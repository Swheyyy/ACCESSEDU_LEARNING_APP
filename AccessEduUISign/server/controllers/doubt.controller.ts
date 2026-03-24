import { Request, Response } from "express";
import { storage } from "../storage";
import { insertDoubtSchema } from "../../shared/schema";

export class DoubtController {
    static async create(req: any, res: Response) {
        const validatedData = insertDoubtSchema.parse({ ...req.body, userId: req.user.id });
        const doubt = await storage.createDoubt(validatedData);
        res.status(201).json(doubt);
    }

    static async listForStudent(req: any, res: Response) {
        const userId = req.params.userId || req.user.id;
        // Basic check: only allow own if not teacher/admin
        if (userId !== req.user.id && req.user.userType === "student") {
            return res.status(403).json({ message: "Forbidden" });
        }
        const doubts = await storage.getDoubts({ studentId: userId });
        res.json(doubts);
    }

    static async listForTeacher(req: any, res: Response) {
        const doubts = await storage.getDoubts({ teacherId: req.user.id });
        res.json(doubts);
    }

    static async respond(req: any, res: Response) {
        const doubtId = Number(req.params.id);
        const { response } = req.body;
        const doubt = await storage.updateDoubt(doubtId, { response, status: "answered" });
        if (!doubt) return res.status(404).json({ message: "Doubt not found" });
        res.json(doubt);
    }
}
