import pool from "../config/database";

const revertSchema = async () => {
    try {
        console.log("Reverting challan_history table schema...");

        // Remove the columns that were added
        await pool.execute(`
            ALTER TABLE challan_history 
            DROP COLUMN IF EXISTS products_data,
            DROP COLUMN IF EXISTS challan_remarks,
            DROP COLUMN IF EXISTS custom_company_name,
            DROP COLUMN IF EXISTS custom_address,
            DROP COLUMN IF EXISTS challan_date
        `);

        console.log("✅ challan_history table schema reverted successfully.");
        console.log("Columns removed: products_data, challan_remarks, custom_company_name, custom_address, challan_date");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error reverting schema:", error);
        process.exit(1);
    }
};

revertSchema();
