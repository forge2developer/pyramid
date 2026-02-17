import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { AppError } from "../middleware/errorHandler";

export interface Company {
  id: number;
  company_name: string;
  count: number;
  customer_name: string;
  phone: string;
  gstNumber?: string;
}

// Get all companies for dropdown
export const getAllCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let {
      company_name,
      customer_name,
      address,
      city,
      phone,
    } = req.body;

    // Build filter dynamically with prepared statements
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (company_name) {
      filterConditions.push("company_name LIKE ?");
      filterValues.push(`%${company_name}%`);
    }
    if (customer_name) {
      filterConditions.push("customer_name LIKE ?");
      filterValues.push(`%${customer_name}%`); // Use LIKE for partial matches
    }
    if (address) {
      filterConditions.push("address LIKE ?");
      filterValues.push(`%${address}%`);
    }
    if (city) {
      filterConditions.push("city LIKE ?");
      filterValues.push(`%${city}%`);
    }
    if (phone) {
      filterConditions.push("phone = ?");
      filterValues.push(phone);
    }

    // Build WHERE clause
    let whereClause = "isActive = 1";
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }
    // Get total count with same filters
    const countQuery = `SELECT COUNT(*) as total FROM company WHERE ${whereClause}`;
    const [countResult] = await pool.execute<any[]>(countQuery, filterValues);
    const total = countResult[0].total;

    // Get laptops with pagination
    const query = `SELECT * FROM company WHERE ${whereClause} LIMIT ? OFFSET ?`;

    const [rows] = await pool.execute<any[]>(query, [...filterValues, limit.toString(), offset.toString()]);

    const [data] = await pool.execute<any[]>(
      `SELECT * from company LIMIT ? OFFSET ?`,
      [limit.toString(), offset.toString()]
    );

    res.json({
      success: true,
      data: {
        company: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: data,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new Company
export const AddCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const { company_name, customer_name, phone, address, city, pinCode, gstNumber, isActive } = req.body;

    // Validate required fields
    if (!company_name) {
      const error: AppError = new Error("Company name is required");
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicates
    let checkQuery = "SELECT * FROM company WHERE phone = ?";
    const checkParams: any[] = [phone];

    if (gstNumber) {
      checkQuery += " OR gstNumber = ?";
      checkParams.push(gstNumber);
    }

    const [existingCompany] = await pool.execute<any[]>(checkQuery, checkParams);

    if (existingCompany.length > 0) {
      for (const company of existingCompany) {
        if (company.phone === phone) {
          const error: AppError = new Error("Phone number already exists");
          error.statusCode = 409;
          throw error;
        }
        if (gstNumber && company.gstNumber === gstNumber) {
          const error: AppError = new Error("GST Number already exists");
          error.statusCode = 409;
          throw error;
        }
      }
    }

    const [result] = await pool.execute<any>(
      `INSERT INTO company(company_name, customer_name, phone, address, city, pinCode, gstNumber, isActive)VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name || null,
        customer_name || null,
        phone || null,
        address || null,
        city || null,
        pinCode || null,
        gstNumber || null,
        isActive !== undefined ? isActive : 1
      ]
    );

    res.status(200).json({
      success: true,
      message: "Company added successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("addCompany", error);
    next(error);
  }
};

export const getCompanyDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { companyID } = req.body;

    if (!companyID) {
      res.status(400).json({ success: false, message: "companyID is required" });
      return;
    }

    // 1. Get Company Details (Optional, but good for context)
    const [companyResult] = await pool.execute<any[]>(
      "SELECT * FROM company WHERE id = ?",
      [companyID]
    );

    if (companyResult.length === 0) {
      res.status(404).json({ success: false, message: "Company not found" });
      return;
    }

    // 2. Helper for CompanyID Query
    // All tables provided have `CompanyID` and `isActive`
    const createQuery = (table: string) => `
      SELECT * FROM ${table} WHERE CompanyID = ? AND isActive = 1 LIMIT ? OFFSET ?
    `;

    // 3. Execute Parallel Queries
    const [
      [laptops],
      [monitors],
      [rams],
      [systems],
      [workstations],
      [hdds],
      [ssds],
      [nvmes],
      [graphicsCards],
      [mobileWorkstations],
      [m_2s]
    ] = await Promise.all([
      pool.execute<any[]>(createQuery("laptop"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("monitor"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("ram"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("system"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("workstation"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("hdd"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("ssd"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("nvme"), [companyID, limit, offset]),
      pool.execute<any[]>(createQuery("graphicscard"), [companyID, limit, offset]),
      // Modified query for mobileworkstation to include component details
      pool.execute<any[]>(
        `SELECT mw.*, 
          (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.MobileWorkstationID = mw.id) AS ram_details,
          (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.MobileWorkstationID = mw.id) AS ssd_details,
          (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.MobileWorkstationID = mw.id) AS nvme_details,
          (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.MobileWorkstationID = mw.id) AS m2_details,
          (SELECT CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) FROM graphicscard g WHERE g.id = mw.graphicscardID) AS graphicscard_details
         FROM mobileworkstation mw WHERE mw.CompanyID = ? AND mw.isActive = 1 LIMIT ? OFFSET ?`,
        [companyID, limit, offset]
      ),
      pool.execute<any[]>(createQuery("m_2"), [companyID, limit, offset])
    ]);

    res.json({
      success: true,
      data: {
        company: companyResult[0],
        products: {
          laptop: laptops,
          monitor: monitors,
          ram: rams,
          system: systems,
          workstation: workstations,
          hdd: hdds,
          ssd: ssds,
          nvme: nvmes,
          graphicscard: graphicsCards,
          mobileworkstation: mobileWorkstations,
          m_2: m_2s,
        },
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          note: "Pagination applies to each product list individually"
        },
      },
    });

  } catch (error) {
    next(error);
  }
};

// Add new Scrap
export const AddScrap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      produced,
      producedID,
      log,
      CompanyID,
      inventoryID,
      userID,
    } = req.body;

    // Validate required fields
    if (!producedID) {
      const error: AppError = new Error("Produced ID is required");
      error.statusCode = 400;
      throw error;
    }

    // Create promises (do not await yet)
    const scrapPromise = pool.execute<any>(
      `INSERT INTO scrap
        (producedID, CompanyID, inventoryID, userID, reason, date, produced)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [
        producedID || null,
        CompanyID || null,
        inventoryID || null,
        userID || null,
        log || null,
        produced || null
      ]
    );

    const recordLogPromise = pool.execute<any>(
      `INSERT INTO activity_logs
        (reason, log, CompanyID, inventoryID, userID, productId, product, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        log || null,
        "Scrap",
        CompanyID || null,
        inventoryID || null,
        userID || null,
        producedID || null,
        produced || null,
      ]
    );
    const updateProduct = pool.execute<any>(
      `UPDATE ${produced} SET isActive = 0 WHERE id = ?`,
      [producedID]
    );

    // Execute both queries in parallel
    const [[scrapResult], [recordResult], [updateresult]] = await Promise.all([
      scrapPromise,
      recordLogPromise,
      updateProduct
    ]);

    res.status(200).json({
      success: true,
      message: "Scrap and log added successfully",
      data: {
        scrapId: scrapResult.insertId,
        recordId: recordResult.insertId,
      },
    });

  } catch (error) {
    next(error);
  }
};

// Get Scrap History
export const getScrapHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Search/Filters (Optional)
    const { companyID, search } = req.body;

    let whereClause = "";
    const params: any[] = [];

    if (companyID && companyID !== "all") {
      whereClause += " AND s.CompanyID = ?";
      params.push(companyID);
    }

    // Note: 'product' column might not exist in scrap table, so we join or use logs? 
    // But for now, we just list what's in the scrap table. 
    // Assuming scrap table has: id, producedID, CompanyID, inventoryID, userID, reason, date.

    const query = `
      SELECT 
        s.id, 
        s.date, 
        s.reason, 
        s.producedID,
        s.produced,
        c.company_name,
        u.name as user_name
      FROM scrap s
      LEFT JOIN company c ON s.CompanyID = c.id
      LEFT JOIN users u ON s.userID = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY s.date DESC
      LIMIT ? OFFSET ?
    `;

    // Total count query
    const countQuery = `SELECT COUNT(*) as total FROM scrap s WHERE 1=1 ${whereClause}`;

    const [rows] = await pool.execute<any[]>(query, [...params, limit.toString(), offset.toString()]);
    const [countResult] = await pool.execute<any[]>(countQuery, params);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: {
        scraps: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new Replace
export const AddReplace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      producedID,
      log,
      CompanyID,
      inventoryID,
      userID,
      replacementID,
      produced,
    } = req.body;

    // ✅ Validation
    if (!producedID || !replacementID) {
      const error: AppError = new Error("producedID and replacementID are required");
      error.statusCode = 400;
      throw error;
    }

    // // ✅ Table name validation (Security)
    // const allowedTables = ["laptop", "monitor", "printer"];
    // if (!allowedTables.includes(produced)) {
    //   throw new Error("Invalid product table");
    // }

    // ✅ Queries as promises
    const replaceInsertPromise = pool.execute<any>(
      `INSERT INTO replacedproduct
       (producedID, CompanyID, inventoryID, userID, reason, date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        producedID || null,
        CompanyID || null,
        inventoryID || null,
        userID || null,
        log || null,
      ]
    );

    const activityLogPromise = pool.execute<any>(
      `INSERT INTO activity_logs
       ( reason, log, CompanyID, inventoryID, userID, productId, product, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        log || null,
        "Replace",
        CompanyID || null,
        inventoryID || null,
        userID || null,
        producedID || null,
        produced || null,
      ]
    );

    let primaryColumn = 'id';
    if (produced === 'system') primaryColumn = 'systemID';
    else if (produced === 'ssd') primaryColumn = 'ssdID';
    else if (['hdd', 'nvme', 'graphicscard'].includes(produced)) primaryColumn = 'ID';

    const replaceQuery = `
  UPDATE ${produced}
  SET
    CompanyID = CASE
        WHEN ${primaryColumn} = ? THEN NULL
        WHEN ${primaryColumn} = ? THEN ?
    END,
    isAvailable = CASE
        WHEN ${primaryColumn} = ? THEN 1
        WHEN ${primaryColumn} = ? THEN 0
    END
  WHERE ${primaryColumn} IN (?, ?)
`;

    const replaceUpdatePromise = pool.execute<any>(replaceQuery, [
      producedID,        // old product → set NULL
      replacementID,     // new product → assign company
      CompanyID,         // company id
      producedID,
      replacementID,
      producedID,        // WHERE IN
      replacementID
    ]);

    // ✅ Execute all queries in parallel
    const [[replaceResult], [activityResult], [updateResult]] =
      await Promise.all([
        replaceInsertPromise,
        activityLogPromise,
        replaceUpdatePromise
      ]);

    res.status(200).json({
      success: true,
      message: "Product replaced successfully",
      data: {
        replacedId: replaceResult.insertId,
        logId: activityResult.insertId,
        affectedRows: updateResult.affectedRows,
      },
    });

  } catch (error) {
    next(error);
  }
};

// Add new Return
export const AddReturn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      produced,
      producedID,
      log,
      CompanyID,
      inventoryID,
      userID,
    } = req.body;

    // Validate required fields
    if (!producedID) {
      const error: AppError = new Error("Produced ID is required");
      error.statusCode = 400;
      throw error;
    }

    // Create promises
    const returnPromise = pool.execute<any>(
      `INSERT INTO returnproduct
       (producedID, CompanyID, inventoryID, userID, reason, date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        producedID || null,
        CompanyID || null,
        inventoryID || null,
        userID || null,
        log || null,
      ]
    );

    const recordLogPromise = pool.execute<any>(
      `INSERT INTO activity_logs
       (reason, log, CompanyID, inventoryID, userID, productId, product, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        log || null,
        "Return",
        CompanyID || null,
        inventoryID || null,
        userID || null,
        producedID || null,
        produced || null,
      ]
    );

    const updateProductPromise = pool.execute<any>(
      `UPDATE ${produced} SET CompanyID = NULL, isAvailable = 1 WHERE id = ?`,
      [producedID]
    );

    // Execute all queries in parallel
    const [[returnResult], [recordResult], [updateResult]] =
      await Promise.all([
        returnPromise,
        recordLogPromise,
        updateProductPromise,
      ]);

    res.status(200).json({
      success: true,
      message: "Return processed successfully",
      data: {
        returnId: returnResult.insertId,
        recordId: recordResult.insertId,
        affectedRows: updateResult.affectedRows,
      },
    });

  } catch (error) {
    next(error);
  }
};

export const getActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyID } = req.body;

    if (!companyID) {
      res.status(400).json({ success: false, message: "companyID is required" });
      return;
    }

    const query = `
      SELECT 
        l.id, 
        l.log, 
        l.reason, 
        l.CompanyID, 
        l.inventoryID, 
        l.userID, 
        l.productId, 
        l.product,
        l.data
      FROM activity_logs l
      ORDER BY l.data DESC
    `;

    const [logs] = await pool.execute<any[]>(query);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// Update Company Laptops
export const companyUpdateLaptops = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      id,
      CompanyID,
      action,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      await pool.execute<any>(
        `UPDATE laptop SET CompanyID= ?, isAvailable = 0 WHERE id = ?`,
        [CompanyID || null, id || null]
      );
    }
    else if (action === "remove") {
      await pool.execute<any>(
        `UPDATE laptop SET CompanyID= NULL, isAvailable = 1 WHERE id = ?`,
        [id || null]
      );
    }

    // --- RAM ---
    if (addRam && addRam.length > 0) {
      for (const item of addRam) {
        await pool.execute(`UPDATE ram SET laptopID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`, [id, CompanyID, item.id]);
      }
    }
    if (removeRam && removeRam.length > 0) {
      for (const item of removeRam) {
        await pool.execute(`UPDATE ram SET laptopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`, [item.id]);
      }
    }

    // --- SSD ---
    if (addSSD && addSSD.length > 0) {
      for (const item of addSSD) {
        const itemId = item.ssdID || item.id;
        await pool.execute(`UPDATE ssd SET laptopID = ?, CompanyID = ?, isAvailable = 0 WHERE ssdID = ?`, [id, CompanyID, itemId]);
      }
    }
    if (removeSSD && removeSSD.length > 0) {
      for (const item of removeSSD) {
        const itemId = item.ssdID || item.id;
        await pool.execute(`UPDATE ssd SET laptopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE ssdID = ?`, [itemId]);
      }
    }

    // --- NVMe ---
    if (addNvme && addNvme.length > 0) {
      for (const item of addNvme) {
        await pool.execute(`UPDATE nvme SET laptopID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`, [id, CompanyID, item.id]);
      }
    }
    if (removeNvme && removeNvme.length > 0) {
      for (const item of removeNvme) {
        await pool.execute(`UPDATE nvme SET laptopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`, [item.id]);
      }
    }

    res.status(200).json({
      success: true,
      message: "Laptop updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company Systems
export const companyUpdateSystems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      systemID,
      CompanyID,
      action,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      await pool.execute<any>(
        `UPDATE system SET CompanyID= ?, isAvailable = 0 WHERE systemID = ?`,
        [CompanyID || null, systemID || null]
      );
    }
    else if (action === "remove") {
      await pool.execute<any>(
        `UPDATE system SET CompanyID= NULL, isAvailable = 1 WHERE systemID = ?`,
        [systemID || null]
      );
    }

    // --- RAM ---
    if (addRam && addRam.length > 0) {
      for (const item of addRam) {
        await pool.execute(`UPDATE ram SET DesktopID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`, [systemID, CompanyID, item.id]);
      }
    }
    if (removeRam && removeRam.length > 0) {
      for (const item of removeRam) {
        await pool.execute(`UPDATE ram SET DesktopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`, [item.id]);
      }
    }

    // --- SSD ---
    if (addSSD && addSSD.length > 0) {
      for (const item of addSSD) {
        const itemId = item.ssdID || item.id;
        await pool.execute(`UPDATE ssd SET DesktopID = ?, CompanyID = ?, isAvailable = 0 WHERE ssdID = ?`, [systemID, CompanyID, itemId]);
      }
    }
    if (removeSSD && removeSSD.length > 0) {
      for (const item of removeSSD) {
        const itemId = item.ssdID || item.id;
        await pool.execute(`UPDATE ssd SET DesktopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE ssdID = ?`, [itemId]);
      }
    }

    // --- NVMe ---
    if (addNvme && addNvme.length > 0) {
      for (const item of addNvme) {
        await pool.execute(`UPDATE nvme SET DesktopID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`, [systemID, CompanyID, item.id]);
      }
    }
    if (removeNvme && removeNvme.length > 0) {
      for (const item of removeNvme) {
        await pool.execute(`UPDATE nvme SET DesktopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`, [item.id]);
      }
    }

    res.status(200).json({
      success: true,
      message: "System updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company Monitor
export const companyUpdateMonitor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      id,
      CompanyID,
      action,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      const [result] = await pool.execute<any>(
        `UPDATE monitor SET CompanyID= ?, isAvailable = 0 WHERE id = ?`,
        [
          CompanyID || null,
          id || null,
        ]
      );
    }
    else if (action === "remove") {
      const [result] = await pool.execute<any>(
        `UPDATE monitor SET CompanyID= NULL, isAvailable = 1 WHERE id = ?`,
        [
          id || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Monitor updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company M.2
export const companyUpdateM_2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      id,
      CompanyID,
      action,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      await pool.execute<any>(
        `UPDATE m_2 SET CompanyID= ?, isAvailable = 0 WHERE id = ?`,
        [CompanyID || null, id || null]
      );
    }
    else if (action === "remove") {
      await pool.execute<any>(
        `UPDATE m_2 SET CompanyID= NULL, isAvailable = 1 WHERE id = ?`,
        [id || null]
      );
    }

    res.status(200).json({
      success: true,
      message: "M.2 updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company Ram
export const companyUpdateRam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      id,
      CompanyID,
      action,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      const [result] = await pool.execute<any>(
        `UPDATE ram SET CompanyID= ?, isAvailable = 0 WHERE id = ?`,
        [
          CompanyID || null,
          id || null,
        ]
      );
    }
    else if (action === "remove") {
      const [result] = await pool.execute<any>(
        `UPDATE ram SET CompanyID= NULL, laptopID = NULL, DesktopID = NULL, WorkstationID = NULL, isAvailable = 1 WHERE id = ?`,
        [
          id || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Ram updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company SSD
export const companyUpdateSSD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      ssdID,
      CompanyID,
      action,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      const [result] = await pool.execute<any>(
        `UPDATE ssd SET CompanyID= ?, isAvailable = 0 WHERE ssdID = ?`,
        [
          CompanyID || null,
          ssdID || null,
        ]
      );
    }
    else if (action === "remove") {
      const [result] = await pool.execute<any>(
        `UPDATE ssd SET CompanyID= NULL, isAvailable = 1 WHERE ssdID = ?`,
        [
          ssdID || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "SSD updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company HDD
export const companyUpdateHDD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      ID,
      CompanyID,
      action,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      const [result] = await pool.execute<any>(
        `UPDATE hdd SET CompanyID= ?, isAvailable = 0 WHERE ID = ?`,
        [
          CompanyID || null,
          ID || null,
        ]
      );
    }
    else if (action === "remove") {
      const [result] = await pool.execute<any>(
        `UPDATE hdd SET CompanyID= NULL, isAvailable = 1 WHERE ID = ?`,
        [
          ID || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "HDD updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company NVMe
export const companyUpdateNVMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      id,
      CompanyID,
      action,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      const [result] = await pool.execute<any>(
        `UPDATE nvme SET CompanyID= ?, isAvailable = 0 WHERE id = ?`,
        [
          CompanyID || null,
          id || null,
        ]
      );
    }
    else if (action === "remove") {
      const [result] = await pool.execute<any>(
        `UPDATE nvme SET CompanyID= NULL, isAvailable = 1 WHERE id = ?`,
        [
          id || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "NVMe updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company Workstation
export const companyUpdateWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      id,
      CompanyID,
      action,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      await pool.execute<any>(
        `UPDATE workstation SET CompanyID= ?, isAvailable = 0 WHERE id = ?`,
        [CompanyID || null, id || null]
      );
    }
    else if (action === "remove") {
      await pool.execute<any>(
        `UPDATE workstation SET CompanyID= NULL, isAvailable = 1 WHERE id = ?`,
        [id || null]
      );
    }

    // --- RAM ---
    if (addRam && addRam.length > 0) {
      for (const item of addRam) {
        await pool.execute(`UPDATE ram SET WorkstationID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`, [id, CompanyID, item.id]);
      }
    }
    if (removeRam && removeRam.length > 0) {
      for (const item of removeRam) {
        await pool.execute(`UPDATE ram SET WorkstationID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`, [item.id]);
      }
    }

    // --- SSD ---
    if (addSSD && addSSD.length > 0) {
      for (const item of addSSD) {
        const itemId = item.ssdID || item.id;
        await pool.execute(`UPDATE ssd SET WorkstationID = ?, CompanyID = ?, isAvailable = 0 WHERE ssdID = ?`, [id, CompanyID, itemId]);
      }
    }
    if (removeSSD && removeSSD.length > 0) {
      for (const item of removeSSD) {
        const itemId = item.ssdID || item.id;
        await pool.execute(`UPDATE ssd SET WorkstationID = NULL, CompanyID = NULL, isAvailable = 1 WHERE ssdID = ?`, [itemId]);
      }
    }

    // --- NVMe ---
    if (addNvme && addNvme.length > 0) {
      for (const item of addNvme) {
        await pool.execute(`UPDATE nvme SET WorkstationID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`, [id, CompanyID, item.id]);
      }
    }
    if (removeNvme && removeNvme.length > 0) {
      for (const item of removeNvme) {
        await pool.execute(`UPDATE nvme SET WorkstationID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`, [item.id]);
      }
    }

    res.status(200).json({
      success: true,
      message: "Workstation updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Company GraphicsCard
export const companyUpdateGraphicsCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {

    const {
      ID,
      CompanyID,
      action,
    } = req.body;

    // Validate required fields
    if (!CompanyID) {
      const error: AppError = new Error("CompanyID is required");
      error.statusCode = 400;
      throw error;
    }
    if (action === "add") {
      const [result] = await pool.execute<any>(
        `UPDATE graphicsCard SET CompanyID= ?, isAvailable = 0 WHERE ID = ?`,
        [
          CompanyID || null,
          ID || null,
        ]
      );
    }
    else if (action === "remove") {
      const [result] = await pool.execute<any>(
        `UPDATE graphicsCard SET CompanyID= NULL, isAvailable = 1 WHERE ID = ?`,
        [
          ID || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "GraphicsCard updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

