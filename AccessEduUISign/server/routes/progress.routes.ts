import { Router } from "express";
import { ProgressController } from "../controllers/progress.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.post("/", authenticate, ProgressController.update);
router.get("/course/:courseId", authenticate, ProgressController.getByCourse);
router.get("/:userId", authenticate, ProgressController.getAll);
router.get("/", authenticate, ProgressController.getAll); // also allow for self without params

export default router;
