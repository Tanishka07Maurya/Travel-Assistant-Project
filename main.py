from flask import Flask, request, jsonify
from flask_cors import CORS
from src.rag_itinerary import TravelRAGPipeline

app = Flask(__name__)
# Enable CORS so the React frontend (running on http://localhost:5173) can talk to Flask
CORS(app)

# Initialize Member 3's RAG Pipeline
try:
    rag_pipeline = TravelRAGPipeline()
    print("--- RAG Pipeline successfully loaded into Flask! ---")
except Exception as e:
    print(f"Error initializing RAG Pipeline: {e}")
    rag_pipeline = None

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "message": "AI Travel Assistant Flask API is active!"
    })

@app.route("/api/generate-itinerary", methods=["POST"])
def generate_itinerary():
    if not rag_pipeline:
        return jsonify({"error": "RAG Pipeline is not initialized properly."}), 500

    data = request.get_json() or {}
    query = data.get("query", "").strip()
    days = data.get("days", 3)

    if not query:
        return jsonify({"error": "Query string cannot be empty."}), 400

    try:
        # Dynamically process user query through ChromaDB + Gemini
        result = rag_pipeline.generate_itinerary(query=query, days=int(days))
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Flask Backend Server on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)