import { Router } from "express";
import { CourseController } from "../controllers/course.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.get("/", CourseController.list);
router.get("/enrolled", authenticate, CourseController.getEnrolledCourses);
router.get("/teacher/:teacherId", authenticate, CourseController.getByTeacher);
router.get("/:id/students", authenticate, authorize(["teacher", "admin"]), CourseController.getEnrolledStudents);
router.get("/:id/lessons", authenticate, CourseController.getLessons);
router.get("/:id", CourseController.getById);
router.post("/:id/enroll", authenticate, CourseController.enroll);
router.post("/:id/lessons", authenticate, authorize(["teacher", "admin"]), CourseController.addLesson);
router.post("/", authenticate, authorize(["teacher", "admin"]), CourseController.create);
router.put("/:id", authenticate, authorize(["teacher", "admin"]), CourseController.update);
router.delete("/:id", authenticate, authorize(["teacher", "admin"]), CourseController.delete);

export default router;
