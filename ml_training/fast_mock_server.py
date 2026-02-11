"""
Fast Mock Inference Server - Returns diverse predictions instantly
This is a temporary solution while the real model is being improved
"""
import sys
import os
import json
import time
import random

print("FAST MOCK INFERENCE SERVER STARTING...", file=sys.stderr, flush=True)

# Common sign language words with realistic confidence scores
SIGN_WORDS = [
    "hello", "thank you", "please", "yes", "no", "good", "help",
    "sorry", "welcome", "friend", "love", "family", "work", "school",
    "eat", "drink", "water", "food", "book", "read", "write",
    "happy", "sad", "tired", "sick", "good morning", "good night",
    "how are you", "nice to meet you", "see you later", "goodbye"
]

def get_mock_prediction():
    """Generate a realistic mock prediction"""
    # Pick a random word
    word = random.choice(SIGN_WORDS)
    # Generate realistic confidence (60-95%)
    confidence = random.uniform(0.60, 0.95)
    
    # Generate top 3 predictions
    predictions = []
    used_words = set()
    
    for i in range(3):
        if i == 0:
            predictions.append({"text": word, "confidence": confidence})
            used_words.add(word)
        else:
            # Pick different words for other predictions
            other_word = random.choice([w for w in SIGN_WORDS if w not in used_words])
            other_conf = confidence * random.uniform(0.5, 0.8)
            predictions.append({"text": other_word, "confidence": other_conf})
            used_words.add(other_word)
    
    return predictions

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Model directory required"}), file=sys.stderr, flush=True)
        return

    model_dir = sys.argv[1]
    print(f"Model directory: {model_dir}", file=sys.stderr, flush=True)
    print("Using FAST MOCK predictor for instant responses", file=sys.stderr, flush=True)
    
    # Simulate quick loading
    time.sleep(0.5)
    print("READY (using fast_mock)", file=sys.stderr, flush=True)
    
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
            
            # Simulate very fast processing (50-200ms)
            time.sleep(random.uniform(0.05, 0.2))
            
            # Generate mock prediction
            predictions = get_mock_prediction()
            
            result = {
                "id": req_id,
                "success": True,
                "predictions": predictions,
                "top_prediction": predictions[0],
                "predictor": "fast_mock",
                "note": "Using mock predictor - replace with real model for production"
            }
            
            print(json.dumps(result), file=sys.stderr, flush=True)
            
        except Exception as e:
            import traceback
            error_result = {
                "id": req_id if 'req_id' in locals() else None,
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            print(json.dumps(error_result), file=sys.stderr, flush=True)

if __name__ == "__main__":
    main()
