"""
Quick diagnostic test for model predictions
"""
import os
import sys
import numpy as np
import json

# Add ml_training to path
sys.path.insert(0, r"d:\AccessEduUISign\ml_training")

from inference import SignLanguagePredictor

model_dir = r"d:\AccessEduUISign\ml_training\output\models\cnn_lstm_mobilenetv2_20260208_000056"
model_path = os.path.join(model_dir, 'final_model.h5')
metadata_path = os.path.join(model_dir, 'metadata.json')

print("Loading model...")
predictor = SignLanguagePredictor(model_path, metadata_path)

print(f"\nModel Info:")
print(f"  Classes: {predictor.num_classes}")
print(f"  Sequence Length: {predictor.sequence_length}")
print(f"  Image Size: {predictor.img_size}")

# Create a dummy sequence of frames
print(f"\nCreating dummy frames...")
dummy_frames = []
for i in range(predictor.sequence_length):
    # Random noise frame
    frame = np.random.randint(0, 255, (640, 480, 3), dtype=np.uint8)
    dummy_frames.append(frame)

print(f"Making prediction...")
results = predictor.predict_from_frames(dummy_frames, top_k=5)

print(f"\nTop 5 Predictions:")
for i, (text, conf) in enumerate(results, 1):
    print(f"  {i}. {text}: {conf:.4f} ({conf*100:.2f}%)")

print("\nDone!")
