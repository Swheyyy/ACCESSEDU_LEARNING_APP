import { Request, Response } from "express";
import { storage } from "../storage";
import { insertEnrollmentSchema } from "../../shared/schema";

export class EnrollmentController {
    static async create(req: any, res: Response) {
        // Support both body-based (for studentId) and auto-derived from JWT
        const studentId = req.body.studentId || req.user.id;
        const courseId = Number(req.body.courseId);

        if (!studentId || !courseId) {
            return res.status(400).json({ message: "Missing studentId or courseId" });
        }

        const data = { userId: studentId, courseId };
        const validatedData = insertEnrollmentSchema.parse(data);
        const enrollment = await storage.createEnrollment(validatedData);
        res.status(201).json(enrollment);
    }

    static async listByUser(req: any, res: Response) {
        const userId = req.params.userId || req.user.id;
        
        // Security: students can only see their own enrollments
        if (req.user.userType === 'student' && userId !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const enrollments = await storage.getEnrollments(userId);
        res.json(enrollments);
    }

    static async listByCourse(req: Request, res: Response) {
        const courseId = Number(req.params.courseId);
        const enrollments = await storage.getEnrollmentsByCourse(courseId);
        res.json(enrollments);
    }
}
