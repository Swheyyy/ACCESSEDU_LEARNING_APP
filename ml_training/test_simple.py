import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from data_preprocessing import WLASLDatasetLoader
from config import VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE, SEQUENCE_LENGTH

print("Testing data loader...")
print(f"Videos dir: {VIDEOS_DIR}")
print(f"Labels file: {LABELS_FILE}")

loader = WLASLDatasetLoader(VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE)
print(f"\nLoaded {len(loader.video_labels)} video labels from JSON")
print(f"Number of unique classes: {len(set(loader.video_labels.values()))}")

# Try loading just 5 videos
print("\nAttempting to load 5 videos...")
features, labels = loader.load_dataset(num_frames=SEQUENCE_LENGTH, max_videos=5)

print(f"\nResult: {len(features)} videos successfully loaded")
if features:
    print(f"Sample feature shape: {features[0]['frames'].shape}")
    print(f"Sample label: {labels[0]}")
else:
    print("No videos were loaded!")
