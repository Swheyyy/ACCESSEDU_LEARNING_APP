import { DatabaseStorage } from "./server/storage.ts";
import "dotenv/config";

async function run() {
    console.log("Starting manual seed...");
    const storage = new DatabaseStorage();
    try {
        await storage.seed();
        console.log("Seeding process finished.");
    } catch (err) {
        console.error("Seeding failed:", err);
    }
    process.exit(0);
}

run();
