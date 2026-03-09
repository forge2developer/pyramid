import pool from "../config/database";

const updateSchema = async () => {
    try {
        console.log("Updating challan_history table schema...");

        // Add new columns for storing complete challan data
        await pool.execute(`
            ALTER TABLE challan_history 
            ADD COLUMN IF NOT EXISTS products_data TEXT,
            ADD COLUMN IF NOT EXISTS challan_remarks TEXT,
            ADD COLUMN IF NOT EXISTS custom_company_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS custom_address TEXT,
            ADD COLUMN IF NOT EXISTS challan_date DATE
        `);

        console.log("✅ challan_history table schema updated successfully.");
        console.log("New columns added: products_data, challan_remarks, custom_company_name, custom_address, challan_date");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error updating schema:", error);
        process.exit(1);
    }
};

updateSchema();
