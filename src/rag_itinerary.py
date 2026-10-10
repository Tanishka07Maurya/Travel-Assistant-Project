import os
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
from google import genai

# Load GEMINI_API_KEY from .env
load_dotenv()

class TravelRAGPipeline:
    def __init__(self, chroma_path="chroma_db"):
        # 1. Initialize ChromaDB persistent client
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self.collection = self.chroma_client.get_collection(
            name="travel_destinations",
            embedding_function=self.embedding_fn
        )
        
        # 2. Initialize Gemini API Client
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing! Check your .env file.")
        
        self.ai_client = genai.Client(api_key=api_key)

    def retrieve_places(self, query: str, top_k: int = 3):
        """Retrieve top_k matching destinations using cosine similarity search."""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )
        return results

    def generate_itinerary(self, query: str, days: int = 3):
        """Perform semantic search, ground system prompt, and synthesize itinerary."""
        # 1. Vector Search
        retrieved_data = self.retrieve_places(query, top_k=3)
        
        docs = retrieved_data.get("documents", [[]])[0]
        metadatas = retrieved_data.get("metadatas", [[]])[0]

        if not docs:
            return {"error": "No matching destination profiles found in ChromaDB vector store."}

        # 2. Construct Bounded Context Prompt
        context_str = "\n\n---\n\n".join(docs)
        
        prompt = f"""You are an expert AI Travel Assistant. Generate a structured {days}-day travel itinerary using ONLY the retrieved verified place profiles and review highlights provided below.

CRITICAL CONSTRAINTS:
1. Do NOT hallucinate fake places, unverified locations, or fictional prices.
2. Rely strictly on the provided aspect ratings and visitor reviews.
3. Provide a clear day-by-day plan (Morning, Afternoon, Evening).
4. Include an 'Explainable AI (XAI) Justification' section explaining why each place was selected based on user preferences and review evidence.

USER REQUEST: "{query}"

RETRIEVED VERIFIED DESTINATION PROFILES:
{context_str}

OUTPUT FORMAT:
Generate clear markdown with section headers for each day, activity blocks, and an XAI Justification block at the end.
"""

        # 3. Call Gemini 2.5 Flash Model
        response = self.ai_client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        # 4. Construct XAI Payload
        xai_payload = []
        for meta in metadatas:
            xai_payload.append({
                "place_name": meta.get("place_name"),
                "category": meta.get("category"),
                "scores": {
                    "Scenery": meta.get("scenery_score"),
                    "Food": meta.get("food_score"),
                    "Nightlife": meta.get("nightlife_score"),
                    "Budget": meta.get("budget_score"),
                    "Crowd": meta.get("crowd_score"),
                }
            })

        return {
            "query": query,
            "days": days,
            "itinerary_markdown": response.text,
            "explainability_data": xai_payload
        }

if __name__ == "__main__":
    # Test Member 3 RAG Pipeline
    rag = TravelRAGPipeline()
    test_query = "A peaceful romantic trip with stunning sunset views, fresh seafood, and low crowd density"
    result = rag.generate_itinerary(test_query, days=3)
    
    print("\n================ GENERATED ITINERARY ================\n")
    print(result.get("itinerary_markdown"))