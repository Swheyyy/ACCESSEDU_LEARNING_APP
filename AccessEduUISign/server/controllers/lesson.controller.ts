import { Request, Response } from "express";
import { storage } from "../storage";
import { insertLessonSchema } from "../../shared/schema";

export class LessonController {
    static async list(req: Request, res: Response) {
        const courseId = Number(req.query.courseId);
        if (isNaN(courseId)) {
            return res.status(400).json({ message: "Invalid courseId" });
        }
        const lessons = await storage.getLessons(courseId);
        res.json(lessons);
    }

    static async getById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const lesson = await storage.getLesson(id);
        if (!lesson) return res.status(404).json({ message: "Lesson not found" });
        res.json(lesson);
    }

    static async create(req: any, res: Response) {
        const validatedData = insertLessonSchema.parse(req.body);
        const lesson = await storage.createLesson(validatedData);
        res.status(201).json(lesson);
    }

    static async update(req: any, res: Response) {
        const id = Number(req.params.id);
        const updated = await storage.updateLesson(id, req.body);
        if (!updated) return res.status(404).json({ message: "Lesson not found" });
        res.json(updated);
    }

    static async delete(req: any, res: Response) {
        const id = Number(req.params.id);
        await storage.deleteLesson(id);
        res.status(204).end();
    }
}
