import pandas as pd

#Load the cleaned datasetv
df = pd.read_csv(
    "C:\\Users\\DELL\\Desktop\\AI_Travel_Recommendation_Assistant\\data\\cleaned_reviews.csv"
)

print(df.head())
print(df.columns)

#Separate the reviews and sentiment labels
X = df["cleaned_review"]
y = df["sentiment_label"]

print("Reviews:", len(X))
print("Labels:", len(y))

#Split the data for training and testing
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training reviews:", len(X_train))
print("Testing reviews:", len(X_test))

#Convert text into numbers using TF-IDF
from sklearn.feature_extraction.text import TfidfVectorizer

vectorizer = TfidfVectorizer()

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

print("Training data shape:", X_train_tfidf.shape)
print("Testing data shape:", X_test_tfidf.shape)

#Train the Logistic Regression model
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)

model.fit(X_train_tfidf, y_train)

print("Logistic Regression model trained successfully!")


#Test the model
y_pred = model.predict(X_test_tfidf)

print("Predictions generated successfully!")
print(y_pred[:10])

#Calculate Accuracy
from sklearn.metrics import accuracy_score

accuracy = accuracy_score(y_test, y_pred)

print("Accuracy:", accuracy)
print("Accuracy percentage:", round(accuracy * 100, 2), "%")

#Get Precision, Recall, and F1-score
from sklearn.metrics import classification_report

print(classification_report(y_test, y_pred))

#Create the confusion matrix
from sklearn.metrics import confusion_matrix

cm = confusion_matrix(
    y_test,
    y_pred,
    labels=["Negative", "Neutral", "Positive"]
)

print("Confusion Matrix:")
print(cm)


#CountVectorizer for the Multinomial Naive Bayes model
from sklearn.feature_extraction.text import CountVectorizer

count_vectorizer = CountVectorizer()

X_train_count = count_vectorizer.fit_transform(X_train)
X_test_count = count_vectorizer.transform(X_test)

print("Naive Bayes training data shape:", X_train_count.shape)
print("Naive Bayes testing data shape:", X_test_count.shape)


#Train the Naive Bayes model
from sklearn.naive_bayes import MultinomialNB

nb_model = MultinomialNB()

nb_model.fit(X_train_count, y_train)

print("Naive Bayes model trained successfully!")


#Generate Naive Bayes predictions
y_pred_nb = nb_model.predict(X_test_count)

print("Naive Bayes predictions generated successfully!")
print(y_pred_nb[:10])

#Calculate Accuracy
from sklearn.metrics import accuracy_score

nb_accuracy = accuracy_score(y_test, y_pred_nb)

print("Naive Bayes Accuracy:", nb_accuracy * 100, "%")

#Naive Bayes Confusion Matrix
from sklearn.metrics import confusion_matrix

cm_nb = confusion_matrix(y_test, y_pred_nb)

print("Naive Bayes Confusion Matrix:")
print(cm_nb)

#Classification Report
from sklearn.metrics import classification_report

print("Naive Bayes Classification Report:")
print(classification_report(y_test, y_pred_nb))

#Save the results
results = {
    "Logistic Regression + TF-IDF": 79.17,
    "Multinomial Naive Bayes + CountVectorizer": 82.083
}

print("\nModel Comparison:")
for model, accuracy in results.items():
    print(f"{model}: {accuracy:.2f}%")

# Save the trained models and vectorizers

import joblib

joblib.dump(
    model,
    r"C:\Users\DELL\Desktop\AI_Travel_Recommendation_Assistant\models\logistic_regression_model.pkl"
)

joblib.dump(
    nb_model,
    r"C:\Users\DELL\Desktop\AI_Travel_Recommendation_Assistant\models\naive_bayes_model.pkl"
)

joblib.dump(
    vectorizer,
    r"C:\Users\DELL\Desktop\AI_Travel_Recommendation_Assistant\models\tfidf_vectorizer.pkl"
)

joblib.dump(
    count_vectorizer,
    r"C:\Users\DELL\Desktop\AI_Travel_Recommendation_Assistant\models\count_vectorizer.pkl"
)

print("\nModels and vectorizers saved successfully!")