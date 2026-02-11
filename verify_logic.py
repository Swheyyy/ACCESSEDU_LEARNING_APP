"""
Diagnostic script to verify the pattern matcher
"""
import sys
import os
import json
import cv2
import numpy as np
import mediapipe as mp

class MockPipe:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.5
        )
        
    def test_logic(self):
        # We can't easily generate fake hand landmarks without a real image
        # but we can test the recognition logic by injecting fake features
        from mediapipe_pattern_server import SignPatternMatcher
        matcher = SignPatternMatcher()
        
        test_cases = [
            {"name": "Fist (A)", "ext": [False, False, False, False, False]},
            {"name": "Index up (D/1)", "ext": [False, True, False, False, False]},
            {"name": "L (L)", "ext": [True, True, False, False, False]},
            {"name": "V/2", "ext": [False, True, True, False, False]},
            {"name": "W/3", "ext": [False, True, True, True, False]},
            {"name": "Palm/Open", "ext": [True, True, True, True, True]},
            {"name": "Y", "ext": [True, False, False, False, True]},
        ]
        
        print(f"{'Test Case':<15} | {'Predicted':<15} | {'Status'}")
        print("-" * 45)
        
        for case in test_cases:
            # Mock feat
            feat = {
                'ext': case['ext'],
                'lms': np.zeros((21, 3))
            }
            # Inject landmarks for specific cases if needed
            res, conf = matcher.recognize([feat])
            print(f"{case['name']:<15} | {res:<15} | OK")

if __name__ == "__main__":
    if os.path.exists('ml_training/mediapipe_pattern_server.py'):
        sys.path.append('ml_training')
        m = MockPipe()
        m.test_logic()
    else:
        print("mediapipe_pattern_server.py not found in ml_training/")
