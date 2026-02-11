"""
Inference module for real-time sign language recognition
"""
import os
import json
import numpy as np
import cv2
import tensorflow as tf
from tensorflow import keras
from typing import List, Tuple, Dict, Optional
import mediapipe as mp


class SignLanguagePredictor:
    """Real-time sign language recognition predictor"""
    
    def __init__(self, model_path: str, metadata_path: str):
        """
        Initialize predictor
        
        Args:
            model_path: Path to trained model (.h5 file)
            metadata_path: Path to model metadata (.json file)
        """
        # Load model
        self.model = keras.models.load_model(model_path)
        
        # Load metadata
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        self.num_classes = self.metadata['num_classes']
        self.sequence_length = self.metadata['sequence_length']
        self.img_size = self.metadata['img_size']
        self.idx_to_class = {int(k): v for k, v in self.metadata['idx_to_class'].items()}
        
        # Initialize MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Frame buffer for real-time prediction
        self.frame_buffer = []
        
        print(f"Model loaded: {self.metadata['model_type']}")
        print(f"Classes: {self.num_classes}")
        print(f"Sequence length: {self.sequence_length}")
    
    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Preprocess a single frame
        
        Args:
            frame: Input frame (BGR format from OpenCV)
            
        Returns:
            Preprocessed frame
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Resize
        frame_resized = cv2.resize(frame_rgb, (self.img_size, self.img_size))
        
        # Normalize
        frame_normalized = frame_resized.astype(np.float32) / 255.0
        
        return frame_normalized
    
    def predict_from_frames(self, frames: List[np.ndarray], top_k: int = 3) -> List[Tuple[str, float]]:
        """
        Predict from a sequence of frames
        
        Args:
            frames: List of frames (numpy arrays)
            top_k: Number of top predictions to return
            
        Returns:
            List of (class_name, confidence) tuples
        """
        if len(frames) != self.sequence_length:
            # Resample frames to match sequence length
            indices = np.linspace(0, len(frames) - 1, self.sequence_length, dtype=int)
            frames = [frames[i] for i in indices]
        
        # Preprocess frames
        processed_frames = [self.preprocess_frame(frame) for frame in frames]
        
        # Create batch
        batch = np.array([processed_frames])
        
        # Predict
        predictions = self.model.predict(batch, verbose=0)[0]
        
        # Debug logging
        max_prob = np.max(predictions)
        max_idx = np.argmax(predictions)
        print(f"[INFERENCE] Max probability: {max_prob:.4f} for class {max_idx}: {self.idx_to_class.get(max_idx, 'UNKNOWN')}", flush=True)
        
        # Get top K predictions
        top_indices = np.argsort(predictions)[-top_k:][::-1]
        results = [
            (self.idx_to_class[idx], float(predictions[idx]))
            for idx in top_indices
        ]
        
        print(f"[INFERENCE] Top {top_k} predictions: {results}", flush=True)
        
        return results
    
    def predict_from_video(self, video_path: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """
        Predict from a video file
        
        Args:
            video_path: Path to video file
            top_k: Number of top predictions to return
            
        Returns:
            List of (class_name, confidence) tuples
        """
        cap = cv2.VideoCapture(video_path)
        frames = []
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        
        cap.release()
        
        if not frames:
            return []
        
        return self.predict_from_frames(frames, top_k)
    
    def predict_from_image(self, image_path: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """
        Predict from a single image (duplicated to create sequence)
        
        Args:
            image_path: Path to image file
            top_k: Number of top predictions to return
            
        Returns:
            List of (class_name, confidence) tuples
        """
        frame = cv2.imread(image_path)
        if frame is None:
            return []
        
        # Duplicate frame to create sequence
        frames = [frame] * self.sequence_length
        
        return self.predict_from_frames(frames, top_k)
    
    def add_frame_realtime(self, frame: np.ndarray) -> Optional[List[Tuple[str, float]]]:
        """
        Add frame to buffer for real-time prediction
        
        Args:
            frame: Input frame
            
        Returns:
            Predictions if buffer is full, None otherwise
        """
        self.frame_buffer.append(frame)
        
        # Keep only last sequence_length frames
        if len(self.frame_buffer) > self.sequence_length:
            self.frame_buffer.pop(0)
        
        # Predict when buffer is full
        if len(self.frame_buffer) == self.sequence_length:
            return self.predict_from_frames(self.frame_buffer, top_k=3)
        
        return None
    
    def reset_buffer(self):
        """Reset frame buffer"""
        self.frame_buffer = []
    
    def __del__(self):
        if hasattr(self, 'hands'):
            self.hands.close()


class SignLanguagePredictorAPI:
    """API wrapper for sign language prediction"""
    
    def __init__(self, model_dir: str):
        """
        Initialize API
        
        Args:
            model_dir: Directory containing model files
        """
        model_path = os.path.join(model_dir, 'final_model.h5')
        metadata_path = os.path.join(model_dir, 'metadata.json')
        
        if not os.path.exists(model_path):
            model_path = os.path.join(model_dir, 'best_model.h5')
        
        if not os.path.exists(model_path) or not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Model files not found in {model_dir}")
        
        self.predictor = SignLanguagePredictor(model_path, metadata_path)
    
    def predict(self, input_data: Dict) -> Dict:
        """
        Predict sign language from input
        
        Args:
            input_data: Dictionary with 'type' and 'data' keys
                type: 'video', 'image', or 'frames'
                data: path to file or list of frames
                
        Returns:
            Dictionary with predictions and metadata
        """
        input_type = input_data.get('type')
        data = input_data.get('data')
        
        if input_type == 'video':
            predictions = self.predictor.predict_from_video(data, top_k=3)
        elif input_type == 'image':
            predictions = self.predictor.predict_from_image(data, top_k=3)
        elif input_type == 'frames':
            predictions = self.predictor.predict_from_frames(data, top_k=3)
        else:
            return {'error': 'Invalid input type'}
        
        if not predictions:
            return {'error': 'No predictions generated'}
        
        # Format response
        response = {
            'success': True,
            'predictions': [
                {
                    'text': pred[0],
                    'confidence': pred[1]
                }
                for pred in predictions
            ],
            'top_prediction': {
                'text': predictions[0][0],
                'confidence': predictions[0][1]
            }
        }
        
        return response


if __name__ == "__main__":
    # Test inference
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python inference.py <model_dir> <video_path>")
        sys.exit(1)
    
    model_dir = sys.argv[1]
    video_path = sys.argv[2]
    
    # Create predictor
    api = SignLanguagePredictorAPI(model_dir)
    
    # Predict
    result = api.predict({
        'type': 'video',
        'data': video_path
    })
    
    print("\nPrediction Results:")
    print("=" * 50)
    if result.get('success'):
        print(f"\nTop Prediction: {result['top_prediction']['text']}")
        print(f"Confidence: {result['top_prediction']['confidence']:.2%}")
        print("\nAll Predictions:")
        for i, pred in enumerate(result['predictions'], 1):
            print(f"{i}. {pred['text']}: {pred['confidence']:.2%}")
    else:
        print(f"Error: {result.get('error')}")
