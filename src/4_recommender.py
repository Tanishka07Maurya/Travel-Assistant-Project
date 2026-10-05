import os
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def run_ml_clustering():
    print("--- Starting Unsupervised ML Clustering (K-Means) ---")
    
    input_path = "data/places_scored.csv"
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run ABSA extraction script first.")
        return

    df = pd.read_csv(input_path)

    # 1. Select feature columns for clustering
    feature_cols = ['scenery_score', 'food_score', 'nightlife_score', 'budget_score', 'crowd_score']
    X = df[feature_cols].fillna(3.5)

    # 2. Normalize features using StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 3. Apply K-Means Clustering (k=3 distinct persona archetypes)
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['persona_cluster'] = kmeans.fit_predict(X_scaled)

    # 4. Map cluster IDs to descriptive semantic labels
    cluster_mapping = {
        0: "Party & Nightlife Hub",
        1: "Peaceful Nature & Scenic Retreat",
        2: "Balanced Culture & Budget Destination"
    }
    df['traveler_persona'] = df['persona_cluster'].map(cluster_mapping)

    # 5. Save clustered dataset
    output_path = "data/places_clustered.csv"
    df.to_csv(output_path, index=False)
    print(f"Successfully generated {output_path}. Assigned all destinations to ML personas.")
    print(df[['place_name', 'traveler_persona']].head(5))

def calculate_user_match(user_weights: dict):
    """
    Multi-Criteria Utility Scoring Engine:
    Takes user preference weights and ranks destinations.
    """
    input_path = "data/places_clustered.csv"
    if not os.path.exists(input_path):
        run_ml_clustering()
        
    df = pd.read_csv(input_path)
    
    total_weight = sum(user_weights.values())
    if total_weight == 0:
        norm_weights = {k: 0.2 for k in user_weights}
    else:
        norm_weights = {k: v / total_weight for k, v in user_weights.items()}

    # Compute dot product utility match score
    df['match_score'] = (
        df['scenery_score'] * norm_weights.get('scenery', 0.2) +
        df['food_score'] * norm_weights.get('food', 0.2) +
        df['nightlife_score'] * norm_weights.get('nightlife', 0.2) +
        df['budget_score'] * norm_weights.get('budget', 0.2) +
        df['crowd_score'] * norm_weights.get('crowd', 0.2)
    )

    df['match_percentage'] = (df['match_score'] / 5.0 * 100).round(1)
    ranked_df = df.sort_values(by='match_percentage', ascending=False)
    return ranked_df

if __name__ == "__main__":
    run_ml_clustering()
    
    # Test query evaluation
    print("\n--- Testing Multi-Criteria Ranking Engine ---")
    test_weights = {'scenery': 0.4, 'food': 0.3, 'nightlife': 0.1, 'budget': 0.1, 'crowd': 0.1}
    results = calculate_user_match(test_weights)
    print(results[['place_name', 'match_percentage', 'traveler_persona']].head(3))