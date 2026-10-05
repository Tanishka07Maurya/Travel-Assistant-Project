import os
import pandas as pd
import numpy as np
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def extract_aspect_scores():
    print("--- Starting ABSA Feature Extraction ---")
    
    # 1. Verify input files exist
    reviews_path = "data/cleaned_reviews.csv"
    places_path = "data/places.csv"
    
    if not os.path.exists(reviews_path) or not os.path.exists(places_path):
        print(f"Error: Missing input files. Ensure {reviews_path} and {places_path} are present.")
        return

    df_reviews = pd.read_csv(reviews_path)
    df_places = pd.read_csv(places_path)
    
    analyzer = SentimentIntensityAnalyzer()

    # 2. Define keyword dictionaries for granular aspect mining
    aspect_keywords = {
        'scenery': ['beach', 'sunset', 'view', 'water', 'sea', 'nature', 'sand', 'landscape', 'waves'],
        'food': ['seafood', 'restaurant', 'food', 'drink', 'curry', 'fish', 'meal', 'cafe', 'taste', 'dining'],
        'nightlife': ['club', 'music', 'party', 'bar', 'shack', 'dance', 'night', 'dj', 'pub', 'cocktail'],
        'budget': ['cheap', 'expensive', 'price', 'cost', 'rupee', 'budget', 'value', 'affordable', 'money'],
        'crowd': ['crowd', 'crowded', 'peaceful', 'quiet', 'calm', 'rush', 'people', 'serene', 'isolated']
    }

    place_aspect_records = []

    # 3. Iterate through every destination and extract aspect sentiment
    for index, row in df_places.iterrows():
        place_id = row['place_id']
        place_revs = df_reviews[df_reviews['place_id'] == place_id]
        
        record = {'place_id': place_id}
        
        for aspect, keywords in aspect_keywords.items():
            polarities = []
            for text in place_revs['cleaned_review'].dropna():
                # Check if any aspect keyword matches tokens in the review text
                if any(kw in str(text).lower() for kw in keywords):
                    score = analyzer.polarity_scores(str(text))['compound']
                    polarities.append(score)
            
            # If reviews mention this aspect, compute mean polarity and scale to 1.0 - 5.0
            if polarities:
                avg_polarity = np.mean(polarities)
                star_rating = round(((avg_polarity + 1) / 2) * 4 + 1, 2)
            else:
                star_rating = 3.5  # Neutral baseline if aspect is unmentioned in corpus subset
                
            record[f'{aspect}_score'] = star_rating
            
        place_aspect_records.append(record)

    # 4. Merge scores back into master places metadata
    aspect_df = pd.DataFrame(place_aspect_records)
    final_places_df = pd.merge(df_places, aspect_df, on='place_id')

    # 5. Save output for Member 2's ML clustering and Member 3's RAG
    output_path = "data/places_scored.csv"
    final_places_df.to_csv(output_path, index=False)
    print(f"Successfully generated {output_path} with granular ABSA metrics!")

if __name__ == "__main__":
    extract_aspect_scores()