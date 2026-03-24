"""
Deep learning model architectures for sign language recognition
"""
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from typing import Tuple, Optional

class SignLanguageModel:
    """Factory class for creating sign language recognition models"""
    
    @staticmethod
    def create_cnn_lstm_model(
        input_shape: Tuple[int, int, int, int],  # (sequence_length, height, width, channels)
        num_classes: int,
        lstm_units: int = 256,
        dropout_rate: float = 0.5,
        cnn_backbone: str = 'mobilenetv2'
    ) -> keras.Model:
        """
        Create CNN-LSTM model for video classification
        
        Args:
            input_shape: Shape of input (sequence_length, height, width, channels)
            num_classes: Number of output classes
            lstm_units: Number of LSTM units
            dropout_rate: Dropout rate
            cnn_backbone: CNN backbone ('mobilenetv2', 'efficientnetb0', 'resnet50')
            
        Returns:
            Compiled Keras model
        """
        sequence_length, height, width, channels = input_shape
        
        # Input layer
        inputs = layers.Input(shape=input_shape)
        
        # TimeDistributed CNN for feature extraction
        if cnn_backbone == 'mobilenetv2':
            base_model = keras.applications.MobileNetV2(
                include_top=False,
                weights='imagenet',
                input_shape=(height, width, channels),
                pooling='avg'
            )
        elif cnn_backbone == 'efficientnetb0':
            base_model = keras.applications.EfficientNetB0(
                include_top=False,
                weights='imagenet',
                input_shape=(height, width, channels),
                pooling='avg'
            )
        elif cnn_backbone == 'resnet50':
            base_model = keras.applications.ResNet50(
                include_top=False,
                weights='imagenet',
                input_shape=(height, width, channels),
                pooling='avg'
            )
        else:
            raise ValueError(f"Unknown backbone: {cnn_backbone}")
        
        # 1. Fine-tune the top layers of the backbone for maximum accuracy (>90%)
        # This allows the model to learn specific hand signs instead of generic ImageNet features.
        base_model.trainable = True
        # Freeze all layers except the top 30 to prevent overfitting and catastrophic forgetting
        for layer in base_model.layers[:-30]:
            layer.trainable = False
        
        # Apply CNN to each frame
        x = layers.TimeDistributed(base_model)(inputs)
        
        # 2. Bidirectional LSTM layers (looks backwards and forwards in time)
        # Proven to significantly boost accuracy in video action recognition tests
        x = layers.Bidirectional(layers.LSTM(lstm_units, return_sequences=True))(x)
        x = layers.Dropout(dropout_rate)(x)
        x = layers.Bidirectional(layers.LSTM(lstm_units // 2))(x)
        x = layers.Dropout(dropout_rate)(x)
        
        # 3. Dense layers with L2 Regularization & Batch Normalization
        # Prevents overfitting and speeds up convergence
        from tensorflow.keras.regularizers import l2
        x = layers.Dense(512, activation='relu', kernel_regularizer=l2(0.001))(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(dropout_rate)(x)
        
        x = layers.Dense(256, activation='relu', kernel_regularizer=l2(0.001))(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(dropout_rate)(x)
        
        # Output layer
        outputs = layers.Dense(num_classes, activation='softmax')(x)
        
        model = keras.Model(inputs=inputs, outputs=outputs, name='cnn_lstm_model')
        return model
    
    @staticmethod
    def create_3dcnn_model(
        input_shape: Tuple[int, int, int, int],
        num_classes: int,
        dropout_rate: float = 0.5
    ) -> keras.Model:
        """
        Create 3D CNN model for video classification
        
        Args:
            input_shape: Shape of input (sequence_length, height, width, channels)
            num_classes: Number of output classes
            dropout_rate: Dropout rate
            
        Returns:
            Compiled Keras model
        """
        inputs = layers.Input(shape=input_shape)
        
        # 3D Convolutional layers
        x = layers.Conv3D(32, (3, 3, 3), activation='relu', padding='same')(inputs)
        x = layers.MaxPooling3D((2, 2, 2))(x)
        x = layers.BatchNormalization()(x)
        
        x = layers.Conv3D(64, (3, 3, 3), activation='relu', padding='same')(x)
        x = layers.MaxPooling3D((2, 2, 2))(x)
        x = layers.BatchNormalization()(x)
        
        x = layers.Conv3D(128, (3, 3, 3), activation='relu', padding='same')(x)
        x = layers.MaxPooling3D((2, 2, 2))(x)
        x = layers.BatchNormalization()(x)
        
        x = layers.Conv3D(256, (3, 3, 3), activation='relu', padding='same')(x)
        x = layers.GlobalAveragePooling3D()(x)
        
        # Dense layers
        x = layers.Dense(512, activation='relu')(x)
        x = layers.Dropout(dropout_rate)(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(dropout_rate)(x)
        
        # Output layer
        outputs = layers.Dense(num_classes, activation='softmax')(x)
        
        model = keras.Model(inputs=inputs, outputs=outputs, name='3dcnn_model')
        return model
    
    @staticmethod
    def create_landmark_model(
        sequence_length: int,
        num_landmarks: int = 21,
        landmark_dim: int = 3,
        num_classes: int = 100,
        lstm_units: int = 128,
        dropout_rate: float = 0.5
    ) -> keras.Model:
        """
        Create model for hand landmark sequences
        
        Args:
            sequence_length: Number of frames
            num_landmarks: Number of hand landmarks
            landmark_dim: Dimension of each landmark (x, y, z)
            num_classes: Number of output classes
            lstm_units: Number of LSTM units
            dropout_rate: Dropout rate
            
        Returns:
            Compiled Keras model
        """
        input_shape = (sequence_length, num_landmarks * landmark_dim)
        inputs = layers.Input(shape=input_shape)
        
        # LSTM layers
        x = layers.LSTM(lstm_units, return_sequences=True)(inputs)
        x = layers.Dropout(dropout_rate)(x)
        x = layers.LSTM(lstm_units, return_sequences=True)(x)
        x = layers.Dropout(dropout_rate)(x)
        x = layers.LSTM(lstm_units // 2)(x)
        x = layers.Dropout(dropout_rate)(x)
        
        # Dense layers
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(dropout_rate)(x)
        x = layers.Dense(128, activation='relu')(x)
        x = layers.Dropout(dropout_rate)(x)
        
        # Output layer
        outputs = layers.Dense(num_classes, activation='softmax')(x)
        
        model = keras.Model(inputs=inputs, outputs=outputs, name='landmark_model')
        return model
    
    @staticmethod
    def create_multimodal_model(
        video_input_shape: Tuple[int, int, int, int],
        landmark_input_shape: Tuple[int, int],
        num_classes: int,
        lstm_units: int = 256,
        dropout_rate: float = 0.5
    ) -> keras.Model:
        """
        Create multimodal model combining video frames and hand landmarks
        
        Args:
            video_input_shape: Shape of video input (sequence_length, height, width, channels)
            landmark_input_shape: Shape of landmark input (sequence_length, num_features)
            num_classes: Number of output classes
            lstm_units: Number of LSTM units
            dropout_rate: Dropout rate
            
        Returns:
            Compiled Keras model
        """
        # Video branch
        video_input = layers.Input(shape=video_input_shape, name='video_input')
        base_model = keras.applications.MobileNetV2(
            include_top=False,
            weights='imagenet',
            input_shape=video_input_shape[1:],
            pooling='avg'
        )
        base_model.trainable = False
        
        video_features = layers.TimeDistributed(base_model)(video_input)
        video_features = layers.LSTM(lstm_units, return_sequences=False)(video_features)
        video_features = layers.Dropout(dropout_rate)(video_features)
        
        # Landmark branch
        landmark_input = layers.Input(shape=landmark_input_shape, name='landmark_input')
        landmark_features = layers.LSTM(lstm_units // 2, return_sequences=False)(landmark_input)
        landmark_features = layers.Dropout(dropout_rate)(landmark_features)
        
        # Concatenate features
        combined = layers.concatenate([video_features, landmark_features])
        
        # Dense layers
        x = layers.Dense(512, activation='relu')(combined)
        x = layers.Dropout(dropout_rate)(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(dropout_rate)(x)
        
        # Output layer
        outputs = layers.Dense(num_classes, activation='softmax')(x)
        
        model = keras.Model(
            inputs=[video_input, landmark_input],
            outputs=outputs,
            name='multimodal_model'
        )
        return model


def compile_model(
    model: keras.Model,
    learning_rate: float = 0.001,
    use_mixed_precision: bool = True
) -> keras.Model:
    """
    Compile model with optimizer and loss
    
    Args:
        model: Keras model
        learning_rate: Learning rate
        use_mixed_precision: Whether to use mixed precision training
        
    Returns:
        Compiled model
    """
    if use_mixed_precision:
        policy = keras.mixed_precision.Policy('mixed_float16')
        keras.mixed_precision.set_global_policy(policy)
    
    optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
    
    model.compile(
        optimizer=optimizer,
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy', keras.metrics.SparseTopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
    )
    
    return model


if __name__ == "__main__":
    # Test model creation
    from config import NUM_CLASSES, SEQUENCE_LENGTH, IMG_SIZE, LSTM_UNITS, DROPOUT_RATE, CNN_BACKBONE
    
    input_shape = (SEQUENCE_LENGTH, IMG_SIZE, IMG_SIZE, 3)
    
    print("Creating CNN-LSTM model...")
    model = SignLanguageModel.create_cnn_lstm_model(
        input_shape=input_shape,
        num_classes=NUM_CLASSES,
        lstm_units=LSTM_UNITS,
        dropout_rate=DROPOUT_RATE,
        cnn_backbone=CNN_BACKBONE
    )
    
    model = compile_model(model)
    model.summary()
    
    print(f"\nModel created successfully!")
    print(f"Total parameters: {model.count_params():,}")
