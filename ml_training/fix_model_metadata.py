"""
Fix model metadata to ensure correct class mappings
"""
import json
import os

model_dir = r"d:\AccessEduUISign\ml_training\output\models\cnn_lstm_mobilenetv2_20260208_000056"
metadata_path = os.path.join(model_dir, 'metadata.json')

print("Loading metadata...")
with open(metadata_path, 'r') as f:
    metadata = json.load(f)

print(f"Current num_classes: {metadata['num_classes']}")
print(f"Current class_to_idx entries: {len(metadata['class_to_idx'])}")
print(f"Current idx_to_class entries: {len(metadata['idx_to_class'])}")

# Verify the mappings are consistent
class_to_idx = metadata['class_to_idx']
idx_to_class = metadata['idx_to_class']

# Check for inconsistencies
print("\nChecking for inconsistencies...")
for word, idx in class_to_idx.items():
    if str(idx) not in idx_to_class:
        print(f"ERROR: {word} -> {idx} not in idx_to_class")
    elif idx_to_class[str(idx)] != word:
        print(f"ERROR: Mismatch for {word}: idx_to_class[{idx}] = {idx_to_class[str(idx)]}")

# Update num_classes to match actual number of classes
actual_num_classes = len(class_to_idx)
metadata['num_classes'] = actual_num_classes

print(f"\nUpdated num_classes to: {actual_num_classes}")

# Save updated metadata
backup_path = os.path.join(model_dir, 'metadata_backup.json')
print(f"\nBacking up original metadata to: {backup_path}")
with open(backup_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"Saving updated metadata to: {metadata_path}")
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print("\nMetadata fixed successfully!")
print(f"Total classes: {actual_num_classes}")
print(f"Sequence length: {metadata['sequence_length']}")
print(f"Image size: {metadata['img_size']}")
