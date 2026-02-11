from data_preprocessing import WLASLDatasetLoader
from config import VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE

loader = WLASLDatasetLoader(VIDEOS_DIR, LABELS_FILE, CLASS_LIST_FILE)
print(f'Loaded {len(loader.video_labels)} video labels')
print(f'Number of classes: {len(loader.class_to_idx)}')
print(f'Sample labels: {list(loader.video_labels.items())[:5]}')
