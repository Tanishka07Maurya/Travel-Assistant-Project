import pandas as pd
import re
import nltk

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

df = pd.read_csv("data/reviews.csv")

print(df.head())
print(df.columns)

#missing values check
print(df.isnull().sum())

stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

#Create the cleaned_review column
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    
    tokens = word_tokenize(text)
    
    tokens = [
        word for word in tokens
        if word not in stop_words
    ]
    
    tokens = [
        lemmatizer.lemmatize(word)
        for word in tokens
    ]
    
    return " ".join(tokens)


df["cleaned_review"] = df["review_text"].apply(preprocess_text)

print(df[["review_text", "cleaned_review"]].head())


#Create the sentiment labels
def get_sentiment(rating):
    if rating <= 2:
        return "Negative"
    elif rating == 3:
        return "Neutral"
    else:
        return "Positive"


df["sentiment_label"] = df["user_rating"].apply(get_sentiment)

print(df[["user_rating", "sentiment_label"]].head(10))


#Save the processed dataset
df.to_csv("data/cleaned_reviews.csv", index=False)

print("Cleaned dataset saved successfully!")


#Check the sentiment distribution
print(df["sentiment_label"].value_counts())


#Save this distribution
sentiment_counts = df["sentiment_label"].value_counts()

sentiment_counts.to_csv(
    "data/sentiment_distribution.csv",
    header=["review_count"]
)

print("Sentiment distribution saved successfully!")
