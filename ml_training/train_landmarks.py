
import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow import keras
from datetime import datetime
import json
import pickle

# Add parent dir to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import *
from models import SignLanguageModel, compile_model
from data_preprocessing import WLASLDatasetLoader

def train_landmark_model(num_classes=100):
    """Train a model using landmark sequences"""
    print(f"Training Landmark Model for {num_classes} classes...")
    
    loader = WLASLDatasetLoader(VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE)
    
    landmarks_dir = os.path.join(DATASET_DIR, 'landmark_sequences')
    if not os.path.exists(landmarks_dir):
        print("Landmarks directory not found!")
        return
        
    # Load data
    X = []
    y = []
    
    files = [f for f in os.listdir(landmarks_dir) if f.endswith('.npy')]
    print(f"Found {len(files)} landmark sequences.")
    
    for f in files:
        video_id = f.replace('.npy', '')
        if video_id in loader.video_labels:
            label = loader.video_labels[video_id]
            if label < num_classes:
                data = np.load(os.path.join(landmarks_dir, f))
                X.append(data)
                y.append(label)
                
    X = np.array(X)
    y = np.array(y)
    
    if len(X) == 0:
        print("No training data found for these classes!")
        return
        
    print(f"Dataset shape: X={X.shape}, y={y.shape}")
    
    # Split
    indices = np.arange(len(X))
    np.random.shuffle(indices)
    split = int(0.8 * len(X))
    train_idx, val_idx = indices[:split], indices[split:]
    
    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]
    
    # Create model
    model = SignLanguageModel.create_landmark_model(
        sequence_length=64,
        num_classes=num_classes
    )
    
    model = compile_model(model, learning_rate=0.001)
    
    print("\nTraining...")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=20,
        batch_size=32,
        verbose=1
    )
    
    # Save
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_path = os.path.join(MODELS_DIR, f"landmark_model_{num_classes}_{timestamp}")
    os.makedirs(save_path, exist_ok=True)
    model.save(os.path.join(save_path, 'model.h5'))
    
    # Create metadata
    idx_to_class = loader.idx_to_class
    class_to_idx = loader.class_to_idx
    metadata = {
        'num_classes': num_classes,
        'sequence_length': 64,
        'idx_to_class': {k: idx_to_class[k] for k in range(num_classes)},
        'classes': [idx_to_class[k] for k in range(num_classes)]
    }
    with open(os.path.join(save_path, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nModel saved to {save_path}")
    return save_path

if __name__ == "__main__":
    train_landmark_model(num_classes=50) # Start small for testing
