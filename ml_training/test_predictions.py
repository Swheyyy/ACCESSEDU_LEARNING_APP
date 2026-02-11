"""
Test script to verify model predictions are working correctly
"""
import os
import sys
import numpy as np
import cv2
from inference import SignLanguagePredictorAPI

# Model directory
model_dir = r"d:\AccessEduUISign\ml_training\output\models\cnn_lstm_mobilenetv2_20260208_000056"

print("="*60)
print("TESTING SIGN LANGUAGE MODEL PREDICTIONS")
print("="*60)

# Initialize API
print("\n1. Loading model...")
try:
    api = SignLanguagePredictorAPI(model_dir)
    print("✓ Model loaded successfully!")
except Exception as e:
    print(f"✗ Failed to load model: {e}")
    sys.exit(1)

# Test with random noise images (should give different predictions)
print("\n2. Testing with random noise images...")
print("   (Each should give different predictions if model is working)")

for i in range(5):
    # Create random noise image
    noise_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    
    # Save temporarily
    temp_path = f"temp_test_{i}.jpg"
    cv2.imwrite(temp_path, noise_img)
    
    # Predict
    try:
        result = api.predict({
            'type': 'image',
            'data': temp_path
        })
        
        if result.get('success'):
            top_pred = result['top_prediction']
            print(f"   Test {i+1}: {top_pred['text']} ({top_pred['confidence']:.2%})")
        else:
            print(f"   Test {i+1}: ERROR - {result.get('error')}")
    except Exception as e:
        print(f"   Test {i+1}: EXCEPTION - {e}")
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

# Test with black image
print("\n3. Testing with solid black image...")
black_img = np.zeros((480, 640, 3), dtype=np.uint8)
cv2.imwrite("temp_black.jpg", black_img)

try:
    result = api.predict({
        'type': 'image',
        'data': 'temp_black.jpg'
    })
    
    if result.get('success'):
        print(f"   Prediction: {result['top_prediction']['text']} ({result['top_prediction']['confidence']:.2%})")
        print(f"   All predictions:")
        for pred in result['predictions']:
            print(f"     - {pred['text']}: {pred['confidence']:.2%}")
    else:
        print(f"   ERROR: {result.get('error')}")
except Exception as e:
    print(f"   EXCEPTION: {e}")
finally:
    if os.path.exists("temp_black.jpg"):
        os.remove("temp_black.jpg")

# Test with white image
print("\n4. Testing with solid white image...")
white_img = np.ones((480, 640, 3), dtype=np.uint8) * 255
cv2.imwrite("temp_white.jpg", white_img)

try:
    result = api.predict({
        'type': 'image',
        'data': 'temp_white.jpg'
    })
    
    if result.get('success'):
        print(f"   Prediction: {result['top_prediction']['text']} ({result['top_prediction']['confidence']:.2%})")
        print(f"   All predictions:")
        for pred in result['predictions']:
            print(f"     - {pred['text']}: {pred['confidence']:.2%}")
    else:
        print(f"   ERROR: {result.get('error')}")
except Exception as e:
    print(f"   EXCEPTION: {e}")
finally:
    if os.path.exists("temp_white.jpg"):
        os.remove("temp_white.jpg")

print("\n" + "="*60)
print("ANALYSIS:")
print("="*60)
print("If all predictions are 'candy' or the same word, the model is stuck.")
print("If predictions vary, the model is working correctly.")
print("Low confidence (<50%) is expected for random noise images.")
print("="*60)
