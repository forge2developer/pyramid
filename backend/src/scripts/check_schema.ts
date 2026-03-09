import pool from "../config/database";

async function checkSchema() {
    try {
        const [rows] = await pool.execute("DESCRIBE laptop");
        console.log("SCHEMA_START");
        console.log(JSON.stringify(rows, null, 2));
        console.log("SCHEMA_END");
        process.exit(0);
    } catch (error) {
        console.error("Error fetching schema:", error);
        process.exit(1);
    }
}

checkSchema();
