import { Request, Response } from "express";
import { storage } from "../storage";
import { insertMessageSchema } from "../../shared/schema";

export class MessageController {
    static async send(req: any, res: Response) {
        const validated = insertMessageSchema.parse({
            ...req.body,
            senderId: req.user.id
        });
        const message = await storage.createMessage(validated);
        res.status(201).json(message);
    }

    static async getConversation(req: any, res: Response) {
        const userId = req.user.id;
        const otherId = req.params.userId;
        const messages = await storage.getMessages(userId, otherId);
        res.json(messages);
    }
}
