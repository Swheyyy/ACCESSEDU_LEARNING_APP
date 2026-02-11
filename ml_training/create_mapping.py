import json
import os

def create_mapping():
    base_dir = ".."
    dataset_dir = os.path.join(base_dir, "wlasl_dataset")
    json_path = os.path.join(dataset_dir, "WLASL_v0.3.json")
    video_dir = os.path.join(dataset_dir, "videos")
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)
    
    mapping = {}
    found_videos = set(os.listdir(video_dir)) if os.path.exists(video_dir) else set()
    
    for entry in data:
        gloss = entry['gloss'].lower()
        # Pick the first instance that exists on disk
        for instance in entry['instances']:
            video_id = instance['video_id']
            if f"{video_id}.mp4" in found_videos:
                mapping[gloss] = video_id
                break
    
    output_path = "word_video_map.json"
    with open(output_path, 'w') as f:
        json.dump(mapping, f, indent=4)
    
    print(f"Success! Created mapping with {len(mapping)} words.")
    print(f"File saved to: {os.path.abspath(output_path)}")

if __name__ == "__main__":
    create_mapping()
