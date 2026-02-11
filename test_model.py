
import os
import json
import tensorflow as tf
from tensorflow import keras
import mediapipe as mp
import numpy as np

model_dir = r"d:\AccessEduUISign\ml_training\output\models\cnn_lstm_mobilenetv2_20260208_000056"
model_path = os.path.join(model_dir, 'final_model.h5')
metadata_path = os.path.join(model_dir, 'metadata.json')

print("Loading model...")
model = keras.models.load_model(model_path)
print("Model loaded.")

with open(metadata_path, 'r') as f:
    metadata = json.load(f)
print(f"Metadata loaded. Num classes: {metadata['num_classes']}")

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True)
print("MediaPipe initialized.")

# Dummy prediction
dummy_frame = np.zeros((224, 224, 3), dtype=np.uint8)
# Preprocess
p = dummy_frame.astype(np.float32) / 255.0
batch = np.array([[p] * 30])
print("Running dummy prediction...")
pred = model.predict(batch, verbose=0)
print("Prediction success!")
print(f"Result shape: {pred.shape}")
