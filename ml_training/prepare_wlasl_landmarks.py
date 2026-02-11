
import os
import sys
import numpy as np
import cv2
import mediapipe as mp
import json
from tqdm import tqdm
import pickle

# Add parent dir to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data_preprocessing import VideoProcessor, WLASLDatasetLoader
from config import *

def prepare_landmarks(max_videos=None):
    """Extract landmarks for WLASL videos and save to landmark_sequences directory"""
    print("Preparing WLASL Landmark Sequences...")
    
    loader = WLASLDatasetLoader(VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE)
    processor = VideoProcessor(use_mediapipe=True)
    
    video_labels = loader.video_labels
    video_ids = list(video_labels.keys())
    
    if max_videos:
        video_ids = video_ids[:max_videos]
        
    landmarks_dir = os.path.join(DATASET_DIR, 'landmark_sequences')
    os.makedirs(landmarks_dir, exist_ok=True)
    
    count = 0
    for video_id in tqdm(video_ids):
        video_path = loader.get_video_path(video_id)
        if not os.path.exists(video_path):
            continue
            
        output_path = os.path.join(landmarks_dir, f"{video_id}.npy")
        if os.path.exists(output_path):
            continue
            
        try:
            # Extract 64 frames to match asl_hand_model.h5 expectation
            frames = processor.extract_frames(video_path, num_frames=64)
            if frames is not None:
                landmarks = processor.extract_hand_landmarks(frames)
                if landmarks is not None:
                    # landmarks shape: (64, 63)
                    np.save(output_path, landmarks)
                    count += 1
        except Exception as e:
            print(f"Error processing {video_id}: {e}")
            
    print(f"Extraction complete. Saved {count} landmark sequences.")

if __name__ == "__main__":
    # For proof of concept, process a few videos
    prepare_landmarks(max_videos=100)
