
import os
import json
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import mediapipe as mp
import random

# Configuration
WLASL_JSON_PATH = r"d:\AccessEduUISign\wlasl_dataset\WLASL_v0.3.json"
VIDEOS_DIR = r"d:\AccessEduUISign\wlasl_dataset\videos"
METADATA_PATH = r"d:\AccessEduUISign\ml_training\output\models\cnn_lstm_mobilenetv2_20260208_000056\metadata.json"
OUTPUT_MODEL_DIR = r"d:\AccessEduUISign\ml_training\output\models\fast_lstm"
SEQUENCE_LENGTH = 30
NUM_LANDMARKS = 21 * 3 # 21 points, x,y,z

# Ensure output directory
os.makedirs(OUTPUT_MODEL_DIR, exist_ok=True)

# 1. Load Target Classes
print("Loading target classes...")
with open(METADATA_PATH, "r") as f:
    target_metadata = json.load(f)
    target_classes = list(target_metadata["class_to_idx"].keys())
    # Ensure consistent ordering
    target_classes.sort()
    class_to_idx = {cls: i for i, cls in enumerate(target_classes)}

print(f"Targeting {len(target_classes)} classes.")

# 2. Map Classes to Video Files
print("Mapping videos...")
with open(WLASL_JSON_PATH, "r") as f:
    wlasl_data = json.load(f)

video_map = {} # video_path -> class_idx
files_found = 0

for entry in wlasl_data:
    gloss = entry["gloss"]
    if gloss in class_to_idx:
        cls_idx = class_to_idx[gloss]
        for instance in entry["instances"]:
            video_id = instance["video_id"]
            video_path = os.path.join(VIDEOS_DIR, f"{video_id}.mp4")
            if os.path.exists(video_path):
                video_map[video_path] = cls_idx
                files_found += 1

print(f"Found {files_found} video files for training.")

# 3. Extract Landmarks
print("Initializing MediaPipe...")
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1, # Assume dominant hand for simplicity in this fast fix
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

X_data = []
y_data = []

print("Extracting landmarks (this may take a few minutes)...")
processed_count = 0
videos = list(video_map.items())
# Limit to max 15 samples per class to stay within 60s processing if possible given the user's urgency
# Actually, let's process as much as we can but maybe shuffle to get balanced data if we cut off.
# For now, simplistic loop.

for video_path, label in videos:
    cap = cv2.VideoCapture(video_path)
    frames_landmarks = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert to RGB
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)
        
        if results.multi_hand_landmarks:
            # Get first hand
            hand_landmarks = results.multi_hand_landmarks[0]
            row = []
            for lm in hand_landmarks.landmark:
                row.extend([lm.x, lm.y, lm.z])
            frames_landmarks.append(row)
        else:
            # If no hand detected, use zeros or skip? 
            # For robustness, let's append zeros if we have previous data, or skip frame
            if frames_landmarks:
                frames_landmarks.append(frames_landmarks[-1]) # Copy last
            else:
                frames_landmarks.append([0.0] * NUM_LANDMARKS)
    
    cap.release()
    
    if len(frames_landmarks) > 5: # Need at least some frames
        # Resample to SEQUENCE_LENGTH
        if len(frames_landmarks) != SEQUENCE_LENGTH:
            indices = np.linspace(0, len(frames_landmarks) - 1, SEQUENCE_LENGTH, dtype=int)
            resampled = [frames_landmarks[i] for i in indices]
        else:
            resampled = frames_landmarks
            
        X_data.append(resampled)
        y_data.append(label)
        processed_count += 1
        if processed_count % 50 == 0:
            print(f"Processed {processed_count}/{len(videos)}")

hands.close()

X = np.array(X_data)
y = np.array(y_data)

print(f"Training data shape: X={X.shape}, y={y.shape}")

# 4. Train Model
if len(X) == 0:
    print("ERROR: No data extracted!")
    exit(1)

model = Sequential([
    LSTM(64, input_shape=(SEQUENCE_LENGTH, NUM_LANDMARKS), return_sequences=False),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(len(target_classes), activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

print("Training model...")
model.fit(X, y, epochs=50, batch_size=32, validation_split=0.2, verbose=1)

# 5. Save Artifacts
print("Saving model...")
model.save(os.path.join(OUTPUT_MODEL_DIR, "fast_model.h5"))

metadata = {
    "model_type": "lstm_landmarks",
    "classes": target_classes,
    "sequence_length": SEQUENCE_LENGTH,
    "num_landmarks": NUM_LANDMARKS
}

with open(os.path.join(OUTPUT_MODEL_DIR, "metadata.json"), "w") as f:
    json.dump(metadata, f)

print("DONE! Fast model created.")
