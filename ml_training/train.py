"""
Main training script for sign language recognition model
"""
import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow import keras
from datetime import datetime
import json
import pickle
from typing import Tuple, List

# Import custom modules
from config import *
from data_preprocessing import WLASLDatasetLoader, create_data_generators
from models import SignLanguageModel, compile_model


class DataGenerator(keras.utils.Sequence):
    """Custom data generator for efficient batch loading"""
    
    def __init__(self, features_list, labels_list, indices, batch_size=16, shuffle=True, augment=False):
        self.features_list = features_list
        self.labels_list = labels_list
        self.indices = indices
        self.batch_size = batch_size
        self.shuffle = shuffle
        self.augment = augment
        self.on_epoch_end()
    
    def __len__(self):
        return int(np.ceil(len(self.indices) / self.batch_size))
    
    def __getitem__(self, index):
        batch_indices = self.indices[index * self.batch_size:(index + 1) * self.batch_size]
        X, y = self.__data_generation(batch_indices)
        return X, y
    
    def on_epoch_end(self):
        if self.shuffle:
            np.random.shuffle(self.indices)
    
    def __data_generation(self, batch_indices):
        X_batch = []
        y_batch = []
        
        for idx in batch_indices:
            feature_data = self.features_list[idx]
            label = self.labels_list[idx]
            
            # Load from disk if it's a metadata dict
            if isinstance(feature_data, dict) and 'feature_path' in feature_data:
                with open(feature_data['feature_path'], 'rb') as f:
                    features = pickle.load(f)
            else:
                features = feature_data
            
            # Get frames
            frames = features['frames'].astype(np.float32) / 255.0
            
            # Apply augmentation if needed
            if self.augment:
                frames = self.augment_frames(frames)
            
            X_batch.append(frames)
            y_batch.append(label)
        
        return np.array(X_batch), np.array(y_batch)
    
    def augment_frames(self, frames):
        """Apply random augmentations to frames"""
        # Random brightness
        if np.random.random() > 0.5:
            factor = np.random.uniform(0.8, 1.2)
            frames = np.clip(frames * factor, 0, 1)
        
        # Random horizontal flip
        if np.random.random() > 0.5:
            frames = np.flip(frames, axis=2)
        
        return frames


def create_callbacks(model_name: str) -> List[keras.callbacks.Callback]:
    """Create training callbacks"""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_path = os.path.join(MODELS_DIR, f"{model_name}_{timestamp}")
    os.makedirs(model_path, exist_ok=True)
    
    callbacks = [
        # Model checkpoint
        keras.callbacks.ModelCheckpoint(
            filepath=os.path.join(model_path, 'best_model.h5'),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        
        # Early stopping
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=EARLY_STOPPING_PATIENCE,
            restore_best_weights=True,
            verbose=1
        ),
        
        # Reduce learning rate
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=REDUCE_LR_PATIENCE,
            min_lr=MIN_LR,
            verbose=1
        ),
        
        # TensorBoard
        keras.callbacks.TensorBoard(
            log_dir=os.path.join(LOGS_DIR, f"{model_name}_{timestamp}"),
            histogram_freq=1,
            write_graph=True
        ),
        
        # CSV Logger
        keras.callbacks.CSVLogger(
            filename=os.path.join(model_path, 'training_log.csv'),
            separator=',',
            append=False
        )
    ]
    
    return callbacks, model_path


def train_model():
    """Main training function"""
    
    print("=" * 80)
    print("SIGN LANGUAGE RECOGNITION MODEL TRAINING")
    print("=" * 80)
    
    # Step 1: Load or preprocess data
    processed_data_path = os.path.join(PROCESSED_DATA_DIR, 'processed_data.pkl')
    
    if os.path.exists(processed_data_path):
        print("\nLoading preprocessed data...")
        loader = WLASLDatasetLoader(VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE)
        features_list, labels_list, class_to_idx, idx_to_class = loader.load_processed_data(processed_data_path)
    else:
        print("\nPreprocessing dataset...")
        loader = WLASLDatasetLoader(VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE)
        features_list, labels_list = loader.load_dataset(num_frames=SEQUENCE_LENGTH)
        loader.save_processed_data(features_list, labels_list, processed_data_path)
        class_to_idx = loader.class_to_idx
        idx_to_class = loader.idx_to_class
    
    print(f"\nDataset loaded: {len(features_list)} samples, {len(set(labels_list))} classes")
    
    # Step 2: Create data splits
    train_idx, val_idx, test_idx, num_classes, filtered_features, filtered_labels, model_idx_to_orig_idx = create_data_generators(
        features_list, labels_list, BATCH_SIZE, TRAIN_SPLIT, VAL_SPLIT
    )
    
    # Step 3: Create data generators
    train_gen = DataGenerator(filtered_features, filtered_labels, train_idx, BATCH_SIZE, shuffle=True, augment=AUGMENT_DATA)
    val_gen = DataGenerator(filtered_features, filtered_labels, val_idx, BATCH_SIZE, shuffle=False, augment=False)
    test_gen = DataGenerator(filtered_features, filtered_labels, test_idx, BATCH_SIZE, shuffle=False, augment=False)
    
    # Step 4: Create model
    print("\nCreating model...")
    input_shape = (SEQUENCE_LENGTH, IMG_SIZE, IMG_SIZE, 3)
    
    if MODEL_TYPE == 'cnn_lstm':
        model = SignLanguageModel.create_cnn_lstm_model(
            input_shape=input_shape,
            num_classes=num_classes,
            lstm_units=LSTM_UNITS,
            dropout_rate=DROPOUT_RATE,
            cnn_backbone=CNN_BACKBONE
        )
    elif MODEL_TYPE == '3dcnn':
        model = SignLanguageModel.create_3dcnn_model(
            input_shape=input_shape,
            num_classes=num_classes,
            dropout_rate=DROPOUT_RATE
        )
    else:
        raise ValueError(f"Unknown model type: {MODEL_TYPE}")
    
    model = compile_model(model, LEARNING_RATE, USE_MIXED_PRECISION)
    
    print("\nModel Summary:")
    model.summary()
    print(f"\nTotal parameters: {model.count_params():,}")
    
    # Step 5: Create callbacks
    callbacks, model_path = create_callbacks(f"{MODEL_TYPE}_{CNN_BACKBONE}")
    
    # Step 6: Train model
    print("\n" + "=" * 80)
    print("STARTING TRAINING")
    print("=" * 80)
    
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1
    )
    
    # Step 7: Evaluate on test set
    print("\n" + "=" * 80)
    print("EVALUATING ON TEST SET")
    print("=" * 80)
    
    test_results = model.evaluate(test_gen, verbose=1)
    print(f"\nTest Loss: {test_results[0]:.4f}")
    print(f"Test Accuracy: {test_results[1]:.4f}")
    print(f"Test Top-3 Accuracy: {test_results[2]:.4f}")
    
    # Step 8: Save final model and metadata
    final_model_path = os.path.join(model_path, 'final_model.h5')
    model.save(final_model_path)
    
    # Create final idx_to_class that maps model outputs (0, 1, 2...) to original class names
    final_idx_to_class = {
        model_idx: idx_to_class[orig_idx] 
        for model_idx, orig_idx in model_idx_to_orig_idx.items()
    }
    
    # Save model metadata
    metadata = {
        'model_type': MODEL_TYPE,
        'cnn_backbone': CNN_BACKBONE,
        'num_classes': num_classes,
        'sequence_length': SEQUENCE_LENGTH,
        'img_size': IMG_SIZE,
        'class_to_idx': {v: k for k, v in final_idx_to_class.items()},
        'idx_to_class': final_idx_to_class,
        'test_accuracy': float(test_results[1]),
        'test_top3_accuracy': float(test_results[2]),
        'training_samples': len(train_idx),
        'validation_samples': len(val_idx),
        'test_samples': len(test_idx)
    }
    
    metadata_path = os.path.join(model_path, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✓ Model saved to: {final_model_path}")
    print(f"✓ Metadata saved to: {metadata_path}")
    
    # Step 9: Save training history
    history_path = os.path.join(model_path, 'history.pkl')
    with open(history_path, 'wb') as f:
        pickle.dump(history.history, f)
    
    print("\n" + "=" * 80)
    print("TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    
    return model, history, metadata


if __name__ == "__main__":
    # Set GPU memory growth
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"Found {len(gpus)} GPU(s)")
        except RuntimeError as e:
            print(e)
    else:
        print("No GPU found, using CPU")
    
    # Run training
    model, history, metadata = train_model()
