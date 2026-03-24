import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcrypt";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    webSocketConstructor: ws
});

async function main() {
    console.log("Starting main...");
    try {
        const client = await pool.connect();
        console.log("Connected...");
        try {
            const hashedPassword = await bcrypt.hash("password123", 10);
            console.log("Hashed...");
            await client.query(`
                INSERT INTO users (name, email, username, password, user_type)
                VALUES 
                ('Admin', 'admin@accessedu.org', 'admin', $1, 'admin'),
                ('Teacher', 'teacher@accessedu.org', 'teacher', $1, 'teacher'),
                ('Student', 'student@accessedu.org', 'student', $1, 'deaf_student')
                ON CONFLICT (username) DO NOTHING
            `, [hashedPassword]);
            console.log("Seeded!");
        } catch (e) {
            console.error("Query/Hash error:", e);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Connect error:", err);
    } finally {
        await pool.end();
        process.exit();
    }
}

main();
