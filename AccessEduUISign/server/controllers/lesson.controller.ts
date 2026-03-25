import { Request, Response } from "express";
import { storage } from "../storage";
import { insertLessonSchema } from "../../shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processVideoAsync } from "../utils/ml-processor";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "videos");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: videoStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|webm|ogg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Error: File upload only supports video formats (mp4, webm, ogg)"));
    }
}).single("video");

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

    static async uploadVideo(req: any, res: Response) {

        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ message: "No video file uploaded" });
            }

            try {
                const { title, description, courseId } = req.body;
                const videoUrl = `/uploads/videos/${req.file.filename}`;

                const validatedData = (insertLessonSchema as any).parse({
                    title,
                    description,
                    courseId: Number(courseId),
                    signVideoUrl: videoUrl,
                    order: Number(req.body.order || 1),
                    processingStatus: "processing"
                });

                const lesson = await storage.createLesson(validatedData);
                
                // Trigger Background Processing
                processVideoAsync(lesson.id, videoUrl);
                
                res.status(201).json(lesson);
            } catch (err: any) {
                res.status(400).json({ message: err.message });
            }
        });
    }
}
