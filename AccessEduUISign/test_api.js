import pkg from 'pg';
const { Pool } = pkg;
import jwt from "jsonwebtoken";
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || "accessedu_secret_key_2024";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const u = await pool.query("SELECT * FROM users WHERE username = 'teacher1'");
        if (u.rows.length === 0) {
            console.log("Teacher not found");
            return;
        }
        const user = u.rows[0];
        const token = jwt.sign({ id: user.id, userType: user.user_type }, JWT_SECRET, { expiresIn: "10d" });
        console.log("Token:", token);
        console.log("UserID:", user.id);
        
        const res = await fetch(`http://localhost:5000/api/courses/teacher/${user.id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const courses = await res.json();
        console.log("Courses:", JSON.stringify(courses, null, 2));

        const resDoubts = await fetch(`http://localhost:5000/api/doubts/teacher`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const doubts = await resDoubts.json();
        console.log("Doubts:", JSON.stringify(doubts, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

check();
