import os
import json
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

import database
from src.rag_itinerary import TravelRAGPipeline

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize RAG Pipeline
rag_pipeline = TravelRAGPipeline()

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "running", "service": "travel.ai backend"}), 200

# AUTHENTICATION ENDPOINTS
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not name or not email or not password:
            return jsonify({"error": "All fields (name, email, password) are required."}), 400

        user = database.register_user(name, email, password)
        if not user:
            return jsonify({"error": "An account with this email already exists."}), 400

        return jsonify(user), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        user = database.login_user(email, password)
        if not user:
            return jsonify({"error": "Invalid email or password."}), 401

        return jsonify(user), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# CORE GENERATION ENDPOINT
@app.route('/api/generate-itinerary', methods=['POST'])
def generate_itinerary():
    try:
        data = request.get_json() or {}
        destination = data.get('destination') or data.get('where') or "Rajasthan"
        query = data.get('query') or data.get('prompt') or ""
        mode = data.get('mode', 'itinerary')
        days = int(data.get('days', 3))
        user_id = int(data.get('user_id', 1))

        # Generate response using unified RAG pipeline
        result = rag_pipeline.handle_request(
            destination=destination,
            query=query,
            mode=mode,
            days=days
        )

        # Automatically persist multi-day itineraries to database
        if mode == 'itinerary' and isinstance(result, dict) and 'itinerary_markdown' in result:
            try:
                save_title = f"{destination} ({days} Days Journey)"
                database.save_user_trip(user_id, save_title, days, result)
            except Exception as e:
                print(f"Trip persistence notice: {e}")

        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# TRIP PERSISTENCE ENDPOINTS
@app.route('/api/save-trip', methods=['POST'])
def save_trip():
    try:
        data = request.get_json() or {}
        user_id = int(data.get('user_id', 1))
        title = data.get('title', 'My Saved Journey')
        days = int(data.get('days', 3))
        trip_data = data.get('trip_data', {})

        trip_id = database.save_user_trip(user_id, title, days, trip_data)
        return jsonify({"status": "success", "trip_id": trip_id}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/user-trips/<int:user_id>', methods=['GET'])
def get_user_trips(user_id):
    try:
        trips = database.get_user_trips(user_id)
        return jsonify(trips), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify([]), 200

if __name__ == '__main__':
    print("Starting Flask Backend Server with SQLite Database on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)