from flask import Flask, Response, request, jsonify, send_from_directory
from flask_cors import CORS
from db import collection
import cv2
import os
import numpy as np
from datetime import datetime, timedelta
from threading import Lock
from pymongo import MongoClient
import torch

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client['boeuf_db']
boeuf_collection = db['detections']

jours_semaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

CAPTURE_FOLDER = 'captures'
os.makedirs(CAPTURE_FOLDER, exist_ok=True)

# Charger YOLOv5n
model = torch.hub.load('ultralytics/yolov5', 'yolov5n', force_reload=True)
model.conf = 0.5
class_names = model.names

total_cattle_detected = 0
temporary_human_count = 0
count_lock = Lock()
identification_active = False  # Flag pour vérifier si l'identification est active

def detect_objects(frame):
    global total_cattle_detected, temporary_human_count
    results = model(frame)
    detected_cows = 0
    detected_humans = 0

    for *box, conf, cls in results.xyxy[0]:
        label = class_names[int(cls)]
        x1, y1, x2, y2 = map(int, box)
        if label == 'cow':
            detected_cows += 1
            color = (0, 255, 0)
        elif label == 'person':
            detected_humans += 1
            color = (255, 0, 0)
        else:
            continue

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    if detected_cows > 0:
        with count_lock:
            total_cattle_detected += detected_cows

    with count_lock:
        temporary_human_count = detected_humans

    return frame

def enregistrer_detection(nombre_boeufs):
    if nombre_boeufs > 0:
        maintenant = datetime.now()
        collection.insert_one({
            "date": maintenant.strftime("%Y-%m-%d"),
            "heure": maintenant.strftime("%H:%M:%S"),
            "nombre_boeufs": nombre_boeufs
        })

def generate_frames(cam_index):
    cap = cv2.VideoCapture(cam_index)
    if not cap.isOpened():
        raise RuntimeError(f"Impossible d'ouvrir la caméra {cam_index}")
    
    while True:
        success, frame = cap.read()
        if not success:
            break

        if identification_active:  # On applique la détection uniquement si l'identification est active
            frame = detect_objects(frame)
        
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    cam_index = int(request.args.get('cam', 0))
    return Response(generate_frames(cam_index), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/capture_image/<int:cam_index>', methods=['GET'])
def capture_image(cam_index):
    cap = cv2.VideoCapture(cam_index)
    if not cap.isOpened():
        return jsonify({'error': 'Caméra non disponible'}), 400

    ret, frame = cap.read()
    cap.release()

    if not ret:
        return jsonify({'error': 'Capture échouée'}), 500

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}.jpg"
    path = os.path.join(CAPTURE_FOLDER, filename)
    cv2.imwrite(path, frame)

    return jsonify({'message': 'Image capturée', 'filename': filename})

@app.route('/reset_counter', methods=['POST'])
def reset_counter():
    global total_cattle_detected
    with count_lock:
        total_cattle_detected = 0
    return jsonify({'message': 'Compteur réinitialisé'})

@app.route('/get_cattle_count', methods=['GET'])
def get_cattle_count():
    with count_lock:
        return jsonify({'total_detected': total_cattle_detected})

@app.route('/get_temp_counts', methods=['GET'])
def get_temp_counts():
    with count_lock:
        return jsonify({
            'boeufs': total_cattle_detected,
            'personnes': temporary_human_count
        })

@app.route('/start_identification', methods=['POST'])
def start_identification():
    global identification_active
    identification_active = True
    return jsonify({'message': 'Identification démarrée'}), 200

@app.route('/stop_identification', methods=['POST'])
def stop_identification():
    global identification_active
    identification_active = False
    return jsonify({'message': 'Identification arrêtée'}), 200

@app.route('/api/boeufs', methods=['POST'])
def ajouter_boeufs():
    data = request.get_json()
    now = datetime.now()
    boeuf = {
        "date": now.date().isoformat(),
        "heure": now.time().strftime("%H:%M:%S"),
        "nombre_boeufs": data['nombre_boeufs']
    }
    boeuf_collection.insert_one(boeuf)
    return jsonify({"message": "Comptage enregistré"}), 201

@app.route('/api/boeufs/hebdomadaire', methods=['GET'])
def get_stats_hebdo():
    aujourd_hui = datetime.now().date()
    stats = {jour: 0 for jour in jours_semaine}
    une_semaine = aujourd_hui - timedelta(days=6)

    documents = collection.find({
        "date": {"$gte": une_semaine.strftime('%Y-%m-%d')} 
    })

    for doc in documents:
        date_str = doc.get("date")
        nombre = doc.get("nombre_boeufs", 0)
        if nombre > 0:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            jour = date_obj.strftime("%a")
            mapping = {
                'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mer', 'Thu': 'Jeu',
                'Fri': 'Ven', 'Sat': 'Sam', 'Sun': 'Dim'
            }
            jour_fr = mapping.get(jour)
            if jour_fr:
                stats[jour_fr] += nombre

    return jsonify(stats)

@app.route('/api/cameras', methods=['GET'])
def detect_cameras():
    max_index = 5  
    disponibles = []
    for i in range(max_index):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            disponibles.append(i)
            cap.release()
    return jsonify(disponibles)

@app.route('/api/boeufs/stats', methods=['GET'])
def statistiques_globales():
    aujourd_hui = datetime.now().date()
    une_semaine = aujourd_hui - timedelta(days=6)
    stats = {jour: 0 for jour in jours_semaine}
    total = 0
    nombre_detections = 0
    derniere_detection = None

    documents = collection.find({"date": {"$gte": une_semaine.strftime('%Y-%m-%d')}})

    for doc in documents:
        date_str = doc.get("date")
        nombre = doc.get("nombre_boeufs", 0)
        if nombre > 0:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            jour = date_obj.strftime("%a")
            mapping = {
                'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mer', 'Thu': 'Jeu',
                'Fri': 'Ven', 'Sat': 'Sam', 'Sun': 'Dim'
            }
            jour_fr = mapping.get(jour)
            if jour_fr:
                stats[jour_fr] += nombre
                total += nombre
                nombre_detections += 1
                if not derniere_detection or date_obj > datetime.strptime(derniere_detection, "%Y-%m-%d"):
                    derniere_detection = date_str

    jour_max = max(stats, key=stats.get)
    jour_min = min(stats, key=stats.get)

    return jsonify({
        "total_hebdo": total,
        "moyenne_journaliere": round(total / 7, 2),
        "jour_max": jour_max,
        "valeur_max": stats[jour_max],
        "jour_min": jour_min,
        "valeur_min": stats[jour_min],
        "derniere_detection": derniere_detection,
        "nombre_detections": nombre_detections
    })

if __name__ == '__main__':
    app.run(debug=True)
