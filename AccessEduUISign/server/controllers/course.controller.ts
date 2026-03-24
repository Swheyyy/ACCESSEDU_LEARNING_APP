import { Request, Response } from "express";
import { storage } from "../storage";
import { insertCourseSchema, insertLessonSchema, insertEnrollmentSchema } from "../../shared/schema";

export class CourseController {
    static async list(req: Request, res: Response) {
        const courses = await storage.getCourses();
        res.json(courses);
    }

    static async getById(req: Request, res: Response) {
        const course = await storage.getCourse(Number(req.params.id));
        if (!course) return res.status(404).json({ message: "Course not found" });
        const lessons = await storage.getLessons(course.id);
        res.json({ ...course, lessons });
    }

    static async create(req: any, res: Response) {
        const teacherId = req.user.id;
        console.log("Teacher ID:", teacherId);
        
        const data = { ...req.body, teacherId };
        // Ensure tags is an array if provided as a string
        if (typeof data.tags === 'string') {
            data.tags = data.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        
        const validatedData = insertCourseSchema.parse(data);
        const course = await storage.createCourse(validatedData);
        res.status(201).json(course);
    }

    static async addLesson(req: any, res: Response) {
        const validatedData = insertLessonSchema.parse({ ...req.body, courseId: Number(req.params.id) });
        const lesson = await storage.createLesson(validatedData);
        res.status(201).json(lesson);
    }

    static async enroll(req: any, res: Response) {
        const courseId = Number(req.params.id);
        const userId = req.user.id;
        
        const existing = await storage.getEnrollment(userId, courseId);
        if (existing) {
            return res.json(existing);
        }

        const enrollment = await storage.createEnrollment({ userId, courseId });
        res.status(201).json(enrollment);
    }

    static async getEnrolledCourses(req: any, res: Response) {
        const enrollments = await storage.getEnrollments(req.user.id);
        const courseIds = enrollments.map(e => e.courseId);
        
        if (courseIds.length === 0) {
            return res.json([]);
        }

        const allCourses = await storage.getCourses();
        const enrolledCourses = allCourses.filter(c => courseIds.includes(c.id));
        res.json(enrolledCourses);
    }

    static async getByTeacher(req: any, res: Response) {
        const teacherId = req.params.teacherId;
        const courses = await storage.getCoursesByTeacher(teacherId);
        console.log("Courses fetched:", courses);
        res.json(courses);
    }

    static async getEnrolledStudents(req: any, res: Response) {
        const courseId = Number(req.params.id);
        const enrollments = await storage.getEnrollmentsByCourse(courseId);
        const users = await Promise.all(enrollments.map(async (e) => {
            const user = await storage.getUser(e.userId as string);
            if (user) {
                const { password, ...safeUser } = user;
                return { ...safeUser, enrolledAt: e.enrolledAt };
            }
            return null;
        }));
        res.json(users.filter(Boolean));
    }

    static async update(req: any, res: Response) {
        const id = Number(req.params.id);
        const updated = await storage.updateCourse(id, req.body);
        if (!updated) return res.status(404).json({ message: "Course not found" });
        res.json(updated);
    }

    static async delete(req: any, res: Response) {
        const id = Number(req.params.id);
        await storage.deleteCourse(id);
        res.status(204).end();
    }
}
