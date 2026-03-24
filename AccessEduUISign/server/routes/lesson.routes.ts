import { Router } from "express";
import { LessonController } from "../controllers/lesson.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.get("/", LessonController.list);
router.get("/:id", LessonController.getById);
router.post("/", authenticate, authorize(["teacher", "admin"]), LessonController.create);
router.put("/:id", authenticate, authorize(["teacher", "admin"]), LessonController.update);
router.delete("/:id", authenticate, authorize(["teacher", "admin"]), LessonController.delete);

export default router;
