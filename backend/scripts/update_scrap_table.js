
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function addProducedColumn() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'phyramid_db',
        });

        console.log('Connected to database.');

        // Check if column exists
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'scrap' AND COLUMN_NAME = 'produced'
    `, [process.env.DB_NAME || 'phyramid_db']);

        if (columns.length > 0) {
            console.log("Column 'produced' already exists in 'scrap' table.");
        } else {
            console.log("Adding 'produced' column to 'scrap' table...");
            await connection.execute(`
        ALTER TABLE scrap 
        ADD COLUMN produced VARCHAR(50) DEFAULT NULL AFTER producedID
      `);
            console.log("Column added successfully.");
        }

    } catch (error) {
        console.error('Error updating table:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addProducedColumn();
