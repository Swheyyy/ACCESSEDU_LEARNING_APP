import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { log } from "./index";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

// Import Modular Routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import courseRoutes from "./routes/course.routes";
import doubtRoutes from "./routes/doubt.routes";
import messageRoutes from "./routes/message.routes";
import progressRoutes from "./routes/progress.routes";
import quizRoutes from "./routes/quiz.routes";
import lessonRoutes from "./routes/lesson.routes";
import enrollmentRoutes from "./routes/enrollment.routes";

export async function registerRoutes(httpServer: Server, app: Express) {
  // 1. API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/lessons", lessonRoutes);
  app.use("/api/doubts", doubtRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/quizzes", quizRoutes);
  app.use("/api/enrollments", enrollmentRoutes);

  // 2. AI Bridge WebSocket Setup
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws-recognition"
  });

  // Python ML Server Configuration
  const PYTHON_PATH = "python";
  const SERVER_SCRIPT = path.join(process.cwd(), "..", "ml_training", "landmark_inference_server.py");

  let pyProcess: ChildProcess | null = null;

  try {
    if (fs.existsSync(SERVER_SCRIPT)) {
      log(`Initializing Machine Learning Server... CWD: ${process.cwd()}`);

      pyProcess = spawn(PYTHON_PATH, [SERVER_SCRIPT], {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"]
      });

      log(`Machine Learning Bridge spawned with PID: ${pyProcess.pid}`);

      pyProcess.stdout?.on("data", (data) => log(`[ML BRIDGE] ${data.toString().trim()}`));
      pyProcess.stderr?.on("data", (data) => log(`[ML BRIDGE ERROR] ${data.toString().trim()}`));

      pyProcess.on("close", (code) => {
        log(`ML Server closed with code ${code}`, "warning");
        pyProcess = null;
      });
    } else {
      log(`ML Server script not found at ${SERVER_SCRIPT}.`, "warning");
    }
  } catch (error) {
    log(`Failed to start ML Bridge: ${error}`, "error");
  }

  wss.on("connection", (ws: WebSocket) => {
    log("Inbound Recognition Connection Established");

    let pyConnection: WebSocket | null = null;

    const connectToPy = () => {
      pyConnection = new WebSocket("ws://localhost:8000");

      pyConnection.on("open", () => log("Bridge connected to Python ML Engine"));

      pyConnection.on("message", (msg) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      });

      pyConnection.on("error", () => {
        setTimeout(connectToPy, 2000);
      });
    };

    connectToPy();

    ws.on("message", (data) => {
      if (pyConnection?.readyState === WebSocket.OPEN) {
        pyConnection.send(data);
      }
    });

    ws.on("close", () => {
      log("Recognition Hub Connection Closed");
      if (pyConnection) pyConnection.close();
    });
  });

  return httpServer;
}
