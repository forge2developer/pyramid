import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { AppError } from "../middleware/errorHandler";
import PDFDocument from "pdfkit";

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
    const { companyID, productType, startDate, endDate, salesStatus } = req.body;

    let whereClause = "";
    const params: any[] = [];

    if (companyID && companyID !== "all") {
      whereClause += " AND s.CompanyID = ?";
      params.push(companyID);
    }

    if (productType && productType !== "all") {
      whereClause += " AND s.produced = ?";
      params.push(productType);
    }

    if (salesStatus && salesStatus !== "all") {
      if (salesStatus === "Pending") {
        whereClause += " AND s.sales IS NULL";
      } else {
        whereClause += " AND s.sales = ?";
        params.push(salesStatus);
      }
    }

    if (startDate) {
      whereClause += " AND s.date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      whereClause += " AND s.date <= ?";
      // Append time to endDate to include the entire day
      params.push(`${endDate} 23:59:59`);
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
        s.sales,
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

// Update Scrap Sales Status
export const updateScrapSalesStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { scrapId, salesStatus, userID } = req.body;

    if (!scrapId || !salesStatus) {
      const error: AppError = new Error("Scrap ID and Sales Status are required");
      error.statusCode = 400;
      throw error;
    }

    // 1. Get current scrap info for logging
    const [scrapInfo] = await pool.execute<any[]>(
      "SELECT produced, producedID, CompanyID FROM scrap WHERE id = ?",
      [scrapId]
    );

    if (scrapInfo.length === 0) {
      const error: AppError = new Error("Scrap record not found");
      error.statusCode = 404;
      throw error;
    }

    const { produced, producedID, CompanyID } = scrapInfo[0];

    // 2. Update scrap table
    await pool.execute(
      "UPDATE scrap SET sales = ? WHERE id = ?",
      [salesStatus, scrapId]
    );

    // 3. Log the action
    await pool.execute<any>(
      `INSERT INTO activity_logs
        (reason, log, CompanyID, userID, productId, product, data)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        `Status updated to: ${salesStatus}`,
        "Scrap Update",
        CompanyID || null,
        userID || null,
        producedID || null,
        produced || null,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Scrap sales status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Generate Scrap History PDF
export const generateScrapHistoryPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productType, startDate, endDate, salesStatus, companyID } = req.body;

    let whereClause = "";
    const params: any[] = [];

    if (companyID && companyID !== "all") {
      whereClause += " AND s.CompanyID = ?";
      params.push(companyID);
    }

    if (productType && productType !== "all") {
      whereClause += " AND s.produced = ?";
      params.push(productType);
    }

    if (salesStatus && salesStatus !== "all") {
      if (salesStatus === "Pending") {
        whereClause += " AND s.sales IS NULL";
      } else {
        whereClause += " AND s.sales = ?";
        params.push(salesStatus);
      }
    }

    if (startDate) {
      whereClause += " AND s.date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      whereClause += " AND s.date <= ?";
      params.push(`${endDate} 23:59:59`);
    }

    const query = `
      SELECT 
        s.id, 
        s.date, 
        s.reason, 
        s.producedID,
        s.produced,
        s.sales,
        c.company_name,
        u.name as user_name
      FROM scrap s
      LEFT JOIN company c ON s.CompanyID = c.id
      LEFT JOIN users u ON s.userID = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY s.date DESC
    `;

    const [rows] = await pool.execute<any[]>(query, params);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const filename = `Scrap_History_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);

    // --- Header ---
    doc.font("Helvetica-Bold").fontSize(18).text("SCRAP HISTORY REPORT", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    // --- Filter Info ---
    // doc.fontSize(10).font("Helvetica-Bold").text("Filters Applied:");
    doc.font("Helvetica").fontSize(9);
    const filterText = [
      productType ? `Product Type: ${productType}` : "Product Type: All",
      salesStatus ? `Sales Status: ${salesStatus}` : "Sales Status: All",
      startDate ? `Start Date: ${startDate}` : null,
      endDate ? `End Date: ${endDate}` : null,
    ].filter(Boolean).join(" | ");
    doc.text(filterText);
    doc.moveDown(1);

    // --- Table Headers ---
    const startX = 30;
    const colWidths = { sl: 30, date: 80, product: 100, reason: 180, user: 80, status: 65 };
    const colX = {
      sl: startX,
      date: startX + colWidths.sl,
      product: startX + colWidths.sl + colWidths.date,
      reason: startX + colWidths.sl + colWidths.date + colWidths.product,
      user: startX + colWidths.sl + colWidths.date + colWidths.product + colWidths.reason,
      status: startX + colWidths.sl + colWidths.date + colWidths.product + colWidths.reason + colWidths.user,
    };

    let currentY = doc.y;

    const drawRow = (y: number, rowData: any, isHeader = false) => {
      const height = isHeader ? 20 : 25;
      if (isHeader) {
        doc.rect(startX, y, 535, height).fill("#f1f5f9").stroke("#cbd5e1");
        doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9);
      } else {
        doc.rect(startX, y, 535, height).stroke("#cbd5e1");
        doc.fillColor("#000000").font("Helvetica").fontSize(8);
      }

      const textY = y + (height / 2) - 4;
      doc.text(rowData.sl, colX.sl + 5, textY, { width: colWidths.sl - 10 });
      doc.text(rowData.date, colX.date + 5, textY, { width: colWidths.date - 10 });
      doc.text(rowData.product, colX.product + 5, textY, { width: colWidths.product - 10 });
      doc.text(rowData.reason, colX.reason + 5, textY, { width: colWidths.reason - 10, height: height - 5 });
      doc.text(rowData.user, colX.user + 5, textY, { width: colWidths.user - 10 });
      doc.text(rowData.status, colX.status + 5, textY, { width: colWidths.status - 10 });

      return y + height;
    };

    currentY = drawRow(currentY, {
      sl: "S.No",
      date: "Date",
      product: "Product Type",
      reason: "Reason",
      user: "User",
      status: "Status"
    }, true);

    rows.forEach((row, index) => {
      if (currentY + 30 > 750) {
        doc.addPage();
        currentY = 30;
        currentY = drawRow(currentY, {
          sl: "S.No",
          date: "Date",
          product: "Product Type",
          reason: "Reason",
          user: "User",
          status: "Status"
        }, true);
      }

      currentY = drawRow(currentY, {
        sl: String(index + 1),
        date: new Date(row.date).toLocaleDateString(),
        product: row.produced || "N/A",
        reason: row.reason || "",
        user: row.user_name || "N/A",
        status: row.sales || "Pending"
      });
    });

    doc.end();
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
      isPendingReplacement,
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
       (producedID, replacementID, product, CompanyID, inventoryID, userID, reason, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        producedID || null,
        replacementID || null,
        produced || null,
        CompanyID || null,
        inventoryID || null,
        userID || null,
        log || null,
      ]
    );

    const returnLogPromise = pool.execute<any>(
      `INSERT INTO activity_logs
       (reason, log, CompanyID, inventoryID, userID, productId, product, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        log || "Replacement Return",
        "Replacement Return",
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
    END,
    replacement_status = 'none'
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
    // Note: No delivery log here — it's already recorded during the initial replacement delivery (addBulkProducts)
    const [[replaceResult], [returnLogResult], [updateResult]] =
      await Promise.all([
        replaceInsertPromise,
        returnLogPromise,
        replaceUpdatePromise
      ]);

    res.status(200).json({
      success: true,
      message: "Product replaced successfully",
      data: {
        replacedId: replaceResult.insertId,
        returnLogId: returnLogResult.insertId,
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

const enrichActivityLogs = async (logs: any[]): Promise<any[]> => {
  const enrichedLogs = [...logs];

  for (let i = 0; i < enrichedLogs.length; i++) {
    const log = enrichedLogs[i];
    if (log.product && log.productId) {
      try {
        let tableName = log.product.toLowerCase();
        if (tableName === 'm_2') tableName = 'm_2'; // Already consistent

        let primaryColumn = 'id';
        if (tableName === 'system') primaryColumn = 'systemID';
        else if (tableName === 'ssd') primaryColumn = 'ssdID';
        else if (['hdd', 'nvme', 'graphicscard'].includes(tableName)) primaryColumn = 'ID';

        let query = `SELECT * FROM ${tableName} WHERE ${primaryColumn} = ?`;

        if (tableName === 'laptop') {
          query = `SELECT l.*,
            (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.laptopID = l.id) AS ram_details,
            (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.laptopID = l.id) AS ssd_details,
            (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.laptopID = l.id) AS nvme_details,
            (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.laptopID = l.id) AS m2_details
          FROM laptop l WHERE l.id = ?`;
        } else if (tableName === 'system') {
          query = `SELECT s.*,
            (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.systemID = s.systemID) AS ram_details,
            (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.systemID = s.systemID) AS ssd_details,
            (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.systemID = s.systemID) AS nvme_details,
            (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.systemID = s.systemID) AS m2_details,
            (SELECT GROUP_CONCAT(CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) SEPARATOR ', ') FROM graphicscard g WHERE g.systemID = s.systemID) AS graphicscard_details
          FROM system s WHERE s.systemID = ?`;
        } else if (tableName === 'workstation') {
          query = `SELECT w.*,
            (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.workstationID = w.id) AS ram_details,
            (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.workstationID = w.id) AS ssd_details,
            (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.workstationID = w.id) AS nvme_details,
            (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.workstationID = w.id) AS m2_details,
            (SELECT GROUP_CONCAT(CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) SEPARATOR ', ') FROM graphicscard g WHERE g.workstationID = w.id) AS graphicscard_details
          FROM workstation w WHERE w.id = ?`;
        } else if (tableName === 'mobileworkstation') {
          query = `SELECT mw.*, 
            (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.MobileWorkstationID = mw.id) AS ram_details,
            (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.MobileWorkstationID = mw.id) AS ssd_details,
            (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.MobileWorkstationID = mw.id) AS nvme_details,
            (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.MobileWorkstationID = mw.id) AS m2_details,
            (SELECT CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) FROM graphicscard g WHERE g.id = mw.graphicscardID) AS graphicscard_details
           FROM mobileworkstation mw WHERE mw.id = ?`;
        }

        const [productData] = await pool.execute<any[]>(query, [log.productId]);

        if (productData && productData.length > 0) {
          const item = productData[0];
          let fullName = "";

          const formatConfig = (it: any) => {
            const parts = [];
            if (it.ram_details) parts.push(`RAM: ${it.ram_details}`);
            if (it.ssd_details) parts.push(`SSD: ${it.ssd_details}`);
            if (it.nvme_details) parts.push(`NVMe: ${it.nvme_details}`);
            if (it.m2_details) parts.push(`M.2: ${it.m2_details}`);
            if (it.graphicscard_details) parts.push(`Graphics: ${it.graphicscard_details}`);
            return parts.length > 0 ? ` | ${parts.join(" | ")}` : "";
          };

          switch (tableName) {
            case 'laptop':
            case 'mobileworkstation':
              fullName = `${item.brand || ""} ${item.model || ""} | Processor: ${item.processor_brand || item.Processor || item.processor || ""} ${item.processor_model || ""}`.trim();
              fullName += formatConfig(item);
              break;
            case 'system':
              fullName = `${item.Name || ""} | Processor: ${item.Processor || ""}`;
              fullName += formatConfig(item);
              break;
            case 'workstation':
              fullName = `${item.Name || item.Processor || ""} | Processor: ${item.Processor || item.processor || ""}`;
              fullName += formatConfig(item);
              break;
            case 'monitor':
              fullName = `${item.name || ""} | Size: ${item.size || ""} | Display: ${item.display || ""}`;
              break;
            case 'ram':
            case 'ssd':
            case 'nvme':
            case 'm_2':
            case 'hdd':
              const size = item.size || item.ssdSize || item.Size || "";
              fullName = `${item.brand || ""} ${size} ${item.type || ""}`.trim();
              break;
            case 'graphicscard':
              fullName = `${item.brand || ""} ${item.model || ""} ${item.size || ""}`.trim();
              break;
            default:
              fullName = log.product;
          }

          enrichedLogs[i].fullProductName = fullName || log.product;

          let pyramidId = item.pyramidID || item.phyramidID || item.pyramidsID || item.pyramid_id || "-";
          let serviceTag = item.service_id || item.serviceID || item.serviceTag || item.service_tag || "-";
          enrichedLogs[i].pyramidID = pyramidId;
          enrichedLogs[i].serviceTag = serviceTag;

        } else {
          enrichedLogs[i].fullProductName = log.product;
          enrichedLogs[i].pyramidID = "-";
          enrichedLogs[i].serviceTag = "-";
        }
      } catch (err) {
        console.error(`Error enriching log for ${log.product} ${log.productId}:`, err);
        enrichedLogs[i].fullProductName = log.product;
        enrichedLogs[i].pyramidID = "-";
        enrichedLogs[i].serviceTag = "-";
      }
    } else {
      enrichedLogs[i].fullProductName = log.product || "Unknown";
      enrichedLogs[i].pyramidID = "-";
      enrichedLogs[i].serviceTag = "-";
    }
  }

  return enrichedLogs;
};

export const getActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyID, logType, startDate, endDate, product } = req.body;

    if (!companyID) {
      res.status(400).json({ success: false, message: "companyID is required" });
      return;
    }

    let query = `
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
      WHERE l.CompanyID = ?
    `;

    const params: any[] = [companyID];

    if (logType && logType !== "All") {
      query += ` AND l.log = ?`;
      params.push(logType);
    }

    if (product && product !== "All") {
      query += ` AND l.product = ?`;
      params.push(product);
    }

    if (startDate) {
      query += ` AND l.data >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ` AND l.data <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY l.data DESC`;

    const [logs] = await pool.execute<any[]>(query, params);

    // Enrich logs with full product names
    const enrichedLogs = await enrichActivityLogs(logs);

    res.status(200).json({
      success: true,
      data: enrichedLogs,
    });
  } catch (error) {
    next(error);
  }
};

export const generateActivityHistoryPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyID, logType, startDate, endDate, companyName, product } = req.body;

    if (!companyID) {
      res.status(400).json({ success: false, message: "companyID is required" });
      return;
    }

    const [companyResults] = await pool.execute<any[]>("SELECT * FROM company WHERE id = ?", [companyID]);
    const company = companyResults[0] || { company_name: companyName };

    let query = `
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
      WHERE l.CompanyID = ?
    `;

    const params: any[] = [companyID];

    if (logType && logType !== "All") {
      query += ` AND l.log = ?`;
      params.push(logType);
    }

    if (product && product !== "All") {
      query += ` AND l.product = ?`;
      params.push(product);
    }

    if (startDate) {
      query += ` AND l.data >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ` AND l.data <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY l.data DESC`;

    const [logs] = await pool.execute<any[]>(query, params);

    // Enrich logs with full product names
    const enrichedLogs = await enrichActivityLogs(logs);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const filename = `Activity_History_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);

    // --- Logo & Branding (Centered) ---
    const logoPath = "src/assets/PhyramidLogo.png";
    const pageWidth = 612; // US Letter width
    const logoWidth = 50;
    try {
      doc.image(logoPath, (pageWidth / 2) - (logoWidth / 2), 30, { width: logoWidth });
    } catch (err) {
      console.error("Logo not found at", logoPath);
    }
    doc.font("Helvetica-Bold").fontSize(10).text("PYRAMID BUSINESS SYSTEMS", 30, 85, { align: "center", width: 552 });

    // --- Title (Centered) ---
    doc.font("Helvetica-Bold").fontSize(18).text("COMPANY HISTORY REPORT", 30, 110, { align: "center", width: 552 });
    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").text(`Generated on: ${new Date().toLocaleString()}`, 30, 130, { align: "center", width: 552 });
    doc.moveDown(2);

    // --- Client Company Details (Below Header) ---
    const headerEndY = 160;
    doc.font("Helvetica-Bold").fontSize(12).text(company.company_name || companyName || 'N/A', 30, headerEndY);
    doc.fontSize(8).font("Helvetica").text(company.address || '', 30, headerEndY + 15, { width: 500 });
    if (company.city || company.pinCode) {
      doc.text(`${company.city || ''} ${company.pinCode || ''}`, 30, headerEndY + 25);
    }
    doc.moveDown(1.5);

    // --- Filter Info ---
    doc.font("Helvetica").fontSize(9);
    const filterText = [
      logType ? `Log Type: ${logType}` : "Log Type: All",
      product ? `Product Type: ${product}` : "Product Type: All",
      startDate ? `Start Date: ${startDate}` : null,
      endDate ? `End Date: ${endDate}` : null,
    ].filter(Boolean).join(" | ");
    doc.text(filterText);
    doc.moveDown(1);

    // --- Table Header ---
    // --- Table Header ---
    doc.moveDown(1);
    const tableTop = doc.y;
    const colBounds = [30, 55, 185, 245, 305, 360, 485, 565];

    // X positions with padding
    const itemX = colBounds[0] + 5;
    const productX = colBounds[1] + 5;
    const pyramidIdX = colBounds[2] + 5;
    const serviceTagX = colBounds[3] + 5;
    const logX = colBounds[4] + 5;
    const reasonX = colBounds[5] + 5;
    const dateX = colBounds[6] + 5;

    // Helper to draw grid lines
    const drawRowGrid = (y: number, height: number, isHeader = false) => {
      doc.lineWidth(isHeader ? 1 : 0.5).strokeColor(isHeader ? "#000000" : "#aaaaaa");
      if (isHeader) doc.moveTo(30, y).lineTo(565, y).stroke(); // Top line for header
      doc.moveTo(30, y + height).lineTo(565, y + height).stroke(); // Bottom line
      colBounds.forEach(x => {
        doc.moveTo(x, y).lineTo(x, y + height).stroke(); // Vertical lines
      });
      doc.strokeColor("#000000").lineWidth(1); // Reset
    };

    const headerHeight = 20;
    drawRowGrid(tableTop, headerHeight, true);

    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("S.No", itemX, tableTop + 5);
    doc.text("Product Details", productX, tableTop + 5);
    doc.text("Pyramid ID", pyramidIdX, tableTop + 5);
    doc.text("Service Tag", serviceTagX, tableTop + 5);
    doc.text("Log Type", logX, tableTop + 5);
    doc.text("Reason", reasonX, tableTop + 5);
    doc.text("Date", dateX, tableTop + 5);

    let currentY = tableTop + headerHeight;

    // --- Table Body ---
    doc.font("Helvetica").fontSize(8);
    enrichedLogs.forEach((log, index) => {
      const dateStr = log.data ? new Date(log.data).toLocaleDateString() : "-";
      const productStr = log.fullProductName || log.product || "-";

      // Calculate required height for the row
      const textHeight = Math.max(
        doc.heightOfString(log.reason || "-", { width: 120 }),
        doc.heightOfString(productStr, { width: 125 }),
        doc.heightOfString(log.pyramidID?.toString() || "-", { width: 55 }),
        doc.heightOfString(log.serviceTag?.toString() || "-", { width: 55 }),
        doc.heightOfString(log.log || "-", { width: 50 }),
        doc.heightOfString(dateStr, { width: 75 }),
        12
      );
      const rowHeight = textHeight + 10;

      if (currentY + rowHeight > 750) {
        doc.addPage();
        currentY = 30;

        // Redraw Header on new page
        drawRowGrid(currentY, headerHeight, true);
        doc.font("Helvetica-Bold").fontSize(9);
        doc.text("S.No", itemX, currentY + 5);
        doc.text("Product Details", productX, currentY + 5);
        doc.text("Pyramid ID", pyramidIdX, currentY + 5);
        doc.text("Service Tag", serviceTagX, currentY + 5);
        doc.text("Log Type", logX, currentY + 5);
        doc.text("Reason", reasonX, currentY + 5);
        doc.text("Date", dateX, currentY + 5);

        currentY += headerHeight;
        doc.font("Helvetica").fontSize(8);
      }

      drawRowGrid(currentY, rowHeight, false);

      doc.text((index + 1).toString(), itemX, currentY + 5);
      doc.text(productStr, productX, currentY + 5, { width: 125 });
      doc.text(log.pyramidID?.toString() || "-", pyramidIdX, currentY + 5, { width: 55 });
      doc.text(log.serviceTag?.toString() || "-", serviceTagX, currentY + 5, { width: 55 });
      doc.text(log.log || "-", logX, currentY + 5, { width: 50 });
      doc.text(log.reason || "-", reasonX, currentY + 5, { width: 120 });
      doc.text(dateStr, dateX, currentY + 5, { width: 75 });

      currentY += rowHeight;
    });

    doc.end();
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

// Generate Current Products PDF
export const generateCurrentProductsPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyID, companyName } = req.body;

    if (!companyID) {
      res.status(400).json({ success: false, message: "companyID is required" });
      return;
    }

    const [companyResults] = await pool.execute<any[]>("SELECT * FROM company WHERE id = ?", [companyID]);
    const company = companyResults[0] || { company_name: companyName };

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
      // Laptops: PK is id, FK in components is laptopID
      pool.execute<any[]>(`
        SELECT l.*,
          (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.laptopID = l.id) AS ram_details,
          (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.laptopID = l.id) AS ssd_details,
          (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.laptopID = l.id) AS nvme_details,
          (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.laptopID = l.id) AS m2_details
        FROM laptop l WHERE l.CompanyID = ? AND l.isActive = 1`, [companyID]),
      pool.execute<any[]>(`SELECT * FROM monitor WHERE CompanyID = ? AND isActive = 1`, [companyID]),
      pool.execute<any[]>(`SELECT * FROM ram WHERE CompanyID = ? AND isActive = 1`, [companyID]),
      // Systems (Desktops): PK is systemID, FK in components is systemID
      pool.execute<any[]>(`
        SELECT s.*,
          (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.systemID = s.systemID) AS ram_details,
          (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.systemID = s.systemID) AS ssd_details,
          (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.systemID = s.systemID) AS nvme_details,
          (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.systemID = s.systemID) AS m2_details,
          (SELECT GROUP_CONCAT(CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) SEPARATOR ', ') FROM graphicscard g WHERE g.systemID = s.systemID) AS graphicscard_details
        FROM system s WHERE s.CompanyID = ? AND s.isActive = 1`, [companyID]),
      // Workstations: PK is id, FK in components is workstationID
      pool.execute<any[]>(`
        SELECT w.*,
          (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.workstationID = w.id) AS ram_details,
          (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.workstationID = w.id) AS ssd_details,
          (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.workstationID = w.id) AS nvme_details,
          (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.workstationID = w.id) AS m2_details,
          (SELECT GROUP_CONCAT(CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) SEPARATOR ', ') FROM graphicscard g WHERE g.workstationID = w.id) AS graphicscard_details
        FROM workstation w WHERE w.CompanyID = ? AND w.isActive = 1`, [companyID]),
      pool.execute<any[]>(`SELECT * FROM hdd WHERE CompanyID = ? AND isActive = 1`, [companyID]),
      pool.execute<any[]>(`SELECT * FROM ssd WHERE CompanyID = ? AND isActive = 1`, [companyID]),
      pool.execute<any[]>(`SELECT * FROM nvme WHERE CompanyID = ? AND isActive = 1`, [companyID]),
      pool.execute<any[]>(`SELECT * FROM graphicscard WHERE CompanyID = ? AND isActive = 1`, [companyID]),
      pool.execute<any[]>(
        `SELECT mw.*, 
          (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.MobileWorkstationID = mw.id) AS ram_details,
          (SELECT GROUP_CONCAT(CONCAT(s.ssdSize, ' ', s.brand) SEPARATOR ', ') FROM ssd s WHERE s.MobileWorkstationID = mw.id) AS ssd_details,
          (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.MobileWorkstationID = mw.id) AS nvme_details,
          (SELECT GROUP_CONCAT(CONCAT(m.size, ' ', m.brand) SEPARATOR ', ') FROM m_2 m WHERE m.MobileWorkstationID = mw.id) AS m2_details,
          (SELECT CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) FROM graphicscard g WHERE g.id = mw.graphicscardID) AS graphicscard_details
         FROM mobileworkstation mw WHERE mw.CompanyID = ? AND mw.isActive = 1`,
        [companyID]
      ),
      pool.execute<any[]>(`SELECT * FROM m_2 WHERE CompanyID = ? AND isActive = 1`, [companyID])
    ]);

    const allProducts = [
      { type: "Laptops", data: laptops },
      { type: "Desktops", data: systems },
      { type: "Monitors", data: monitors },
      { type: "Workstations", data: workstations },
      { type: "Mobile Workstations", data: mobileWorkstations },
      { type: "RAM Modules", data: rams },
      { type: "SSDs", data: ssds },
      { type: "HDDs", data: hdds },
      { type: "NVMe Drives", data: nvmes },
      { type: "M.2 Drives", data: m_2s },
      { type: "Graphics Cards", data: graphicsCards }
    ].filter(p => p.data.length > 0);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const filename = `Current_Products_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);

    // --- Logo & Branding (Centered) ---
    const logoPath = "src/assets/PhyramidLogo.png";
    const pageWidth = 612; // US Letter width
    const logoWidth = 50;
    try {
      doc.image(logoPath, (pageWidth / 2) - (logoWidth / 2), 30, { width: logoWidth });
    } catch (err) {
      console.error("Logo not found at", logoPath);
    }
    doc.font("Helvetica-Bold").fontSize(10).text("PYRAMID BUSINESS SYSTEMS", 30, 85, { align: "center", width: 552 });

    // --- Title (Centered) ---
    doc.font("Helvetica-Bold").fontSize(18).text("CURRENT RENTAL PRODUCTS", 30, 110, { align: "center", width: 552 });
    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").text(`Generated on: ${new Date().toLocaleString()}`, 30, 130, { align: "center", width: 552 });
    doc.moveDown(2);

    // --- Client Company Details (Below Header) ---
    const startY = 160;
    doc.font("Helvetica-Bold").fontSize(12).text(company.company_name || companyName || 'N/A', 30, startY);
    doc.fontSize(8).font("Helvetica").text(company.address || '', 30, startY + 15, { width: 500 });
    if (company.city || company.pinCode) {
      doc.text(`${company.city || ''} ${company.pinCode || ''}`, 30, startY + 25);
    }
    doc.moveDown(2);

    let currentY = doc.y;

    allProducts.forEach((category) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 30;
      }

      doc.font("Helvetica-Bold").fontSize(12).text(category.type, 30, currentY);
      currentY += 15;
      doc.moveTo(30, currentY).lineTo(565, currentY).stroke();
      currentY += 5;

      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("S.No", 35, currentY);
      doc.text("Product Details", 75, currentY);
      doc.text("Pyramid ID", 390, currentY);
      doc.text("Service Tag", 480, currentY);
      currentY += 15;

      doc.font("Helvetica").fontSize(8);
      category.data.forEach((item, index) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 30;
          doc.font("Helvetica-Bold").fontSize(10).text(`${category.type} (Contd.)`, 30, currentY);
          currentY += 15;
          doc.font("Helvetica").fontSize(8);
        }

        let desc = "";
        let serviceTag = item.service_id || item.serviceID || item.serviceTag || item.service_tag || "-";

        const formatConfig = (item: any) => {
          const parts = [];
          if (item.ram_details) parts.push(`RAM: ${item.ram_details}`);
          if (item.ssd_details) parts.push(`SSD: ${item.ssd_details}`);
          if (item.nvme_details) parts.push(`NVMe: ${item.nvme_details}`);
          if (item.m2_details) parts.push(`M.2: ${item.m2_details}`);
          if (item.graphicscard_details) parts.push(`Graphics: ${item.graphicscard_details}`);
          return parts.length > 0 ? ` | ${parts.join(" | ")}` : "";
        };

        switch (category.type) {
          case "Laptops":
          case "Mobile Workstations":
            desc = `${item.brand || ""} ${item.model || ""} | Processor: ${item.processor_brand || item.Processor || item.processor || ""} ${item.processor_model || ""}`.trim();
            desc += formatConfig(item);
            break;
          case "Desktops":
            desc = `${item.Name || ""} | Processor: ${item.Processor || ""}`;
            desc += formatConfig(item);
            break;
          case "Monitors":
            desc = `${item.name || ""} | Size: ${item.size || ""} | Display: ${item.display || ""}`;
            break;
          case "Workstations":
            desc = `${item.Name || item.Processor || ""} | Processor: ${item.Processor || item.processor || ""}`;
            desc += formatConfig(item);
            break;
          case "RAM Modules":
          case "SSDs":
          case "NVMe Drives":
          case "M.2 Drives":
          case "HDDs":
            const size = item.size || item.ssdSize || item.Size || "";
            desc = `${item.brand || ""} ${size} ${item.type || ""}`.trim();
            break;
          case "Graphics Cards":
            desc = `${item.brand || ""} ${item.model || ""} ${item.size || ""}`.trim();
            break;
        }

        let pId = item.phyramidID || "-";

        doc.text((index + 1).toString(), 35, currentY);
        doc.text(desc, 75, currentY, { width: 310 });
        doc.text(pId.toString(), 390, currentY);
        doc.text(serviceTag, 480, currentY);

        const rowHeight = Math.max(doc.heightOfString(desc, { width: 310 }), 12);
        currentY += rowHeight + 5;
      });

      currentY += 10;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      company_name,
      customer_name,
      phone,
      address,
      city,
      pinCode,
      gstNumber
    } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: "Company ID is required" });
      return;
    }

    const query = `
      UPDATE company
      SET
        company_name = ?,
        customer_name = ?,
        phone = ?,
        address = ?,
        city = ?,
        pinCode = ?,
        gstNumber = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute<any>(query, [
      company_name || null,
      customer_name || null,
      phone || null,
      address || null,
      city || null,
      pinCode || null,
      gstNumber || null,
      id
    ]);

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "Company not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Company ID is required" });
      return;
    }

    // First check if company has assigned products
    const tables = ['laptop', 'monitor', 'system', 'workstation', 'mobileworkstation', 'ram', 'ssd', 'hdd', 'nvme', 'graphicscard', 'm_2', 'printer', 'cctv', 'biometric', 'accesscontrol', 'network', 'server'];

    // Simplest way is just to delete. If we want rigorous check, we'd query all tables.
    // For now we just execute delete. Database foreign keys usually restrict if assigned, or we can just delete.
    const query = `DELETE FROM company WHERE id = ?`;

    const [result] = await pool.execute<any>(query, [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "Company not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    // If there's a foreign key constraint error, it means the company still has items
    if (error && (error as any).code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(400).json({ success: false, message: "Cannot delete company. It still has products assigned." });
      return;
    }
    next(error);
  }
};
