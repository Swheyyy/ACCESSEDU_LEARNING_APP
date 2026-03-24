import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { insertUserSchema } from "../../shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "accessedu_secret_key_2024";

export class AuthController {
    static async register(req: Request, res: Response) {
        const validatedData = insertUserSchema.parse(req.body);
        const existingUser = await storage.getUserByUsername(validatedData.username);

        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);
        const user = await storage.createUser({ ...validatedData, password: hashedPassword });

        res.status(201).json(user);
    }

    static async login(req: Request, res: Response) {
        const { username, password } = req.body;
        const user = await storage.getUserByUsername(username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, userType: user.userType }, JWT_SECRET, { expiresIn: "10d" });
        res.json({ user, token });
    }

    static async logout(req: Request, res: Response) {
        res.json({ message: "Logged out successfully" });
    }

    static async verify(req: any, res: Response) {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        res.json(req.user);
    }
}
