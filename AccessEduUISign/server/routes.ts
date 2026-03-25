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

  // 2. AI Bridge Setup
  const PYTHON_PATH = "python";
  const SERVER_SCRIPT = path.join(process.cwd(), "..", "ml_training", "fast_mock_server.py");
  const MODEL_DIR = path.join(process.cwd(), "..", "ml_training", "output");

  let pyProcess: ChildProcess | null = null;
  const pendingRequests = new Map<string, (data: any) => void>();

  function spawnPyServer() {
    log(`Initializing Machine Learning Server... CWD: ${process.cwd()}`);
    
    // Ensure MODEL_DIR exists (at least broadly)
    if (!fs.existsSync(SERVER_SCRIPT)) {
      log(`ML Server script not found at ${SERVER_SCRIPT}.`, "error");
      return;
    }

    pyProcess = spawn(PYTHON_PATH, [SERVER_SCRIPT, MODEL_DIR], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"]
    });

    log(`Machine Learning Bridge spawned with PID: ${pyProcess.pid}`);

    pyProcess.stdout?.on("data", (data) => {
      const output = data.toString().trim();
      log(`[ML BRIDGE] ${output}`);
      
      try {
        // Attempt to parse JSON from stdout
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            const result = JSON.parse(line.trim());
            if (result.id && pendingRequests.has(result.id)) {
              pendingRequests.get(result.id)!(result);
              pendingRequests.delete(result.id);
            }
          }
        }
      } catch (e) {
        // Not JSON, just regular output
      }
    });

    pyProcess.stderr?.on("data", (data) => {
      const output = data.toString().trim();
      log(`[ML BRIDGE LOG] ${output}`);
      // Special "READY" signal
      if (output.includes("READY")) {
        log("ML Engine is fully loaded and ready for inference");
      }
    });

    pyProcess.on("close", (code) => {
      log(`ML Server closed with code ${code}`, "warning");
      pyProcess = null;
      // Restart after 5 seconds
      setTimeout(spawnPyServer, 5000);
    });
  }

  spawnPyServer();

  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws-recognition"
  });

  wss.on("connection", (ws: WebSocket) => {
    log("Inbound Recognition Connection Established");

    ws.on("message", (data) => {
      if (pyProcess && pyProcess.stdin?.writable) {
        try {
          const msg = data.toString();
          const parsed = JSON.parse(msg);
          const reqId = parsed.id || `req_${Date.now()}`;
          parsed.id = reqId; // Ensure the ID is always sent to Python
          
          // Store response handler
          pendingRequests.set(reqId, (response) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(response));
            }
          });

          pyProcess.stdin.write(JSON.stringify(parsed) + "\n");
        } catch (e) {
          log(`Error processing websocket message: ${e}`, "error");
        }
      } else {
        log("ML Server not available, skipping message", "warning");
      }
    });

    ws.on("close", () => {
      log("Recognition Hub Connection Closed");
    });
  });

  return httpServer;
}
