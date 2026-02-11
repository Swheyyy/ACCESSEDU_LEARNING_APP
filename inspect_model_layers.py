
import os
import tensorflow as tf
from tensorflow import keras
import sys

model_path = r"d:\AccessEduUISign\wlasl_dataset\asl_hand_model.h5"

def check():
    try:
        model = keras.models.load_model(model_path, compile=False)
        model.summary()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
