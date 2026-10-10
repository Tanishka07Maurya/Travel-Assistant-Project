import os
import pandas as pd
import numpy as np
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Ensure target directories exist
os.makedirs("data", exist_ok=True)
nltk.download('vader_lexicon', quiet=True)

# 1. Load places and reviews data via relative paths
places_df = pd.read_csv("data/places.csv")
reviews_df = pd.read_csv("data/cleaned_reviews.csv")

# 2. Check and ensure 'place_id' exists in places.csv
if "place_id" not in places_df.columns:
    print("Warning: 'place_id' missing in places.csv. Generating place_id automatically...")
    places_df["place_id"] = [f"P_{i+1:03d}" for i in range(len(places_df))]
    places_df.to_csv("data/places.csv", index=False)

# Ensure 'place_id' exists in cleaned_reviews.csv
if "place_id" not in reviews_df.columns:
    print("Warning: 'place_id' missing in cleaned_reviews.csv. Assigning default match...")
    # If no place_id, map reviews round-robin or assign to first place
    reviews_df["place_id"] = places_df["place_id"].iloc[0]

# 3. ABSA Keyword Taxonomy Definitions
ASPECT_KEYWORDS = {
    "scenery": ["view", "scenery", "landscape", "sunset", "nature", "beach", "mountain", "beautiful", "scenic"],
    "food": ["food", "restaurant", "cafe", "cuisine", "dishes", "seafood", "taste", "delicious", "dinner"],
    "nightlife": ["nightlife", "bar", "pub", "club", "music", "party", "drinks", "evening"],
    "budget": ["cheap", "affordable", "price", "expensive", "cost", "budget", "value", "entry fee"],
    "crowd": ["crowd", "peaceful", "quiet", "noisy", "busy", "crowded", "tourists", "calm"]
}
analyzer = SentimentIntensityAnalyzer()

def extract_aspect_scores(review_text):
    print("--- Starting ABSA Feature Extraction ---")
    scores = {aspect: [] for aspect in ASPECT_KEYWORDS}
    if not isinstance(review_text, str):
        return {aspect: 0.0 for aspect in ASPECT_KEYWORDS}

    sentences = review_text.lower().split(".")
    for sentence in sentences:
        compound = analyzer.polarity_scores(sentence)["compound"]
        for aspect, keywords in ASPECT_KEYWORDS.items():
            if any(kw in sentence for kw in keywords):
                scores[aspect].append(compound)

    # Average sentiment score for matched keywords per aspect
    return {
        aspect: (sum(vals) / len(vals) if vals else 0.0)
        for aspect, vals in scores.items()
    }

# 4. Compute ABSA scores per review
print("Extracting aspect scores from reviews...")
absa_results = reviews_df["cleaned_text"].apply(extract_aspect_scores)
absa_df = pd.DataFrame(list(absa_results))

# Merge aspect scores with review place IDs
reviews_absa = pd.concat([reviews_df[["place_id"]], absa_df], axis=1)

# Group by place_id to get average aspect ratings for each destination
place_aspect_scores = reviews_absa.groupby("place_id").mean().reset_index()

# Merge back with destination metadata
places_scored = pd.merge(places_df, place_aspect_scores, on="place_id", how="left").fillna(0)

# Save output
places_scored.to_csv("data/places_scored.csv", index=False)
print("ABSA extraction complete. Output saved to 'data/places_scored.csv'.")

if __name__ == "__main__":
    extract_aspect_scores()