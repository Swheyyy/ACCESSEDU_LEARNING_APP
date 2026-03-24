import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        console.log('--- USERS ---');
        const resUsers = await pool.query("SELECT id, name, username, user_type FROM users WHERE name LIKE '%Teacher%' OR name LIKE '%Admin%' OR name LIKE '%Student%'");
        console.table(resUsers.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

check();
