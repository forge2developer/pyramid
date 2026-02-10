
import pool from '../config/database';

const createTable = async () => {
    try {
        console.log('🔌 Connecting to database...');
        const connection = await pool.getConnection();
        console.log('✅ Connected.');

        const createQuery = `
            CREATE TABLE IF NOT EXISTS challan_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL,
                company_name VARCHAR(255),
                filename VARCHAR(255) NOT NULL,
                challan_type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (company_id),
                INDEX (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        console.log('🛠 Creating table `challan_history`...');
        await connection.query(createQuery);
        console.log('✅ Table `challan_history` created or already exists.');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
};

createTable();
