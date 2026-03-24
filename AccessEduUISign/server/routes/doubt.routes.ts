import { Router } from "express";
import { DoubtController } from "../controllers/doubt.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.post("/", authenticate, DoubtController.create);
router.get("/student/:userId", authenticate, DoubtController.listForStudent);
router.get("/student", authenticate, DoubtController.listForStudent);
router.get("/teacher", authenticate, authorize(["teacher", "admin"]), DoubtController.listForTeacher);
router.put("/:id/respond", authenticate, authorize(["teacher", "admin"]), DoubtController.respond);
router.patch("/:id", authenticate, authorize(["teacher", "admin"]), DoubtController.respond);

export default router;
