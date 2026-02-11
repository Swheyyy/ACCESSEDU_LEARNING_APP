"""
Hybrid Inference Server - Uses both CNN-LSTM and MediaPipe approaches
Automatically falls back to faster MediaPipe if CNN-LSTM is too slow or unavailable
"""
import sys
import os
import json
import time
import traceback

print("HYBRID INFERENCE SERVER STARTING...", file=sys.stderr, flush=True)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Model directory required"}), file=sys.stderr, flush=True)
        return

    model_dir = sys.argv[1]
    use_mediapipe = len(sys.argv) > 2 and sys.argv[2] == "--mediapipe"
    
    print(f"Model directory: {model_dir}", file=sys.stderr, flush=True)
    print(f"Use MediaPipe: {use_mediapipe}", file=sys.stderr, flush=True)
    
    # Import heavy libraries
    print("Loading ML libraries...", file=sys.stderr, flush=True)
    
    predictor = None
    predictor_type = "none"
    
    if use_mediapipe:
        try:
            from mediapipe_inference import MediaPipeSignPredictor
            predictor = MediaPipeSignPredictor()
            predictor_type = "mediapipe"
            print("MediaPipe predictor loaded", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"Failed to load MediaPipe predictor: {e}", file=sys.stderr, flush=True)
            traceback.print_exc(file=sys.stderr)
    
    # Try to load CNN-LSTM model if MediaPipe failed or not requested
    if predictor is None:
        try:
            from inference import SignLanguagePredictorAPI
            predictor = SignLanguagePredictorAPI(model_dir)
            predictor_type = "cnn_lstm"
            print("CNN-LSTM predictor loaded", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"Failed to load CNN-LSTM predictor: {e}", file=sys.stderr, flush=True)
            traceback.print_exc(file=sys.stderr)
    
    if predictor is None:
        print(json.dumps({"error": "No predictor could be loaded"}), file=sys.stderr, flush=True)
        return
    
    print(f"READY (using {predictor_type})", file=sys.stderr, flush=True)
    
    # Process requests
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            data = json.loads(line)
            req_id = data.get("id")
            input_type = data.get("type", "image")
            input_path = data.get("data")
            
            if not input_path or not os.path.exists(input_path):
                result = {
                    "id": req_id,
                    "success": False,
                    "error": f"File not found: {input_path}"
                }
                print(json.dumps(result), file=sys.stderr, flush=True)
                continue
            
            # Make prediction
            start_time = time.time()
            
            if predictor_type == "mediapipe":
                # MediaPipe approach
                import cv2
                import numpy as np
                
                if input_type == "video":
                    # Read video frames
                    cap = cv2.VideoCapture(input_path)
                    frames = []
                    while len(frames) < 30:  # Limit to 30 frames
                        ret, frame = cap.read()
                        if not ret:
                            break
                        frames.append(frame)
                    cap.release()
                else:
                    # Read single image
                    frame = cv2.imread(input_path)
                    frames = [frame] * 10  # Duplicate for sequence
                
                predictions = predictor.predict_from_frames(frames, top_k=3)
                
                result = {
                    "id": req_id,
                    "success": True,
                    "predictions": [
                        {"text": text, "confidence": conf}
                        for text, conf in predictions
                    ],
                    "top_prediction": {
                        "text": predictions[0][0],
                        "confidence": predictions[0][1]
                    },
                    "predictor": predictor_type,
                    "inference_time": time.time() - start_time
                }
            else:
                # CNN-LSTM approach
                pred_result = predictor.predict({
                    "type": input_type,
                    "data": input_path
                })
                
                if pred_result.get("success"):
                    result = {
                        "id": req_id,
                        **pred_result,
                        "predictor": predictor_type,
                        "inference_time": time.time() - start_time
                    }
                else:
                    result = {
                        "id": req_id,
                        "success": False,
                        "error": pred_result.get("error", "Unknown error"),
                        "predictor": predictor_type
                    }
            
            print(json.dumps(result), file=sys.stderr, flush=True)
            
        except Exception as e:
            error_result = {
                "id": req_id if 'req_id' in locals() else None,
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            print(json.dumps(error_result), file=sys.stderr, flush=True)

if __name__ == "__main__":
    main()
