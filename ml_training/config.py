"""
Configuration file for sign language recognition model training
"""
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, 'wlasl_dataset')
VIDEOS_DIR = os.path.join(DATASET_DIR, 'videos')
LABELS_FILE = os.path.join(DATASET_DIR, 'WLASL_v0.3.json') # Start with 100 classes
CLASS_LIST_FILE = os.path.join(DATASET_DIR, 'wlasl_class_list.txt')
PRETRAINED_MODEL = os.path.join(DATASET_DIR, 'asl_hand_model.h5')

# Output paths
OUTPUT_DIR = os.path.join(BASE_DIR, 'ml_training', 'output')
MODELS_DIR = os.path.join(OUTPUT_DIR, 'models')
LOGS_DIR = os.path.join(OUTPUT_DIR, 'logs')
PROCESSED_DATA_DIR = os.path.join(OUTPUT_DIR, 'processed_data')
PROCESSED_FEATURES_DIR = os.path.join(PROCESSED_DATA_DIR, 'individual_features')
CHECKPOINTS_DIR = os.path.join(OUTPUT_DIR, 'checkpoints')

# Create directories
for dir_path in [OUTPUT_DIR, MODELS_DIR, LOGS_DIR, PROCESSED_DATA_DIR, PROCESSED_FEATURES_DIR, CHECKPOINTS_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# Model hyperparameters
NUM_CLASSES = 100  # Start with 100 classes, can scale to 300, 1000, 2000
SEQUENCE_LENGTH = 30  # Number of frames per video
IMG_SIZE = 224  # Image size for CNN input
BATCH_SIZE = 16
EPOCHS = 50
LEARNING_RATE = 0.001

# Data split
TRAIN_SPLIT = 0.7
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15

# Feature extraction
USE_MEDIAPIPE = True  # Use MediaPipe for hand landmark detection
USE_OPTICAL_FLOW = False  # Use optical flow features
NUM_HAND_LANDMARKS = 21  # MediaPipe hand landmarks
LANDMARK_DIM = 3  # x, y, z coordinates

# Augmentation
AUGMENT_DATA = True
AUGMENTATION_FACTOR = 2  # Number of augmented versions per video

# Model architecture
MODEL_TYPE = 'cnn_lstm'  # Options: 'cnn_lstm', '3dcnn', 'transformer'
CNN_BACKBONE = 'mobilenetv2'  # Options: 'mobilenetv2', 'efficientnetb0', 'resnet50'
LSTM_UNITS = 256
DROPOUT_RATE = 0.5

# Training
USE_MIXED_PRECISION = True
EARLY_STOPPING_PATIENCE = 10
REDUCE_LR_PATIENCE = 5
MIN_LR = 1e-7

# Inference
CONFIDENCE_THRESHOLD = 0.7  # Minimum confidence for predictions
TOP_K_PREDICTIONS = 3  # Return top K predictions
