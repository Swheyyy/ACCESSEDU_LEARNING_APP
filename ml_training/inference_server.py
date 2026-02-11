
import sys
print("PYTHON SCRIPT LOADED - BEFORE IMPORTS", file=sys.stderr, flush=True)
import os
import json
import time
print("PYTHON SCRIPT LOADED - AFTER CORE IMPORTS", file=sys.stderr, flush=True)

def main():
    print("PYTHON SCRIPT STARTING MAIN", file=sys.stderr, flush=True)
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Model directory required"}), file=sys.stderr, flush=True)
        return

    model_dir = sys.argv[1]
    
    # Import heavy stuff late
    print("PYTHON SCRIPT LOADING ML LIBS...", file=sys.stderr, flush=True)
    from inference import SignLanguagePredictorAPI
    print("PYTHON SCRIPT ML LIBS LOADED", file=sys.stderr, flush=True)
    
    try:
        # Load model once
        api = SignLanguagePredictorAPI(model_dir)
        print("READY", file=sys.stderr, flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr, flush=True)
        return

    # Loop for requests
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            data = json.loads(line)
            req_id = data.get("id")
            input_type = data.get("type")
            input_path = data.get("data")
            
            if not input_path or not os.path.exists(input_path):
                print(json.dumps({"id": req_id, "error": f"File not found: {input_path}"}), file=sys.stderr, flush=True)
                continue
                
            result = api.predict({"type": input_type, "data": input_path})
            result["id"] = req_id
            print(json.dumps(result), file=sys.stderr, flush=True)
            
        except Exception as e:
            print(json.dumps({"id": req_id, "error": str(e)}), file=sys.stderr, flush=True)

if __name__ == "__main__":
    main()
