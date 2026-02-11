
import os
import tensorflow as tf
from tensorflow import keras
import numpy as np

model_path = r"d:\AccessEduUISign\wlasl_dataset\asl_hand_model.h5"

if not os.path.exists(model_path):
    print(f"Model not found at {model_path}")
else:
    print(f"Loading model from {model_path}...")
    try:
        model = keras.models.load_model(model_path)
        print("Model loaded successfully.")
        print("\nModel Summary:")
        model.summary()
        
        print("\nInput shape:", model.input_shape)
        print("Output shape:", model.output_shape)
        
        # Try to find class names if they are embedded or in a separate file
        class_list_path = r"d:\AccessEduUISign\wlasl_dataset\wlasl_class_list.txt"
        if os.path.exists(class_list_path):
            with open(class_list_path, 'r') as f:
                classes = f.readlines()
            print(f"\nNumber of classes in wlasl_class_list.txt: {len(classes)}")
    except Exception as e:
        print(f"Error loading model: {e}")
