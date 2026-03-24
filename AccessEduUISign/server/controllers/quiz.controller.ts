import { Request, Response } from "express";
import { storage } from "../storage";
import { insertQuizSchema } from "../../shared/schema";

export class QuizController {
    static async getByCourse(req: any, res: Response) {
        const courseId = Number(req.params.courseId);
        const quizzes = await storage.getQuizzesByCourse(courseId);
        res.json(quizzes);
    }

    static async getByLesson(req: any, res: Response) {
        const lessonId = Number(req.params.lessonId);
        const quizzes = await storage.getQuizzesByLesson(lessonId);
        res.json(quizzes);
    }

    static async submit(req: any, res: Response) {
        const { courseId, lessonId, answers } = req.body;
        const userId = req.user.id;
        
        const quizzes = await storage.getQuizzesByLesson(Number(lessonId));
        if (quizzes.length === 0) return res.status(404).json({ message: "No quiz found for this lesson" });
        
        const quiz = quizzes[0] as any;
        let correctCount = 0;
        
        const qArray = quiz.questions as any [];
        qArray.forEach((q: any, index: number) => {
            if (answers[index] === q.correct) {
                correctCount++;
            }
        });
        
        const score = Math.round((correctCount / qArray.length) * 100);
        const progress = await storage.submitQuizResult(userId, Number(courseId), Number(lessonId), score);
        
        res.json({
            score,
            correctCount,
            totalQuestions: qArray.length,
            progress
        });
    }

    static async create(req: any, res: Response) {
        const validated = insertQuizSchema.parse(req.body);
        const quiz = await storage.createQuiz(validated);
        res.status(201).json(quiz);
    }
}
