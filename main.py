from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import re
import string
from pathlib import Path


app = FastAPI(
    title="Emotion Classifier API",
    description="API for predicting emotions from text",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nlp-emotion-classifer-1.onrender.com"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Base directory
BASE_DIR = Path(__file__).resolve().parent


# Load model and TF-IDF
model = joblib.load(BASE_DIR / "model.pkl")
tfidf = joblib.load(BASE_DIR / "tfidf.pkl")


# Emotion mapping
emotion_mapping = {
    0: "sadness",
    1: "anger",
    2: "love",
    3: "surprise",
    4: "fear",
    5: "joy"
}


# Request body
class TextInput(BaseModel):
    text: str


# Text preprocessing
def preprocess_text(text):
    text = text.lower()
    text = text.translate(
        str.maketrans("", "", string.punctuation)
    )
    text = re.sub(r"\d+", "", text)
    text = " ".join(text.split())

    return text


# Home route
@app.get("/")
def home():
    return {
        "message": "Emotion Classifier API is running"
    }


# Prediction route
@app.post("/predict")
def predict_emotion(data: TextInput):

    text = data.text

    if not text.strip():
        return {
            "error": "Please enter some text"
        }

    cleaned_text = preprocess_text(text)

    text_vector = tfidf.transform([cleaned_text])

    prediction = model.predict(text_vector)[0]

    emotion = emotion_mapping.get(
        int(prediction),
        "unknown"
    )

    return {
        "text": text,
        "emotion": emotion
    }