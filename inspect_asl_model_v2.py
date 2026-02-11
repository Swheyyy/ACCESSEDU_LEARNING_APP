
import os
import tensorflow as tf
from tensorflow import keras
import numpy as np
import sys

model_path = r"d:\AccessEduUISign\wlasl_dataset\asl_hand_model.h5"

def check():
    if not os.path.exists(model_path):
        print(f"MISSING: {model_path}")
        return
        
    print(f"LOADING: {model_path}")
    try:
        model = keras.models.load_model(model_path, compile=False)
        print("SUCCESS")
        
        print(f"INPUT_SHAPE: {model.input_shape}")
        print(f"OUTPUT_SHAPE: {model.output_shape}")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check()
