
import pool from '../config/database';

const createTable = async () => {
    try {
        console.log('🔌 Connecting to database...');
        const connection = await pool.getConnection();
        console.log('✅ Connected.');

        const createQuery = `
            CREATE TABLE IF NOT EXISTS scrap (
                id INT AUTO_INCREMENT PRIMARY KEY,
                producedID INT NOT NULL,
                CompanyID INT,
                inventoryID INT,
                userID INT,
                reason TEXT,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (CompanyID),
                INDEX (date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        console.log('🛠 Creating table `scrap`...');
        await connection.query(createQuery);
        console.log('✅ Table `scrap` created or already exists.');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
};

createTable();
