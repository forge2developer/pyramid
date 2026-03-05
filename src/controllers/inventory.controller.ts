import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { AppError } from "../middleware/errorHandler";
export interface Laptop {
  id: number;
  brand: string;
  model: string;
  processor_brand: string;
  processor_model: string;
  generation: string;
  service_id: string; // Updated to string based on SQL schema
  CompanyID: number | null;
  date_of_purchase: string;
  adapter: string;
  ramID: number | null;
  graphicscardID: number | null;
  ssdID: string | null;
  nvmeID: string | null;
  m2ID: string | null;
  inventoryID: number | null;
  phyramidID: string | null;
  isAvailable: number;
  isActive: number;
  replacement_status: 'none' | 'pending' | 'completed';
}

export interface Company {
  id: number;
  company_name: string;
  count: number;
  customer_name: string;
  phone: string;
}

// Get all companies for dropdown
export const getAllCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>(
      "SELECT id, company_name, customer_name, phone FROM company ORDER BY company_name ASC"
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get all inventories for dropdown
export const getAllInventories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>(
      "SELECT id, name FROM inventory"
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get all laptops with company details (LEFT JOIN to include unrented laptops)
export const getAllLaptops = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("giri", req.body);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let {
      brand,
      model,
      processor,
      service_id,
      inventoryID,
      isAvailable,
    } = req.body;

    // Build filter dynamically with prepared statements
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }

    if (model) {
      filterConditions.push("model LIKE ?");
      filterValues.push(`%${model}%`);
    }
    if (processor) {
      const parts = processor.trim().split(" ");

      const brandPart = parts[0];                 // Intel
      const modelPart = parts.slice(1).join(" "); // i7-1165G7

      filterConditions.push(
        "(processor_brand LIKE ? AND processor_model LIKE ?)"
      );

      filterValues.push(`%${brandPart}%`, `%${modelPart}%`);
    }
    if (service_id) {
      filterConditions.push("service_id = ?");
      filterValues.push(service_id);
    }
    if (req.body.pyramidID) {
      filterConditions.push("phyramidID LIKE ?");
      filterValues.push(`%${req.body.pyramidID}%`);
    }
    if (req.body.generation) {
      filterConditions.push("generation LIKE ?");
      filterValues.push(`%${req.body.generation}%`);
    }

    // Build WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND (isAvailable = '1' OR isAvailable = 1)";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `SELECT COUNT(*) as total FROM laptop WHERE ${whereClause}`;
    const filteredQuery = `SELECT * FROM laptop WHERE ${whereClause} LIMIT ? OFFSET ?`;

    // Execute queries in parallel
    const [[countResult], [rows]] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit.toString(), offset.toString()])
    ]);

    const total = countResult[0].total;
    const [data] = await pool.execute<any[]>(
      `SELECT * from laptop LIMIT ? OFFSET ?`,
      [limit.toString(), offset.toString()]
    );


    res.json({
      success: true,
      data: {
        laptops: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: data
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMonitors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      brand,
      display,
      pyramid_id,
      service_tag,
      size,
      inventoryID,
      isAvailable,
    } = req.body;

    // Dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (brand) {
      filterConditions.push("name = ?");
      filterValues.push(brand);
    }
    if (display) {
      filterConditions.push("display LIKE ?");
      filterValues.push(`%${display}%`);
    }
    if (pyramid_id) {
      filterConditions.push("pyramid_id = ?");
      filterValues.push(pyramid_id);
    }
    if (service_tag) {
      filterConditions.push("service_tag LIKE ?");
      filterValues.push(`%${service_tag}%`);
    }
    if (size) {
      filterConditions.push("size = ?");
      filterValues.push(size);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM monitor
      WHERE ${whereClause}
    `;


    const allDataQuery = `
      SELECT *
      FROM monitor
      LIMIT ? OFFSET ?
    `;

    const filteredQuery = `
      SELECT *
      FROM monitor
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute all queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        monitors: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getAllRam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      brand,
      size,
      phyramidID,
      service_id,
      type,
      inventoryID,
      isAvailable,
    } = req.body;

    // Dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (size) {
      filterConditions.push("size LIKE ?");
      filterValues.push(`%${size}%`);
    }
    if (phyramidID) {
      filterConditions.push("phyramidID = ?");
      filterValues.push(phyramidID);
    }
    if (service_id) {
      filterConditions.push("service_id = ?");
      filterValues.push(service_id);
    }
    if (type) {
      filterConditions.push("type = ?");
      filterValues.push(type);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (req.body.form_factor) {
      filterConditions.push("form_factor = ?");
      filterValues.push(req.body.form_factor);
    }
    // Parent Device Filters
    if (req.body.MobileWorkstationID) {
      filterConditions.push("MobileWorkstationID = ?");
      filterValues.push(req.body.MobileWorkstationID);
    }
    if (req.body.WorkstationID) {
      filterConditions.push("WorkstationID = ?");
      filterValues.push(req.body.WorkstationID);
    }
    if (req.body.SystemID) {
      filterConditions.push("systemID = ?");
      filterValues.push(req.body.SystemID);
    }
    if (req.body.LaptopID) {
      filterConditions.push("laptopID = ?");
      filterValues.push(req.body.LaptopID);
    }
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ram
      WHERE ${whereClause}
    `;

    const dataQuery = `
      SELECT *
      FROM ram
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const allDataQuery = `
      SELECT *
      FROM ram
      LIMIT ? OFFSET ?
    `;

    // 🔥 Parallel execution
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(dataQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        ram: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      }
    });

  } catch (error) {
    next(error);
  }
};


export const getAllSSD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      SerialNumber,
      brand,
      service_tag,
      size,
      inventoryID,
      isAvailable,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (SerialNumber) {
      filterConditions.push("SerialNumber = ?");
      filterValues.push(SerialNumber);
    }
    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (service_tag) {
      filterConditions.push("serviceTag = ?");
      filterValues.push(service_tag);
    }
    if (size) {
      filterConditions.push("size LIKE ?");
      filterValues.push(`%${size}%`);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (req.body.phyramidID) {
      filterConditions.push("phyramidID LIKE ?");
      filterValues.push(`%${req.body.phyramidID}%`);
    }
    // Parent Device Filters
    if (req.body.MobileWorkstationID) {
      filterConditions.push("MobileWorkstationID = ?");
      filterValues.push(req.body.MobileWorkstationID);
    }
    if (req.body.WorkstationID) {
      filterConditions.push("WorkstationID = ?");
      filterValues.push(req.body.WorkstationID);
    }
    if (req.body.SystemID) {
      filterConditions.push("systemID = ?");
      filterValues.push(req.body.SystemID);
    }
    if (req.body.LaptopID) {
      filterConditions.push("laptopID = ?");
      filterValues.push(req.body.LaptopID);
    }
    // WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM ssd
      WHERE ${whereClause}
    `;

    const filteredQuery = `
      SELECT *
      FROM ssd
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;


    const allDataQuery = `
      SELECT *
      FROM ssd
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        ssd: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      },
    });

  } catch (error) {
    next(error);
  }
};


export const getAllNVMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      serialNumber,
      brand,
      Size,
      serviceTag,
      inventoryID,
      isAvailable,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (serialNumber) {
      filterConditions.push("SerialNumber = ?");
      filterValues.push(serialNumber);
    }
    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (Size) {
      filterConditions.push("Size LIKE ?");
      filterValues.push(`%${Size}%`);
    }
    if (serviceTag) {
      filterConditions.push("serviceTag LIKE ?");
      filterValues.push(`%${serviceTag}%`);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    // Parent Device Filters
    if (req.body.MobileWorkstationID) {
      filterConditions.push("MobileWorkstationID = ?");
      filterValues.push(req.body.MobileWorkstationID);
    }
    if (req.body.WorkstationID) {
      filterConditions.push("WorkstationID = ?");
      filterValues.push(req.body.WorkstationID);
    }
    if (req.body.SystemID) {
      filterConditions.push("systemID = ?");
      filterValues.push(req.body.SystemID);
    }
    if (req.body.LaptopID) {
      filterConditions.push("laptopID = ?");
      filterValues.push(req.body.LaptopID);
    }
    if (req.body.phyramidID) {
      filterConditions.push("phyramidID LIKE ?");
      filterValues.push(`%${req.body.phyramidID}%`);
    }
    // WHERE clause
    let whereClause = "isActive = 1";

    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }

    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM nvme
      WHERE ${whereClause}
    `;

    const filteredQuery = `
      SELECT *
      FROM nvme
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;


    const allDataQuery = `
      SELECT *
      FROM nvme
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute all queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        nvme: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      },
    });

  } catch (error) {
    next(error);
  }
};


export const getAllHDD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      SerialNumber,
      brand,
      service_tag,
      size,
      inventoryID,
      isAvailable,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (SerialNumber) {
      filterConditions.push("SerialNumber = ?");
      filterValues.push(SerialNumber);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (req.body.phyramidID) {
      filterConditions.push("phyramidID LIKE ?");
      filterValues.push(`%${req.body.phyramidID}%`);
    }
    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (service_tag) {
      filterConditions.push("serviceTag = ?");
      filterValues.push(service_tag);
    }
    if (size) {
      filterConditions.push("size LIKE ?");
      filterValues.push(`%${size}%`);
    }

    // WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM hdd
      WHERE ${whereClause}
    `;

    const filteredQuery = `
      SELECT *
      FROM hdd
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const allDataQuery = `
      SELECT *
      FROM hdd
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute all queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        hdd: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      },
    });

  } catch (error) {
    next(error);
  }
};


export const getAllGraphicsCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      SerialNumber,
      brand,
      service_tag,
      size,
      inventoryID,
      isAvailable,
      generation,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (SerialNumber) {
      filterConditions.push("SerialNumber = ?");
      filterValues.push(SerialNumber);
    }
    if (req.body.id) {
      filterConditions.push("ID = ?");
      filterValues.push(req.body.id);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (req.body.phyramidID) {
      filterConditions.push("phyramidID LIKE ?");
      filterValues.push(`%${req.body.phyramidID}%`);
    }
    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (service_tag) {
      filterConditions.push("serviceTag = ?");
      filterValues.push(service_tag);
    }
    if (size) {
      filterConditions.push("size LIKE ?");
      filterValues.push(`%${size}%`);
    }
    if (generation) {
      filterConditions.push("generation LIKE ?");
      filterValues.push(`%${generation}%`);
    }
    // Parent Device Filters
    if (req.body.MobileWorkstationID) {
      filterConditions.push("MobileWorkstationID = ?");
      filterValues.push(req.body.MobileWorkstationID);
    }
    if (req.body.WorkstationID) {
      filterConditions.push("WorkstationID = ?");
      filterValues.push(req.body.WorkstationID);
    }
    if (req.body.SystemID) {
      filterConditions.push("systemID = ?");
      filterValues.push(req.body.SystemID);
    }
    if (req.body.LaptopID) {
      filterConditions.push("laptopID = ?");
      filterValues.push(req.body.LaptopID);
    }

    // WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
          SELECT COUNT(*) AS total
          FROM graphicscard
          WHERE ${whereClause}
        `;

    const filteredQuery = `
          SELECT *
          FROM graphicscard
          WHERE ${whereClause}
          LIMIT ? OFFSET ?
        `;
    const allDataQuery = `
      SELECT *
      FROM graphicscard
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute all queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        graphicsCard: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      },
    });

  } catch (error) {
    next(error);
  }
};


export const getAllWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      Name,
      Processor,
      Generation,
      serviceID,
      pyramidsID,
      inventoryID,
      isAvailable,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (Name) {
      filterConditions.push("Name LIKE ?");
      filterValues.push(`%${Name}%`);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (Processor) {
      filterConditions.push("Processor LIKE ?");
      filterValues.push(`%${Processor}%`);
    }
    if (Generation) {
      filterConditions.push("generation LIKE ?");
      filterValues.push(`%${Generation}%`);
    }
    if (serviceID) {
      filterConditions.push("serviceID LIKE ?");
      filterValues.push(`%${serviceID}%`);
    }
    if (pyramidsID) {
      filterConditions.push("pyramidsID = ?");
      filterValues.push(pyramidsID);
    }

    // WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM workstation
      WHERE ${whereClause}
    `;

    const filteredQuery = `
      SELECT *
      FROM workstation
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const allDataQuery = `
      SELECT *
      FROM workstation
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute all queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        workstation: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      },
    });

  } catch (error) {
    next(error);
  }
};


export const getAllMobileWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      brand,
      model,
      processor_brand,
      processor_model,
      generation,
      adapter,
      service_id,
      phyramidID,
      date_of_purchase,
      inventoryID,
      isAvailable,
      // Legacy params support (optional)
      serviceTag,
      pyramidsID,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (model) {
      filterConditions.push("model LIKE ?");
      filterValues.push(`%${model}%`);
    }
    if (processor_brand) {
      filterConditions.push("processor_brand LIKE ?");
      filterValues.push(`%${processor_brand}%`);
    }
    if (processor_model) {
      filterConditions.push("processor_model LIKE ?");
      filterValues.push(`%${processor_model}%`);
    }
    if (generation) {
      filterConditions.push("generation LIKE ?");
      filterValues.push(`%${generation}%`);
    }
    if (adapter) {
      filterConditions.push("adapter LIKE ?");
      filterValues.push(`%${adapter}%`);
    }

    // IDs
    if (service_id || serviceTag) {
      filterConditions.push("service_id = ?");
      filterValues.push(service_id || serviceTag);
    }
    if (phyramidID || pyramidsID) {
      filterConditions.push("phyramidID = ?");
      filterValues.push(phyramidID || pyramidsID);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (date_of_purchase) {
      filterConditions.push("date_of_purchase = ?");
      filterValues.push(date_of_purchase);
    }


    // WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND (isAvailable = '1' OR isAvailable = 1)";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM mobileworkstation
      WHERE ${whereClause}
    `;

    const filteredQuery = `
      SELECT *
      FROM mobileworkstation
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const allDataQuery = `
      SELECT *
      FROM mobileworkstation
      LIMIT ? OFFSET ?
    `;

    //  Execute all queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        mobileworkstation: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      },
    });

  } catch (error) {
    next(error);
  }
};


export const getAllSystem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      Name,
      Processor,
      Generation,
      pyramidsID,
      serviceID,
      inventoryID,
      isAvailable,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (Name) {
      filterConditions.push("Name LIKE ?");
      filterValues.push(`%${Name}%`);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (Processor) {
      filterConditions.push("Processor LIKE ?");
      filterValues.push(`%${Processor}%`);
    }
    if (Generation) {
      filterConditions.push("Generation LIKE ?");
      filterValues.push(`%${Generation}%`);
    }
    if (pyramidsID) {
      filterConditions.push("pyramidsID = ?");
      filterValues.push(pyramidsID);
    }
    if (serviceID) {
      filterConditions.push("serviceID = ?");
      filterValues.push(serviceID);
    }

    // WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND isAvailable = 1";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Queries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM system
      WHERE ${whereClause}
    `;

    const filteredQuery = `
      SELECT *
      FROM system
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const allDataQuery = `
      SELECT *
      FROM system
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute all queries in parallel
    const [
      [countResult],
      [allData],
      [rows]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(allDataQuery, [limit, offset]),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset])
    ]);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        system: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
        data: allData
      },
    });

  } catch (error) {
    next(error);
  }
};


// Get single laptop by ID 
// Get Single Laptop by ID
export const getInventoryFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute<any[]>(
      `SELECT 
        l.id,
        l.brand,
        l.model,
        l.processor_brand,
        l.processor_model,
        l.generation,
        l.service_id,
        l.CompanyID,
        l.date_of_purchase,
        l.adapter,
        l.ramID,
        l.graphicscardID,
        l.inventoryID,
        l.phyramidID,
        l.isAvailable,
        l.isActive,
        c.company_name,
        c.customer_name,
        c.phone
      FROM laptop l
      LEFT JOIN company c ON l.CompanyID = c.id
      WHERE l.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      const error: AppError = new Error("Laptop not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};


// Add new laptop
export const addLaptopNew = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log("!!! EXECUTING addLaptopNew - IF YOU SEE THIS, NEW CODE IS RUNNING !!!");
  try {
    const laptops = Array.isArray(req.body) ? req.body : [req.body];
    console.log('DEBUG: addLaptop called with body:', JSON.stringify(req.body, null, 2));

    // Validate required fields for all items first
    for (const laptop of laptops) {
      if (!laptop.brand || !laptop.model) {
        const error: AppError = new Error("Brand and model are required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicates
    // Normalize IDs to strings for consistent comparison
    const serviceIds = new Set(
      laptops
        .map((l: any) => l.service_id?.toString().trim())
        .filter((id: any) => id)
    );
    const pyramidIDs = new Set(
      laptops
        .map((l: any) => l.phyramidID?.toString().trim())
        .filter((id: any) => id)
    );

    console.log("DEBUG: Checking duplicates for ServiceIDs:", Array.from(serviceIds), "PyramidIDs:", Array.from(pyramidIDs));

    if (serviceIds.size > 0 || pyramidIDs.size > 0) {
      const conditions: string[] = [];
      const values: any[] = [];

      if (serviceIds.size > 0) {
        conditions.push(`service_id IN (${Array(serviceIds.size).fill('?').join(',')})`);
        values.push(...Array.from(serviceIds));
      }
      if (pyramidIDs.size > 0) {
        conditions.push(`phyramidID IN (${Array(pyramidIDs.size).fill('?').join(',')})`);
        values.push(...Array.from(pyramidIDs));
      }

      const query = `SELECT service_id, phyramidID FROM laptop WHERE ${conditions.join(' OR ')}`;
      console.log("DEBUG: Executing duplicate query:", query, "Values:", values);

      const [existingRecords] = await pool.execute<any[]>(query, values);
      console.log("DEBUG: Duplicates found in DB:", JSON.stringify(existingRecords, null, 2));

      const duplicateServiceIds: string[] = [];
      const duplicatePyramidIDs: string[] = [];

      existingRecords.forEach((record: any) => {
        if (record.service_id && serviceIds.has(String(record.service_id))) {
          duplicateServiceIds.push(String(record.service_id));
        }
        if (record.phyramidID && pyramidIDs.has(String(record.phyramidID))) {
          duplicatePyramidIDs.push(String(record.phyramidID));
        }
      });

      if (duplicateServiceIds.length > 0 || duplicatePyramidIDs.length > 0) {
        const errorMessages: string[] = [];
        if (duplicateServiceIds.length > 0) {
          errorMessages.push(`Service IDs: ${[...new Set(duplicateServiceIds)].join(', ')}`);
        }
        if (duplicatePyramidIDs.length > 0) {
          errorMessages.push(`Pyramid IDs: ${[...new Set(duplicatePyramidIDs)].join(', ')}`);
        }

        const error: AppError = new Error(`Duplicate Laptop(s) found: ${errorMessages.join('; ')}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = laptops.map(async (laptop: any) => {
      const {
        brand,
        model,
        processor_brand,
        processor_model,
        generation,
        service_id,
        company_id,
        phyramidID,
        date_of_purchase,
        adapter,
        inventoryID,
      } = laptop;

      // Support both array (ramIDs) and single (ramID) for backward compatibility
      const ramIDList = Array.isArray(laptop.ramIDs) ? laptop.ramIDs : (laptop.ramID ? [laptop.ramID] : []);
      const ssdIDList = Array.isArray(laptop.ssdIDs) ? laptop.ssdIDs : (laptop.ssdID ? [laptop.ssdID] : []);
      const nvmeIDList = Array.isArray(laptop.nvmeIDs) ? laptop.nvmeIDs : (laptop.nvmeID ? [laptop.nvmeID] : []);
      const m2IDList = Array.isArray(laptop.m2IDs) ? laptop.m2IDs : (laptop.m2ID ? [laptop.m2ID] : []);
      const gpuIDList = Array.isArray(laptop.graphicscardIDs) ? laptop.graphicscardIDs : (laptop.graphicscardID ? [laptop.graphicscardID] : []);

      const [result] = await pool.execute<any>(
        `INSERT INTO laptop 
          (brand, model, processor_brand, processor_model, generation, ramID, graphicscardID, ssdID, nvmeID, m2ID, service_id, CompanyID, phyramidID, date_of_purchase, adapter, inventoryID) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          model,
          processor_brand || null,
          processor_model || null,
          generation || null,
          ramIDList[0] || null,
          gpuIDList[0] || null,
          ssdIDList[0] || null,
          nvmeIDList[0] || null,
          m2IDList[0] || null,
          service_id || null,
          company_id || null,
          phyramidID || null,
          date_of_purchase || null,
          adapter || null,
          laptop.inventoryID || null,
        ]
      );

      const laptopId = result.insertId;

      // Update Component Allocation - Link back to Laptop
      // 1. RAM (all selected)
      for (const rid of ramIDList) {
        if (rid) {
          await pool.execute(
            `UPDATE ram SET laptopID = ?, isAvailable = 0 WHERE id = ?`,
            [laptopId, rid]
          );
        }
      }

      // 2. SSD (all selected)
      for (const sid of ssdIDList) {
        if (sid) {
          await pool.execute(
            `UPDATE ssd SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE ssdID = ?`,
            [laptopId, company_id || null, sid]
          );
        }
      }

      // 3. NVMe (all selected)
      for (const nid of nvmeIDList) {
        if (nid) {
          await pool.execute(
            `UPDATE nvme SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE ID = ?`,
            [laptopId, company_id || null, nid]
          );
        }
      }

      // 4. M.2 (all selected)
      for (const mid of m2IDList) {
        if (mid) {
          await pool.execute(
            `UPDATE m_2 SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
            [laptopId, company_id || null, mid]
          );
        }
      }

      // 5. Graphics Card (all selected)
      for (const gid of gpuIDList) {
        if (gid) {
          await pool.execute(
            `UPDATE graphicscard SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
            [laptopId, company_id || null, gid]
          );
        }
      }

      return laptopId;
    });

    const results = await Promise.all(insertPromises);

    res.status(201).json({
      success: true,
      message: "Laptops added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new RAM
export const addRam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  console.log('req', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    console.log('nova', req.body);

    for (const item of items) {
      if (!item.brand) {
        const error: AppError = new Error("Brand is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicate Pyramid IDs
    const pyramidIDs = items.map((i: any) => i.phyramidID).filter((id: any) => id);

    if (pyramidIDs.length > 0) {
      const [existingPyramids] = await pool.execute<any>(
        `SELECT phyramidID FROM ram WHERE phyramidID IN (${pyramidIDs.map(() => '?').join(',')})`,
        pyramidIDs
      );

      if (existingPyramids.length > 0) {
        const duplicates = existingPyramids.map((r: any) => r.phyramidID).join(', ');
        const error: AppError = new Error(`Duplicate Pyramid ID(s) already exist: ${duplicates}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        date_of_purchase,
        form_factor,
        pyramid_id,
        service_id,
        size,
        type,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO ram( brand, date_of_purchase, form_factor, phyramidID, service_id, size, type, inventoryID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          date_of_purchase,
          form_factor || null,
          pyramid_id || null,
          service_id || null,
          size || null,
          type || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(201).json({
      success: true,
      message: "Ram added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new SSD
export const addSSD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.brand) {
        const error: AppError = new Error("Brand is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicates
    const serialNumbers = items.map((i: any) => i.SerialNumber).filter((id: any) => id);
    const pyramidIDs = items.map((i: any) => i.phyramidID).filter((id: any) => id);

    if (serialNumbers.length > 0 || pyramidIDs.length > 0) {
      const duplicateConditions: string[] = [];
      const duplicateValues: any[] = [];

      if (serialNumbers.length > 0) {
        duplicateConditions.push(`SerialNumber IN (${serialNumbers.map(() => '?').join(',')})`);
        duplicateValues.push(...serialNumbers);
      }
      if (pyramidIDs.length > 0) {
        duplicateConditions.push(`phyramidID IN (${pyramidIDs.map(() => '?').join(',')})`);
        duplicateValues.push(...pyramidIDs);
      }

      const duplicateQuery = `SELECT SerialNumber, phyramidID FROM ssd WHERE ${duplicateConditions.join(' OR ')}`;
      const [duplicates] = await pool.execute<any[]>(duplicateQuery, duplicateValues);

      if (duplicates.length > 0) {
        const duplicateSerialNumbers = duplicates.map((d: any) => d.SerialNumber).filter((id: any) => id && serialNumbers.includes(id));
        const duplicatePyramidIDs = duplicates.map((d: any) => d.phyramidID).filter((id: any) => id && pyramidIDs.includes(id));

        const errorMessages = [];
        if (duplicateSerialNumbers.length > 0) {
          errorMessages.push(`Serial Numbers: ${duplicateSerialNumbers.join(', ')}`);
        }
        if (duplicatePyramidIDs.length > 0) {
          errorMessages.push(`Pyramid IDs: ${duplicatePyramidIDs.join(', ')}`);
        }

        const error: AppError = new Error(`Duplicate SSD(s) found: ${errorMessages.join('; ')}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        SerialNumber,
        dateOfPurchase,
        serviceTag,
        speed,
        ssdSize,
        warrantyEndDate,
        phyramidID,
      } = item;



      const [result] = await pool.execute<any>(
        `INSERT INTO ssd (brand, ssdSize, speed, SerialNumber, serviceTag, warrantyEndDate, dateOfPurchase, phyramidID, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          ssdSize || null,
          speed || null,
          SerialNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          phyramidID || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "SSD added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new NVMe
export const addNVMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.brand) {
        const error: AppError = new Error("Brand is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicates
    const serialNumbers = items.map((i: any) => i.serialNumber).filter((id: any) => id);
    const pyramidIDs = items.map((i: any) => i.phyramidID).filter((id: any) => id);

    if (serialNumbers.length > 0 || pyramidIDs.length > 0) {
      const duplicateConditions: string[] = [];
      const duplicateValues: any[] = [];

      if (serialNumbers.length > 0) {
        duplicateConditions.push(`serialNumber IN (${serialNumbers.map(() => '?').join(',')})`);
        duplicateValues.push(...serialNumbers);
      }
      if (pyramidIDs.length > 0) {
        duplicateConditions.push(`phyramidID IN (${pyramidIDs.map(() => '?').join(',')})`);
        duplicateValues.push(...pyramidIDs);
      }

      const duplicateQuery = `SELECT serialNumber, phyramidID FROM nvme WHERE ${duplicateConditions.join(' OR ')}`;
      const [duplicates] = await pool.execute<any[]>(duplicateQuery, duplicateValues);

      if (duplicates.length > 0) {
        const duplicateSerialNumbers = duplicates.map((d: any) => d.serialNumber).filter((id: any) => id && serialNumbers.includes(id));
        const duplicatePyramidIDs = duplicates.map((d: any) => d.phyramidID).filter((id: any) => id && pyramidIDs.includes(id));

        const errorMessages = [];
        if (duplicateSerialNumbers.length > 0) {
          errorMessages.push(`Serial Numbers: ${duplicateSerialNumbers.join(', ')}`);
        }
        if (duplicatePyramidIDs.length > 0) {
          errorMessages.push(`Pyramid IDs: ${duplicatePyramidIDs.join(', ')}`);
        }

        const error: AppError = new Error(`Duplicate NVMe(s) found: ${errorMessages.join('; ')}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        serialNumber,
        dateOfPurchase,
        serviceTag,
        speed,
        Size,
        warrantyEndDate,
        phyramidID,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO nvme(brand, Size, speed, serialNumber, serviceTag, warrantyEndDate, dateOfPurchase, phyramidID, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          Size || null,
          speed || null,
          serialNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          phyramidID || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "NVMe added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new HDD
export const addHDD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.brand) {
        const error: AppError = new Error("Brand is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for existing Serial Numbers
    const serialNumbers = items.filter((item: any) => item.serialNumber).map((item: any) => item.serialNumber);
    if (serialNumbers.length > 0) {
      const placeholders = serialNumbers.map(() => '?').join(',');
      const [existing] = await pool.execute<any>(
        `SELECT serialNumber FROM hdd WHERE serialNumber IN (${placeholders})`,
        serialNumbers
      );
      if (existing.length > 0) {
        const error: AppError = new Error(`HDD with Serial Number ${existing[0].serialNumber} already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    // Check for existing Pyramid IDs
    const pyramidIDs = items.filter((item: any) => item.phyramidID).map((item: any) => item.phyramidID);
    if (pyramidIDs.length > 0) {
      const placeholders = pyramidIDs.map(() => '?').join(',');
      const [existing] = await pool.execute<any>(
        `SELECT phyramidID FROM hdd WHERE phyramidID IN (${placeholders})`,
        pyramidIDs
      );
      if (existing.length > 0) {
        const error: AppError = new Error(`HDD with Pyramid ID ${existing[0].phyramidID} already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        serialNumber,
        dateOfPurchase,
        serviceTag,
        speed,
        size,
        warrantyEndDate,
        phyramidID,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO hdd(brand, speed, serialNumber, serviceTag, warrantyEndData, dateOfPurchase, size, phyramidID, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          speed || null,
          serialNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          size || null,
          phyramidID || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "HDD added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new Monitor
export const addMonitor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.name) {
        const error: AppError = new Error("Name is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicate Pyramid IDs
    const pyramidIDs = items.map((i: any) => i.pyramid_id).filter((id: any) => id);

    if (pyramidIDs.length > 0) {
      const [existingPyramids] = await pool.execute<any>(
        `SELECT pyramid_id FROM monitor WHERE pyramid_id IN (${pyramidIDs.map(() => '?').join(',')})`,
        pyramidIDs
      );

      if (existingPyramids.length > 0) {
        const duplicates = existingPyramids.map((r: any) => r.pyramid_id).join(', ');
        const error: AppError = new Error(`Duplicate Pyramid ID(s) already exist: ${duplicates}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        name,
        date_of_purchase,
        display,
        pyramid_id,
        service_tag,
        size,
        warranty_date,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO  monitor(name, size, display, service_tag, pyramid_id, date_of_purchase, warranty_date, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          size || null,
          display || null,
          service_tag || null,
          pyramid_id || null,
          date_of_purchase || null,
          warranty_date || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "Monitor added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new Desktop (System)
export const addDesktop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      const name = item.Name || item.Brand || item.brand;
      if (!name || !item.Processor) {
        const error: AppError = new Error("Brand/Name and Processor are required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicates
    const pyramidsIDs = items.map((i: any) => i.pyramidsID).filter((id: any) => id);

    if (pyramidsIDs.length > 0) {
      const [existingPyramids] = await pool.query<RowDataPacket[]>(
        `SELECT pyramidsID FROM system WHERE pyramidsID IN (?)`,
        [pyramidsIDs]
      );

      if (existingPyramids.length > 0) {
        const duplicateIDs = existingPyramids.map((r: any) => r.pyramidsID).join(', ');
        const error: AppError = new Error(`Pyramid IDs already exist: ${duplicateIDs}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        Name,
        Brand,
        brand,
        Processor,
        Generation,
        serviceID,
        pyramidsID,
        dateOfPurchase,
      } = item;

      const dbName = Name || Brand || brand;

      // Support both array (ramIDs) and single (ramID) for backward compatibility
      const ramIDList = Array.isArray(item.ramIDs) ? item.ramIDs : (item.ramID ? [item.ramID] : []);
      const ssdIDList = Array.isArray(item.ssdIDs) ? item.ssdIDs : (item.ssdID ? [item.ssdID] : []);
      const nvmeIDList = Array.isArray(item.nvmeIDs) ? item.nvmeIDs : (item.nvmeID ? [item.nvmeID] : []);
      const m2IDList = Array.isArray(item.m2IDs) ? item.m2IDs : (item.m2ID ? [item.m2ID] : []);
      const gpuIDList = Array.isArray(item.graphicscardIDs) ? item.graphicscardIDs : (item.graphicscardID ? [item.graphicscardID] : []);

      const [result] = await pool.execute<any>(
        `INSERT INTO system(Name, Processor, Generation, serviceID, pyramidsID, ramID, ssdID, nvmeID, m2ID, graphicscardID, dateOfPurchase, inventoryID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dbName,
          Processor,
          Generation || null,
          serviceID || null,
          pyramidsID || null,
          ramIDList[0] || null,
          ssdIDList[0] || null,
          nvmeIDList[0] || null,
          m2IDList[0] || null,
          gpuIDList[0] || null,
          dateOfPurchase || null,
          item.inventoryID || null,
        ]
      );

      const systemId = result.insertId;

      // Update Component Allocation - Link back to System
      // 1. RAM (all selected)
      for (const rid of ramIDList) {
        if (rid) {
          await pool.execute(
            `UPDATE ram SET systemID = ?, isAvailable = 0 WHERE id = ?`,
            [systemId, rid]
          );
        }
      }

      // 2. SSD (all selected)
      for (const sid of ssdIDList) {
        if (sid) {
          await pool.execute(
            `UPDATE ssd SET systemID = ?, isAvailable = 0 WHERE ssdID = ?`,
            [systemId, sid]
          );
        }
      }

      // 3. NVMe (all selected)
      for (const nid of nvmeIDList) {
        if (nid) {
          await pool.execute(
            `UPDATE nvme SET systemID = ?, isAvailable = 0 WHERE id = ?`,
            [systemId, nid]
          );
        }
      }

      // 4. M.2 (all selected)
      for (const mid of m2IDList) {
        if (mid) {
          await pool.execute(
            `UPDATE m_2 SET systemID = ?, isAvailable = 0 WHERE id = ?`,
            [systemId, mid]
          );
        }
      }

      // 5. Graphics Card (all selected)
      for (const gid of gpuIDList) {
        if (gid) {
          await pool.execute(
            `UPDATE graphicscard SET systemID = ?, isAvailable = 0 WHERE id = ?`,
            [systemId, gid]
          );
        }
      }

      return systemId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "System added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new Workstation
export const addWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      const name = item.Name || item.Brand || item.brand;
      if (!name || !item.Processor) {
        const error: AppError = new Error("Brand/Name and Processor are required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicate Pyramid IDs
    const pyramidsIDs = items.map((i: any) => i.pyramidsID).filter((id: any) => id);

    if (pyramidsIDs.length > 0) {
      const [existingPyramids] = await pool.execute<any>(
        `SELECT pyramidsID FROM workstation WHERE pyramidsID IN (${pyramidsIDs.map(() => '?').join(',')})`,
        pyramidsIDs
      );

      if (existingPyramids.length > 0) {
        const duplicates = existingPyramids.map((r: any) => r.pyramidsID).join(', ');
        const error: AppError = new Error(`Duplicate Pyramid ID(s) already exist: ${duplicates}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        Name,
        Brand,
        brand,
        Processor,
        generation,
        serviceID,
        pyramidsID,
        dateOfPurchase,
      } = item;

      const dbName = Name || Brand || brand;

      // Support both array (ramIDs) and single (ramID) for backward compatibility
      const ramIDList = Array.isArray(item.ramIDs) ? item.ramIDs : (item.ramID ? [item.ramID] : []);
      const ssdIDList = Array.isArray(item.ssdIDs) ? item.ssdIDs : (item.ssdID ? [item.ssdID] : []);
      const nvmeIDList = Array.isArray(item.nvmeIDs) ? item.nvmeIDs : (item.nvmeID ? [item.nvmeID] : []);
      const m2IDList = Array.isArray(item.m2IDs) ? item.m2IDs : (item.m2ID ? [item.m2ID] : []);
      const gpuIDList = Array.isArray(item.graphicscardIDs) ? item.graphicscardIDs : (item.graphicscardID ? [item.graphicscardID] : []);

      const [result] = await pool.execute<any>(
        `INSERT INTO workstation(Name, Processor, generation, serviceID, pyramidsID, ramID, ssdID, nvmeID, m2ID, graphicscardID, dateOfPurchase, inventoryID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dbName,
          Processor,
          generation || null,
          serviceID || null,
          pyramidsID || null,
          ramIDList[0] || null,
          ssdIDList[0] || null,
          nvmeIDList[0] || null,
          m2IDList[0] || null,
          gpuIDList[0] || null,
          dateOfPurchase || null,
          item.inventoryID || null,
        ]
      );

      const workstationId = result.insertId;

      // Update Component Allocation - Link back to Workstation
      // 1. RAM (all selected)
      for (const rid of ramIDList) {
        if (rid) {
          await pool.execute(
            `UPDATE ram SET workstationID = ?, isAvailable = 0 WHERE id = ?`,
            [workstationId, rid]
          );
        }
      }

      // 2. SSD (all selected)
      for (const sid of ssdIDList) {
        if (sid) {
          await pool.execute(
            `UPDATE ssd SET workstationID = ?, isAvailable = 0 WHERE ssdID = ?`,
            [workstationId, sid]
          );
        }
      }

      // 3. NVMe (all selected)
      for (const nid of nvmeIDList) {
        if (nid) {
          await pool.execute(
            `UPDATE nvme SET workstationID = ?, isAvailable = 0 WHERE id = ?`,
            [workstationId, nid]
          );
        }
      }

      // 4. M.2 (all selected)
      for (const mid of m2IDList) {
        if (mid) {
          await pool.execute(
            `UPDATE m_2 SET workstationID = ?, isAvailable = 0 WHERE id = ?`,
            [workstationId, mid]
          );
        }
      }

      // 5. Graphics Card (all selected)
      for (const gid of gpuIDList) {
        if (gid) {
          await pool.execute(
            `UPDATE graphicscard SET workstationID = ?, isAvailable = 0 WHERE id = ?`,
            [workstationId, gid]
          );
        }
      }

      return workstationId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "Workstation added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new Mobile Workstation

// Add new MobileWorkstation
export const addMobileWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Mobile Workstation', req.body);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.processor_brand) {
        // Fallback if legacy field `processor` is sent, or error? 
        // Frontend sends processor_brand.
        // Let's be strict or allow optional if we want robustness.
        // But schema says processor_brand VARCHAR(100) DEFAULT NULL? No, let's assume strict for now based on frontend required.
      }
    }

    // Check for duplicate phyramidID and service_id
    const phyramidIDs = items.map((item: any) => item.phyramidID).filter(Boolean);
    const serviceIds = items.map((item: any) => item.service_id).filter(Boolean);

    if (phyramidIDs.length > 0) {
      const [existingPyramids] = await pool.execute<any>(
        `SELECT phyramidID FROM mobileworkstation WHERE phyramidID IN (${phyramidIDs.map(() => '?').join(',')})`,
        phyramidIDs
      );
      if (existingPyramids.length > 0) {
        const duplicates = existingPyramids.map((r: any) => r.phyramidID).join(', ');
        const error: AppError = new Error(`Duplicate Pyramid ID(s) already exist: ${duplicates}`);
        error.statusCode = 400;
        throw error;
      }
    }

    if (serviceIds.length > 0) {
      const [existingTags] = await pool.execute<any>(
        `SELECT service_id FROM mobileworkstation WHERE service_id IN (${serviceIds.map(() => '?').join(',')})`,
        serviceIds
      );
      if (existingTags.length > 0) {
        const duplicates = existingTags.map((r: any) => r.service_id).join(', ');
        const error: AppError = new Error(`Duplicate Service ID(s) already exist: ${duplicates}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        model,
        processor_brand,
        processor_model,
        generation,
        service_id,
        phyramidID,
        CompanyID,
        date_of_purchase, // Frontend sends camelCase, map to snake_case or check schema column name?
        // Schema says `date_of_purchase`. Old code used `dateOfPurchase` column?
        // Let's check old code: `INSERT INTO mobileworkstation(... dateOfPurchase ...)`. 
        // So OLD column was camelCase. User schema says `date_of_purchase`.
        // I should use `date_of_purchase` in SQL.
        adapter,
        ramIDs,
        ssdIDs,
        nvmeIDs,
        m2IDs,
        graphicscardID,
        inventoryID,
        isAvailable = 1,
        isActive = 1
      } = item;

      // Handle Component Arrays (Multi-Select)
      const ramIDList = Array.isArray(ramIDs) ? ramIDs : (ramIDs ? [ramIDs] : []);
      const ssdIDList = Array.isArray(ssdIDs) ? ssdIDs : (ssdIDs ? [ssdIDs] : []);
      const nvmeIDList = Array.isArray(nvmeIDs) ? nvmeIDs : (nvmeIDs ? [nvmeIDs] : []);
      const m2IDList = Array.isArray(m2IDs) ? m2IDs : (m2IDs ? [m2IDs] : []);

      // Store first RAM ID for legacy/primary reference if needed, or null
      const primaryRamID = ramIDList.length > 0 ? ramIDList[0] : null;

      const [result] = await pool.execute<any>(
        `INSERT INTO mobileworkstation(
          brand, model, processor_brand, processor_model, generation, 
          service_id, phyramidID, CompanyID, date_of_purchase, adapter, 
          ramID, graphicscardID, inventoryID, 
          isAvailable, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand || null,
          model || null,
          processor_brand || null,
          processor_model || null,
          generation || null,
          service_id || null,
          phyramidID || null,
          CompanyID || null,
          date_of_purchase || null,
          adapter || null,
          primaryRamID || null,
          graphicscardID || null,
          inventoryID || null,
          isAvailable,
          isActive
        ]
      );

      const mobileWorkstationId = result.insertId;

      // Component Linking
      if (mobileWorkstationId) {
        // Link RAM
        if (ramIDList.length > 0) {
          // Update individually or IN clause? IN clause is better but need to set MobileWorkstationID.
          // `UPDATE ram SET MobileWorkstationID = ?, isAvailable = 0 WHERE id IN (?)`
          // But mysql2 IN clause binding with array needs workaround or loop. Loop is safer given previous patterns.
          for (const id of ramIDList) {
            await pool.execute(`UPDATE ram SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`, [mobileWorkstationId, CompanyID || null, id]);
          }
        }
        // Link SSD
        for (const id of ssdIDList) {
          await pool.execute(`UPDATE ssd SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE ssdID = ?`, [mobileWorkstationId, CompanyID || null, id]);
        }
        // Link NVMe
        for (const id of nvmeIDList) {
          await pool.execute(`UPDATE nvme SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE ID = ?`, [mobileWorkstationId, CompanyID || null, id]);
        }
        // Link M.2
        for (const id of m2IDList) {
          await pool.execute(`UPDATE m_2 SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`, [mobileWorkstationId, CompanyID || null, id]);
        }
      }

      return mobileWorkstationId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "Mobile Workstation added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new GraphicsCard
export const addGraphicsCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.brand) {
        const error: AppError = new Error("brand is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Duplicate check for phyramidID only
    const pyramidIDs = new Set(
      items.map((i: any) => i.phyramidID?.toString().trim()).filter((id: any) => id)
    );

    if (pyramidIDs.size > 0) {
      const query = `SELECT phyramidID FROM graphicscard WHERE phyramidID IN (${Array(pyramidIDs.size).fill('?').join(',')})`;
      const [existingRecords] = await pool.execute<any[]>(query, Array.from(pyramidIDs));

      const duplicatePyramidIDs = existingRecords
        .map((r: any) => String(r.phyramidID))
        .filter((id: string) => pyramidIDs.has(id));

      if (duplicatePyramidIDs.length > 0) {
        const error: AppError = new Error(`Duplicate Graphics Card(s) found - Pyramid IDs: ${[...new Set(duplicatePyramidIDs)].join(', ')}`);
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        dateOfPurchase,
        generation,
        model,
        serviceNumber,
        serviceTag,
        size,
        warrantyEndDate,
        phyramidID,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO  graphicscard(brand, model, size, generation, serviceNumber, serviceTag, warrantyEndDate, dateOfPurchase, inventoryID, phyramidID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand || null,
          model || null,
          size || null,
          generation || null,
          serviceNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          item.inventoryID || null,
          phyramidID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "GraphicsCard added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update RAM
export const updateRam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // const { id } = req.params; // laptopID
    const {
      addRam,
      removeRam,
      userID,
      CompanyID,
      inventoryID,
      log,
      id,
      product,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
    } = req.body;
    const productMap: Record<string, string> = {
      laptop: 'laptopID',
      workstation: 'workstationID',
      monitor: 'monitorID',
    };

    const productID = productMap[product];
    //  Validation
    if (!id) {
      const error: AppError = new Error("Laptop ID is required");
      error.statusCode = 400;
      throw error;
    }

    const hasRamUpdates = (addRam && addRam.length > 0) || (removeRam && removeRam.length > 0);
    const hasSSDUpdates = (addSSD && addSSD.length > 0) || (removeSSD && removeSSD.length > 0);
    const hasNvmeUpdates = (addNvme && addNvme.length > 0) || (removeNvme && removeNvme.length > 0);

    // if (!hasRamUpdates && !hasSSDUpdates && !hasNvmeUpdates) {
    //   const error: AppError = new Error("At least one component (RAM, SSD, or NVMe) must be updated");
    //   error.statusCode = 400;
    //   throw error;
    // }

    // Create promises (same pattern as AddReturn)
    const promises: Promise<any>[] = [];

    // Add RAM to Laptop
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        const addPromise = pool.execute<any>(
          `UPDATE ram SET ${productID} = ?, companyID = ?, isAvailable = 0 WHERE id = ?`,
          [id, CompanyID, ram.id]
        );
        promises.push(addPromise);
      });
    }

    // Remove RAM from Laptop
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        const removePromise = pool.execute<any>(
          `UPDATE ram SET ${productID} = NULL, companyID = NULL, isAvailable = 1 WHERE id = ?`,
          [ram.id]
        );
        promises.push(removePromise);
      });
    }

    // Add SSD
    if (Array.isArray(addSSD)) {
      addSSD.forEach((item: any) => {
        const addPromise = pool.execute<any>(
          `UPDATE ssd SET ${productID} = ?, companyID = ?, isAvailable = 0 WHERE ssdID = ?`,
          [id, CompanyID, item.ssdID]
        );
        promises.push(addPromise);
      });
    }

    // Remove SSD
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((item: any) => {
        const removePromise = pool.execute<any>(
          `UPDATE ssd SET ${productID} = NULL, companyID = NULL, isAvailable = 1 WHERE ssdID = ?`,
          [item.ssdID]
        );
        promises.push(removePromise);
      });
    }

    // Add NVMe
    if (Array.isArray(addNvme)) {
      addNvme.forEach((item: any) => {
        const addPromise = pool.execute<any>(
          `UPDATE nvme SET ${productID} = ?, companyID = ?, isAvailable = 0 WHERE ID = ?`,
          [id, CompanyID, item.ID]
        );
        promises.push(addPromise);
      });
    }

    // Remove NVMe
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((item: any) => {
        const removePromise = pool.execute<any>(
          `UPDATE nvme SET ${productID} = NULL, companyID = NULL, isAvailable = 1 WHERE ID = ?`,
          [item.ID]
        );
        promises.push(removePromise);
      });
    }

    // Activity Log
    // const logPromise = pool.execute<any>(
    //   `INSERT INTO activity_logs
    //    (log, CompanyID, inventoryID, userID, productId, data)
    //    VALUES (?, ?, ?, ?, ?, NOW())`,
    //   [
    //     log || "RAM updated",
    //     CompanyID || null,
    //     inventoryID || null,
    //     userID || null,
    //     id,
    //   ]
    // );
    // promises.push(logPromise);

    //  Execute all queries in parallel
    const results = await Promise.all(promises);

    const affectedRows = results
      .filter((r: any) => r?.[0]?.affectedRows !== undefined)
      .reduce((sum: number, r: any) => sum + r[0].affectedRows, 0);

    if (affectedRows === 0) {
      const error: AppError = new Error("No RAM updated");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "RAM updated successfully",
      affectedRows,
    });

  } catch (error) {
    next(error);
  }
};


// Delete laptop
export const deleteLaptop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute<any>(
      "DELETE FROM laptop WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      const error: AppError = new Error("Laptop not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "Laptop deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update laptop
export const updateLaptop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      adapter,
      brand,
      date_of_purchase,
      service_id,
      model,
      processor_brand,
      processor_model,
      generation,
      ramID,
      graphicscardID,
      ssdID,
      nvmeID,
      m2ID,
      phyramidID,
      inventoryID,
      CompanyID,
      id,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
      addGraphicsCard,
      removeGraphicsCard,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!brand || !model) {
      const error: AppError = new Error("Brand and model are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE laptop SET brand = ?, model = ?, processor_brand = ?, processor_model = ?, generation = ?, ramID = ?, graphicscardID = ?, ssdID = ?, nvmeID = ?, m2ID = ?, service_id = ?, CompanyID = ?, phyramidID = ?, date_of_purchase = ?, adapter = ?, inventoryID = ? WHERE id = ?`,
      [
        brand,
        model,
        processor_brand || null,
        processor_model || null,
        generation || null,
        ramID || null,
        graphicscardID || null,
        ssdID || null,
        nvmeID || null,
        m2ID || null,
        service_id || null,
        CompanyID || null,
        phyramidID || null,
        date_of_purchase ? new Date(date_of_purchase).toISOString().split('T')[0] : null,
        adapter || null,
        inventoryID || null,
        id,
      ]
    );


    const promises: Promise<any>[] = [];

    // 1. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        if (ramId) {
          promises.push(pool.execute(
            `UPDATE ram SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
            [id, req.body.CompanyID || null, ramId]
          ));
        }
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        if (ramId) {
          promises.push(pool.execute(
            `UPDATE ram SET laptopID = NULL, isAvailable = 1, CompanyID = NULL WHERE id = ?`,
            [ramId]
          ));
        }
      });
    }

    // 2. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        if (ssdId) {
          promises.push(pool.execute(
            `UPDATE ssd SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE ssdID = ?`,
            [id, req.body.CompanyID || null, ssdId]
          ));
        }
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        if (ssdId) {
          promises.push(pool.execute(
            `UPDATE ssd SET laptopID = NULL, isAvailable = 1, CompanyID = NULL WHERE ssdID = ?`,
            [ssdId]
          ));
        }
      });
    }

    // 3. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        if (nvmeId) {
          promises.push(pool.execute(
            `UPDATE nvme SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE ID = ?`,
            [id, req.body.CompanyID || null, nvmeId]
          ));
        }
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        if (nvmeId) {
          promises.push(pool.execute(
            `UPDATE nvme SET laptopID = NULL, isAvailable = 1, CompanyID = NULL WHERE ID = ?`,
            [nvmeId]
          ));
        }
      });
    }

    // 4. M.2 Updates
    if (Array.isArray(addM2)) {
      addM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        if (m2Id) {
          promises.push(pool.execute(
            `UPDATE m_2 SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
            [id, req.body.CompanyID || null, m2Id]
          ));
        }
      });
    }
    if (Array.isArray(removeM2)) {
      removeM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        if (m2Id) {
          promises.push(pool.execute(
            `UPDATE m_2 SET laptopID = NULL, isAvailable = 1, CompanyID = NULL WHERE id = ?`,
            [m2Id]
          ));
        }
      });
    }

    // 5. Graphics Card Updates
    if (Array.isArray(addGraphicsCard)) {
      addGraphicsCard.forEach((gpu: any) => {
        const gpuId = gpu.id || gpu.ID || gpu.graphicscardID;
        if (gpuId) {
          promises.push(pool.execute(
            `UPDATE graphicscard SET laptopID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
            [id, req.body.CompanyID || null, gpuId]
          ));
        }
      });
    }
    if (Array.isArray(removeGraphicsCard)) {
      removeGraphicsCard.forEach((gpu: any) => {
        const gpuId = gpu.id || gpu.ID || gpu.graphicscardID;
        if (gpuId) {
          promises.push(pool.execute(
            `UPDATE graphicscard SET laptopID = NULL, isAvailable = 1, CompanyID = NULL WHERE id = ?`,
            [gpuId]
          ));
        }
      });
    }

    await Promise.all(promises);

    res.status(201).json({
      success: true,
      message: "Laptop updated successfully",
      data: {
        id: id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update monitor
export const updateMonitor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      display,
      name,
      pyramid_id,
      service_tag,
      size,
      warranty_date,
      date_of_purchase,
      inventoryID,
      id,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!name || !pyramid_id) {
      const error: AppError = new Error("Brand and model are required");
      error.statusCode = 400;
      throw error;
    }

    // Format dates if provided
    const formattedWarrantyDate = warranty_date ? new Date(warranty_date).toISOString().split('T')[0] : null;
    const formattedPurchaseDate = date_of_purchase ? new Date(date_of_purchase).toISOString().split('T')[0] : null;

    const [result] = await pool.execute<any>(
      `UPDATE monitor  SET display = ?, name = ?, pyramid_id = ?, service_tag = ?, size = ?, warranty_date = ?, date_of_purchase = ?, inventoryID = ? WHERE id = ?`,
      [
        display,
        name,
        pyramid_id,
        service_tag,
        size,
        formattedWarrantyDate,
        formattedPurchaseDate,
        inventoryID || null,
        id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Monitor updated successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update nvme
export const updateNvme = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      Size,
      brand,
      dateOfPurchase,
      serialNumber,
      serviceTag,
      speed,
      warrantyEndDate,
      phyramidID,
      id,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!brand) {
      const error: AppError = new Error("Brand is required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE nvme SET Size = ?, brand = ?, dateOfPurchase = ?, serialNumber = ?, serviceTag = ?, speed = ?, warrantyEndDate = ?, phyramidID = ? WHERE id = ?`,
      [
        Size || null,
        brand || null, // Should not be null due to validation but safe to default
        dateOfPurchase ? new Date(dateOfPurchase).toISOString().split('T')[0] : null,
        serialNumber || null,
        serviceTag || null,
        speed || null,
        warrantyEndDate ? new Date(warrantyEndDate).toISOString().split('T')[0] : null,
        phyramidID || null,
        id || req.body.ID, // Handle both id and ID
      ]
    );

    res.status(201).json({
      success: true,
      message: "Nvme updated successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Ram
export const editRam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      systemID,
      WorkstationID,
      brand,
      date_of_purchase,
      form_factor,
      phyramidID,
      service_id,
      size,
      type,
      inventoryID,
      id,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!brand || !form_factor) {
      const error: AppError = new Error("Brand and form_factor are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE ram SET systemID = ?, WorkstationID = ?, brand = ?, date_of_purchase = ?, form_factor = ?, phyramidID = ?, service_id = ?, size = ?, type = ?, inventoryID = ? WHERE id = ?`,
      [
        systemID ?? null,
        WorkstationID ?? null,
        brand ?? null,
        date_of_purchase ? new Date(date_of_purchase).toISOString().split('T')[0] : null,
        form_factor ?? null,
        phyramidID ?? null,
        service_id ?? null,
        size ?? null,
        type ?? null,
        inventoryID ?? null,
        id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Ram updated successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Update System
export const updateSystem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      Brand,
      Name,
      Processor,
      generation,
      dateOfPurchase,
      ramID,
      ssdID,
      nvmeID,
      m2ID,
      pyramidsID,
      serviceID,
      systemID,
      inventoryID,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
      addGraphicsCard,
      removeGraphicsCard,
      product // 'system'
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    const systemName = Brand || Name;
    if (!systemName || !Processor) {
      const error: AppError = new Error("Brand and Processor are required");
      error.statusCode = 400;
      throw error;
    }

    const promises: Promise<any>[] = [];

    // 1. Update System Details
    const systemUpdatePromise = pool.execute<any>(
      `UPDATE system SET Name = ?, Processor = ?, Generation = ?, dateOfPurchase = ?, ramID = ?, ssdID = ?, nvmeID = ?, m2ID = ?, pyramidsID = ?, serviceID = ?, inventoryID = ? WHERE systemID = ?`,
      [
        Brand || Name || null,
        Processor || null,
        generation || null,
        dateOfPurchase ? new Date(dateOfPurchase).toISOString().split('T')[0] : null,
        ramID || null,
        ssdID || null,
        nvmeID || null,
        m2ID || null,
        pyramidsID || null,
        serviceID || null,
        inventoryID || null,
        systemID,
      ]
    );
    promises.push(systemUpdatePromise);

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        promises.push(pool.execute(
          `UPDATE ram SET systemID = ?, isAvailable = 0 WHERE id = ?`,
          [systemID, ramId]
        ));
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        promises.push(pool.execute(
          `UPDATE ram SET systemID = NULL, isAvailable = 1 WHERE id = ?`,
          [ramId]
        ));
      });
    }

    // 3. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        promises.push(pool.execute(
          `UPDATE ssd SET systemID = ?, isAvailable = 0 WHERE ssdID = ?`,
          [systemID, ssdId]
        ));
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        promises.push(pool.execute(
          `UPDATE ssd SET systemID = NULL, isAvailable = 1 WHERE ssdID = ?`,
          [ssdId]
        ));
      });
    }

    // 4. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        promises.push(pool.execute(
          `UPDATE nvme SET systemID = ?, isAvailable = 0 WHERE ID = ?`,
          [systemID, nvmeId]
        ));
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        promises.push(pool.execute(
          `UPDATE nvme SET systemID = NULL, isAvailable = 1 WHERE ID = ?`,
          [nvmeId]
        ));
      });
    }

    // 5. M.2 Updates
    if (Array.isArray(addM2)) {
      addM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET SystemID = ?, isAvailable = 0 WHERE id = ?`,
          [systemID, m2Id]
        ));
      });
    }
    if (Array.isArray(removeM2)) {
      removeM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET SystemID = NULL, isAvailable = 1 WHERE id = ?`,
          [m2Id]
        ));
      });
    }

    // 6. Graphics Card Updates
    if (Array.isArray(addGraphicsCard)) {
      addGraphicsCard.forEach((card: any) => {
        const cardId = card.id || card.ID || card.graphicscardID;
        promises.push(pool.execute(
          `UPDATE graphicscard SET systemID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
          [systemID, req.body.CompanyID || null, cardId]
        ));
      });
    }
    if (Array.isArray(removeGraphicsCard)) {
      removeGraphicsCard.forEach((card: any) => {
        const cardId = card.id || card.ID || card.graphicscardID;
        promises.push(pool.execute(
          `UPDATE graphicscard SET systemID = NULL, isAvailable = 1, CompanyID = NULL WHERE id = ?`,
          [cardId]
        ));
      });
    }

    // Execute all
    const results = await Promise.all(promises);

    // Extract insertId from system update (first promise) if needed, but for UPDATE it's usually 0 or irrelevant
    // const [result] = results[0]; 

    res.status(201).json({
      success: true,
      message: "System updated successfully",
      data: {
        id: systemID,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Laptop History
export const getLaptopHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Laptop ID is required" });
      return;
    }

    // 1. Get Laptop Details
    const [laptops] = await pool.execute<any[]>(
      `SELECT l.*, c.company_name, c.customer_name, c.phone as company_phone 
       FROM laptop l 
       LEFT JOIN company c ON l.CompanyID = c.id 
       WHERE l.id = ?`,
      [id]
    );

    if (laptops.length === 0) {
      res.status(404).json({ success: false, message: "Laptop not found" });
      return;
    }

    const laptop = laptops[0];

    // 2. Get Activity Logs
    // Filter by productId (laptop ID) AND ensure it's a laptop related log if possible.
    // We check activity_logs where productId = id. 
    // Ideally we should also check logs that might store inventoryID but productId is the main link for producedID.
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name  as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND (al.product = 'laptop' OR al.product = 'Laptop' OR al.product = 'LAPTOP')
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        laptop,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get RAM History
export const getRamHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "RAM ID is required" });
      return;
    }

    // 1. Get RAM Details
    // Note: laptopID, systemID, workstationID are the foreign keys.
    const [rams] = await pool.execute<any[]>(
      `SELECT r.*, 
        l.brand as laptop_brand, l.model as laptop_model,
        s.Name as system_name, s.Processor as system_processor,
        w.Processor as workstation_processor
       FROM ram r 
       LEFT JOIN laptop l ON r.laptopID = l.id
       LEFT JOIN system s ON r.systemID = s.systemID 
       LEFT JOIN workstation w ON r.workstationID = w.id
       WHERE r.id = ?`,
      [id]
    );

    if (rams.length === 0) {
      res.status(404).json({ success: false, message: "RAM not found" });
      return;
    }

    const ram = rams[0];

    // 2. Get Activity Logs
    // Filter by productId = id AND produced = 'Ram'
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND (al.product = 'ram' OR al.product = 'RAM' OR al.product = 'Ram')
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ram,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get Monitor History
export const getMonitorHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Monitor ID is required" });
      return;
    }

    // 1. Get Monitor Details
    const [monitors] = await pool.execute<any[]>(
      `SELECT m.*, c.company_name, c.customer_name, c.phone as company_phone 
       FROM monitor m
       LEFT JOIN company c ON m.CompanyID = c.id 
       WHERE m.id = ?`,
      [id]
    );

    if (monitors.length === 0) {
      res.status(404).json({ success: false, message: "Monitor not found" });
      return;
    }

    const monitor = monitors[0];

    // 2. Get Activity Logs
    // Note: Checking where productId = id AND (produced = 'monitor' OR product = 'monitor') to cover inconsistent naming if any.
    // Based on user edits, they seem to be standardizing on 'product' column as well.
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND al.product = 'monitor'
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        monitor,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get System History
export const getSystemHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "System ID is required" });
      return;
    }

    // 1. Get System Details
    const [systems] = await pool.execute<any[]>(
      `SELECT s.*, c.company_name, c.customer_name, c.phone as company_phone,
        (SELECT GROUP_CONCAT(CONCAT(r.size, ' ', r.brand) SEPARATOR ', ') FROM ram r WHERE r.systemID = s.systemID) AS ramCount,
        (SELECT GROUP_CONCAT(CONCAT(ssd.ssdSize, ' ', ssd.brand) SEPARATOR ', ') FROM ssd WHERE ssd.systemID = s.systemID) AS ssdCount,
        (SELECT GROUP_CONCAT(CONCAT(n.Size, ' ', n.brand) SEPARATOR ', ') FROM nvme n WHERE n.systemID = s.systemID) AS nvmeCount,
        (SELECT GROUP_CONCAT(CONCAT(IFNULL(g.size, ''), ' ', IFNULL(g.brand, ''), ' ', IFNULL(g.model, '')) SEPARATOR ', ') FROM graphicscard g WHERE g.systemID = s.systemID) AS graphics
       FROM system s
       LEFT JOIN company c ON s.CompanyID = c.id 
       WHERE s.systemID = ?`,
      [id]
    );

    if (systems.length === 0) {
      res.status(404).json({ success: false, message: "System not found" });
      return;
    }

    const system = systems[0];

    // 2. Get Activity Logs
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND al.product = 'system'
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        system,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get SSD History
export const getSSDHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "SSD ID is required" });
      return;
    }

    // 1. Get SSD Details
    // Note: checking assignment to laptop/system/workstation
    const [ssds] = await pool.execute<any[]>(
      `SELECT s.*, 
        l.brand as laptop_brand, l.model as laptop_model,
        sys.Name as system_name, sys.Processor as system_processor,
        w.Processor as workstation_processor
       FROM ssd s
       LEFT JOIN laptop l ON s.laptopID = l.id
       LEFT JOIN system sys ON s.systemID = sys.systemID 
       LEFT JOIN workstation w ON s.workstationID = w.id
       WHERE s.ssdID = ?`,
      [id]
    );

    if (ssds.length === 0) {
      res.status(404).json({ success: false, message: "SSD not found" });
      return;
    }

    const ssd = ssds[0];

    // 2. Get Activity Logs
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND al.product = 'ssd'
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ssd,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get NVMe History
export const getNVMeHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "NVMe ID is required" });
      return;
    }

    // 1. Get NVMe Details
    // Note: checking assignment to laptop/system/workstation
    // The table name is likely 'nvme' and primary key 'ID' based on convention for this group
    const [nvmes] = await pool.execute<any[]>(
      `SELECT n.*, 
        l.brand as laptop_brand, l.model as laptop_model,
        sys.Name as system_name, sys.Processor as system_processor,
        w.Processor as workstation_processor
       FROM nvme n
       LEFT JOIN laptop l ON n.laptopID = l.id
       LEFT JOIN system sys ON n.systemID = sys.systemID 
       LEFT JOIN workstation w ON n.workstationID = w.id
       WHERE n.ID = ?`,
      [id]
    );

    if (nvmes.length === 0) {
      res.status(404).json({ success: false, message: "NVMe not found" });
      return;
    }

    const nvme = nvmes[0];

    // 2. Get Activity Logs
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
        WHERE al.productId = ? AND (al.product = 'nvme' OR al.product = 'NVMe' OR al.product = 'Nvme')
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        nvme,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get HDD History
export const getHDDHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "HDD ID is required" });
      return;
    }

    // 1. Get HDD Details
    const [hdds] = await pool.execute<any[]>(
      `SELECT h.*
       FROM hdd h
       WHERE h.ID = ?`,
      [id]
    );

    if (hdds.length === 0) {
      res.status(404).json({ success: false, message: "HDD not found" });
      return;
    }

    const hdd = hdds[0];

    // 2. Get Activity Logs
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
        WHERE al.productId = ? AND (al.product = 'hdd' OR al.product = 'HDD' OR al.product = 'Hdd')
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        hdd,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};



// Get Graphics Card History
export const getGraphicsCardHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Graphics Card ID is required" });
      return;
    }

    // 1. Get Graphics Card Details
    const [cards] = await pool.execute<any[]>(
      `SELECT g.*
       FROM graphicscard g
       WHERE g.ID = ?`,
      [id]
    );

    if (cards.length === 0) {
      res.status(404).json({ success: false, message: "Graphics Card not found" });
      return;
    }

    const card = cards[0];

    // 2. Get Activity Logs
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND (al.product = 'graphicscard' OR al.product = 'graphicsCard')
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        card,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Generate Graphics Card History PDF
export const getGraphicsCardHistoryPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, logType, cardDetails } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: "Graphics Card ID is required" });
      return;
    }

    // Build filtered query
    let query = `
      SELECT al.*, u.name as user_name, c.company_name
      FROM activity_logs al
      LEFT JOIN company c ON al.CompanyID = c.id
      LEFT JOIN users u ON al.userID = u.id
      WHERE al.productId = ? AND (al.product = 'graphicscard' OR al.product = 'graphicsCard')
    `;
    const params: any[] = [id];

    if (logType) {
      query += ` AND al.log = ?`;
      params.push(logType);
    }
    if (startDate) {
      query += ` AND al.data >= ?`;
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += ` AND al.data <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY al.data DESC`;

    const [logs] = await pool.execute<any[]>(query, params);

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const filename = `GraphicsCard_History_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    doc.pipe(res);

    // --- Logo & Branding ---
    const logoPath = "src/assets/PhyramidLogo.png";
    const pageWidth = 595;
    const logoWidth = 50;
    try {
      doc.image(logoPath, (pageWidth / 2) - (logoWidth / 2), 30, { width: logoWidth });
    } catch (err) {
      console.error("Logo not found at", logoPath);
    }
    doc.font("Helvetica-Bold").fontSize(10).text("PYRAMID BUSINESS SYSTEMS", 30, 85, { align: "center", width: 535 });
    doc.font("Helvetica-Bold").fontSize(16).text("GRAPHICS CARD ACTIVITY HISTORY", 30, 105, { align: "center", width: 535 });
    doc.fontSize(9).font("Helvetica").text(`Generated on: ${new Date().toLocaleDateString()}`, 30, 125, { align: "center", width: 535 });

    // --- Card Details ---
    doc.moveDown(2);
    const detailY = 150;
    if (cardDetails) {
      doc.font("Helvetica-Bold").fontSize(12).text(`${cardDetails.brand || ""} ${cardDetails.model || ""}`, 30, detailY);
      doc.fontSize(9).font("Helvetica");
      doc.text(`Size: ${cardDetails.size || "N/A"}  |  Generation: ${cardDetails.generation || "N/A"}  |  Service Number: ${cardDetails.serviceNumber || "N/A"}  |  Service Tag: ${cardDetails.serviceTag || "N/A"}`, 30, detailY + 16);
    }

    // --- Filter Info ---
    doc.moveDown(1);
    const filterY = detailY + 38;
    const filterText = [
      logType ? `Log Type: ${logType}` : "Log Type: All",
      startDate ? `Start: ${startDate}` : null,
      endDate ? `End: ${endDate}` : null,
    ].filter(Boolean).join(" | ");
    doc.font("Helvetica").fontSize(9).text(filterText, 30, filterY);

    // --- Table with borders ---
    doc.moveDown(1);
    const tableTop = filterY + 20;
    const colBounds = [30, 60, 140, 220, 330, 420, 565];

    const snoX = colBounds[0] + 3;
    const dateX = colBounds[1] + 3;
    const eventX = colBounds[2] + 3;
    const companyX = colBounds[3] + 3;
    const userX = colBounds[4] + 3;
    const reasonX = colBounds[5] + 3;

    const drawRowGrid = (y: number, height: number, isHeader = false) => {
      doc.lineWidth(isHeader ? 1 : 0.5).strokeColor(isHeader ? "#000000" : "#aaaaaa");
      if (isHeader) doc.moveTo(30, y).lineTo(565, y).stroke();
      doc.moveTo(30, y + height).lineTo(565, y + height).stroke();
      colBounds.forEach(x => {
        doc.moveTo(x, y).lineTo(x, y + height).stroke();
      });
      doc.strokeColor("#000000").lineWidth(1);
    };

    const headerHeight = 20;
    drawRowGrid(tableTop, headerHeight, true);

    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("S.No", snoX, tableTop + 5);
    doc.text("Date", dateX, tableTop + 5);
    doc.text("Event", eventX, tableTop + 5);
    doc.text("Company", companyX, tableTop + 5);
    doc.text("User", userX, tableTop + 5);
    doc.text("Reason", reasonX, tableTop + 5);

    let currentY = tableTop + headerHeight;

    doc.font("Helvetica").fontSize(8);
    logs.forEach((log: any, index: number) => {
      const dateStr = log.data ? new Date(log.data).toLocaleDateString() : "-";
      const reasonStr = log.reason || "-";
      const companyStr = log.company_name || "-";
      const userStr = log.user_name || "Unknown";

      const textHeight = Math.max(
        doc.heightOfString(reasonStr, { width: 140 }),
        doc.heightOfString(companyStr, { width: 105 }),
        doc.heightOfString(userStr, { width: 85 }),
        12
      );
      const rowHeight = textHeight + 10;

      if (currentY + rowHeight > 750) {
        doc.addPage();
        currentY = 30;
        drawRowGrid(currentY, headerHeight, true);
        doc.font("Helvetica-Bold").fontSize(9);
        doc.text("S.No", snoX, currentY + 5);
        doc.text("Date", dateX, currentY + 5);
        doc.text("Event", eventX, currentY + 5);
        doc.text("Company", companyX, currentY + 5);
        doc.text("User", userX, currentY + 5);
        doc.text("Reason", reasonX, currentY + 5);
        currentY += headerHeight;
        doc.font("Helvetica").fontSize(8);
      }

      drawRowGrid(currentY, rowHeight, false);

      doc.text((index + 1).toString(), snoX, currentY + 5);
      doc.text(dateStr, dateX, currentY + 5, { width: 75 });
      doc.text(log.log || "-", eventX, currentY + 5, { width: 75 });
      doc.text(companyStr, companyX, currentY + 5, { width: 105 });
      doc.text(userStr, userX, currentY + 5, { width: 85 });
      doc.text(reasonStr, reasonX, currentY + 5, { width: 140 });

      currentY += rowHeight;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};


// Generic Product History PDF - handles all product types
export const getProductHistoryPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, productType } = req.params;
    const { startDate, endDate, logType, details } = req.body;

    if (!id || !productType) {
      res.status(400).json({ success: false, message: "Product ID and type are required" });
      return;
    }

    // Map URL product types to activity_logs product values
    const productTypeMap: Record<string, string[]> = {
      laptop: ['laptop', 'Laptop', 'LAPTOP', 'laptops', 'Laptops'],
      hdd: ['hdd', 'HDD', 'Hdd', 'hdds', 'HDDs'],
      m2: ['m_2', 'm2', 'M2', 'M_2', 'M.2', 'm.2'],
      monitor: ['monitor', 'Monitor', 'MONITOR', 'monitors', 'Monitors'],
      mobileWorkstation: ['mobileworkstation', 'mobileWorkStation', 'MobileWorkstation', 'Mobile Workstation', 'mobile workstation'],
      nvme: ['nvme', 'NVMe', 'Nvme', 'nvmes', 'NVMEs'],
      ram: ['ram', 'RAM', 'Ram', 'rams', 'RAMs'],
      ssd: ['ssd', 'SSD', 'Ssd', 'ssds', 'SSDs'],
      system: ['system', 'System', 'SYSTEM', 'systems', 'Systems'],
      workstation: ['workstation', 'Workstation', 'WORKSTATION', 'workstations', 'Workstations'],
      graphicsCard: ['graphicscard', 'graphicsCard', 'GraphicsCard', 'GraphicCard', 'graphicCard', 'graphics card', 'Graphics Card'],
    };

    const productNames = productTypeMap[productType];
    if (!productNames) {
      res.status(400).json({ success: false, message: `Invalid product type: ${productType}` });
      return;
    }

    // Build filtered query
    const productFilter = productNames.map(() => `al.product = ?`).join(' OR ');
    let query = `
      SELECT al.*, u.name as user_name, c.company_name
      FROM activity_logs al
      LEFT JOIN company c ON al.CompanyID = c.id
      LEFT JOIN users u ON al.userID = u.id
      WHERE al.productId = ? AND (${productFilter})
    `;
    const params: any[] = [id, ...productNames];

    if (logType) {
      query += ` AND al.log = ?`;
      params.push(logType);
    }
    if (startDate) {
      query += ` AND al.data >= ?`;
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += ` AND al.data <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY al.data DESC`;

    const [logs] = await pool.execute<any[]>(query, params);

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const pdfTitle = (productType.replace(/([A-Z])/g, ' $1').trim().toUpperCase()) + ' ACTIVITY HISTORY';
    const filename = `${productType}_History_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    doc.pipe(res);

    // --- Logo & Branding ---
    const logoPath = "src/assets/PhyramidLogo.png";
    const pageWidth = 595;
    const logoWidth = 50;
    try {
      doc.image(logoPath, (pageWidth / 2) - (logoWidth / 2), 30, { width: logoWidth });
    } catch (err) {
      console.error("Logo not found at", logoPath);
    }
    doc.font("Helvetica-Bold").fontSize(10).text("PYRAMID BUSINESS SYSTEMS", 30, 85, { align: "center", width: 535 });
    doc.font("Helvetica-Bold").fontSize(16).text(pdfTitle, 30, 105, { align: "center", width: 535 });
    doc.fontSize(9).font("Helvetica").text(`Generated on: ${new Date().toLocaleDateString()}`, 30, 125, { align: "center", width: 535 });

    // --- Product Details ---
    doc.moveDown(2);
    const detailY = 150;
    if (details) {
      const detailStr = Object.entries(details)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')}: ${v}`)
        .join('  |  ');
      doc.font("Helvetica-Bold").fontSize(10).text(detailStr, 30, detailY, { width: 535 });
    }

    // --- Filter Info ---
    const filterY = detailY + 22;
    const filterText = [
      logType ? `Log Type: ${logType}` : "Log Type: All",
      startDate ? `Start: ${startDate}` : null,
      endDate ? `End: ${endDate}` : null,
    ].filter(Boolean).join(" | ");
    doc.font("Helvetica").fontSize(9).text(filterText, 30, filterY);

    // --- Table with borders ---
    const tableTop = filterY + 20;
    const colBounds = [30, 60, 140, 220, 330, 420, 565];
    const snoX = colBounds[0] + 3;
    const dateX = colBounds[1] + 3;
    const eventX = colBounds[2] + 3;
    const companyX = colBounds[3] + 3;
    const userX = colBounds[4] + 3;
    const reasonX = colBounds[5] + 3;

    const drawRowGrid = (y: number, height: number, isHeader = false) => {
      doc.lineWidth(isHeader ? 1 : 0.5).strokeColor(isHeader ? "#000000" : "#aaaaaa");
      if (isHeader) doc.moveTo(30, y).lineTo(565, y).stroke();
      doc.moveTo(30, y + height).lineTo(565, y + height).stroke();
      colBounds.forEach((x: number) => {
        doc.moveTo(x, y).lineTo(x, y + height).stroke();
      });
      doc.strokeColor("#000000").lineWidth(1);
    };

    const headerHeight = 20;
    drawRowGrid(tableTop, headerHeight, true);
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("S.No", snoX, tableTop + 5);
    doc.text("Date", dateX, tableTop + 5);
    doc.text("Event", eventX, tableTop + 5);
    doc.text("Company", companyX, tableTop + 5);
    doc.text("User", userX, tableTop + 5);
    doc.text("Reason", reasonX, tableTop + 5);

    let currentY = tableTop + headerHeight;
    doc.font("Helvetica").fontSize(8);

    logs.forEach((log: any, index: number) => {
      const dateStr = log.data ? new Date(log.data).toLocaleDateString() : "-";
      const reasonStr = log.reason || "-";
      const companyStr = log.company_name || "-";
      const userStr = log.user_name || "Unknown";

      const textHeight = Math.max(
        doc.heightOfString(reasonStr, { width: 140 }),
        doc.heightOfString(companyStr, { width: 105 }),
        doc.heightOfString(userStr, { width: 85 }),
        12
      );
      const rowHeight = textHeight + 10;

      if (currentY + rowHeight > 750) {
        doc.addPage();
        currentY = 30;
        drawRowGrid(currentY, headerHeight, true);
        doc.font("Helvetica-Bold").fontSize(9);
        doc.text("S.No", snoX, currentY + 5);
        doc.text("Date", dateX, currentY + 5);
        doc.text("Event", eventX, currentY + 5);
        doc.text("Company", companyX, currentY + 5);
        doc.text("User", userX, currentY + 5);
        doc.text("Reason", reasonX, currentY + 5);
        currentY += headerHeight;
        doc.font("Helvetica").fontSize(8);
      }

      drawRowGrid(currentY, rowHeight, false);
      doc.text((index + 1).toString(), snoX, currentY + 5);
      doc.text(dateStr, dateX, currentY + 5, { width: 75 });
      doc.text(log.log || "-", eventX, currentY + 5, { width: 75 });
      doc.text(companyStr, companyX, currentY + 5, { width: 105 });
      doc.text(userStr, userX, currentY + 5, { width: 85 });
      doc.text(reasonStr, reasonX, currentY + 5, { width: 140 });

      currentY += rowHeight;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};


// Get Workstation History
export const getWorkstationHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Workstation ID is required" });
      return;
    }

    // 1. Get Workstation Details
    const [workstations] = await pool.execute<any[]>(
      `SELECT w.*, w.Processor as processor,
        gc.brand as graphicscard_brand, gc.model as graphicscard_model
       FROM workstation w
       LEFT JOIN graphicscard gc ON w.graphicscardID = gc.id
       WHERE w.id = ?`,
      [id]
    );

    if (workstations.length === 0) {
      res.status(404).json({ success: false, message: "Workstation not found" });
      return;
    }

    const workstation = workstations[0];

    // 2. Get Activity Logs
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND al.product = 'workstation'
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        workstation,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};


// Get Mobile Workstation History
export const getMobileWorkstationHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Mobile Workstation ID is required" });
      return;
    }

    // 1. Get Mobile Workstation Details
    const [mws] = await pool.execute<any[]>(
      `SELECT mw.*, c.company_name
       FROM mobileworkstation mw
       LEFT JOIN company c ON mw.CompanyID = c.id
       WHERE mw.id = ?`,
      [id]
    );

    if (mws.length === 0) {
      res.status(404).json({ success: false, message: "Mobile Workstation not found" });
      return;
    }

    const mobileWorkstation = mws[0];

    // 2. Get Activity Logs
    // Note: Checking for 'mobileWorkStation' or 'mobileWorkstation' variations in product logger
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
       WHERE al.productId = ? AND (al.product = 'mobileWorkStation' OR al.product = 'mobileworkstation')
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        mobileWorkstation,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get M.2 History
export const getM_2History = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "M.2 ID is required" });
      return;
    }

    // 1. Get M.2 Details
    const [m2s] = await pool.execute<any[]>(
      `SELECT m.*, 
        l.brand as laptop_brand, l.model as laptop_model,
        sys.Name as system_name, sys.Processor as system_processor,
        w.Processor as workstation_processor,
        mw.brand as mw_brand, mw.model as mw_model
       FROM m_2 m
       LEFT JOIN laptop l ON m.laptopID = l.id
       LEFT JOIN system sys ON m.systemID = sys.systemID 
       LEFT JOIN workstation w ON m.WorkstationID = w.id
       LEFT JOIN mobileworkstation mw ON m.MobileWorkstationID = mw.id
       WHERE m.id = ?`,
      [id]
    );

    if (m2s.length === 0) {
      res.status(404).json({ success: false, message: "M.2 not found" });
      return;
    }

    const m2 = m2s[0];

    // 2. Get Activity Logs
    const [logs] = await pool.execute<any[]>(
      `SELECT al.*, u.name as user_name, c.company_name
       FROM activity_logs al
       LEFT JOIN company c ON al.CompanyID = c.id
       LEFT JOIN users u ON al.userID = u.id
        WHERE al.productId = ? AND (al.product = 'm_2' OR al.product = 'm2' OR al.product = 'M2' OR al.product = 'M_2' OR al.product = 'M.2')
       ORDER BY al.data DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        m_2: m2,
        history: logs
      }
    });

  } catch (error) {
    next(error);
  }
};

// Update SSD
export const updateSSD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      SerialNumber,
      brand,
      dateOfPurchase,
      serviceTag,
      speed,
      warrantyEndDate,
      ssdSize,
      phyramidID,
      ssdID,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!serviceTag || !phyramidID) {
      const error: AppError = new Error("serviceTag and phyramidID are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE ssd SET brand=?,ssdSize=?,speed=?,SerialNumber=?,serviceTag=?,warrantyEndDate=?,dateOfPurchase=?,phyramidID=? WHERE ssdID = ?`,
      [
        brand ?? null,
        ssdSize ?? null,
        speed ?? null,
        SerialNumber ?? null,
        serviceTag ?? null,
        warrantyEndDate ? new Date(warrantyEndDate).toISOString().split('T')[0] : null,
        dateOfPurchase ? new Date(dateOfPurchase).toISOString().split('T')[0] : null,
        phyramidID ?? null,
        ssdID,
      ]
    );

    res.status(201).json({
      success: true,
      message: "SSD updated successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update HDD
export const updateHDD = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      brand,
      dateOfPurchase,
      serialNumber,
      serviceTag,
      size,
      speed,
      warrantyEndData,
      phyramidID,
      ID
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!ID || !brand) {
      const error: AppError = new Error("ID and brand are required");
      error.statusCode = 400;
      throw error;
    }

    const formattedWarrantyEnd = warrantyEndData ? new Date(warrantyEndData).toISOString().split('T')[0] : null;
    const formattedPurchase = dateOfPurchase ? new Date(dateOfPurchase).toISOString().split('T')[0] : null;
    console.log(`[updateHDD DEBUG] original: ${warrantyEndData}, formatted: ${formattedWarrantyEnd}`);

    const [result] = await pool.execute<any>(
      `UPDATE hdd SET brand=?,size=?,speed=?,serialNumber=?,serviceTag=?,warrantyEndData=?,dateOfPurchase=?,phyramidID=? WHERE ID = ?`,
      [
        brand,
        size,
        speed || null,
        serialNumber || null,
        serviceTag || null,
        formattedWarrantyEnd,
        formattedPurchase,
        phyramidID || null,
        ID,
      ]
    );

    res.status(201).json({
      success: true,
      message: "SSD updated successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Graphics Card
// Update Graphics Card
export const updateGraphicsCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      ID,
      brand,
      model,
      size,
      generation,
      serviceNumber,
      serviceTag,
      warrantyEndDate,
      dateOfPurchase,
      phyramidID,
    } = req.body;


    console.log('nova', req.body);
    // Validate required fields
    if (!ID || !brand) {
      const error: AppError = new Error("ID and brand are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE graphicscard SET brand = ?,size = ?,generation = ?,model = ?,serviceTag = ?,serviceNumber = ?,warrantyEndDate = ?,dateOfPurchase = ?,phyramidID = ? WHERE ID = ?`,
      [
        brand ?? null,
        size ?? null,
        generation ?? null,
        model ?? null,
        serviceTag ?? null,
        serviceNumber ?? null,
        warrantyEndDate ? new Date(warrantyEndDate).toISOString().split('T')[0] : null,
        dateOfPurchase ? new Date(dateOfPurchase).toISOString().split('T')[0] : null,
        phyramidID ?? null,
        ID,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Graphics Card updated successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addBulkProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId, products, deliveryType, replacementReason } = req.body;

    if (!companyId || !products) {
      const error: AppError = new Error("Company ID and products are required");
      error.statusCode = 400;
      throw error;
    }

    const isReplacement = deliveryType === 'Replacement';
    const logType = isReplacement ? 'Replacement Delivery' : 'Delivery';
    const logReason = isReplacement ? (replacementReason || 'Replacement Delivery') : 'Bulk assignment';

    const results: any = {};
    const promises: Promise<any>[] = [];
    const userID = (req as any).user?.id || req.body.userID || null;

    // Helper: create activity log
    const logDelivery = (productId: any, productType: string) => {
      return pool.execute(
        `INSERT INTO activity_logs (reason, log, CompanyID, inventoryID, userID, productId, product, data) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [logReason, logType, companyId, null, userID, productId, productType]
      );
    };

    // 1. Laptops
    if (products.laptop && Array.isArray(products.laptop)) {
      const laptopPromises = products.laptop.map(async (item: any) => {
        await pool.execute(
          `UPDATE laptop 
           SET brand=?, model=?, processor_brand=?, processor_model=?, generation=?, service_id=?, CompanyID=?, phyramidID=?, date_of_purchase=?, adapter=?, inventoryID=?, ramID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE id=?`,
          [
            item.brand,
            item.model,
            item.processor_brand || null,
            item.processor_model || null,
            item.generation || null,
            item.service_id || null,
            companyId,
            item.phyramidID || null,
            item.date_of_purchase ? new Date(item.date_of_purchase).toISOString().split('T')[0] : null,
            item.adapter || null,
            item.inventoryID || null,
            item.ramID || null,
            item.id
          ]
        );
        await logDelivery(item.id, 'laptop');
      });
      promises.push(
        Promise.all(laptopPromises).then((res) => {
          results.laptop = res.length;
        })
      );
    }

    // 2. Workstations
    if (products.workstation && Array.isArray(products.workstation)) {
      const workstationPromises = products.workstation.map(async (item: any) => {
        await pool.execute(
          `UPDATE workstation 
           SET Name=?, Processor=?, generation=?, serviceID=?, pyramidsID=?, ramID=?, ssdID=?, nvmeID=?, m2ID=?, graphicscardID=?, dateOfPurchase=?, inventoryID=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE id=?`,
          [
            item.name || item.Name || null,
            item.processor || item.Processor || null,
            item.generation || null,
            item.serviceID || item.serviceTag || null,
            item.pyramidsID || null,
            item.ramID || null,
            item.ssdID || null,
            item.nvmeID || null,
            item.m2ID || null,
            item.graphicscardID || null,
            item.dateOfPurchase ? new Date(item.dateOfPurchase).toISOString().split('T')[0] : null,
            item.inventoryID || null,
            companyId,
            item.id
          ]
        );
        await logDelivery(item.id, 'workstation');
      });
      promises.push(
        Promise.all(workstationPromises).then((res) => {
          results.workstation = res.length;
        })
      );
    }

    // 3. Systems (Desktops)
    if (products.system && Array.isArray(products.system)) {
      const systemPromises = products.system.map(async (item: any) => {
        await pool.execute(
          `UPDATE system 
           SET Name=?, Processor=?, Generation=?, dateOfPurchase=?, pyramidsID=?, serviceID=?, inventoryID=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE systemID=?`,
          [
            item.Name,
            item.Processor || null,
            item.Generation || null,
            item.dateOfPurchase ? new Date(item.dateOfPurchase).toISOString().split('T')[0] : null,
            item.pyramidsID || null,
            item.serviceID || null,
            item.inventoryID || null,
            companyId,
            item.systemID
          ]
        );
        await logDelivery(item.systemID, 'system');
      });
      promises.push(
        Promise.all(systemPromises).then((res) => {
          results.system = res.length;
        })
      );
    }

    // 4. Monitors
    if (products.monitor && Array.isArray(products.monitor)) {
      const monitorPromises = products.monitor.map(async (item: any) => {
        await pool.execute(
          `UPDATE monitor 
           SET name=?, size=?, service_tag=?, pyramid_id=?, date_of_purchase=?, warranty_date=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE id=?`,
          [
            item.name,
            item.size || null,
            item.service_tag || null,
            item.pyramid_id || null,
            item.date_of_purchase ? new Date(item.date_of_purchase).toISOString().split('T')[0] : null,
            item.warranty_date ? new Date(item.warranty_date).toISOString().split('T')[0] : null,
            companyId,
            item.id
          ]
        );
        await logDelivery(item.id, 'monitor');
      });
      promises.push(
        Promise.all(monitorPromises).then((res) => {
          results.monitor = res.length;
        })
      );
    }

    // 5. SSDs
    if (products.ssd && Array.isArray(products.ssd)) {
      const ssdPromises = products.ssd.map(async (item: any) => {
        await pool.execute(
          `UPDATE ssd 
           SET brand=?, ssdSize=?, speed=?, SerialNumber=?, serviceTag=?, warrantyEndDate=?, dateOfPurchase=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE ssdID=?`,
          [
            item.brand,
            item.ssdSize || null,
            item.speed || null,
            item.SerialNumber || null,
            item.serviceTag || null,
            item.warrantyEndDate ? new Date(item.warrantyEndDate).toISOString().split('T')[0] : null,
            item.dateOfPurchase ? new Date(item.dateOfPurchase).toISOString().split('T')[0] : null,
            companyId,
            item.ssdID
          ]
        );
        await logDelivery(item.ssdID, 'ssd');
      });
      promises.push(
        Promise.all(ssdPromises).then((res) => {
          results.ssd = res.length;
        })
      );
    }

    // 6. HDDs
    if (products.hdd && Array.isArray(products.hdd)) {
      const hddPromises = products.hdd.map(async (item: any) => {
        await pool.execute(
          `UPDATE hdd 
           SET brand=?, speed=?, serialNumber=?, serviceTag=?, warrantyEndData=?, dateOfPurchase=?, size=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE ID=?`,
          [
            item.brand,
            item.speed || null,
            item.serialNumber || null,
            item.serviceTag || null,
            item.warrantyEndData ? new Date(item.warrantyEndData).toISOString().split('T')[0] : null,
            item.dateOfPurchase ? new Date(item.dateOfPurchase).toISOString().split('T')[0] : null,
            item.size || null,
            companyId,
            item.ID
          ]
        );
        await logDelivery(item.ID, 'hdd');
      });
      promises.push(
        Promise.all(hddPromises).then((res) => {
          results.hdd = res.length;
        })
      );
    }

    // 7. NVMe
    if (products.nvme && Array.isArray(products.nvme)) {
      const nvmePromises = products.nvme.map(async (item: any) => {
        await pool.execute(
          `UPDATE nvme 
           SET brand=?, Size=?, speed=?, serialNumber=?, serviceTag=?, warrantyEndDate=?, dateOfPurchase=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE ID=?`,
          [
            item.brand,
            item.Size || null,
            item.speed || null,
            item.serialNumber || null,
            item.serviceTag || null,
            item.warrantyEndDate ? new Date(item.warrantyEndDate).toISOString().split('T')[0] : null,
            item.dateOfPurchase ? new Date(item.dateOfPurchase).toISOString().split('T')[0] : null,
            companyId,
            item.ID
          ]
        );
        await logDelivery(item.ID, 'nvme');
      });
      promises.push(
        Promise.all(nvmePromises).then((res) => {
          results.nvme = res.length;
        })
      );
    }

    // 8. Graphics Cards
    if (products.graphicscard && Array.isArray(products.graphicscard)) {
      const graphicsCardPromises = products.graphicscard.map(async (item: any) => {
        await pool.execute(
          `UPDATE graphicscard 
           SET brand=?, model=?, size=?, generation=?, serviceNumber=?, serviceTag=?, warrantyEndDate=?, dateOfPurchase=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE ID=?`,
          [
            item.brand || null,
            item.model || null,
            item.size || null,
            item.generation || null,
            item.serviceNumber || null,
            item.serviceTag || null,
            item.warrantyEndDate ? new Date(item.warrantyEndDate).toISOString().split('T')[0] : null,
            item.dateOfPurchase ? new Date(item.dateOfPurchase).toISOString().split('T')[0] : null,
            companyId,
            item.ID
          ]
        );
        await logDelivery(item.ID, 'graphicscard');
      });
      promises.push(
        Promise.all(graphicsCardPromises).then((res) => {
          results.graphicscard = res.length;
        })
      );
    }

    // 9. RAM
    if (products.ram && Array.isArray(products.ram)) {
      const ramPromises = products.ram.map(async (item: any) => {
        await pool.execute(
          `UPDATE ram 
           SET brand=?, date_of_purchase=?, form_factor=?, phyramidID=?, service_id=?, size=?, type=?, companyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE id=?`,
          [
            item.brand,
            item.date_of_purchase ? new Date(item.date_of_purchase).toISOString().split('T')[0] : null,
            item.form_factor || null,
            item.pyramid_id || item.phyramidID || null,
            item.service_id || null,
            item.size || null,
            item.type || null,
            companyId,
            item.id
          ]
        );
        await logDelivery(item.id, 'ram');
      });
      promises.push(
        Promise.all(ramPromises).then((res) => {
          results.ram = res.length;
        })
      );
    }

    // 10. Mobile Workstations
    if (products.mobile_workstation && Array.isArray(products.mobile_workstation)) {
      const mobileWorkstationPromises = products.mobile_workstation.map(async (item: any) => {
        await pool.execute(
          `UPDATE mobileworkstation 
           SET brand=?, model=?, processor_brand=?, processor_model=?, generation=?, date_of_purchase=?, adapter=?, phyramidID=?, service_id=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE id=?`,
          [
            item.brand || null,
            item.model || null,
            item.processor_brand || null,
            item.processor_model || null,
            item.generation || null,
            (item.date_of_purchase || item.dateOfPurchase) ? new Date(item.date_of_purchase || item.dateOfPurchase).toISOString().split('T')[0] : null,
            item.adapter || null,
            item.phyramidID || null,
            item.service_id || item.serviceTag || null,
            companyId,
            item.id
          ]
        );
        await logDelivery(item.id, 'mobileworkstation');
      });
      promises.push(
        Promise.all(mobileWorkstationPromises).then((res) => {
          results.mobile_workstation = res.length;
        })
      );
    }

    // 11. M.2
    if (products.m_2 && Array.isArray(products.m_2)) {
      const m2Promises = products.m_2.map(async (item: any) => {
        await pool.execute(
          `UPDATE m_2 
           SET brand=?, size=?, type=?, form_factor=?, service_id=?, date_of_purchase=?, phyramidID=?, CompanyID=?, isAvailable=0${isReplacement ? ", replacement_status='pending'" : ''} 
           WHERE id=?`,
          [
            item.brand || null,
            item.size || null,
            item.type || null,
            item.form_factor || null,
            item.service_id || null,
            item.date_of_purchase ? new Date(item.date_of_purchase).toISOString().split('T')[0] : null,
            item.phyramidID || null,
            companyId,
            item.id
          ]
        );
        await logDelivery(item.id, 'm_2');
      });
      promises.push(
        Promise.all(m2Promises).then((res: any) => {
          results.m_2 = res.length;
        })
      );
    }

    await Promise.all(promises);

    res.status(200).json({
      success: true,
      message: "Products assigned to company successfully",
      data: results,
    });

  } catch (error) {
    next(error);
  }
};

// Update Workstation
export const updateWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const {
      dateOfPurchase,
      graphicscardID,
      id,
      Processor,
      pyramidsID,
      serviceID,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
      addGraphicsCard,
      removeGraphicsCard,
      CompanyID,
      // New fields
      Name,
      generation,
      ramID,
      ssdID,
      nvmeID,
      m2ID,
      inventoryID,
      // Legacy fields to ignore/map
      serviceTag
    } = req.body;


    console.log('nova', req.body);
    // Validate required fields
    if (!id) {
      const error: AppError = new Error("ID is required");
      error.statusCode = 400;
      throw error;
    }

    const promises: Promise<any>[] = [];

    const workstationUpdatePromise = pool.execute<any>(
      `UPDATE workstation SET Name=?, Processor=?, generation=?, serviceID=?, pyramidsID=?, ramID=?, ssdID=?, nvmeID=?, m2ID=?, graphicscardID=?, dateOfPurchase=?, inventoryID=? WHERE id = ?`,
      [
        Name ?? null,
        Processor ?? null,
        generation ?? null,
        serviceID || serviceTag || null,
        pyramidsID ?? null,
        ramID ?? null,
        ssdID ?? null,
        nvmeID ?? null,
        m2ID ?? null,
        graphicscardID ?? null,
        dateOfPurchase ? new Date(dateOfPurchase).toISOString().split('T')[0] : null,
        inventoryID ?? null,
        id,
      ]
    );
    promises.push(workstationUpdatePromise);

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        promises.push(pool.execute(
          `UPDATE ram SET workstationID = ?, isAvailable = 0, CompanyID =  ? WHERE id = ?`,
          [id, CompanyID, ramId]
        ));
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        promises.push(pool.execute(
          `UPDATE ram SET workstationID = NULL, isAvailable = 1, CompanyID =  NULL WHERE id = ?`,
          [ramId]
        ));
      });
    }

    // 3. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        promises.push(pool.execute(
          `UPDATE ssd SET workstationID = ?, isAvailable = 0, CompanyID =  ? WHERE ssdID = ?`,
          [id, CompanyID, ssdId]
        ));
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        promises.push(pool.execute(
          `UPDATE ssd SET workstationID = NULL, isAvailable = 1, CompanyID =  NULL  WHERE ssdID = ?`,
          [ssdId]
        ));
      });
    }

    // 4. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        promises.push(pool.execute(
          `UPDATE nvme SET workstationID = ?, isAvailable = 0, CompanyID =  ? WHERE ID = ?`,
          [id, CompanyID, nvmeId]
        ));
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        promises.push(pool.execute(
          `UPDATE nvme SET workstationID = NULL, isAvailable = 1, CompanyID =  NULL WHERE ID = ?`,
          [nvmeId]
        ));
      });
    }

    // 5. M.2 Updates
    if (Array.isArray(addM2)) {
      addM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET WorkstationID = ?, isAvailable = 0, CompanyID =  ? WHERE id = ?`,
          [id, CompanyID, m2Id]
        ));
      });
    }
    if (Array.isArray(removeM2)) {
      removeM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET WorkstationID = NULL, isAvailable = 1, CompanyID =  NULL WHERE id = ?`,
          [m2Id]
        ));
      });
    }

    // 6. Graphics Card Updates
    if (Array.isArray(addGraphicsCard)) {
      addGraphicsCard.forEach((card: any) => {
        const cardId = card.id || card.ID || card.graphicscardID;
        promises.push(pool.execute(
          `UPDATE graphicscard SET workstationID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
          [id, CompanyID, cardId]
        ));
      });
    }
    if (Array.isArray(removeGraphicsCard)) {
      removeGraphicsCard.forEach((card: any) => {
        const cardId = card.id || card.ID || card.graphicscardID;
        promises.push(pool.execute(
          `UPDATE graphicscard SET workstationID = NULL, isAvailable = 1, CompanyID = NULL WHERE id = ?`,
          [cardId]
        ));
      });
    }

    // Execute all
    const results = await Promise.all(promises);

    res.status(201).json({
      success: true,
      message: "Workstation updated successfully",
      data: {
        id: id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Mobile Workstation
export const updateMobileWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      id,
      brand,
      model,
      processor_brand,
      processor_model,
      generation,
      adapter,
      date_of_purchase,
      dateOfPurchase, // Legacy support
      phyramidID,
      pyramidsID, // Legacy support (map to phyramidID)
      service_id,
      serviceTag, // Legacy support (map to service_id)
      isAvailable,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
    } = req.body;

    if (!id) {
      const error: AppError = new Error("ID is required");
      error.statusCode = 400;
      throw error;
    }

    const promises: Promise<any>[] = [];

    // 1. Update Mobile Workstation Details
    const updates: string[] = [];
    const values: any[] = [];

    if (brand !== undefined) { updates.push("brand = ?"); values.push(brand); }
    if (model !== undefined) { updates.push("model = ?"); values.push(model); }
    if (processor_brand !== undefined) { updates.push("processor_brand = ?"); values.push(processor_brand); }
    if (processor_model !== undefined) { updates.push("processor_model = ?"); values.push(processor_model); }
    if (generation !== undefined) { updates.push("generation = ?"); values.push(generation); }
    if (adapter !== undefined) { updates.push("adapter = ?"); values.push(adapter); }

    // Date of Purchase
    const rawDop = date_of_purchase !== undefined ? date_of_purchase : dateOfPurchase;
    const dop = rawDop ? new Date(rawDop).toISOString().split('T')[0] : (rawDop === null ? null : undefined);
    if (dop !== undefined) { updates.push("date_of_purchase = ?"); values.push(dop); }

    // IDs (legacy support)
    const pid = phyramidID !== undefined ? phyramidID : pyramidsID;
    if (pid !== undefined) { updates.push("phyramidID = ?"); values.push(pid); }

    const sid = service_id !== undefined ? service_id : serviceTag;
    if (sid !== undefined) { updates.push("service_id = ?"); values.push(sid); }

    if (isAvailable !== undefined) { updates.push("isAvailable = ?"); values.push(isAvailable ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE mobileworkstation SET ${updates.join(", ")} WHERE id = ?`;
      promises.push(pool.execute(query, values));
    }

    // 1.5 Graphics Card Update (Handle Single ID)
    if (req.body.graphicscardID) {
      const gID = req.body.graphicscardID;
      // Update the mobile workstation to point to this card
      promises.push(pool.execute(
        `UPDATE mobileworkstation SET graphicscardID = ? WHERE id = ?`,
        [gID, id]
      ));
      // Update the card itself (set CompanyID)
      promises.push(pool.execute(
        `UPDATE graphicscard SET isAvailable = 0, CompanyID = ? WHERE id = ?`,
        [req.body.CompanyID || null, gID]
      ));
    }

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        promises.push(pool.execute(
          `UPDATE ram SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
          [id, req.body.CompanyID || null, ramId]
        ));
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        const ramId = ram.id || ram.ID || ram.ramID;
        promises.push(pool.execute(
          `UPDATE ram SET MobileWorkstationID = NULL, isAvailable = 1, CompanyID = NULL WHERE id = ?`,
          [ramId]
        ));
      });
    }

    // 3. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        promises.push(pool.execute(
          `UPDATE ssd SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE ssdID = ?`,
          [id, req.body.CompanyID || null, ssdId]
        ));
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((ssd: any) => {
        const ssdId = ssd.id || ssd.ID || ssd.ssdID;
        promises.push(pool.execute(
          `UPDATE ssd SET MobileWorkstationID = NULL, isAvailable = 1, CompanyID = NULL WHERE ssdID = ?`,
          [ssdId]
        ));
      });
    }


    // 4. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        promises.push(pool.execute(
          `UPDATE nvme SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE ID = ?`,
          [id, req.body.CompanyID || null, nvmeId]
        ));
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((nvme: any) => {
        const nvmeId = nvme.id || nvme.ID || nvme.nvmeID;
        promises.push(pool.execute(
          `UPDATE nvme SET MobileWorkstationID = NULL, isAvailable = 1, CompanyID = NULL WHERE ID = ?`,
          [nvmeId]
        ));
      });
    }

    // 5. M.2 Updates
    if (Array.isArray(addM2)) {
      addM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET MobileWorkstationID = ?, isAvailable = 0, CompanyID = ? WHERE id = ?`,
          [id, req.body.CompanyID || null, m2Id]
        ));
      });
    }
    if (Array.isArray(removeM2)) {
      removeM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET MobileWorkstationID = NULL, isAvailable = 1, CompanyID = NULL WHERE id = ?`,
          [m2Id]
        ));
      });
    }

    // Execute all
    await Promise.all(promises);

    res.status(200).json({
      success: true,
      message: "Mobile Workstation updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update Laptops (Comprehensive: Main + Components)
export const updateLaptops = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      // Main fields matching schema
      id,
      brand,
      model,
      processor_brand,
      processor_model,
      generation,
      service_id,
      CompanyID,
      date_of_purchase,
      adapter,
      ramID,
      graphicscardID,
      ssdID,
      nvmeID,
      m2ID,
      inventoryID,
      phyramidID,
      isAvailable,
      isActive,

      // Components to assign/unassign
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
      addGraphicsCard,
      removeGraphicsCard,
    } = req.body;

    // Validate required fields
    if (!id) {
      const error: AppError = new Error("Laptop ID is required");
      error.statusCode = 400;
      throw error;
    }

    const promises: Promise<any>[] = [];

    // 1. Update Laptop Main Details
    // Construct dynamic update query based on provided fields
    let fieldsToUpdate: string[] = [];
    let valuesToUpdate: any[] = [];

    if (brand !== undefined) { fieldsToUpdate.push("brand = ?"); valuesToUpdate.push(brand); }
    if (model !== undefined) { fieldsToUpdate.push("model = ?"); valuesToUpdate.push(model); }
    if (processor_brand !== undefined) { fieldsToUpdate.push("processor_brand = ?"); valuesToUpdate.push(processor_brand); }
    if (processor_model !== undefined) { fieldsToUpdate.push("processor_model = ?"); valuesToUpdate.push(processor_model); }
    if (generation !== undefined) { fieldsToUpdate.push("generation = ?"); valuesToUpdate.push(generation); }
    if (service_id !== undefined) { fieldsToUpdate.push("service_id = ?"); valuesToUpdate.push(service_id); }
    if (CompanyID !== undefined) { fieldsToUpdate.push("CompanyID = ?"); valuesToUpdate.push(CompanyID); }
    if (date_of_purchase !== undefined) {
      // Create a date object from the input
      const date = new Date(date_of_purchase);
      // Format as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      fieldsToUpdate.push("date_of_purchase = ?");
      valuesToUpdate.push(formattedDate);
    }
    if (adapter !== undefined) { fieldsToUpdate.push("adapter = ?"); valuesToUpdate.push(adapter); }
    if (ramID !== undefined) { fieldsToUpdate.push("ramID = ?"); valuesToUpdate.push(ramID); }
    if (graphicscardID !== undefined) { fieldsToUpdate.push("graphicscardID = ?"); valuesToUpdate.push(graphicscardID); }
    if (ssdID !== undefined) { fieldsToUpdate.push("ssdID = ?"); valuesToUpdate.push(ssdID); }
    if (nvmeID !== undefined) { fieldsToUpdate.push("nvmeID = ?"); valuesToUpdate.push(nvmeID); }
    if (m2ID !== undefined) { fieldsToUpdate.push("m2ID = ?"); valuesToUpdate.push(m2ID); }
    if (inventoryID !== undefined) { fieldsToUpdate.push("inventoryID = ?"); valuesToUpdate.push(inventoryID); }
    if (phyramidID !== undefined) { fieldsToUpdate.push("phyramidID = ?"); valuesToUpdate.push(phyramidID); }
    if (isAvailable !== undefined) { fieldsToUpdate.push("isAvailable = ?"); valuesToUpdate.push(isAvailable); }
    if (isActive !== undefined) { fieldsToUpdate.push("isActive = ?"); valuesToUpdate.push(isActive); }

    if (fieldsToUpdate.length > 0) {
      const sql = `UPDATE laptop SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;
      valuesToUpdate.push(id);
      promises.push(pool.execute(sql, valuesToUpdate));
    }

    const companyIdToUse = CompanyID || req.body.company_id || null;

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET laptopID = ?, companyID = ?, isAvailable = 0 WHERE id = ?`,
          [id, companyIdToUse, ram.id]
        ));
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET laptopID = NULL, companyID = NULL, isAvailable = 1 WHERE id = ?`,
          [ram.id]
        ));
      });
    }

    // 3. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((item: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET laptopID = ?, companyID = ?, isAvailable = 0 WHERE ssdID = ?`,
          [id, companyIdToUse, item.ssdID]
        ));
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((item: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET laptopID = NULL, companyID = NULL, isAvailable = 1 WHERE ssdID = ?`,
          [item.ssdID]
        ));
      });
    }

    // 4. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((item: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET laptopID = ?, companyID = ?, isAvailable = 0 WHERE ID = ?`,
          [id, companyIdToUse, item.ID]
        ));
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((item: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET laptopID = NULL, companyID = NULL, isAvailable = 1 WHERE ID = ?`,
          [item.ID]
        ));
      });
    }

    // 5. M.2 Updates
    if (Array.isArray(addM2)) {
      addM2.forEach((item: any) => {
        const m2Id = item.id || item.ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET laptopID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`,
          [id, companyIdToUse, m2Id]
        ));
      });
    }
    if (Array.isArray(removeM2)) {
      removeM2.forEach((item: any) => {
        const m2Id = item.id || item.ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET laptopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`,
          [m2Id]
        ));
      });
    }

    // 6. Graphics Card Updates
    if (Array.isArray(addGraphicsCard)) {
      addGraphicsCard.forEach((item: any) => {
        const gpuId = item.id || item.ID || item.graphicscardID;
        promises.push(pool.execute(
          `UPDATE graphicscard SET laptopID = ?, companyID = ?, isAvailable = 0 WHERE id = ?`,
          [id, companyIdToUse, gpuId]
        ));
      });
    }
    if (Array.isArray(removeGraphicsCard)) {
      removeGraphicsCard.forEach((item: any) => {
        const gpuId = item.id || item.ID || item.graphicscardID;
        promises.push(pool.execute(
          `UPDATE graphicscard SET laptopID = NULL, companyID = NULL, isAvailable = 1 WHERE id = ?`,
          [gpuId]
        ));
      });
    }

    // Execute all
    await Promise.all(promises);

    res.status(200).json({
      success: true,
      message: "Laptop updated successfully",
      data: {
        id: id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add new M.2
export const addM_2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.brand) {
        const error: AppError = new Error("Brand is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    const pyramidIDs = items.map((i: any) => i.phyramidID).filter((id: any) => id);

    if (pyramidIDs.length > 0) {
      const [existingPyramidIDs] = await pool.query(
        `SELECT phyramidID FROM m_2 WHERE phyramidID IN (?)`,
        [pyramidIDs]
      ) as RowDataPacket[];

      if (existingPyramidIDs.length > 0) {
        const error: AppError = new Error(
          `Duplicate Pyramid IDs found: ${existingPyramidIDs.map((r: any) => r.phyramidID).join(", ")}`
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        serviceTag,
        date_of_purchase,
        dateOfPurchase,
        size,
        type,
        form_factor,
        phyramidID,
        inventoryID,
      } = item;

      // Default form_factor to 'Laptop' if not provided
      const dbFormFactor = form_factor || 'Laptop';

      const [result] = await pool.execute<any>(
        `INSERT INTO m_2(brand, size, type, form_factor, service_id, date_of_purchase, phyramidID, inventoryID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          size || null,
          type || null,
          dbFormFactor,
          serviceTag || null, // Directly use service_id
          date_of_purchase || dateOfPurchase || null,
          phyramidID || null,
          inventoryID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "M.2 added successfully",
      data: {
        ids: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete M.2
export const deleteM_2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ success: false, message: "ID is required" });
      return;
    }

    const [result] = await pool.execute<any>(
      "DELETE FROM m_2 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "M.2 not found" });
      return;
    }

    res.json({ success: true, message: "M.2 deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Edit M.2
export const editM_2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      id,
      brand,
      size,
      type,
      formFactor, // Mapped from frontend formFactor
      // service_id might come as service_id or serialNumber from frontend edit form
      service_id,
      serialNumber,
      dateOfPurchase,
      phyramidID,
      inventoryID
    } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: "ID is required" });
      return;
    }

    const dbFormFactor = formFactor || 'Laptop';
    const dbServiceId = service_id || serialNumber;

    const [result] = await pool.execute<any>(
      `UPDATE m_2 SET 
        brand = ?, 
        size = ?, 
        type = ?, 
        form_factor = ?, 
        service_id = ?, 
        date_of_purchase = ?, 
        phyramidID = ?, 
        inventoryID = ?
       WHERE id = ?`,
      [
        brand || null,
        size || null,
        type || null,
        dbFormFactor,
        dbServiceId || null,
        dateOfPurchase || null,
        phyramidID || null,
        inventoryID || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "M.2 not found" });
      return;
    }

    res.json({ success: true, message: "M.2 updated successfully" });
  } catch (error) {
    next(error);
  }
};

// Get All M.2
export const getAllM_2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const {
      brand,
      size,
      type,
      form_factor,
      service_id,
      phyramidID,
      inventoryID,
      isAvailable
    } = req.body;

    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (brand) {
      filterConditions.push("brand LIKE ?");
      filterValues.push(`%${brand}%`);
    }
    if (size) {
      filterConditions.push("size LIKE ?");
      filterValues.push(`%${size}%`);
    }
    if (type) {
      filterConditions.push("type LIKE ?");
      filterValues.push(`%${type}%`);
    }
    if (form_factor) {
      filterConditions.push("form_factor LIKE ?");
      filterValues.push(`%${form_factor}%`);
    }
    if (service_id) {
      filterConditions.push("service_id LIKE ?");
      filterValues.push(`%${service_id}%`);
    }
    if (phyramidID) {
      filterConditions.push("phyramidID LIKE ?");
      filterValues.push(`%${phyramidID}%`);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID LIKE ?");
      filterValues.push(`%${inventoryID}%`);
    }
    // Parent Device Filters
    if (req.body.MobileWorkstationID) {
      filterConditions.push("MobileWorkstationID = ?");
      filterValues.push(req.body.MobileWorkstationID);
    }
    if (req.body.WorkstationID) {
      filterConditions.push("WorkstationID = ?");
      filterValues.push(req.body.WorkstationID);
    }
    if (req.body.SystemID) {
      filterConditions.push("systemID = ?");
      filterValues.push(req.body.SystemID);
    }
    if (req.body.LaptopID) {
      filterConditions.push("laptopID = ?");
      filterValues.push(req.body.LaptopID);
    }
    if (isAvailable) {
      filterConditions.push("isAvailable = 1 AND CompanyID IS NULL");
    }

    let whereClause = "1=1";
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    const countQuery = `SELECT COUNT(*) as total FROM m_2 WHERE ${whereClause}`;
    const [countResult] = await pool.execute<any[]>(countQuery, filterValues);
    const total = countResult[0].total;

    const query = `SELECT * FROM m_2 WHERE ${whereClause} LIMIT ? OFFSET ?`;
    const [rows] = await pool.execute<any[]>(query, [...filterValues, limit.toString(), offset.toString()]);

    // Get all items for filter dropdowns (without pagination)
    const [allRows] = await pool.execute<any[]>(`SELECT * FROM m_2`);

    res.json({
      success: true,
      data: {
        m_2: rows,
        data: allRows, // For dropdown filters
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

// Update M.2
export const updateM_2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      id,
      brand,
      size,
      type,
      form_factor,
      service_id,
      date_of_purchase,
      phyramidID,
      inventoryID,
      isAvailable
    } = req.body;

    if (!id) {
      const error: AppError = new Error("ID is required");
      error.statusCode = 400;
      throw error;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (brand !== undefined) {
      updates.push("brand = ?");
      values.push(brand);
    }
    if (size !== undefined) {
      updates.push("size = ?");
      values.push(size);
    }
    if (type !== undefined) {
      updates.push("type = ?");
      values.push(type);
    }
    if (form_factor !== undefined) {
      updates.push("form_factor = ?");
      values.push(form_factor);
    }
    if (service_id !== undefined) {
      updates.push("service_id = ?");
      values.push(service_id);
    }
    if (date_of_purchase !== undefined) {
      updates.push("date_of_purchase = ?");
      values.push(date_of_purchase ? new Date(date_of_purchase).toISOString().split('T')[0] : date_of_purchase);
    }
    if (phyramidID !== undefined) {
      updates.push("phyramidID = ?");
      values.push(phyramidID);
    }
    if (inventoryID !== undefined) {
      updates.push("inventoryID = ?");
      values.push(inventoryID);
    }
    if (isAvailable !== undefined) {
      updates.push("isAvailable = ?");
      values.push(isAvailable);
    }

    if (updates.length === 0) {
      res.status(200).json({ success: true, message: "No updates provided" });
      return;
    }

    values.push(id);

    const [result] = await pool.execute<any>(
      `UPDATE m_2 SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      const error: AppError = new Error("M.2 product not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "M.2 product updated successfully",
    });
  } catch (error) {
    next(error);
  }
};