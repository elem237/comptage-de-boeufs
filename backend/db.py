from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["comptage_boeufs"]
collection = db["detections"]
