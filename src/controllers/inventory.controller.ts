import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { AppError } from "../middleware/errorHandler";
import { type } from "os";
console.log("🔥🔥🔥 getAllLaptops HIT");
export interface Laptop {
  id: number;
  brand: string;
  model: string;
  processor_brand: string;
  processor_model: string;
  graphics: string;
  graphics_ram: string;
  service_id: number;
  brand_id: number;
  company_id: number | null;
  date_of_purchase: string;
  adapter: string;
  company_name: string | null;
  customer_name: string | null;
  phone: string | null;
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
      graphics,
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
    if (graphics) {
      if (processor) {
        const parts = processor.trim().split(" ");

        const brandPart = parts[0];                 // Intel
        const modelPart = parts.slice(1).join(" "); // i7-1165G7

        filterConditions.push(
          "(processor_brand LIKE ? AND processor_model LIKE ?)"
        );

        filterValues.push(`%${brandPart}%`, `%${modelPart}%`);
      }
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

    // Build WHERE clause
    let whereClause = "isActive = 1";
    if (isAvailable) {
      whereClause += " AND (isAvailable = '1' OR isAvailable = 1)";
    }
    if (filterConditions.length > 0) {
      whereClause += " AND " + filterConditions.join(" AND ");
    }

    // Get total count with same filters
    const countQuery = `SELECT COUNT(*) as total FROM laptop WHERE ${whereClause}`;
    const [countResult] = await pool.execute<any[]>(countQuery, filterValues);
    const total = countResult[0].total;

    // Get laptops with pagination
    const query = `SELECT * FROM laptop WHERE ${whereClause} LIMIT ? OFFSET ?`;

    const [rows] = await pool.execute<any[]>(query, [...filterValues, limit.toString(), offset.toString()]);

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
        data: data,
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

    const filteredQuery = `
      SELECT *
      FROM monitor
      WHERE ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const allDataQuery = `
      SELECT *
      FROM monitor
      LIMIT ? OFFSET ?
    `;

    // 🔥 Execute all queries in parallel
    const [
      [countResult],
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
      pyramid_id,
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
    if (pyramid_id) {
      filterConditions.push("pyramid_id = ?");
      filterValues.push(pyramid_id);
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(dataQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
        data: allData,
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
      deliveryCompany,
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
    if (deliveryCompany) {
      filterConditions.push("deliveryComany LIKE ?");
      filterValues.push(`%${deliveryCompany}%`);
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
        data: allData,
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
        data: allData,
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
        data: allData,
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
      configuration,
      deliveryCompany,
      processor,
      pyramidsID,
      serviceTag,
      inventoryID,
      isAvailable,
    } = req.body;

    // Build dynamic filters
    const filterConditions: string[] = [];
    const filterValues: any[] = [];

    if (configuration) {
      filterConditions.push("configuration LIKE ?");
      filterValues.push(`%${configuration}%`);
    }
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (deliveryCompany) {
      filterConditions.push("deliveryCompany LIKE ?");
      filterValues.push(`%${deliveryCompany}%`);
    }
    if (processor) {
      filterConditions.push("processor LIKE ?");
      filterValues.push(`%${processor}%`);
    }
    if (serviceTag) {
      filterConditions.push("serviceTag LIKE ?");
      filterValues.push(`%${serviceTag}%`);
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
        data: allData,
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
      processor,
      serviceTag,
      pyramidsID,
      inventoryID,
      isAvailable,
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
    if (inventoryID) {
      filterConditions.push("inventoryID = ?");
      filterValues.push(inventoryID);
    }
    if (processor) {
      filterConditions.push("processor LIKE ?");
      filterValues.push(`%${processor}%`);
    }
    if (serviceTag) {
      filterConditions.push("serviceTag LIKE ?");
      filterValues.push(`%${serviceTag}%`);
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
        data: allData,
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
      configuration,
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
    if (configuration) {
      filterConditions.push("configuration LIKE ?");
      filterValues.push(`%${configuration}%`);
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
      [rows],
      [allData]
    ] = await Promise.all([
      pool.execute<any[]>(countQuery, filterValues),
      pool.execute<any[]>(filteredQuery, [...filterValues, limit, offset]),
      pool.execute<any[]>(allDataQuery, [limit, offset])
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
        data: allData,
      },
    });

  } catch (error) {
    next(error);
  }
};


// Get single laptop by ID 
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
        l.graphics,
        l.graphics_ram,
        l.service_id,
        l.brand_id,
        l.company_id,
        l.date_of_purchase,
        l.adapter,
        c.company_name,
        c.customer_name,
        c.phone
      FROM laptop l
      LEFT JOIN company c ON l.company_id = c.id
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
export const addLaptop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);

  try {
    const laptops = Array.isArray(req.body) ? req.body : [req.body];
    console.log('nova', req.body);

    // Validate required fields for all items first
    for (const laptop of laptops) {
      if (!laptop.brand || !laptop.model) {
        const error: AppError = new Error("Brand and model are required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    const insertPromises = laptops.map(async (laptop: any) => {
      const {
        brand,
        model,
        processor_brand,
        processor_model,
        graphics,
        graphics_ram,
        service_id,
        brand_id,
        company_id,
        date_of_purchase,
        adapter,
        phyramidID,
      } = laptop;

      const [result] = await pool.execute<any>(
        `INSERT INTO laptop 
          (brand, model, processor_brand, processor_model, graphics, graphics_ram, service_id, CompanyID, phyramidID, date_of_purchase, adapter, inventoryID) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          model,
          processor_brand || null,
          processor_model || null,
          graphics || null,
          graphics_ram || null,
          service_id || null,
          company_id || null,
          phyramidID || null,
          date_of_purchase || null,
          adapter || null,
          laptop.inventoryID || null,
        ]
      );
      return result.insertId;
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
        deliveryCompany,
        serviceTag,
        speed,
        ssdSize,
        warrantyEndDate,
        phyramidID,
      } = item;



      const [result] = await pool.execute<any>(
        `INSERT INTO ssd (brand, ssdSize, speed, SerialNumber, serviceTag, warrantyEndDate, dateOfPurchase, deliveryCompany, phyramidID, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          ssdSize || null,
          speed || null,
          SerialNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          deliveryCompany || null,
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
        deliveryCompany,
        serviceTag,
        speed,
        Size,
        warrantyEndDate,
        phyramidID,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO nvme(brand, Size, speed, serialNumber, serviceTag, warrantyEndDate, dateOfPurchase, deliveryCompany, phyramidID, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          Size || null,
          speed || null,
          serialNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          deliveryCompany || null,
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
        deliveryCompany,
        serviceTag,
        speed,
        size,
        warrantyEndDate,
        phyramidID,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO hdd(brand, speed, serialNumber, serviceTag, warrantyEndData, dateOfPurchase, deliveryCompany, size, phyramidID, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          speed || null,
          serialNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          deliveryCompany || null,
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

// Add new Desktop
export const addDesktop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Brand', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.Name) {
        const error: AppError = new Error("Name is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        Name,
        Processor,
        configuration,
        dateOfPurchase,
        deliveryCompany,
        pyramidsID,
        serviceID,
        warrantyEndDate,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO  system(Name, Processor, configuration, dateOfPurchase, deliveryCompany, pyramidsID, serviceID, warrantyEndDate, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Name,
          Processor || null,
          configuration || null,
          dateOfPurchase || null,
          deliveryCompany || null,
          pyramidsID || null,
          serviceID || null,
          warrantyEndDate || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
    });

    const results = await Promise.all(insertPromises);

    res.status(200).json({
      success: true,
      message: "Monitor added successfully", // Note: The original message said "Monitor", I should probably correct it to "Desktop" or "System", but keeping it safe or changing to "Desktop/System" is better. Let's fix it.
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
      if (!item.processor) {
        const error: AppError = new Error("processor is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        configuration,
        dateOfPurchase,
        deliveryCompany,
        display,
        graphicscardID,
        nvmeCount,
        processor,
        pyramidsID,
        ramCount,
        serviceTag,
        ssdCount,
        warrantyEndDate,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO  workstation( processor, configuration, display, serviceTag, pyramidsID, graphicscardID, ramCount, ssdCount, nvmeCount, warrantyEndDate, dateOfPurchase, deliveryCompany, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          processor || null,
          configuration || null,
          display || null,
          serviceTag || null,
          pyramidsID || null,
          graphicscardID || null,
          ramCount || null,
          ssdCount || null,
          nvmeCount || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          deliveryCompany || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
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
export const addMobileWorkstation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('Mobile Workstation', req);
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of items) {
      if (!item.processor) {
        const error: AppError = new Error("processor is required for all items");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for duplicate pyramidsID and serviceTag
    const pyramidsIDs = items.map((item: any) => item.pyramidsID).filter(Boolean);
    const serviceTags = items.map((item: any) => item.serviceTag).filter(Boolean);

    if (pyramidsIDs.length > 0) {
      const [existingPyramids] = await pool.execute<any>(
        `SELECT pyramidsID FROM mobileworkstation WHERE pyramidsID IN (${pyramidsIDs.map(() => '?').join(',')})`,
        pyramidsIDs
      );
      if (existingPyramids.length > 0) {
        const duplicates = existingPyramids.map((r: any) => r.pyramidsID).join(', ');
        const error: AppError = new Error(`Duplicate Pyramid ID(s) already exist: ${duplicates}`);
        error.statusCode = 400;
        throw error;
      }
    }

    if (serviceTags.length > 0) {
      const [existingTags] = await pool.execute<any>(
        `SELECT serviceTag FROM mobileworkstation WHERE serviceTag IN (${serviceTags.map(() => '?').join(',')})`,
        serviceTags
      );
      if (existingTags.length > 0) {
        const duplicates = existingTags.map((r: any) => r.serviceTag).join(', ');
        const error: AppError = new Error(`Duplicate Service Tag(s) already exist: ${duplicates}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        model,
        processor,
        configuration,
        display,
        dateOfPurchase,
        deliveryCompany,
        pyramidsID,
        serviceTag,
        graphicscardID,
        ramCount,
        ssdCount,
        nvmeCount,
        warrantyEndDate,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO mobileworkstation(brand, model, processor, configuration, display, dateOfPurchase, deliveryCompany, pyramidsID, serviceTag, graphicscardID, ramCount, ssdCount, nvmeCount, warrantyEndDate, inventoryID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand || null,
          model || null,
          processor || null,
          configuration || null,
          display || null,
          dateOfPurchase || null,
          deliveryCompany || null,
          pyramidsID || null,
          serviceTag || null,
          graphicscardID || null,
          ramCount || null,
          ssdCount || null,
          nvmeCount || null,
          warrantyEndDate || null,
          item.inventoryID || null,
        ]
      );
      return result.insertId;
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

    const insertPromises = items.map(async (item: any) => {
      const {
        brand,
        dateOfPurchase,
        deliveryCompany,
        generation,
        model,
        serviceNumber,
        serviceTag,
        size,
        warrantyEndDate,
      } = item;

      const [result] = await pool.execute<any>(
        `INSERT INTO  graphicscard(brand, model, size, generation, serviceNumber, serviceTag, warrantyEndDate, dateOfPurchase, deliveryCompany, inventoryID)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand || null,
          model || null,
          size || null,
          generation || null,
          serviceNumber || null,
          serviceTag || null,
          warrantyEndDate || null,
          dateOfPurchase || null,
          deliveryCompany || null,
          item.inventoryID || null,
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
      brand_id,
      date_of_purchase,
      graphics,
      graphics_ram,
      service_id,
      model,
      processor_brand,
      processor_model,
      id,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!brand || !model) {
      const error: AppError = new Error("Brand and model are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE laptop  SET brand = ?, model = ?, processor_brand = ?, processor_model = ?, graphics = ?, graphics_ram = ?, service_id = ?, brand_id = ?, date_of_purchase = ?, adapter = ? WHERE id = ?`,
      [
        brand,
        model,
        processor_brand || null,
        processor_model || null,
        graphics || null,
        graphics_ram || null,
        service_id || null,
        brand_id || null,
        date_of_purchase || null,
        adapter || null,
        id,
      ]
    );


    res.status(201).json({
      success: true,
      message: "Laptop updated successfully",
      data: {
        id: result.insertId,
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
      id,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!name || !pyramid_id) {
      const error: AppError = new Error("Brand and model are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE monitor  SET display = ?, name = ?, pyramid_id = ?, service_tag = ?, size = ?, warranty_date = ?, date_of_purchase = ? WHERE id = ?`,
      [
        display,
        name,
        pyramid_id,
        service_tag,
        size,
        warranty_date,
        date_of_purchase,
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
      deliveryComany,
      serialNumber,
      serviceTag,
      speed,
      warrantyEndDate,
      id,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!brand || !deliveryComany) {
      const error: AppError = new Error("Brand and model are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE nvme SET Size = ?, brand = ?, dateOfPurchase = ?, deliveryComany = ?, serialNumber = ?, serviceTag = ?, speed = ?, warrantyEndDate = ? WHERE id = ?`,
      [
        Size,
        brand,
        dateOfPurchase,
        deliveryComany,
        serialNumber,
        serviceTag,
        speed,
        warrantyEndDate,
        id,
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
      DesktopID,
      WorkstationID,
      brand,
      date_of_purchase,
      form_factor,
      pyramid_id,
      service_id,
      size,
      type,
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
      `UPDATE ram SET DesktopID = ?, WorkstationID = ?, brand = ?, date_of_purchase = ?, form_factor = ?, pyramid_id = ?, service_id = ?, size = ?, type = ? WHERE id = ?`,
      [
        DesktopID,
        WorkstationID,
        brand,
        date_of_purchase,
        form_factor,
        pyramid_id,
        service_id,
        size,
        type,
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
      Name,
      Processor,
      configuration,
      dateOfPurchase,
      deliveryCompany,
      graphics,
      nvmeCount,
      pyramidsID,
      ramCount,
      serviceID,
      ssdCount,
      systemID,
      warrantyEndDate,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
      product // 'system'
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!Name || !Processor) {
      const error: AppError = new Error("Name and Processor are required");
      error.statusCode = 400;
      throw error;
    }

    const promises: Promise<any>[] = [];

    // 1. Update System Details
    const systemUpdatePromise = pool.execute<any>(
      `UPDATE system SET Name = ?, Processor = ?, configuration = ?, dateOfPurchase = ?, deliveryCompany = ?, graphics = ?, nvmeCount = ?, pyramidsID = ?, ramCount = ?, serviceID = ?, ssdCount = ?, warrantyEndDate = ? WHERE systemID = ?`,
      [
        Name,
        Processor,
        configuration,
        dateOfPurchase,
        deliveryCompany,
        graphics,
        nvmeCount,
        pyramidsID,
        ramCount,
        serviceID,
        ssdCount,
        warrantyEndDate,
        systemID,
      ]
    );
    promises.push(systemUpdatePromise);

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET systemID = ?, isAvailable = 0 WHERE id = ?`,
          [systemID, ram.id]
        ));
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET systemID = NULL, isAvailable = 1 WHERE id = ?`,
          [ram.id]
        ));
      });
    }

    // 3. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((ssd: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET systemID = ?, isAvailable = 0 WHERE ssdID = ?`,
          [systemID, ssd.ssdID]
        ));
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((ssd: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET systemID = NULL, isAvailable = 1 WHERE ssdID = ?`,
          [ssd.ssdID]
        ));
      });
    }

    // 4. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((nvme: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET systemID = ?, isAvailable = 0 WHERE ID = ?`,
          [systemID, nvme.ID]
        ));
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((nvme: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET systemID = NULL, isAvailable = 1 WHERE ID = ?`,
          [nvme.ID]
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
       WHERE al.productId = ?
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
        w.processor as workstation_processor, w.configuration as workstation_config
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
       WHERE al.productId = ? AND al.product = 'ram'
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
      `SELECT s.*, c.company_name, c.customer_name, c.phone as company_phone 
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
        w.processor as workstation_processor, w.configuration as workstation_config
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
        w.processor as workstation_processor, w.configuration as workstation_config
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
       WHERE al.productId = ? AND al.product = 'nvme'
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
       WHERE al.productId = ? AND al.product = 'hdd'
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
       FROM graphicsCard g
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
      `SELECT w.*
       FROM workstation w
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
      deliveryCompany,
      serviceTag,
      speed,
      warrantyEndDate,
      ssdSize,
      ssdID,
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!SerialNumber || !brand) {
      const error: AppError = new Error("SerialNumber and brand are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE ssd SET brand=?,ssdSize=?,speed=?,SerialNumber=?,serviceTag=?,warrantyEndDate=?,dateOfPurchase=?,deliveryCompany=? WHERE ssdID = ?`,
      [
        brand,
        ssdSize,
        speed,
        SerialNumber,
        serviceTag,
        warrantyEndDate,
        dateOfPurchase,
        deliveryCompany,
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
      deliveryCompany,
      serialNumber,
      serviceTag,
      size,
      speed,
      warrantyEndData,
      ID
    } = req.body;

    console.log('nova', req.body);
    // Validate required fields
    if (!ID || !brand) {
      const error: AppError = new Error("ID and brand are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE hdd SET brand=?,size=?,speed=?,serialNumber=?,serviceTag=?,warrantyEndData=?,dateOfPurchase=?,deliveryCompany=? WHERE ID = ?`,
      [
        brand,
        size,
        speed,
        serialNumber,
        serviceTag,
        warrantyEndData,
        dateOfPurchase,
        deliveryCompany,
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
      deliveryCompany,
    } = req.body;


    console.log('nova', req.body);
    // Validate required fields
    if (!ID || !brand) {
      const error: AppError = new Error("ID and brand are required");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.execute<any>(
      `UPDATE graphicsCard SET brand = ?,size = ?,generation = ?,model = ?,serviceTag = ?,serviceNumber = ?,warrantyEndDate = ?,dateOfPurchase = ?,deliveryCompany = ? WHERE ID = ?`,
      [
        brand ?? null,
        size ?? null,
        generation ?? null,
        model ?? null,
        serviceTag ?? null,
        serviceNumber ?? null,
        warrantyEndDate ?? null,
        dateOfPurchase ?? null,
        deliveryCompany ?? null,
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
    const { companyId, products } = req.body;

    if (!companyId || !products) {
      const error: AppError = new Error("Company ID and products are required");
      error.statusCode = 400;
      throw error;
    }

    const results: any = {};
    const promises: Promise<any>[] = [];

    // 1. Laptops
    if (products.laptop && Array.isArray(products.laptop)) {
      const laptopPromises = products.laptop.map((item: any) => {
        return pool.execute(
          `UPDATE laptop 
           SET brand=?, model=?, processor_brand=?, processor_model=?, graphics=?, graphics_ram=?, service_id=?, CompanyID=?, date_of_purchase=?, adapter=?, isAvailable=0 
           WHERE id=?`,
          [
            item.brand,
            item.model,
            item.processor_brand || null,
            item.processor_model || null,
            item.graphics || null,
            item.graphics_ram || null,
            item.service_id || null,
            companyId, // Using top-level companyId
            item.date_of_purchase || null,
            item.adapter || null,
            item.id
          ]
        );
      });
      promises.push(
        Promise.all(laptopPromises).then((res) => {
          results.laptop = res.length;
        })
      );
    }

    // 2. Workstations
    if (products.workstation && Array.isArray(products.workstation)) {
      const workstationPromises = products.workstation.map((item: any) => {
        return pool.execute(
          `UPDATE workstation 
           SET processor=?, configuration=?, display=?, serviceTag=?, pyramidsID=?, graphicscardID=?, ramCount=?, ssdCount=?, nvmeCount=?, warrantyEndDate=?, dateOfPurchase=?, deliveryCompany=?, CompanyID=?, isAvailable=0 
           WHERE id=?`,
          [
            item.processor || null,
            item.configuration || null,
            item.display || null,
            item.serviceTag || null,
            item.pyramidsID || null,
            item.graphicscardID || null,
            item.ramCount || null,
            item.ssdCount || null,
            item.nvmeCount || null,
            item.warrantyEndDate || null,
            item.dateOfPurchase || null,
            item.deliveryCompany || null,
            companyId,
            item.id
          ]
        );
      });
      promises.push(
        Promise.all(workstationPromises).then((res) => {
          results.workstation = res.length;
        })
      );
    }

    // 3. Systems (Desktops)
    if (products.system && Array.isArray(products.system)) {
      const systemPromises = products.system.map((item: any) => {
        return pool.execute(
          `UPDATE system 
           SET Name=?, Processor=?, configuration=?, dateOfPurchase=?, deliveryCompany=?, pyramidsID=?, serviceID=?, warrantyEndDate=?, graphics=?, nvmeCount=?, ramCount=?, ssdCount=?, CompanyID=?, isAvailable=0 
           WHERE systemID=?`,
          [
            item.Name,
            item.Processor || null,
            item.configuration || null,
            item.dateOfPurchase || null,
            item.deliveryCompany || null,
            item.pyramidsID || null,
            item.serviceID || null,
            item.warrantyEndDate || null,
            item.graphics || null,
            item.nvmeCount || null,
            item.ramCount || null,
            item.ssdCount || null,
            companyId,
            item.systemID
          ]
        );
      });
      promises.push(
        Promise.all(systemPromises).then((res) => {
          results.system = res.length;
        })
      );
    }

    // 4. Monitors
    if (products.monitor && Array.isArray(products.monitor)) {
      const monitorPromises = products.monitor.map((item: any) => {
        return pool.execute(
          `UPDATE monitor 
           SET name=?, size=?, display=?, service_tag=?, pyramid_id=?, date_of_purchase=?, warranty_date=?, CompanyID=?, isAvailable=0 
           WHERE id=?`,
          [
            item.name,
            item.size || null,
            item.display || null,
            item.service_tag || null,
            item.pyramid_id || null,
            item.date_of_purchase || null,
            item.warranty_date || null,
            companyId,
            item.id
          ]
        );
      });
      promises.push(
        Promise.all(monitorPromises).then((res) => {
          results.monitor = res.length;
        })
      );
    }

    // 5. SSDs
    if (products.ssd && Array.isArray(products.ssd)) {
      const ssdPromises = products.ssd.map((item: any) => {
        return pool.execute(
          `UPDATE ssd 
           SET brand=?, ssdSize=?, speed=?, SerialNumber=?, serviceTag=?, warrantyEndDate=?, dateOfPurchase=?, deliveryCompany=?, CompanyID=?, isAvailable=0 
           WHERE ssdID=?`,
          [
            item.brand,
            item.ssdSize || null,
            item.speed || null,
            item.SerialNumber || null,
            item.serviceTag || null,
            item.warrantyEndDate || null,
            item.dateOfPurchase || null,
            item.deliveryCompany || null,
            companyId,
            item.ssdID
          ]
        );
      });
      promises.push(
        Promise.all(ssdPromises).then((res) => {
          results.ssd = res.length;
        })
      );
    }

    // 6. HDDs
    if (products.hdd && Array.isArray(products.hdd)) {
      const hddPromises = products.hdd.map((item: any) => {
        return pool.execute(
          `UPDATE hdd 
           SET brand=?, speed=?, serialNumber=?, serviceTag=?, warrantyEndData=?, dateOfPurchase=?, deliveryCompany=?, size=?, CompanyID=?, isAvailable=0 
           WHERE ID=?`,
          [
            item.brand,
            item.speed || null,
            item.serialNumber || null,
            item.serviceTag || null,
            item.warrantyEndData || null,
            item.dateOfPurchase || null,
            item.deliveryCompany || null,
            item.size || null,
            companyId,
            item.ID
          ]
        );
      });
      promises.push(
        Promise.all(hddPromises).then((res) => {
          results.hdd = res.length;
        })
      );
    }

    // 7. NVMe
    if (products.nvme && Array.isArray(products.nvme)) {
      const nvmePromises = products.nvme.map((item: any) => {
        return pool.execute(
          `UPDATE nvme 
           SET brand=?, Size=?, speed=?, serialNumber=?, serviceTag=?, warrantyEndDate=?, dateOfPurchase=?, deliveryComany=?, CompanyID=?, isAvailable=0 
           WHERE ID=?`,
          [
            item.brand,
            item.Size || null,
            item.speed || null,
            item.serialNumber || null,
            item.serviceTag || null,
            item.warrantyEndDate || null,
            item.dateOfPurchase || null,
            item.deliveryCompany || item.deliveryComany || null,
            companyId,
            item.ID
          ]
        );
      });
      promises.push(
        Promise.all(nvmePromises).then((res) => {
          results.nvme = res.length;
        })
      );
    }

    // 8. Graphics Cards
    if (products.graphicscard && Array.isArray(products.graphicscard)) {
      const graphicsCardPromises = products.graphicscard.map((item: any) => {
        return pool.execute(
          `UPDATE graphicscard 
           SET brand=?, model=?, size=?, generation=?, serviceNumber=?, serviceTag=?, warrantyEndDate=?, dateOfPurchase=?, deliveryCompany=?, CompanyID=?, isAvailable=0 
           WHERE ID=?`,
          [
            item.brand || null,
            item.model || null,
            item.size || null,
            item.generation || null,
            item.serviceNumber || null,
            item.serviceTag || null,
            item.warrantyEndDate || null,
            item.dateOfPurchase || null,
            item.deliveryCompany || null,
            companyId,
            item.ID
          ]
        );
      });
      promises.push(
        Promise.all(graphicsCardPromises).then((res) => {
          results.graphicscard = res.length;
        })
      );
    }

    // 9. RAM
    if (products.ram && Array.isArray(products.ram)) {
      const ramPromises = products.ram.map((item: any) => {
        return pool.execute(
          `UPDATE ram 
           SET brand=?, date_of_purchase=?, form_factor=?, phyramidID=?, service_id=?, size=?, type=?, companyID=?, isAvailable=0 
           WHERE id=?`,
          [
            item.brand,
            item.date_of_purchase || null,
            item.form_factor || null,
            item.pyramid_id || item.phyramidID || null,
            item.service_id || null,
            item.size || null,
            item.type || null,
            companyId,
            item.id
          ]
        );
      });
      promises.push(
        Promise.all(ramPromises).then((res) => {
          results.ram = res.length;
        })
      );
    }

    // 10. Mobile Workstations
    if (products.mobile_workstation && Array.isArray(products.mobile_workstation)) {
      const mobileWorkstationPromises = products.mobile_workstation.map((item: any) => {
        return pool.execute(
          `UPDATE mobileworkstation 
           SET brand=?, model=?, processor=?, configuration=?, dateOfPurchase=?, deliveryCompany=?, pyramidsID=?, serviceTag=?, warrantyEndDate=?, CompanyID=?, isAvailable=0 
           WHERE id=?`,
          [
            item.brand || null,
            item.model || null,
            item.processor || null,
            item.configuration || null,
            item.dateOfPurchase || null,
            item.deliveryCompany || null,
            item.pyramidsID || null,
            item.serviceTag || null,
            item.warrantyEndDate || null,
            companyId,
            item.id
          ]
        );
      });
      promises.push(
        Promise.all(mobileWorkstationPromises).then((res) => {
          results.mobile_workstation = res.length;
        })
      );
    }

    // 11. M.2
    if (products.m_2 && Array.isArray(products.m_2)) {
      const m2Promises = products.m_2.map((item: any) => {
        return pool.execute(
          `UPDATE m_2 
           SET brand=?, size=?, type=?, form_factor=?, service_id=?, date_of_purchase=?, phyramidID=?, CompanyID=?, isAvailable=0 
           WHERE id=?`,
          [
            item.brand || null,
            item.size || null,
            item.type || null,
            item.form_factor || null,
            item.service_id || null,
            item.date_of_purchase || null,
            item.phyramidID || null,
            companyId,
            item.id
          ]
        );
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
      configuration,
      dateOfPurchase,
      display,
      graphicscardID,
      id,
      nvmeCount,
      processor,
      pyramidsID,
      ramCount,
      serviceTag,
      warrantyEndDate,
      ssdCount,
      deliveryCompany,
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
      CompanyID
    } = req.body;


    console.log('nova', req.body);
    // Validate required fields
    if (!id || !configuration) {
      const error: AppError = new Error("ID and configuration are required");
      error.statusCode = 400;
      throw error;
    }

    const promises: Promise<any>[] = [];

    // 1. Update Workstation Details
    const workstationUpdatePromise = pool.execute<any>(
      `UPDATE workstation SET configuration = ?,dateOfPurchase = ?,display = ?,graphicscardID = ?,nvmeCount = ?,processor = ?,pyramidsID = ?,ramCount = ?,serviceTag = ?,warrantyEndDate = ?,ssdCount = ?,deliveryCompany = ? WHERE id = ?`,
      [
        configuration ?? null,
        dateOfPurchase ?? null,
        display ?? null,
        graphicscardID ?? null,
        nvmeCount ?? null,
        processor ?? null,
        pyramidsID ?? null,
        ramCount ?? null,
        serviceTag ?? null,
        warrantyEndDate ?? null,
        ssdCount ?? null,
        deliveryCompany ?? null,
        id,
      ]
    );
    promises.push(workstationUpdatePromise);

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET workstationID = ?, isAvailable = 0, CompanyID =  ? WHERE id = ?`,
          [id, CompanyID, ram.id]
        ));
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET workstationID = NULL, isAvailable = 1, CompanyID =  NULL WHERE id = ?`,
          [ram.id]
        ));
      });
    }

    // 3. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((ssd: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET workstationID = ?, isAvailable = 0, CompanyID =  ? WHERE ssdID = ?`,
          [id, CompanyID, ssd.ssdID]
        ));
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((ssd: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET workstationID = NULL, isAvailable = 1, CompanyID =  NULL  WHERE ssdID = ?`,
          [ssd.ssdID]
        ));
      });
    }

    // 4. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((nvme: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET workstationID = ?, isAvailable = 0, CompanyID =  ? WHERE ID = ?`,
          [id, CompanyID, nvme.ID]
        ));
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((nvme: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET workstationID = NULL, isAvailable = 1, CompanyID =  NULL WHERE ID = ?`,
          [nvme.ID]
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
      processor,
      configuration,
      dateOfPurchase,
      deliveryCompany,
      pyramidsID,
      serviceTag,
      warrantyEndDate,
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
    if (processor !== undefined) { updates.push("processor = ?"); values.push(processor); }
    if (configuration !== undefined) { updates.push("configuration = ?"); values.push(configuration); }
    if (dateOfPurchase !== undefined) { updates.push("dateOfPurchase = ?"); values.push(dateOfPurchase); }
    if (deliveryCompany !== undefined) { updates.push("deliveryCompany = ?"); values.push(deliveryCompany); }
    if (pyramidsID !== undefined) { updates.push("pyramidsID = ?"); values.push(pyramidsID); }
    if (serviceTag !== undefined) { updates.push("serviceTag = ?"); values.push(serviceTag); }
    if (warrantyEndDate !== undefined) { updates.push("warrantyEndDate = ?"); values.push(warrantyEndDate); }
    if (isAvailable !== undefined) { updates.push("isAvailable = ?"); values.push(isAvailable ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE mobileworkstation SET ${updates.join(", ")} WHERE id = ?`;
      promises.push(pool.execute(query, values));
    }

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET MobileWorkstationID = ?, isAvailable = 0 WHERE id = ?`,
          [id, ram.id]
        ));
      });
    }
    if (Array.isArray(removeRam)) {
      removeRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET MobileWorkstationID = NULL, isAvailable = 1 WHERE id = ?`,
          [ram.id]
        ));
      });
    }

    // 3. SSD Updates
    if (Array.isArray(addSSD)) {
      addSSD.forEach((ssd: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET MobileWorkstationID = ?, isAvailable = 0 WHERE ssdID = ?`,
          [id, ssd.ssdID]
        ));
      });
    }
    if (Array.isArray(removeSSD)) {
      removeSSD.forEach((ssd: any) => {
        promises.push(pool.execute(
          `UPDATE ssd SET MobileWorkstationID = NULL, isAvailable = 1 WHERE ssdID = ?`,
          [ssd.ssdID]
        ));
      });
    }

    // 4. NVMe Updates
    if (Array.isArray(addNvme)) {
      addNvme.forEach((nvme: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET MobileWorkstationID = ?, isAvailable = 0 WHERE ID = ?`,
          [id, nvme.ID]
        ));
      });
    }
    if (Array.isArray(removeNvme)) {
      removeNvme.forEach((nvme: any) => {
        promises.push(pool.execute(
          `UPDATE nvme SET MobileWorkstationID = NULL, isAvailable = 1 WHERE ID = ?`,
          [nvme.ID]
        ));
      });
    }

    // 5. M.2 Updates
    if (Array.isArray(addM2)) {
      addM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET MobileWorkstationID = ?, isAvailable = 0 WHERE id = ?`,
          [id, m2Id]
        ));
      });
    }
    if (Array.isArray(removeM2)) {
      removeM2.forEach((m2: any) => {
        const m2Id = m2.id || m2.ID || m2.m2ID;
        promises.push(pool.execute(
          `UPDATE m_2 SET MobileWorkstationID = NULL, isAvailable = 1 WHERE id = ?`,
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
      // Main fields (from updateLaptop)
      adapter,
      brand,
      brand_id,
      date_of_purchase,
      graphics,
      graphics_ram,
      service_id,
      model,
      processor_brand,
      processor_model,
      id,
      // Components (from updateRam logic)
      addRam,
      removeRam,
      addSSD,
      removeSSD,
      addNvme,
      removeNvme,
      addM2,
      removeM2,
    } = req.body;

    // Validate required fields
    if (!id) {
      const error: AppError = new Error("Laptop ID is required");
      error.statusCode = 400;
      throw error;
    }

    const promises: Promise<any>[] = [];

    // 1. Update Laptop Main Details
    if (brand || model) {
      const laptopUpdatePromise = pool.execute<any>(
        `UPDATE laptop SET brand = ?, model = ?, processor_brand = ?, processor_model = ?, graphics = ?, graphics_ram = ?, service_id = ?, date_of_purchase = ?, adapter = ? WHERE id = ?`,
        [
          brand || null,
          model || null,
          processor_brand || null,
          processor_model || null,
          graphics || null,
          graphics_ram || null,
          service_id || null,
          date_of_purchase || null,
          adapter || null,
          id,
        ]
      );
      promises.push(laptopUpdatePromise);
    }

    // 2. RAM Updates
    if (Array.isArray(addRam)) {
      addRam.forEach((ram: any) => {
        promises.push(pool.execute(
          `UPDATE ram SET laptopID = ?, companyID = ?, isAvailable = 0 WHERE id = ?`,
          [id, req.body.CompanyID || null, ram.id]
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
          [id, req.body.CompanyID || null, item.ssdID]
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
          [id, req.body.CompanyID || null, item.ID]
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
        promises.push(pool.execute(
          `UPDATE m_2 SET laptopID = ?, CompanyID = ?, isAvailable = 0 WHERE id = ?`,
          [id, req.body.CompanyID || null, item.id]
        ));
      });
    }
    if (Array.isArray(removeM2)) {
      removeM2.forEach((item: any) => {
        promises.push(pool.execute(
          `UPDATE m_2 SET laptopID = NULL, CompanyID = NULL, isAvailable = 1 WHERE id = ?`,
          [item.id]
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

    // Check for duplicates
    // Schema: service_id (int not null), phyramidID (varchar)
    // Note: service_id is int, but user input might be alphanumeric if they meant Serial Number.  
    // We will try to map serialNumber to service_id, but it might fail if not int.
    // However, to fix the 'Unknown column' error, we must use service_id.
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
        service_id,
        dateOfPurchase,
        size,
        type,
        formFactor,
        phyramidID,
        inventoryID,
      } = item;

      // Default form_factor to 'Laptop' if not provided
      const dbFormFactor = formFactor || 'Laptop';

      const [result] = await pool.execute<any>(
        `INSERT INTO m_2(brand, size, type, form_factor, service_id, date_of_purchase, phyramidID, inventoryID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          size || null,
          type || null,
          dbFormFactor,
          service_id || null, // Directly use service_id
          dateOfPurchase || null,
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
      values.push(date_of_purchase);
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