import { Router } from "express";
import { QuizController } from "../controllers/quiz.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/course/:courseId", authenticate, QuizController.getByCourse);
router.get("/lesson/:lessonId", authenticate, QuizController.getByLesson);
router.post("/:courseId/submit", authenticate, QuizController.submit);
router.post("/", authenticate, authorize(["teacher", "admin"]), QuizController.create);

export default router;
