from flask import Flask, request, jsonify
from flask_cors import CORS
from src.rag_itinerary import TravelRAGPipeline
import database

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 1. Initialize SQLite database on startup
database.init_db()

# 2. Initialize RAG Pipeline
rag_pipeline = TravelRAGPipeline()

# ----------------- AUTH ROUTES ----------------- #

@app.route("/api/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    result = database.register_user(name, email, password)
    if not result["success"]:
        return jsonify({"error": result["error"]}), 409

    return jsonify(result["user"]), 201


@app.route("/api/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    result = database.authenticate_user(email, password)
    if not result["success"]:
        return jsonify({"error": result["error"]}), 401

    return jsonify(result["user"]), 200


# ----------------- ITINERARY & TRIPS ROUTES ----------------- #

@app.route("/api/generate-itinerary", methods=["POST", "OPTIONS"])
def generate_itinerary_endpoint():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}
    query = data.get("query", "")
    days = data.get("days", 3)
    user_id = data.get("user_id")

    if not query:
        return jsonify({"error": "Query string is required"}), 400

    # Execute RAG & ABSA generation
    result = rag_pipeline.generate_itinerary(query=query, days=days)

    # Save to SQLite database if user is authenticated
    if user_id and "itinerary_markdown" in result:
        trip_title = query.split(".")[0][:60]
        database.save_trip(user_id=user_id, query_title=trip_title, days=days, data=result)

    return jsonify(result)


@app.route("/api/user-trips/<int:user_id>", methods=["GET", "OPTIONS"])
def get_trips(user_id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    trips = database.get_user_trips(user_id)
    return jsonify(trips), 200


if __name__ == "__main__":
    print("Starting Flask Backend Server with SQLite Database on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)