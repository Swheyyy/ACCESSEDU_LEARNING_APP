# Sign Language Recognition ML Training Pipeline

## Overview
This directory contains a complete machine learning pipeline for training a sign language recognition model using the WLASL (Word-Level American Sign Language) dataset.

## Features
- ✅ **Multiple Model Architectures**: CNN-LSTM, 3D CNN, Landmark-based, and Multimodal models
- ✅ **Transfer Learning**: Uses pre-trained ImageNet weights (MobileNetV2, EfficientNet, ResNet50)
- ✅ **MediaPipe Integration**: Hand landmark detection for enhanced accuracy
- ✅ **Data Augmentation**: Automatic augmentation for better generalization
- ✅ **Real-time Inference**: Optimized for webcam and video processing
- ✅ **Production Ready**: Complete API for integration with web applications

## Dataset
The WLASL dataset contains:
- **5,041 videos** of sign language gestures
- **2,000 classes** (words/phrases)
- Multiple difficulty levels: 100, 300, 1000, 2000 classes

## Project Structure
```
ml_training/
├── config.py                 # Configuration and hyperparameters
├── data_preprocessing.py     # Data loading and preprocessing
├── models.py                 # Model architectures
├── train.py                  # Training script
├── inference.py              # Inference and prediction
├── requirements.txt          # Python dependencies
├── README.md                 # This file
└── output/                   # Training outputs
    ├── models/               # Saved models
    ├── logs/                 # TensorBoard logs
    ├── processed_data/       # Preprocessed data cache
    └── checkpoints/          # Training checkpoints
```

## Installation

### 1. Install Python Dependencies
```bash
cd ml_training
pip install -r requirements.txt
```

### 2. Verify Dataset
Ensure the WLASL dataset is in the correct location:
```
wlasl_dataset/
├── videos/                   # Video files
├── nslt_100.json            # Labels for 100 classes
├── nslt_300.json            # Labels for 300 classes
├── nslt_1000.json           # Labels for 1000 classes
├── nslt_2000.json           # Labels for 2000 classes
├── wlasl_class_list.txt     # Class mappings
└── asl_hand_model.h5        # Pre-trained hand model (optional)
```

## Training

### Quick Start (100 Classes)
```bash
python train.py
```

This will:
1. Load and preprocess the dataset (100 classes by default)
2. Split data into train/val/test sets (70/15/15)
3. Train a CNN-LSTM model with MobileNetV2 backbone
4. Save the best model and training logs


### Custom Training
Edit `config.py` to customize:
- `NUM_CLASSES`: 100, 300, 1000, or 2000
- `MODEL_TYPE`: 'cnn_lstm', '3dcnn', or 'transformer'
- `CNN_BACKBONE`: 'mobilenetv2', 'efficientnetb0', or 'resnet50'
- `EPOCHS`: Number of training epochs
- `BATCH_SIZE`: Batch size
- `LEARNING_RATE`: Initial learning rate

### Training on GPU
The training script automatically detects and uses GPU if available:
```bash
# Check GPU availability
python -c "import tensorflow as tf; print('GPUs:', tf.config.list_physical_devices('GPU'))"

# Train with GPU
python train.py
```

### Monitor Training
Use TensorBoard to monitor training progress:
```bash
tensorboard --logdir=output/logs
```

## Model Performance Targets

| Model | Classes | Expected Accuracy | Training Time (GPU) |
|-------|---------|-------------------|---------------------|
| CNN-LSTM (MobileNetV2) | 100 | 85-90% | 2-3 hours |
| CNN-LSTM (MobileNetV2) | 300 | 75-85% | 4-6 hours |
| CNN-LSTM (ResNet50) | 100 | 90-95% | 4-5 hours |
| 3D CNN | 100 | 80-85% | 3-4 hours |

## Inference

### Test Trained Model
```bash
# Predict from video
python inference.py output/models/cnn_lstm_mobilenetv2_TIMESTAMP/ path/to/video.mp4

# Predict from image
python inference.py output/models/cnn_lstm_mobilenetv2_TIMESTAMP/ path/to/image.jpg
```

### Integration with Web App
```python
from ml_training.inference import SignLanguagePredictorAPI

# Initialize predictor
model_dir = 'ml_training/output/models/cnn_lstm_mobilenetv2_TIMESTAMP/'
api = SignLanguagePredictorAPI(model_dir)

# Predict from video
result = api.predict({
    'type': 'video',
    'data': 'path/to/video.mp4'
})

print(f"Prediction: {result['top_prediction']['text']}")
print(f"Confidence: {result['top_prediction']['confidence']:.2%}")
```

## Model Architecture

### CNN-LSTM (Default)
```
Input (30, 224, 224, 3)
    ↓
TimeDistributed(MobileNetV2)
    ↓ 
LSTM(256) → LSTM(128)
    ↓
Dense(512) → Dense(256)
    ↓
Output (num_classes)
```

**Advantages:**
- Fast inference
- Good accuracy
- Works well with limited data
- Pre-trained on ImageNet

### 3D CNN
```
Input (30, 224, 224, 3)
    ↓
Conv3D layers
    ↓
GlobalAveragePooling3D
    ↓
Dense layers
    ↓
Output (num_classes)
```

**Advantages:**
- Captures spatiotemporal features
- No separate temporal modeling needed
- Good for complex gestures

## Data Preprocessing

### Frame Extraction
- Videos are sampled to extract exactly `SEQUENCE_LENGTH` frames (default: 30)
- Frames are uniformly sampled across the video duration
- Each frame is resized to `IMG_SIZE × IMG_SIZE` (default: 224×224)

### MediaPipe Hand Landmarks
- 21 hand landmarks per hand (x, y, z coordinates)
- Provides pose-invariant features
- Useful for fine-grained gesture recognition

### Data Augmentation
- Random brightness adjustment
- Random horizontal flip
- Can be extended with rotation, scaling, etc.

## Troubleshooting

### Out of Memory (OOM)
- Reduce `BATCH_SIZE` in `config.py`
- Reduce `SEQUENCE_LENGTH`
- Use `mobilenetv2` instead of `resnet50`

### Low Accuracy
- Increase `EPOCHS`
- Try different `CNN_BACKBONE`
- Enable `AUGMENT_DATA`
- Increase dataset size (use more classes)

### Slow Training
- Use GPU instead of CPU
- Reduce `IMG_SIZE`
- Use `mobilenetv2` backbone
- Enable `USE_MIXED_PRECISION`

## Next Steps

### 1. Train Initial Model (100 classes)
```bash
python train.py
```

### 2. Evaluate Performance
Check test accuracy and confusion matrix

### 3. Scale Up (300+ classes)
Edit `config.py`:
```python
NUM_CLASSES = 300
LABELS_FILE = os.path.join(DATASET_DIR, 'nslt_300.json')
```

### 4. Fine-tune
- Unfreeze CNN backbone layers
- Train with lower learning rate
- Add more augmentation

### 5. Deploy
- Export model to TensorFlow Lite for mobile
- Integrate with web application
- Set up inference API

## Performance Optimization

### For Production Deployment
1. **Model Quantization**: Reduce model size
   ```python
   converter = tf.lite.TFLiteConverter.from_keras_model(model)
   converter.optimizations = [tf.lite.Optimize.DEFAULT]
   tflite_model = converter.convert()
   ```

2. **Batch Inference**: Process multiple videos at once

3. **Caching**: Cache preprocessed frames

4. **GPU Acceleration**: Use TensorRT for faster inference

## Citation
If you use this code or the WLASL dataset, please cite:
```
@inproceedings{li2020word,
  title={Word-level Deep Sign Language Recognition from Video: A New Large-scale Dataset and Methods Comparison},
  author={Li, Dongxu and Rodriguez, Cristian and Yu, Xin and Li, Hongdong},
  booktitle={The IEEE Winter Conference on Applications of Computer Vision},
  pages={1459--1469},
  year={2020}
}
```

## License
This project is for educational and research purposes. Please refer to the WLASL dataset license for usage restrictions.

## Support
For issues or questions:
1. Check the troubleshooting section
2. Review TensorBoard logs
3. Examine training logs in `output/models/*/training_log.csv`
