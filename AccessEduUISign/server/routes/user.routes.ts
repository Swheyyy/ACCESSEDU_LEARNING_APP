import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.get("/profile", authenticate, UserController.getProfile);
router.put("/profile", authenticate, UserController.updateProfile);
router.get("/list", authenticate, UserController.listAll);
router.get("/:id", authenticate, UserController.getById);

export default router;
