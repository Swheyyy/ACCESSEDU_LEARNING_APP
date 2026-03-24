import { Request, Response } from "express";
import { storage } from "../storage";

export class UserController {
    static async getProfile(req: any, res: Response) {
        res.json(req.user);
    }

    static async updateProfile(req: any, res: Response) {
        const updated = await storage.updateUser(req.user.id, req.body);
        if (!updated) return res.status(404).json({ message: "User not found" });
        const { password, ...safeUser } = updated;
        res.json(safeUser);
    }

    static async listAll(req: any, res: Response) {
        if (req.user.userType !== "admin") return res.status(403).json({ message: "Admin only" });
        const users = await storage.getAllUsers();
        res.json(users.map(({ password, ...u }) => u));
    }

    static async getById(req: Request, res: Response) {
        const users = await storage.getAllUsers();
        res.json(users);
    }
}
