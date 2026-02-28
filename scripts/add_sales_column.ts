import pool from "../src/config/database";

async function migrate() {
    try {
        console.log("Adding 'sales' column to 'scrap' table...");
        await pool.execute("ALTER TABLE scrap ADD COLUMN sales VARCHAR(255) DEFAULT NULL;");
        console.log("Successfully added 'sales' column.");
        process.exit(0);
    } catch (error: any) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log("Column 'sales' already exists.");
            process.exit(0);
        } else {
            console.error("Migration failed:", error);
            process.exit(1);
        }
    }
}

migrate();
