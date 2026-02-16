import pool from "../config/database";

const addColumns = async () => {
    try {
        console.log("Adding edit columns to challan_history table...");

        // Check which columns already exist
        const [columns] = await pool.execute<any>(`SHOW COLUMNS FROM challan_history`);
        const existingCols = (columns as any[]).map(c => c.Field);

        const columnsToAdd = [
            { name: 'products_data', definition: 'JSON' },
            { name: 'challan_remarks', definition: 'TEXT' },
            { name: 'custom_company_name', definition: 'VARCHAR(255)' },
            { name: 'custom_address', definition: 'TEXT' },
            { name: 'challan_date', definition: 'DATE' },
        ];

        for (const col of columnsToAdd) {
            if (!existingCols.includes(col.name)) {
                await pool.execute(`ALTER TABLE challan_history ADD COLUMN ${col.name} ${col.definition}`);
                console.log(`  ✅ Added column: ${col.name}`);
            } else {
                console.log(`  ⏭️  Column already exists: ${col.name}`);
            }
        }

        console.log("✅ All columns ready.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

addColumns();
