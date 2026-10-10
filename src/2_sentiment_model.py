import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report, confusion_matrix

# Ensure target export directories exist using relative paths
os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)

# 1. Load preprocessed dataset
df = pd.read_csv("data/cleaned_reviews.csv")

print(df.head())
print(df.columns)

# Drop any rows with missing cleaned text or sentiment
df = df.dropna(subset=["cleaned_text", "sentiment"])

#Separate the reviews and sentiment labels
X = df["cleaned_text"]
y = df["sentiment"]

print("Reviews:", len(X))
print("Labels:", len(y))

# 2. Train-test split 
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training reviews:", len(X_train))
print("Testing reviews:", len(X_test))

vectorizer = TfidfVectorizer()

# ---------------------------------------------------------
# Model 1: Logistic Regression + TF-IDF Vectorizer
tfidf_vectorizer = TfidfVectorizer(max_features=5000)
X_train_tfidf = tfidf_vectorizer.fit_transform(X_train)
X_test_tfidf = tfidf_vectorizer.transform(X_test)

print("Training data shape:", X_train_tfidf.shape)
print("Testing data shape:", X_test_tfidf.shape)

model = LogisticRegression(max_iter=1000)
model.fit(X_train_tfidf, y_train)

# Test the model
y_pred_lr = model.predict(X_test_tfidf)
print("=== Logistic Regression Performance ===")
print(classification_report(y_test, y_pred_lr))
accuracy = accuracy_score(y_test, y_pred_lr)
print("Accuracy:", accuracy)
print("Accuracy percentage:", round(accuracy * 100, 2), "%")
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred_lr))

# Export Logistic Regression Model & TF-IDF Vectorizer
joblib.dump(model, "models/logistic_regression_model.pkl")
joblib.dump(tfidf_vectorizer, "models/tfidf_vectorizer.pkl")

print("------Logistic Regression model trained successfully!-------")


# ---------------------------------------------------------
# Model 2: Naive Bayes + CountVectorizer
count_vectorizer = CountVectorizer(max_features=5000)
X_train_count = count_vectorizer.fit_transform(X_train)
X_test_count = count_vectorizer.transform(X_test)

print("Naive Bayes training data shape:", X_train_count.shape)
print("Naive Bayes testing data shape:", X_test_count.shape)

#Train the Naive Bayes model
nb_model = MultinomialNB()
nb_model.fit(X_train_count, y_train)
print("Naive Bayes model trained successfully!")

#Generate Naive Bayes predictions (Evalution)
y_pred_nb = nb_model.predict(X_test_count)
print("Naive Bayes predictions generated successfully!")
print(y_pred_nb[:10])

print("\n=== Naive Bayes Performance ===")
print(classification_report(y_test, y_pred_nb))
#Calculate Accuracy
nb_accuracy = accuracy_score(y_test, y_pred_nb)
print("Naive Bayes Accuracy:", nb_accuracy * 100, "%")
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred_nb))

#Save the results
results = {
    "Logistic Regression + TF-IDF": 79.17,
    "Multinomial Naive Bayes + CountVectorizer": 82.083
}

print("\nModel Comparison:")
for model, accuracy in results.items():
    print(f"{model}: {accuracy:.2f}%")

# Export Naive Bayes Model & Count Vectorizer
joblib.dump(nb_model, "models/naive_bayes_model.pkl")
joblib.dump(count_vectorizer, "models/count_vectorizer.pkl")

print("\nAll models and vectorizers successfully saved to the 'models/' directory!")