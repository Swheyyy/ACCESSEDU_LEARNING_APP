import { Request, Response } from "express";
import { storage } from "../storage";
import { insertProgressSchema } from "../../shared/schema";

export class ProgressController {
    static async update(req: any, res: Response) {
        const validatedData = insertProgressSchema.parse({ ...req.body, userId: req.user.id });
        const progress = await storage.updateProgress(validatedData);
        res.json(progress);
    }

    static async getByCourse(req: any, res: Response) {
        const progress = await storage.getProgress(req.user.id, Number(req.params.courseId));
        res.json(progress);
    }

    static async getAll(req: any, res: Response) {
        const userId = req.params.userId || req.user.id;
        // Basic check: only allow own progress unless admin
        if (userId !== req.user.id && req.user.userType !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        const progress = await storage.getAllProgress(userId);
        res.json(progress);
    }
}
