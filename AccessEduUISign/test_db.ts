import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import ws from "ws";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    webSocketConstructor: ws
});

async function test() {
    try {
        const client = await pool.connect();
        console.log("SUCCESS: Connected to database");
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("TABLES:", res.rows.map(r => r.table_name));
        client.release();
    } catch (err) {
        console.error("FAILURE: Could not connect to database");
        console.error(err);
    } finally {
        await pool.end();
        process.exit();
    }
}

test();
