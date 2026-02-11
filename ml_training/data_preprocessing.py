"""
Data preprocessing utilities for WLASL dataset
Handles video loading, frame extraction, and feature extraction
"""
import os
import json
import cv2
import numpy as np
import mediapipe as mp
from typing import List, Tuple, Dict, Optional
from tqdm import tqdm
import pickle

class VideoProcessor:
    """Process videos and extract features"""
    
    def __init__(self, use_mediapipe=True):
        self.use_mediapipe = use_mediapipe
        if use_mediapipe:
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
    
    def extract_frames(self, video_path: str, num_frames: int = 30) -> Optional[np.ndarray]:
        """
        Extract fixed number of frames from video
        
        Args:
            video_path: Path to video file
            num_frames: Number of frames to extract
            
        Returns:
            numpy array of shape (num_frames, height, width, 3) or None if failed
        """
        if not os.path.exists(video_path):
            print(f"Video not found: {video_path}")
            return None
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Cannot open video: {video_path}")
            return None
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames == 0:
            cap.release()
            return None
        
        # Sample frames uniformly
        frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
        frames = []
        
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                # Resize frame
                frame = cv2.resize(frame, (224, 224))
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame)
            else:
                # If frame read fails, use last valid frame or black frame
                if frames:
                    frames.append(frames[-1])
                else:
                    frames.append(np.zeros((224, 224, 3), dtype=np.uint8))
        
        cap.release()
        return np.array(frames)
    
    def extract_hand_landmarks(self, frames: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract MediaPipe hand landmarks from frames
        
        Args:
            frames: numpy array of shape (num_frames, height, width, 3)
            
        Returns:
            numpy array of shape (num_frames, num_landmarks * 3) or None
        """
        if not self.use_mediapipe:
            return None
        
        landmarks_sequence = []
        
        for frame in frames:
            results = self.hands.process(frame)
            
            if results.multi_hand_landmarks:
                # Get first hand (or combine both hands)
                hand_landmarks = results.multi_hand_landmarks[0]
                landmarks = []
                for landmark in hand_landmarks.landmark:
                    landmarks.extend([landmark.x, landmark.y, landmark.z])
                landmarks_sequence.append(landmarks)
            else:
                # No hand detected, use zeros
                landmarks_sequence.append([0.0] * (21 * 3))
        
        return np.array(landmarks_sequence)
    
    def process_video(self, video_path: str, num_frames: int = 30) -> Dict:
        """
        Process a single video and extract all features
        
        Args:
            video_path: Path to video file
            num_frames: Number of frames to extract
            
        Returns:
            Dictionary with 'frames' and optionally 'landmarks'
        """
        frames = self.extract_frames(video_path, num_frames)
        if frames is None:
            return None
        
        result = {'frames': frames}
        
        if self.use_mediapipe:
            landmarks = self.extract_hand_landmarks(frames)
            if landmarks is not None:
                result['landmarks'] = landmarks
        
        return result
    
    def __del__(self):
        if hasattr(self, 'hands'):
            self.hands.close()


class WLASLDatasetLoader:
    """Load and preprocess WLASL dataset"""
    
    def __init__(self, videos_dir: str, labels_file: str, class_list_file: str):
        self.videos_dir = videos_dir
        self.labels_file = labels_file
        self.class_list_file = class_list_file
        self.processor = VideoProcessor(use_mediapipe=True)
        
        # Load class mappings
        self.class_to_idx, self.idx_to_class = self.load_class_mappings()
        
        # Load video labels
        self.video_labels = self.load_labels()
    
    def load_class_mappings(self) -> Tuple[Dict, Dict]:
        """Load class name to index mappings"""
        class_to_idx = {}
        idx_to_class = {}
        
        with open(self.class_list_file, 'r') as f:
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) == 2:
                    idx, class_name = parts
                    idx = int(idx)
                    class_to_idx[class_name] = idx
                    idx_to_class[idx] = class_name
        
        return class_to_idx, idx_to_class
    
    def load_labels(self) -> Dict:
        """Load video labels from JSON file"""
        with open(self.labels_file, 'r') as f:
            data = json.load(f)
        
        video_labels = {}
        
        # Check if data is a list (WLASL_v0.3.json format) or a dict (nslt_100.json format)
        if isinstance(data, list):
            # Format: list of [{'gloss': 'word', 'instances': [{'video_id': 'id', ...}, ...]}, ...]
            print(f"Detected list-based WLASL format (Full Dataset)")
            for entry in data:
                gloss = entry['gloss'].lower() # Ensure lowercase matching
                if gloss in self.class_to_idx:
                    class_idx = self.class_to_idx[gloss]
                    for instance in entry.get('instances', []):
                        video_id = instance['video_id']
                        video_labels[video_id] = class_idx
        else:
            # Format: video_id -> {'subset': 'train/val/test', 'action': [class_idx, instance, total]}
            print(f"Detected dict-based WLASL format (Subset)")
            for video_id, info in data.items():
                if 'action' in info and isinstance(info['action'], list) and len(info['action']) > 0:
                    # action[0] is the class index
                    class_idx = info['action'][0]
                    if class_idx < len(self.idx_to_class):
                        video_labels[video_id] = class_idx
        
        return video_labels
    
    def get_video_path(self, video_id: str) -> str:
        """Get full path to video file"""
        return os.path.join(self.videos_dir, f"{video_id}.mp4")
    
    def load_dataset(self, num_frames: int = 30, max_videos: Optional[int] = None) -> Tuple[List, List]:
        """
        Load entire dataset by saving features to disk (memory-efficient)
        
        Args:
            num_frames: Number of frames per video
            max_videos: Maximum number of videos to load (for testing)
            
        Returns:
            Tuple of (features_metadata_list, labels_list)
            Each element in features_metadata_list is a dict with {'feature_path': path}
        """
        from config import PROCESSED_FEATURES_DIR
        
        features_metadata = []
        labels_list = []
        
        video_ids = list(self.video_labels.keys())
        if max_videos:
            video_ids = video_ids[:max_videos]
        
        print(f"Total video IDs in labels: {len(video_ids)}")
        
        # Check which videos actually exist
        existing_videos = []
        for video_id in video_ids:
            video_path = self.get_video_path(video_id)
            if os.path.exists(video_path):
                existing_videos.append(video_id)
        
        print(f"Videos that exist on disk: {len(existing_videos)}")
        
        if len(existing_videos) == 0:
            return [], []
        
        print(f"Processing and saving {len(existing_videos)} videos to disk...")
        
        for video_id in tqdm(existing_videos):
            video_path = self.get_video_path(video_id)
            
            # Use try-except to handle corrupted video files without crashing
            try:
                features = self.processor.process_video(video_path, num_frames)
                if features is not None:
                    # Save individual feature to disk
                    feature_filename = f"{video_id}_features.pkl"
                    feature_path = os.path.join(PROCESSED_FEATURES_DIR, feature_filename)
                    
                    with open(feature_path, 'wb') as f:
                        pickle.dump(features, f)
                    
                    features_metadata.append({'feature_path': feature_path})
                    labels_list.append(self.video_labels[video_id])
            except Exception as e:
                # Silently skip corrupted videos but keep going
                continue
        
        print(f"Successfully processed {len(features_metadata)} videos")
        return features_metadata, labels_list

    def save_processed_data(self, features_list: List, labels_list: List, output_path: str):
        """Save dataset metadata to disk"""
        data = {
            'features_metadata': features_list, # Now contains paths
            'labels': labels_list,
            'class_to_idx': self.class_to_idx,
            'idx_to_class': self.idx_to_class
        }
        
        with open(output_path, 'wb') as f:
            pickle.dump(data, f)
        
        print(f"Saved dataset metadata to {output_path}")
    
    def load_processed_data(self, input_path: str) -> Tuple[List, List, Dict, Dict]:
        """Load dataset metadata from disk"""
        with open(input_path, 'rb') as f:
            data = pickle.load(f)
        
        # Backwards compatibility check
        features = data.get('features_metadata', data.get('features'))
        
        return (
            features,
            data['labels'],
            data['class_to_idx'],
            data['idx_to_class']
        )


def create_data_generators(features_list, labels_list, batch_size=16, train_split=0.7, val_split=0.15):
    """
    Create train/val/test data generators
    
    Args:
        features_list: List of feature dictionaries
        labels_list: List of labels
        batch_size: Batch size
        train_split: Training set proportion
        val_split: Validation set proportion
        
    Returns:
        Tuple of (train_idx, val_idx, test_idx, num_classes, filtered_features, filtered_labels)
    """
    from sklearn.model_selection import train_test_split
    from collections import Counter
    
    # 1. Count samples per class
    counts = Counter(labels_list)
    
    # 2. Filter out classes with fewer than 5 samples (safer for train/val/test split)
    min_samples = 5
    valid_classes = [cls for cls, count in counts.items() if count >= min_samples]
    
    print(f"Original: {len(set(labels_list))} classes")
    print(f"After filtering (<{min_samples} samples): {len(valid_classes)} classes")
    
    filtered_indices = [i for i, lbl in enumerate(labels_list) if lbl in valid_classes]
    
    filtered_features = [features_list[i] for i in filtered_indices]
    filtered_labels_orig = [labels_list[i] for i in filtered_indices]
    
    # 3. Re-map labels to continuous indices (0 to num_classes-1)
    unique_labels = sorted(list(set(filtered_labels_orig)))
    label_map = {old_lbl: new_idx for new_idx, old_lbl in enumerate(unique_labels)}
    filtered_labels = [label_map[lbl] for lbl in filtered_labels_orig]
    
    num_samples = len(filtered_labels)
    num_classes = len(unique_labels)
    
    if num_samples == 0:
        raise ValueError(f"No samples left after filtering classes with <{min_samples} samples!")
    
    # 4. Split data
    indices = np.arange(num_samples)
    
    # Split: Train vs (Val + Test)
    train_idx, temp_idx = train_test_split(
        indices, 
        train_size=train_split, 
        random_state=42, 
        stratify=filtered_labels
    )
    
    # Check if we can stratify the second split
    temp_labels = [filtered_labels[i] for i in temp_idx]
    temp_counts = Counter(temp_labels)
    can_stratify_temp = all(count >= 2 for count in temp_counts.values())
    
    # Split: Val vs Test
    val_size_relative = val_split / (1 - train_split)
    if can_stratify_temp:
        val_idx, test_idx = train_test_split(
            temp_idx, 
            train_size=val_size_relative, 
            random_state=42, 
            stratify=temp_labels
        )
    else:
        print("Warning: Cannot stratify validation/test split due to small class sizes. Falling back to random split.")
        val_idx, test_idx = train_test_split(
            temp_idx, 
            train_size=val_size_relative, 
            random_state=42
        )

    
    print(f"Dataset split: Train={len(train_idx)}, Val={len(val_idx)}, Test={len(test_idx)}")
    
    # Create the mapping between model indices and original class names/indices
    model_idx_to_orig_idx = {new_idx: int(old_lbl) for old_lbl, new_idx in label_map.items()}
    
    return train_idx, val_idx, test_idx, num_classes, filtered_features, filtered_labels, model_idx_to_orig_idx


if __name__ == "__main__":
    # Test data loading
    from config import VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE, PROCESSED_DATA_DIR, SEQUENCE_LENGTH
    
    loader = WLASLDatasetLoader(VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE)
    
    # Load small subset for testing
    features, labels = loader.load_dataset(num_frames=SEQUENCE_LENGTH, max_videos=10)
    
    print(f"Loaded {len(features)} samples")
    if features:
        print(f"Sample feature keys: {features[0].keys()}")
        print(f"Frame shape: {features[0]['frames'].shape}")
        if 'landmarks' in features[0]:
            print(f"Landmarks shape: {features[0]['landmarks'].shape}")
