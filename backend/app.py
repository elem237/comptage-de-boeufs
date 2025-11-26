import eventlet
eventlet.monkey_patch()

from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import subprocess
import cv2
import torch
from datetime import datetime, timedelta
from collections import defaultdict
import pymongo

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["comptage_boeufs"]
collection = db["detections"]
humain_collection = db["humains"]

# YOLOv5
model = torch.hub.load('ultralytics/yolov5', 'yolov5n', trust_repo=True)
model.conf = 0.4
model.classes = [0, 20]  
# Caméras
local_cameras = [0, 1]
wifi_camera_map = {
    "CAMERA_WIFI_1": "rtsp://192.168.1.100:554/stream",
    "CAMERA_WIFI_2": "rtsp://192.168.1.101:554/stream"
}
connected_wifi_cameras = []

# Comptage temporaire
temp_counts = {"boeufs": 0, "humains": 0}


def notifier_nouvelle_detection(data):
    data["time"] = datetime.now().strftime("%H:%M:%S")
    socketio.emit('nouvelle_detection', data)


def detect_local_cameras(max_index=3):
    return [i for i in range(max_index) if cv2.VideoCapture(i).read()[0]]


def scanner_wifi_windows():
    try:
        output = subprocess.check_output("netsh wlan show networks", shell=True).decode("utf-8", errors="ignore")
        return [line.split(":")[1].strip() for line in output.split("\n") if "SSID" in line and "BSSID" not in line]
    except:
        return []


def connecter_a_wifi(ssid):
    try:
        subprocess.run(f'netsh wlan connect name="{ssid}"', shell=True, check=True)
        connected_wifi_cameras.append(ssid)
        return True
    except:
        return False


def run_detection_background(source, camera_name):
    cap = cv2.VideoCapture(source)
    if not cap.isOpened(): return

    while True:
        success, frame = cap.read()
        if not success: break

        results = model(frame)
        detected = results.pandas().xyxy[0]

        nb_boeufs = len(detected[detected['name'] == 'cow'])
        nb_humains = len(detected[detected['name'] == 'person'])

        temp_counts["boeufs"] = nb_boeufs
        temp_counts["humains"] = nb_humains

        if nb_boeufs > 0 or nb_humains > 0:
            data = {
                "camera": camera_name,
                "count": nb_boeufs,
                "humains": nb_humains,
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            collection.insert_one(data)
            notifier_nouvelle_detection(data)

        eventlet.sleep(1)

    cap.release()



def gen_frames(source):
    cap = cv2.VideoCapture(source)
    if not cap.isOpened(): return

    while True:
        success, frame = cap.read()
        if not success: break

        results = model(frame)
        detected = results.pandas().xyxy[0]
        boeufs = detected[detected['name'] == 'cow']
        humains = detected[detected['name'] == 'person']

        temp_counts["boeufs"] = len(boeufs)
        temp_counts["humains"] = len(humains)

        for _, row in boeufs.iterrows():
            x1, y1, x2, y2 = map(int, [row['xmin'], row['ymin'], row['xmax'], row['ymax']])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, "Boeuf", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        for _, row in humains.iterrows():
            x1, y1, x2, y2 = map(int, [row['xmin'], row['ymin'], row['xmax'], row['ymax']])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, "Humain", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')


@app.route('/video_feed')
def video_feed():
    cam = int(request.args.get('cam', 0))
    return Response(gen_frames(cam), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/video_feed_wifi')
def video_feed_wifi():
    ssid = request.args.get("ssid")
    url = wifi_camera_map.get(ssid)
    return Response(gen_frames(url), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/cameras', methods=['GET'])
def get_local_cameras():
    return jsonify(detect_local_cameras())


@app.route('/api/cameras/wifi/detecter')
def detecter_cameras_wifi():
    return jsonify({"reseaux_detectes": scanner_wifi_windows()})


@app.route('/api/cameras/wifi', methods=['GET'])
def get_connected_wifi_cameras():
    return jsonify(connected_wifi_cameras)

def detect_local_cameras(max_index=3):
    detected = []
    for i in range(max_index):
        cap = cv2.VideoCapture(i)
        if cap is not None and cap.read()[0]:
            detected.append(i)
        cap.release()
    return detected

@app.route('/api/cameras/wifi/connecter', methods=['POST'])
def connecter_wifi_camera():
    ssid = request.json.get("ssid")
    if not ssid or ssid not in wifi_camera_map:
        return jsonify({"error": "SSID inconnu"}), 400
    return jsonify({"message": "Connecté"}) if connecter_a_wifi(ssid) else jsonify({"error": "Échec"}), 500


@app.route('/start_identification', methods=['POST'])
def start_identification():
    data = request.get_json()
    camera_id = data.get('camera_id')
    camera_type = data.get('camera_type', 'local')

    if camera_type == "local":
        source = local_cameras[int(camera_id)]
    elif camera_type == "wifi":
        source = wifi_camera_map.get(camera_id)
        if not source:
            return jsonify({'error': 'SSID inconnu'}), 400
    else:
        return jsonify({'error': 'Type non supporté'}), 400

    eventlet.spawn(run_detection_background, source, f"{camera_type}_{camera_id}")
    return jsonify({'message': f"Identification lancée pour {camera_type}_{camera_id}"}), 200

@app.route('/api/humains/total', methods=['GET'])
def total_humains():
    total = humain_collection.count_documents({})
    return jsonify({"total_humains": total})

@app.route('/get_temp_counts')
def get_temp_counts():
    return jsonify({
        "boeufs": temp_counts.get("boeufs", 0),
        "humains": temp_counts.get("humains", 0)
    })


@app.route('/api/humains/count', methods=['POST'])
def compter_humains():
    try:
        cap = cv2.VideoCapture(0)
        success, frame = cap.read()
        cap.release()
        if not success:
            return jsonify({'error': 'Erreur de lecture'}), 500

        results = model(frame)
        humains = results.pandas().xyxy[0][results.pandas().xyxy[0]['name'] == 'person']
        count = len(humains)

        humain_collection.insert_one({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "count": count
        })

        return jsonify({"count": count, "message": "Détection enregistrée"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    data = request.get_json()
    db.tickets.insert_one({
        'boucher': data.get('boucher'),
        'nombre_boeufs': data.get('nombreBoeufs'),
        'date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'created_by': 'Service Commercial'
    })
    return jsonify({'message': 'Ticket enregistré'}), 201


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
