import os
import cv2
import numpy as np
import base64
import json
import logging

logger = logging.getLogger(__name__)

class FaceRecognitionEngine:
    def __init__(self, models_dir=None):
        if models_dir is None:
            models_dir = os.path.join(os.path.dirname(__file__), 'models')
        self.models_dir = models_dir
        self.detector_path = os.path.join(models_dir, 'face_detection_yunet_2023mar.onnx')
        self.recognizer_path = os.path.join(models_dir, 'face_recognition_sface_2021dec.onnx')
        
        self.detector = None
        self.recognizer = None
        self.haar_cascade = None
        self.cache_encodings = {}  # student_id -> list of feature vectors
        
        self.init_models()

    def init_models(self):
        try:
            if os.path.exists(self.detector_path) and os.path.exists(self.recognizer_path):
                self.detector = cv2.FaceDetectorYN.create(
                    model=self.detector_path,
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000
                )
                self.recognizer = cv2.FaceRecognizerSF.create(
                    model=self.recognizer_path,
                    config=""
                )
                print("[AI Engine] OpenCV YuNet & SFace Deep Learning models loaded successfully.")
            else:
                print(f"[AI Engine] Model files missing in {self.models_dir}, falling back to Haar Cascade")
        except Exception as e:
            print(f"[AI Engine] Error loading ONNX models: {e}")
            
        # Also load Haar cascade as a secondary / fast fallback
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_path):
                self.haar_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception as e:
            print(f"[AI Engine] Haar cascade init error: {e}")

    def decode_base64_image(self, b64_str):
        """Converts base64 data URL string into an OpenCV BGR numpy image"""
        try:
            if ',' in b64_str:
                b64_str = b64_str.split(',', 1)[1]
            image_data = base64.b64decode(b64_str)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"[AI Engine] decode_base64_image error: {e}")
            return None

    def detect_and_extract(self, img):
        """
        Detects faces in img and extracts 128-d SFace embeddings.
        Returns list of dicts: [ { 'box': [x, y, w, h], 'score': float, 'feature': np.array, 'landmarks': [...] } ]
        """
        if img is None:
            return []
        
        h, w = img.shape[:2]
        results = []

        if self.detector is not None and self.recognizer is not None:
            try:
                self.detector.setInputSize((w, h))
                _, faces = self.detector.detect(img)
                if faces is not None:
                    for face in faces:
                        # face has: [x, y, w, h, x_re, y_re, x_le, y_le, x_nt, y_nt, x_rc, y_rc, x_lc, y_lc, score]
                        box = [int(face[0]), int(face[1]), int(face[2]), int(face[3])]
                        # Bound coordinates to image
                        box[0] = max(0, box[0])
                        box[1] = max(0, box[1])
                        box[2] = min(w - box[0], box[2])
                        box[3] = min(h - box[1], box[3])
                        score = float(face[14]) if len(face) > 14 else 0.9

                        # Align face and extract 128-d deep embedding
                        aligned_face = self.recognizer.alignCrop(img, face)
                        feature = self.recognizer.feature(aligned_face) # 1x128 float32 vector
                        # Flatten to 1D
                        feat_flat = feature.flatten().tolist()

                        results.append({
                            'box': box,
                            'score': round(score, 3),
                            'feature': feat_flat,
                            'raw_face': face
                        })
                    return results
            except Exception as e:
                print(f"[AI Engine] Detection error with YuNet: {e}")

        # Fallback to Haar Cascade if YuNet had an issue
        if self.haar_cascade is not None:
            try:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = self.haar_cascade.detectMultiScale(gray, 1.2, 5, minSize=(60, 60))
                for (x, y, fw, fh) in faces:
                    # Synthetic feature vector from normalized histogram of face patch
                    face_roi = gray[y:y+fh, x:x+fw]
                    resized = cv2.resize(face_roi, (32, 32))
                    hist = cv2.calcHist([resized], [0], None, [128], [0, 256])
                    cv2.normalize(hist, hist)
                    feat_flat = hist.flatten().tolist()
                    results.append({
                        'box': [int(x), int(y), int(fw), int(fh)],
                        'score': 0.85,
                        'feature': feat_flat
                    })
            except Exception as e:
                print(f"[AI Engine] Haar detection error: {e}")

        return results

    def refresh_cache(self, db_encodings):
        """
        db_encodings: list of FaceEncoding records (student_id, encoding_json)
        Loads all student encodings into memory for instant matching.
        """
        self.cache_encodings.clear()
        for item in db_encodings:
            try:
                vec = json.loads(item.encoding_json)
                if item.student_id not in self.cache_encodings:
                    self.cache_encodings[item.student_id] = []
                self.cache_encodings[item.student_id].append(np.array(vec, dtype=np.float32))
            except Exception as e:
                print(f"[AI Engine] Error caching encoding for {item.student_id}: {e}")
        print(f"[AI Engine] In-memory face database loaded: {len(self.cache_encodings)} students registered.")

    def match_feature(self, query_feature, cosine_threshold=0.38):
        """
        Compares query_feature against all registered student features.
        Returns (best_student_id, confidence, similarity)
        """
        if not self.cache_encodings or query_feature is None:
            return "Unknown", 0.0, 0.0

        q_vec = np.array(query_feature, dtype=np.float32).reshape(1, -1)
        # L2 normalize
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        best_student_id = "Unknown"
        max_similarity = -1.0

        for student_id, vectors in self.cache_encodings.items():
            for v in vectors:
                v_norm = np.linalg.norm(v)
                if v_norm > 0:
                    v_normed = v / v_norm
                else:
                    v_normed = v
                
                # Cosine similarity is dot product of normalized vectors
                sim = float(np.dot(q_vec, v_normed.reshape(-1, 1))[0][0])
                if sim > max_similarity:
                    max_similarity = sim
                    if sim >= cosine_threshold:
                        best_student_id = student_id

        # Calculate a realistic human-friendly confidence percentage (70% - 99%)
        if max_similarity >= cosine_threshold:
            # Scale similarity (e.g. 0.38 to 0.85) to (75% to 99%)
            conf = min(0.99, max(0.70, 0.70 + (max_similarity - cosine_threshold) * 0.65))
        else:
            conf = max(0.0, max_similarity * 0.5)

        return best_student_id, round(conf, 3), round(max_similarity, 3)

# Global singleton engine instance
engine = FaceRecognitionEngine()
