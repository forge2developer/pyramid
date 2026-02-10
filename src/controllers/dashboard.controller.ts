
import { Request, Response, NextFunction } from "express";
import pool from "../config/database";

export const getDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // 1. Fetch all inventories first (to ensure we report 0 counts for empty ones)
        const [invNamesRes] = await pool.execute<any[]>("SELECT id, name FROM inventory");
        const allInventories = invNamesRes.map((i: any) => ({ id: i.id, name: i.name }));
        const inventoryMap = allInventories.reduce((acc: any, curr: any) => {
            acc[curr.id] = curr.name;
            return acc;
        }, {});

        // 2. Total Companies
        const [companyResult] = await pool.execute<any[]>(
            "SELECT COUNT(*) as total FROM company WHERE isActive = 1"
        );
        const totalCompanies = companyResult[0].total;

        // 3. Product Stats
        // We need to count: Total, Available, Moving (InventoryID logic if needed, but 'Moving' usually means isAvailable=0 and CompanyID IS NOT NULL? Or distinct status?)
        // Based on previous files, 'isAvailable' seems to be the key. 
        // Also user wants "count per inventory (Inventory 1 and Inventory 2)".

        // Helper to build query for a table
        const getTableStats = async (tableName: string) => {
            // Unchanged: Global Totals (fast enough to keep separate or derive, let's keep for safety)
            const [totalRes] = await pool.execute<any[]>(`SELECT COUNT(*) as count FROM ${tableName} WHERE isActive = 1`);
            const [availableRes] = await pool.execute<any[]>(`SELECT COUNT(*) as count FROM ${tableName} WHERE isActive = 1 AND isAvailable = 1`);
            const [movingRes] = await pool.execute<any[]>(`SELECT COUNT(*) as count FROM ${tableName} WHERE isActive = 1 AND isAvailable = 0`);

            // Fetch detailed stats per inventory
            const [invRes] = await pool.execute<any[]>(`
                SELECT 
                    inventoryID, 
                    SUM(CASE WHEN isAvailable = 1 THEN 1 ELSE 0 END) as available,
                    SUM(CASE WHEN isAvailable = 0 THEN 1 ELSE 0 END) as moving,
                    COUNT(*) as total
                FROM ${tableName} 
                WHERE isActive = 1 
                GROUP BY inventoryID
            `);

            // Map results to a dictionary for easy lookup
            const detailsMap = invRes.reduce((acc: any, cur: any) => {
                const key = cur.inventoryID === null ? 'unassigned' : cur.inventoryID;
                acc[key] = {
                    available: parseInt(cur.available),
                    moving: parseInt(cur.moving),
                    total: parseInt(cur.total)
                };
                return acc;
            }, {});

            // Construct the final array ensuring all inventories are present
            const inventoryDetails = allInventories.map(inv => {
                const stats = detailsMap[inv.id] || { available: 0, moving: 0, total: 0 };
                return {
                    inventoryID: inv.id,
                    name: inv.name,
                    ...stats
                };
            });

            // Handle unassigned
            const unassignedStats = detailsMap['unassigned'] || { available: 0, moving: 0, total: 0 };

            return {
                total: totalRes[0].count,
                available: availableRes[0].count,
                moving: movingRes[0].count,
                inventoryDetails,
                unassigned: unassignedStats
            };
        };

        // List of tables to query
        const tables = [
            'laptop', 'monitor', 'ram', 'system', 'ssd', 'nvme', 'hdd', 'graphicscard', 'workstation', 'mobileworkstation'
            // Add others if needed
        ];

        const productStats: Record<string, any> = {};
        let totalItemCount = 0; // Renamed for clarity internally

        // Execute in parallel? or Sequential? Parallel is faster.
        await Promise.all(tables.map(async (table) => {
            try {
                const stats = await getTableStats(table);
                productStats[table] = stats;
                totalItemCount += stats.total;
            } catch (err) {
                console.error(`Failed to get stats for ${table}`, err);
                productStats[table] = {
                    total: 0, available: 0, moving: 0,
                    inventoryDetails: allInventories.map(inv => ({
                        inventoryID: inv.id, name: inv.name, available: 0, moving: 0, total: 0
                    })),
                    unassigned: { available: 0, moving: 0, total: 0 }
                };
            }
        }));

        res.json({
            success: true,
            data: {
                totalCompanies,
                totalInventory: allInventories.length, // Count of Inventories (Table Rows)
                totalItems: totalItemCount, // Total Items Sum
                productStats,
                inventoryMap
            }
        });

    } catch (error) {
        next(error);
    }
};
