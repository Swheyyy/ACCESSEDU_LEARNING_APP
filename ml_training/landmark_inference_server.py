"""
Final Landmark-based Inference Server
Optimized for Speed and Accuracy on 50 Common Signs
"""
import os
import sys
import json
import time
import numpy as np
import cv2
import mediapipe as mp
import tensorflow as tf
from tensorflow import keras
import traceback

# Force CPU if needed, but GPU is better if available
# os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

print("LANDMARK INFERENCE SERVER STARTING...", file=sys.stderr, flush=True)

class LandmarkPredictor:
    def __init__(self, model_dir):
        model_path = os.path.join(model_dir, 'model.h5')
        metadata_path = os.path.join(model_dir, 'metadata.json')
        
        if not os.path.exists(model_path):
            # Try alternative name
            model_path = os.path.join(model_dir, 'fast_model.h5')
            
        if not os.path.exists(model_path) or not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Model files not found in {model_dir}")

        print(f"Loading model from {model_path}...", file=sys.stderr, flush=True)
        self.model = keras.models.load_model(model_path)
        
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
            
        self.classes = self.metadata['classes']
        self.sequence_length = self.metadata.get('sequence_length', 64)
        self.num_landmarks = self.metadata.get('num_landmarks', 63) # 21 * 3
        
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        print(f"Model loaded. Classes: {len(self.classes)}, Seq Len: {self.sequence_length}", file=sys.stderr, flush=True)

    def extract_landmarks(self, frame):
        if frame is None:
            return [0.0] * self.num_landmarks
            
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)
        
        if results.multi_hand_landmarks:
            # Take the first hand
            hl = results.multi_hand_landmarks[0]
            lms = []
            for lm in hl.landmark:
                lms.extend([lm.x, lm.y, lm.z])
            return lms
        return [0.0] * self.num_landmarks

    def predict(self, input_path, itype="video"):
        start_time = time.time()
        
        if itype == "video":
            cap = cv2.VideoCapture(input_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if total_frames <= 0:
                return {"success": False, "error": "Invalid video file"}
                
            # SAMPLE FRAMES UNIFORMLY BEFORE MediaPipe
            # Matching training sequence length for max accuracy
            target_seq_len = self.sequence_length
            sample_indices = np.linspace(0, total_frames - 1, target_seq_len, dtype=int)
            
            landmarks_seq = []
            for idx in sample_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret:
                    landmarks_seq.append([0.0] * self.num_landmarks)
                    continue
                
                lms = self.extract_landmarks(frame)
                landmarks_seq.append(lms)
            cap.release()

            landmarks_seq = np.array(landmarks_seq).reshape(1, self.sequence_length, -1)
            
            # Prediction
            preds = self.model.predict(landmarks_seq, verbose=0)[0]
            
            # Get multiple top predictions
            top_k = 5
            top_indices = np.argsort(preds)[-top_k:][::-1]
            
            predictions = []
            for idx in top_indices:
                predictions.append({
                    "text": self.classes[idx],
                    "confidence": float(preds[idx])
                })
            
            elapsed = time.time() - start_time
            
            # Check if hands were detected in at least 15% of the sequence
            empty_frames = sum(1 for lms in landmarks_seq[0] if all(v == 0.0 for v in lms))
            if empty_frames > self.sequence_length * 0.85:
                print(f"[AI] NO HAND DETECTED ({empty_frames}/{self.sequence_length} empty)", file=sys.stderr, flush=True)
                return {
                    "success": True,
                    "top_prediction": {"text": "No hand detected", "confidence": 0.0},
                    "predictions": [{"text": "No hand detected", "confidence": 0.0}],
                    "process_time": elapsed
                }
            
            print(f"[AI] Predicted {predictions[0]['text']} in {elapsed:.2f}s", file=sys.stderr, flush=True)
            return {
                "success": True, 
                "top_prediction": predictions[0],
                "predictions": predictions,
                "process_time": elapsed
            }
        else:
            # Image
            img = cv2.imread(input_path)
            lms = self.extract_landmarks(img)
            
            # Check if hand detected in image
            if all(v == 0.0 for v in lms):
                 return {
                    "success": True,
                    "top_prediction": {"text": "No hand detected", "confidence": 0.0},
                    "predictions": [{"text": "No hand detected", "confidence": 0.0}],
                    "process_time": time.time() - start_time
                }
                
            landmarks_seq = [lms] * self.sequence_length
            
        # Reshape for model (batch, seq, feat)
        input_data = np.array([landmarks_seq])
        
        # Predict
        prediction = self.model.predict(input_data, verbose=0)[0]
        
        # Get multiple top predictions
        top_k = 5
        top_indices = np.argsort(prediction)[-top_k:][::-1]
        
        predictions = []
        for idx in top_indices:
            predictions.append({
                "text": self.classes[idx],
                "confidence": float(prediction[idx])
            })
            
        elapsed = time.time() - start_time
        print(f"[AI] Predicted {predictions[0]['text']} in {elapsed:.2f}s", file=sys.stderr, flush=True)
        
        return {
            "success": True,
            "top_prediction": predictions[0],
            "predictions": predictions,
            "process_time": elapsed
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: python landmark_inference_server.py <model_dir>", file=sys.stderr)
        return

    model_dir = sys.argv[1]
    try:
        predictor = LandmarkPredictor(model_dir)
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to init predictor: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return

    print("READY", file=sys.stderr, flush=True)
    
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            data = json.loads(line)
            req_id = data.get("id")
            itype = data.get("type", "video")
            ipath = data.get("data")
            
            if not ipath or not os.path.exists(ipath):
                print(json.dumps({"id": req_id, "success": False, "error": "File not found"}), file=sys.stderr, flush=True)
                continue
                
            result = predictor.predict(ipath, itype)
            result["id"] = req_id
            print(json.dumps(result), file=sys.stderr, flush=True)
            
        except Exception as e:
            print(json.dumps({"id": req_id, "success": False, "error": str(e)}), file=sys.stderr, flush=True)
            traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    main()
