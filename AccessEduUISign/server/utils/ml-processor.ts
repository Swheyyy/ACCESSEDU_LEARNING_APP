import { spawn } from "child_process";
import path from "path";
import { storage } from "../storage";
import { log } from "../index";

export async function processVideoAsync(lessonId: number, relativeVideoPath: string) {
    log(`Starting asynchronous ML processing for Lesson ${lessonId}...`);
    
    const pythonPath = "python";
    const mlScript = path.join(process.cwd(), "..", "ml_training", "mediapipe_inference.py");
    const absoluteVideoPath = path.join(process.cwd(), relativeVideoPath);

    log(`Spawning ML process for file: ${absoluteVideoPath}`);

    const pyProcess = spawn(pythonPath, [mlScript, "--file", absoluteVideoPath]);

    let output = "";
    let errorOutput = "";

    pyProcess.stdout.on("data", (data) => {
        output += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
    });

    pyProcess.on("close", async (code) => {
        if (code === 0) {
            try {
                const lines = output.trim().split("\n");
                const lastLine = lines[lines.length - 1];
                const result = JSON.parse(lastLine);
                
                await storage.updateLesson(lessonId, {
                    transcript: result.transcript,
                    processingStatus: "completed"
                });
                log(`Successfully processed Lesson ${lessonId}. Transcript generated.`);
            } catch (e) {
                log(`Failed to parse ML output for Lesson ${lessonId}: ${e}. Raw output: ${output}`, "error");
                await storage.updateLesson(lessonId, { processingStatus: "failed" });
            }
        } else {
            log(`ML Process exited with code ${code} for Lesson ${lessonId}. Error: ${errorOutput}`, "error");
            await storage.updateLesson(lessonId, { processingStatus: "failed" });
        }
    });
}
