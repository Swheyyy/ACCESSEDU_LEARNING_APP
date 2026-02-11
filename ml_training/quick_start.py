"""
Quick start script for training sign language recognition model
"""
import os
import sys

def check_requirements():
    """Check if all requirements are installed"""
    print("Checking requirements...")
    
    try:
        import tensorflow as tf
        print(f"✓ TensorFlow {tf.__version__}")
    except ImportError:
        print("✗ TensorFlow not found. Install with: pip install tensorflow")
        return False
    
    try:
        import cv2
        print(f"✓ OpenCV {cv2.__version__}")
    except ImportError:
        print("✗ OpenCV not found. Install with: pip install opencv-python")
        return False
    
    try:
        import mediapipe as mp
        print(f"✓ MediaPipe {mp.__version__}")
    except ImportError:
        print("✗ MediaPipe not found. Install with: pip install mediapipe")
        return False
    
    try:
        import numpy as np
        print(f"✓ NumPy {np.__version__}")
    except ImportError:
        print("✗ NumPy not found. Install with: pip install numpy")
        return False
    
    return True

def check_dataset():
    """Check if dataset exists"""
    print("\nChecking dataset...")
    
    from config import VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE
    
    if not os.path.exists(VIDEOS_DIR):
        print(f"✗ Videos directory not found: {VIDEOS_DIR}")
        return False
    
    if not os.path.exists(LABELS_FILE):
        print(f"✗ Labels file not found: {LABELS_FILE}")
        return False
    
    if not os.path.exists(CLASS_LIST_FILE):
        print(f"✗ Class list file not found: {CLASS_LIST_FILE}")
        return False
    
    # Count videos
    video_count = len([f for f in os.listdir(VIDEOS_DIR) if f.endswith('.mp4')])
    print(f"✓ Found {video_count} videos")
    print(f"✓ Labels file: {LABELS_FILE}")
    print(f"✓ Class list file: {CLASS_LIST_FILE}")
    
    return True

def check_gpu():
    """Check GPU availability"""
    print("\nChecking GPU...")
    
    import tensorflow as tf
    
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f"✓ Found {len(gpus)} GPU(s)")
        for gpu in gpus:
            print(f"  - {gpu.name}")
        return True
    else:
        print("⚠ No GPU found. Training will use CPU (slower)")
        return False

def main():
    """Main quick start function"""
    print("=" * 80)
    print("SIGN LANGUAGE RECOGNITION - QUICK START")
    print("=" * 80)
    
    # Check requirements
    if not check_requirements():
        print("\n✗ Please install missing requirements:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    
    # Check dataset
    if not check_dataset():
        print("\n✗ Dataset not found or incomplete")
        print("  Please ensure the WLASL dataset is in the correct location")
        sys.exit(1)
    
    # Check GPU
    has_gpu = check_gpu()
    
    # Ask user to proceed
    print("\n" + "=" * 80)
    print("READY TO START TRAINING")
    print("=" * 80)
    
    from config import NUM_CLASSES, EPOCHS, BATCH_SIZE, MODEL_TYPE, CNN_BACKBONE
    
    print(f"\nTraining Configuration:")
    print(f"  - Number of classes: {NUM_CLASSES}")
    print(f"  - Epochs: {EPOCHS}")
    print(f"  - Batch size: {BATCH_SIZE}")
    print(f"  - Model type: {MODEL_TYPE}")
    print(f"  - CNN backbone: {CNN_BACKBONE}")
    print(f"  - Device: {'GPU' if has_gpu else 'CPU'}")
    
    if not has_gpu:
        print("\n⚠ WARNING: Training on CPU will be very slow!")
        print("  Consider using Google Colab or a machine with GPU")
    
    response = input("\nDo you want to start training? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        print("\n" + "=" * 80)
        print("STARTING TRAINING...")
        print("=" * 80)
        
        # Import and run training
        from train import train_model
        
        try:
            model, history, metadata = train_model()
            
            print("\n" + "=" * 80)
            print("✓ TRAINING COMPLETED SUCCESSFULLY!")
            print("=" * 80)
            print(f"\nModel accuracy: {metadata['test_accuracy']:.2%}")
            print(f"Top-3 accuracy: {metadata['test_top3_accuracy']:.2%}")
            
        except Exception as e:
            print(f"\n✗ Training failed with error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    else:
        print("\nTraining cancelled.")
        sys.exit(0)

if __name__ == "__main__":
    main()
