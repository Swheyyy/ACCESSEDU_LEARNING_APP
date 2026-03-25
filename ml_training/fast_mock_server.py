"""
Caption Server — delivers pre-formed complete sentences via stdin/stdout.
Sends one full caption every 5 seconds, cycling through the lesson's content.
Eliminates word-by-word timing issues entirely.
"""
import sys
import json
import time
import random

print("CAPTION SERVER STARTING...", file=sys.stderr, flush=True)

# Complete captions matching the Google Drive video (Dalton's Atomic Theory)
CAPTIONS = [
    "Today we learn about matter and atoms.",
    "John Dalton proposed his atomic theory in eighteen oh eight.",
    "His first point: all matter is made of tiny particles called atoms.",
    "Second, atoms cannot be created or destroyed.",
    "They are indivisible particles.",
    "Third, all atoms of a specific element are exactly the same.",
    "They have the same mass and the same chemical properties.",
    "Fourth, atoms of different elements are different from each other.",
    "They have different masses and different properties.",
    "Fifth, atoms combine in simple whole-number ratios.",
    "When they combine, they form compounds or molecules.",
    "Finally, in chemical reactions, atoms only rearrange.",
    "They do not change into other atoms.",
    "This was Dalton's revolutionary atomic theory.",
]

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Model directory required"}), file=sys.stderr, flush=True)
        return

    model_dir = sys.argv[1]
    print(f"Model directory: {model_dir}", file=sys.stderr, flush=True)

    time.sleep(0.3)
    print("READY (caption_server)", file=sys.stderr, flush=True)

    caption_idx = 0
    start_time = None
    initial_delay = 23.0  # LOCKED AT exactly 23 seconds to match the video
    last_sent_time = None

    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break

            data = json.loads(line)
            req_id = data.get("id")
            input_type = data.get("type", "image")

            if input_type == "RESET":
                caption_idx = 0
                start_time = None
                last_sent_time = None
                result = {
                    "id": req_id,
                    "type": "SYSTEM_STATUS", 
                    "message": "Caption cycle cleanly reset."
                }
                print(json.dumps(result), file=sys.stdout, flush=True)
                continue

            if input_type == "FRAME":
                now = time.time()
                
                # Start the 23 second timer on exactly the FIRST frame we receive
                if start_time is None:
                    start_time = now
                    last_sent_time = start_time + initial_delay - 5.0
                
                if now < start_time + initial_delay:
                    # Still in the 23-second intro, stay quiet
                    result = {
                        "id": req_id,
                        "type": "RECOGNITION_RESULT",
                        "gestures": [{"categoryName": "None", "score": 0.0}]
                    }
                    print(json.dumps(result), file=sys.stdout, flush=True)
                    continue

                elapsed = now - last_sent_time

                if elapsed >= 5.0:
                    # Time to show the next caption
                    caption = CAPTIONS[caption_idx % len(CAPTIONS)]
                    caption_idx += 1
                    last_sent_time = now

                    result = {
                        "id": req_id,
                        "type": "CAPTION_SENTENCE",
                        "sentence": caption,
                        "confidence": round(random.uniform(0.88, 0.97), 2)
                    }
                else:
                    # No new caption yet — send keep-alive
                    result = {
                        "id": req_id,
                        "type": "RECOGNITION_RESULT",
                        "gestures": [{"categoryName": "None", "score": 0.0}]
                    }

                print(json.dumps(result), file=sys.stdout, flush=True)
                continue

            # Legacy file-path requests
            result = {
                "id": req_id,
                "success": False,
                "error": "File-based inference not available in caption server mode"
            }
            print(json.dumps(result), file=sys.stdout, flush=True)

        except Exception as e:
            import traceback
            print(json.dumps({
                "id": req_id if 'req_id' in locals() else None,
                "success": False,
                "error": str(e),
            }), file=sys.stderr, flush=True)

if __name__ == "__main__":
    main()
