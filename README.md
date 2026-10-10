# ✈️ AI Travel Assistant with Explainable RAG & ABSA

An intelligent, full-stack travel itinerary generator that uses **Aspect-Based Sentiment Analysis (ABSA)**, **ChromaDB vector retrieval**, and **Google Gemini 2.5 Flash** to create personalized, grounded travel plans with Explainable AI (XAI) justifications.

---

## 🏗️ Project Architecture

```text
Travel-Assistant-Project/
├── chroma_db/                  # Local ChromaDB persistent vector database
├── data/
│   ├── cleaned_reviews.csv     # Preprocessed review dataset
│   ├── places.csv              # Raw destination dataset
│   └── places_scored.csv       # Scored destinations with aspect ratings
├── frontend/                   # React + Vite Frontend UI
│   ├── src/
│   │   ├── App.jsx             # React application & API connection
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
├── src/                        # Machine Learning & RAG Engine
│   ├── 1_preprocessing.py      # Text normalization, POS tagging & lemmatization
│   ├── 2_sentiment_model.py    # TF-IDF & Logistic Regression sentiment classifier
│   ├── 3_absa_extraction.py    # VADER aspect-based sentiment analyzer
│   ├── 5_vector_store.py       # MiniLM embeddings & ChromaDB indexing
│   └── rag_itinerary.py        # Gemini 2.5 Flash RAG generation pipeline
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules
├── main.py                     # Flask REST API server
└── requirements.txt            # Python dependencies
```

---
## 👥 Team & Responsibilities
---
```text
Member 1 (Preprocessing & Sentiment Analysis): Built text cleaning pipelines, lemmatization, POS tagging, and sentiment baseline models (1_preprocessing.py, 2_sentiment_model.py).

Member 2 (Aspect-Based Sentiment Analysis): Implemented aspect extraction (Scenery, Food, Nightlife, Budget, Crowd) and generated composite aspect ratings (3_absa_extraction.py).

Member 3 (Vector Database & RAG Pipeline): Engineered ChromaDB vector store indexing (sentence-transformers/all-MiniLM-L6-v2), Gemini 2.5 Flash RAG pipeline, XAI justification payload (5_vector_store.py, rag_itinerary.py), and Flask API endpoints (main.py).

Member 4 (Full-Stack Frontend Integration): Designed the interactive React UI (frontend/), integrated Axios REST requests, and rendered dynamic Markdown itineraries with aspect visualizers.
```

---
## 🛠️ Tech Stack
---
```text
Backend Framework: Python, Flask, Flask-CORS

Machine Learning & NLP: NLTK, spaCy, scikit-learn, VADER

Vector Store & Embeddings: ChromaDB, all-MiniLM-L6-v2 (SentenceTransformers)

Generative LLM: Google Gemini 2.5 Flash (google-genai SDK)

Frontend: React.js, Vite, Axios, Markdown-to-JSX
```

---
## 🚀 Getting Started
---

```text
Prerequisites
Python 3.10+ installed

Node.js & npm installed

Google Gemini API Key

1. Backend Setup
Clone the repository:

Bash
git clone [https://github.com/your-username/Travel-Assistant-Project.git](https://github.com/your-username/Travel-Assistant-Project.git)
cd Travel-Assistant-Project
Create and activate a virtual environment:

Bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
Install Python dependencies:

Bash
pip install -r requirements.txt
Configure Environment Variables:

Copy .env.example to create a local .env file:

Bash
cp .env.example .env
Open .env and add your Gemini API Key:

Code snippet
GEMINI_API_KEY=your_actual_gemini_api_key_here
Build the Vector Store (One-time setup):

Bash
python src/5_vector_store.py
Start the Flask API Server:

Bash
python main.py
The Flask backend will run on http://127.0.0.1:5000.

2. Frontend Setup (React)
Navigate to the frontend directory:

Bash
cd frontend
Install Node dependencies:

Bash
npm install
Start the Development Server:

Bash
npm run dev
The React UI will run on http://localhost:5173.
```
