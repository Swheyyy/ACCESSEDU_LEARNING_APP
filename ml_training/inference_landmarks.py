"""
Inference module for real-time sign language recognition using Landmarks (Fast Model)
"""
import os
import json
import numpy as np
import cv2
import tensorflow as tf
from tensorflow import keras
from typing import List, Tuple, Dict, Optional
import mediapipe as mp

class SignLanguageLandmarkPredictor:
    """Real-time sign language recognition predictor using Landmarks"""
    
    def __init__(self, model_dir: str):
        """
        Initialize predictor
        
        Args:
            model_dir: Directory containing fast_model.h5 and metadata.json
        """
        model_path = os.path.join(model_dir, 'fast_model.h5')
        metadata_path = os.path.join(model_dir, 'metadata.json')
        
        if not os.path.exists(model_path) or not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Model files not found in {model_dir}")
            
        # Load model
        self.model = keras.models.load_model(model_path)
        
        # Load metadata
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        self.classes = self.metadata['classes']
        self.sequence_length = self.metadata['sequence_length']
        self.num_landmarks = self.metadata['num_landmarks'] # 63
        
        # Initialize MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        print(f"Landmark Model loaded. Classes: {len(self.classes)}")
    
    def extract_landmarks(self, frame: np.ndarray) -> List[float]:
        """
        Extract landmarks from a single frame using MediaPipe
        """
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)
        
        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]
            row = []
            for lm in hand_landmarks.landmark:
                row.extend([lm.x, lm.y, lm.z])
            return row
        return [0.0] * self.num_landmarks

    def predict(self, input_data: Dict) -> Dict:
        """
        Predict from video/image input
        """
        input_type = input_data.get('type')
        data_path = input_data.get('data')
        
        frames = []
        if input_type == 'video':
            cap = cv2.VideoCapture(data_path)
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                frames.append(frame)
            cap.release()
        elif input_type == 'image':
            frame = cv2.imread(data_path)
            if frame is not None:
                # Repeat image to fill sequence
                frames = [frame] * self.sequence_length
        else:
            return {'error': 'Invalid input type'}
            
        if not frames:
            return {'error': 'No frames to process'}
            
        # Extract landmarks for all frames
        sequences = []
        for frame in frames:
            lm = self.extract_landmarks(frame)
            sequences.append(lm)
            
        # Pad or truncate to sequence length
        if len(sequences) < self.sequence_length:
            # Pad with last frame or zeros
            last = sequences[-1] if sequences else [0.0]*self.num_landmarks
            sequences += [last] * (self.sequence_length - len(sequences))
        else:
            # Resample equally
            indices = np.linspace(0, len(sequences) - 1, self.sequence_length, dtype=int)
            sequences = [sequences[i] for i in indices]
            
        # Predict
        input_seq = np.array([sequences])
        prediction = self.model.predict(input_seq, verbose=0)[0]
        
        # Get top results
        top_indices = np.argsort(prediction)[-3:][::-1]
        results = [
            {
                'text': self.classes[i],
                'confidence': float(prediction[i])
            }
            for i in top_indices
        ]
        
        return {
            'success': True,
            'top_prediction': results[0],
            'predictions': results
        }

if __name__ == "__main__":
    import sys
    # Simple CLI test
    if len(sys.argv) > 2:
        model_dir = sys.argv[1]
        file_path = sys.argv[2]
        predictor = SignLanguageLandmarkPredictor(model_dir)
        print(json.dumps(predictor.predict({'type': 'video', 'data': file_path})))
