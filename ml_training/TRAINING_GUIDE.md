# Sign Language Recognition Training Guide

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd ml_training
pip install -r requirements.txt
```

### Step 2: Run Quick Start Script
```bash
python quick_start.py
```

This will:
- ✅ Check all requirements
- ✅ Verify dataset
- ✅ Detect GPU
- ✅ Start training with optimal settings

## 📊 Expected Results

### Training Time
- **With GPU**: 2-3 hours for 100 classes
- **With CPU**: 12-24 hours for 100 classes (not recommended)

### Accuracy Targets
- **100 classes**: 85-90% accuracy
- **300 classes**: 75-85% accuracy
- **1000 classes**: 65-75% accuracy

## 🎯 Training Steps

### 1. Data Preprocessing (Automatic)
The first run will preprocess all videos:
- Extract 30 frames per video
- Detect hand landmarks with MediaPipe
- Normalize and resize frames
- Cache processed data for future runs

**Time**: ~30-60 minutes for 100 classes

### 2. Model Training
- CNN-LSTM model with MobileNetV2 backbone
- Transfer learning from ImageNet
- Data augmentation
- Early stopping and learning rate reduction

**Time**: ~2-3 hours with GPU

### 3. Evaluation
- Test on held-out test set
- Generate confusion matrix
- Save best model and metrics

## 📁 Output Files

After training, you'll find:
```
output/
└── models/
    └── cnn_lstm_mobilenetv2_TIMESTAMP/
        ├── best_model.h5          # Best model weights
        ├── final_model.h5         # Final model weights
        ├── metadata.json          # Model metadata
        ├── training_log.csv       # Training history
        └── history.pkl            # Full training history
```

## 🔧 Customization

Edit `config.py` to customize:

```python
# Start with fewer classes for faster training
NUM_CLASSES = 100  # or 300, 1000, 2000

# Reduce epochs for quick testing
EPOCHS = 10  # default: 50

# Adjust batch size based on GPU memory
BATCH_SIZE = 8  # default: 16

# Try different model architectures
MODEL_TYPE = 'cnn_lstm'  # or '3dcnn'
CNN_BACKBONE = 'mobilenetv2'  # or 'efficientnetb0', 'resnet50'
```

## 🎥 Using the Trained Model

### Test on a Video
```bash
python inference.py output/models/cnn_lstm_mobilenetv2_TIMESTAMP/ path/to/video.mp4
```

### Integrate with Web App
The trained model will automatically be used by the AccessEdu web application for real sign language recognition!

## 💡 Tips

1. **Start Small**: Begin with 100 classes to verify everything works
2. **Use GPU**: Training on CPU is extremely slow
3. **Monitor Progress**: Use TensorBoard to watch training in real-time
4. **Be Patient**: First run takes longer due to data preprocessing
5. **Save Checkpoints**: Best model is automatically saved

## 🐛 Troubleshooting

### Out of Memory
```python
# In config.py
BATCH_SIZE = 4  # Reduce from 16
IMG_SIZE = 128  # Reduce from 224
```

### Slow Training
- Ensure GPU is being used
- Reduce number of classes
- Use MobileNetV2 instead of ResNet50

### Low Accuracy
- Train for more epochs
- Enable data augmentation
- Try different model architecture

## 📈 Next Steps

1. **Train on 100 classes** ✓
2. **Evaluate performance** ✓
3. **Scale to 300 classes**
4. **Fine-tune model**
5. **Deploy to production**

## 🎓 Learning Resources

- [TensorFlow Documentation](https://www.tensorflow.org/tutorials)
- [WLASL Dataset Paper](https://arxiv.org/abs/1910.11006)
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)

---

**Ready to train?** Run `python quick_start.py` and let's build an amazing sign language recognition model! 🚀
