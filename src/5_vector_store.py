import os
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions

def build_vector_store():
    print("--- Starting ChromaDB Vector Indexing ---")
    
    # 1. Resolve path to input files
    places_path = "data/places_scored.csv" if os.path.exists("data/places_scored.csv") else "data/places.csv"
    reviews_path = "data/cleaned_reviews.csv"
    
    if not os.path.exists(places_path) or not os.path.exists(reviews_path):
        print(f"Error: Missing input files ({places_path} or {reviews_path}). Run Member 1 & 2 scripts first.")
        return

    places_df = pd.read_csv(places_path)
    reviews_df = pd.read_csv(reviews_path)

    # Automatically identify review text column
    review_col = None
    for col in ["cleaned_review", "cleaned_text", "review_text", "Review", "text"]:
        if col in reviews_df.columns:
            review_col = col
            break
            
    if not review_col:
        print(f"Warning: Could not find review text column in {reviews_df.columns.tolist()}. Falling back to empty strings.")

    # 2. Initialize local ChromaDB persistent store & embedding function
    chroma_client = chromadb.PersistentClient(path="chroma_db")
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    collection = chroma_client.get_or_create_collection(
        name="travel_destinations",
        embedding_function=sentence_transformer_ef,
        metadata={"hnsw:space": "cosine"}
    )

    documents = []
    metadatas = []
    ids = []

    # 3. Construct contextual documents per destination
    for idx, place in places_df.iterrows():
        p_id = str(place.get("place_id", f"P_{idx+1:03d}"))
        p_name = str(place.get("place_name", place.get("name", "Unknown Place")))
        category = str(place.get("category", "Travel Destination"))
        location = str(place.get("location", place.get("city", "India")))

        # Fetch top review highlights safely
        if review_col and "place_id" in reviews_df.columns:
            place_revs = reviews_df[reviews_df["place_id"] == p_id][review_col].dropna().head(5).tolist()
            review_snippets = "\n- ".join(place_revs) if place_revs else "No verified review highlights available."
        else:
            review_snippets = "No verified review highlights available."

        # ABSA aspect ratings
        scenery = place.get("scenery_score", place.get("scenery", 3.5))
        food = place.get("food_score", place.get("food", 3.5))
        nightlife = place.get("nightlife_score", place.get("nightlife", 3.5))
        budget = place.get("budget_score", place.get("budget", 3.5))
        crowd = place.get("crowd_score", place.get("crowd", 3.5))

        document_text = (
            f"Place: {p_name} | Category: {category} | Location: {location}\n"
            f"Aspect Ratings: Scenery: {scenery}/5, Food: {food}/5, Nightlife: {nightlife}/5, Budget: {budget}/5, Crowd: {crowd}/5\n"
            f"Verified Review Highlights:\n- {review_snippets}"
        )

        documents.append(document_text)
        ids.append(p_id)
        metadatas.append({
            "place_id": p_id,
            "place_name": p_name,
            "category": category,
            "location": location,
            "scenery_score": float(scenery),
            "food_score": float(food),
            "nightlife_score": float(nightlife),
            "budget_score": float(budget),
            "crowd_score": float(crowd)
        })

    # 4. Upsert documents into ChromaDB collection
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

    print(f"Successfully indexed {len(documents)} destinations into local ChromaDB collection ('chroma_db/')!")

if __name__ == "__main__":
    build_vector_store()