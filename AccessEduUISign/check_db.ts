import { db } from "./server/db.ts";
import { users, courses, doubts, enrollments } from "./shared/schema.ts";

async function check() {
    try {
        const u = await db.select().from(users);
        const c = await db.select().from(courses);
        const d = await db.select().from(doubts);
        const e = await db.select().from(enrollments);
        
        console.log(`Users: ${u.length}`);
        console.log(`Courses: ${c.length}`);
        console.log(`Doubts: ${d.length}`);
        console.log(`Enrollments: ${e.length}`);
        
        if (u.length > 0) {
            console.log("Names:", u.map(x => x.name).join(", "));
        }
    } catch (err) {
        console.error("DB check failed:", err);
    }
    process.exit(0);
}

check();
