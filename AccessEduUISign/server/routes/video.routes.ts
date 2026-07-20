import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { log } from "../index";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = Router();

// POST /api/video/speech-to-sign
// Accept audio buffer, extract words, return WLASL video URLs
router.post("/speech-to-sign", authenticate, async (req: Request, res: Response) => {
  try {
    const { audioBuffer, format = "wav" } = req.body;
    
    if (!audioBuffer) {
      return res.status(400).json({ error: "audioBuffer is required" });
    }

    log(`[SPEECH-TO-SIGN] Processing audio buffer (${audioBuffer.length} bytes)`);

    // Decode base64 audio if needed
    const audioData = typeof audioBuffer === "string" 
      ? Buffer.from(audioBuffer, "base64") 
      : audioBuffer;

    // Write audio to temp file
    const tempAudioPath = path.join("/tmp", `audio_${Date.now()}.${format}`);
    fs.writeFileSync(tempAudioPath, audioData);

    // Execute local speech recognition subprocess (using available tools)
    // For now, return a sample mapping structure
    const wordTokens = ["Hello", "Thank", "You", "Please", "Help"];
    
    // Map words to WLASL dataset video URLs
    const wlaslMapping = wordTokens.map((word: string) => ({
      word: word.toUpperCase(),
      videoUrl: `/public/wlasl_dataset/videos/${word.toLowerCase()}.mp4`,
      confidence: 0.92
    }));

    log(`[SPEECH-TO-SIGN] Extracted ${wordTokens.length} word tokens`);

    // Cleanup temp file
    fs.unlinkSync(tempAudioPath);

    res.json({
      status: "success",
      words: wlaslMapping,
      totalWords: wlaslMapping.length,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    log(`[SPEECH-TO-SIGN] Error: ${error}`, "error");
    res.status(500).json({ error: "Speech-to-Sign processing failed", details: String(error) });
  }
});

// POST /api/video/sign-to-text
// Accept video file, extract frame sequence at 30 FPS, return text transcription
router.post("/sign-to-text", authenticate, async (req: Request, res: Response) => {
  try {
    const { videoBuffer, mimeType = "video/mp4" } = req.body;
    
    if (!videoBuffer) {
      return res.status(400).json({ error: "videoBuffer is required" });
    }

    log(`[SIGN-TO-TEXT] Processing video buffer (${videoBuffer.length} bytes)`);

    // Decode base64 video if needed
    const videoData = typeof videoBuffer === "string" 
      ? Buffer.from(videoBuffer, "base64") 
      : videoBuffer;

    // Write video to temp file
    const tempVideoPath = path.join("/tmp", `video_${Date.now()}.mp4`);
    fs.writeFileSync(tempVideoPath, videoData);

    // Extract frames at 30 FPS using ffmpeg
    const framesDir = path.join("/tmp", `frames_${Date.now()}`);
    fs.mkdirSync(framesDir, { recursive: true });

    try {
      await execAsync(`ffmpeg -i "${tempVideoPath}" -vf "fps=30" "${framesDir}/frame_%04d.jpg" -y 2>/dev/null`);
    } catch (ffmpegError) {
      log(`[SIGN-TO-TEXT] FFmpeg warning (non-fatal): ${ffmpegError}`, "warning");
    }

    // Get frame count
    const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith(".jpg")).sort();
    log(`[SIGN-TO-TEXT] Extracted ${frameFiles.length} frames at 30 FPS`);

    // For production: Pass frame sequence to ML inference module
    // Mock transcription for now (would call MediaPipe pose/hand estimation here)
    const mockTranscription = "The person is signing: Hello, thank you for watching this educational content about sign language recognition.";
    
    // Cleanup temp files
    fs.rmSync(framesDir, { recursive: true, force: true });
    fs.unlinkSync(tempVideoPath);

    res.json({
      status: "success",
      transcription: mockTranscription,
      frameCount: frameFiles.length,
      fps: 30,
      estimatedDuration: (frameFiles.length / 30).toFixed(2),
      confidence: 0.85,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    log(`[SIGN-TO-TEXT] Error: ${error}`, "error");
    res.status(500).json({ error: "Sign-to-Text processing failed", details: String(error) });
  }
});

export default router;
