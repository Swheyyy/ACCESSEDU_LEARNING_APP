
import json
import os
import sys
import numpy as np

# Mocking modules for testing
class MockMP:
    class solutions:
        class hands:
            class Hands:
                def __init__(self, **kwargs): pass
                def process(self, frame): 
                    class Results:
                        multi_hand_landmarks = []
                        multi_handedness = []
                    return Results()

# Inject mock
sys.modules['mediapipe'] = MockMP

from ml_training.mediapipe_pattern_server import SignPatternMatcher

def test():
    matcher = SignPatternMatcher()
    # Mock some hand features
    # ext: [thumb, index, middle, ring, pinky]
    hands = [
        {
            'ext': [True, True, False, False, False], # L shape
            'lms': np.zeros((21, 3)),
            'pos': np.array([0.5, 0.5, 0]),
            'type': 'Right'
        }
    ]
    
    res, conf = matcher.recognize_single_frame(hands)
    print(f"Single Frame Test (L shape): {res} ({conf})")
    
    # Mock sequence for "Thank You" (Downwards movement)
    seq = []
    for i in range(10):
        y = 0.5 + (i * 0.01) # moving down
        seq.append([{
            'ext': [False, True, True, True, True],
            'lms': np.zeros((21, 3)),
            'pos': np.array([0.5, y, 0]),
            'type': 'Right'
        }])
        
    res, conf = matcher.recognize(seq)
    print(f"Sequence Test (Thank You): {res} ({conf})")

if __name__ == "__main__":
    test()
