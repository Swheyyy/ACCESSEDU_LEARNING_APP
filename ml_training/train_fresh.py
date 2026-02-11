"""
Simple training script that forces fresh data preprocessing
"""
import os
import sys

# Delete cached data to force fresh preprocessing
cached_file = 'output/processed_data/processed_data.pkl'
if os.path.exists(cached_file):
    os.remove(cached_file)
    print(f"Deleted cached file: {cached_file}")

# Delete individual features directory
import shutil
features_dir = 'output/processed_data/individual_features'
if os.path.exists(features_dir):
    shutil.rmtree(features_dir)
    os.makedirs(features_dir)
    print(f"Cleared individual features directory: {features_dir}")

# Now run the training
from train import train_model

print("\n" + "="*80)
print("STARTING TRAINING WITH FRESH DATA PREPROCESSING")
print("="*80 + "\n")

try:
    model, history, metadata = train_model()
    
    print("\n" + "="*80)
    print("✓ TRAINING COMPLETED SUCCESSFULLY!")
    print("="*80)
    print(f"\nModel accuracy: {metadata['test_accuracy']:.2%}")
    print(f"Top-3 accuracy: {metadata['test_top3_accuracy']:.2%}")
    
except Exception as e:
    print(f"\n✗ Training failed with error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
