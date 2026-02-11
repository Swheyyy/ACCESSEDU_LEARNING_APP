import tensorflow as tf
from tensorflow import keras
import numpy as np
import os
import json

model_path = r"d:\AccessEduUISign\wlasl_dataset\asl_hand_model.h5"
if not os.path.exists(model_path):
    print(f"Model not found at {model_path}")
    exit()

model = keras.models.load_model(model_path)
print("Model loaded.")
print(f"Input shape: {model.input_shape}")
print(f"Output shape: {model.output_shape}")

# Create dummy input based on shape
input_shape = model.input_shape[1:]
dummy_input = np.random.random((1, *input_shape)).astype(np.float32)

prediction = model.predict(dummy_input)
print(f"Prediction success. Output max: {np.max(prediction)}")
print(f"Output argmax: {np.argmax(prediction)}")
