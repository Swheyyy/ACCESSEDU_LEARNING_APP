"""
Improved inference using MediaPipe Gesture Recognizer Task
This approach uses a Google-Official Pretrained Model for near-perfect baseline sign recognition.
"""
import os
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from typing import List, Tuple, Dict, Optional
import argparse
import json
import sys

class MediaPipeSignPredictor:
    """
    Sign language predictor using official MediaPipe Gesture Recognizer
    Provides robust, low-latency recognition for a standard set of hand signs.
    """
    
    def __init__(self, model_path: str = "ACCESSEDU_LEARNING_APP/ml_training/gesture_recognizer.task"):
        """Initialize MediaPipe Gesture Recognizer"""
        # Ensure model exists
        if not os.path.exists(model_path):
            # Try absolute path relative to current script
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(base_dir, "gesture_recognizer.task")
            
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.GestureRecognizerOptions(base_options=base_options)
        self.recognizer = vision.GestureRecognizer.create_from_options(options)
        
        # Mapping for ASL-style interpretation of common gestures
        self.sign_mapping = {
            "Open_Palm": [("hello", 0.95), ("wait", 0.85), ("five", 0.70)],
            "Closed_Fist": [("yes", 0.90), ("solid", 0.80), ("zero", 0.60)],
            "Pointing_Up": [("one", 0.95), ("look", 0.75), ("up", 0.70)],
            "Victory": [("two", 0.98), ("peace", 0.90), ("victory", 0.80)],
            "ILoveYou": [("i love you", 0.99), ("love", 0.90), ("asl-love", 0.85)],
            "Thumbs_Up": [("yes", 0.98), ("correct", 0.90), ("good", 0.85)],
            "Thumbs_Down": [("no", 0.98), ("wrong", 0.90), ("bad", 0.85)],
            "None": [("unclear", 0.0)]
        }
        
    def predict_from_frames(self, frames: List[np.ndarray], top_k: int = 3) -> List[Tuple[str, float]]:
        """
        Predict sign from sequence of frames using the Gesture Recognizer task
        
        Args:
            frames: List of frames (BGR format)
            top_k: Number of top predictions to return
            
        Returns:
            List of (sign_name, confidence) tuples
        """
        if not frames:
            return [("No frames received", 0.0)]

        # Use the most recent frame for instant gesture recognition (most gestures are static postures)
        # For a full implementation, we could average across the sequence
        frame = frames[-1]
        
        # Convert BGR to RGB (MediaPipe requirement)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        # Recognize gesture
        recognition_result = self.recognizer.recognize(mp_image)
        
        if not recognition_result.gestures:
            return [("unclear sign - please try again", 0.1)]
            
        # Get the top gesture detected
        top_gesture = recognition_result.gestures[0][0]
        category_name = top_gesture.category_name
        score = top_gesture.score
        
        # Map official gesture names to sign language vocabulary
        interpreted_signs = self.sign_mapping.get(category_name, [(category_name.lower(), score)])
        
        # Adjust confidence scores based on the model's output
        final_predictions = [(sign, conf * score) for sign, conf in interpreted_signs]
        
        return final_predictions[:top_k]

    def draw_landmarks(self, frame: np.ndarray) -> np.ndarray:
        """Draw hand landmarks logic (placeholder as GestureRecognizer handles it internally)"""
        # Note: If drawing is needed, we'd use mp.solutions.drawing_utils separately
        # For now, return the frame as is or implement standard drawing
        return frame

    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'recognizer'):
            try:
                self.recognizer.close()
            except:
                pass

def process_video_file(video_path: str, predictor: MediaPipeSignPredictor):
    """Processes a video file and returns a JSON transcript"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Could not open video file"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    interval = max(int(fps / 3), 1) # 3 frames per second sampling
    
    recognized_words = []
    last_word = ""
    
    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_idx % interval == 0:
            # Convert frame to expected format (BGR is fine for our predict method)
            results = predictor.predict_from_frames([frame])
            if results and results[0][1] > 0.5:
                word = results[0][0]
                # Filter noise and repetitive detections
                if word != last_word and word not in ["unclear sign - please try again", "none"]:
                    recognized_words.append(word)
                    last_word = word
        
        frame_idx += 1
    
    cap.release()
    
    transcript = " ".join(recognized_words) if recognized_words else "No signs clearly detected."
    return {"transcript": transcript, "status": "completed"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AccessEdu Sign Inference Engine")
    parser.add_argument("--file", type=str, help="Process a video file")
    parser.add_argument("--stream", action="store_true", help="Start in streaming mode (default)")
    args = parser.parse_args()

    try:
        predictor = MediaPipeSignPredictor()
        
        if args.file:
            result = process_video_file(args.file, predictor)
            print(json.dumps(result)) # Output JSON for Node controller
        else:
            # Traditional testing or stream start
            print("Model loaded successfully! Ready for streaming.")
            # Blank frame test
            dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            results = predictor.predict_from_frames([dummy_frame])
            
    except Exception as e:
        print(json.dumps({"error": str(e), "status": "failed"}))
        sys.exit(1)
