import tensorflow as tf
from tensorflow import keras
import json

try:
    model_path = r"d:\AccessEduUISign\wlasl_dataset\asl_hand_model.h5"
    model = keras.models.load_model(model_path)
    print("Model loaded successfully!")
    print(f"Input shape: {model.input_shape}")
    print(f"Output shape: {model.output_shape}")
    model.summary()
except Exception as e:
    print(f"Failed to load model: {e}")
