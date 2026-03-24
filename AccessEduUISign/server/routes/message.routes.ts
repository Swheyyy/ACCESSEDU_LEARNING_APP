import { Router } from "express";
import { MessageController } from "../controllers/message.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, MessageController.send);
router.get("/:userId", authenticate, MessageController.getConversation);

export default router;
