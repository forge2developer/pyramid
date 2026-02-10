
import pool from "../config/database";

const createTable = async () => {
    try {
        console.log("Creating challan_history table...");
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS challan_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL,
                company_name VARCHAR(255),
                filename VARCHAR(255) NOT NULL,
                challan_type VARCHAR(50), 
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ challan_history table created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating table:", error);
        process.exit(1);
    }
};

createTable();
