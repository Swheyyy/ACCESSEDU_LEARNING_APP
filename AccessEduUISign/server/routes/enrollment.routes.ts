import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.post("/", authenticate, EnrollmentController.create);
router.get("/course/:courseId", authenticate, EnrollmentController.listByCourse);
router.get("/:userId", authenticate, EnrollmentController.listByUser);
router.get("/", authenticate, EnrollmentController.listByUser);

export default router;
