from fastapi import FastAPI
from fastapi.responses import JSONResponse
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


# --------------------------------------------------
# CORS
# --------------------------------------------------

@app.middleware("http")
async def add_cors_headers(request, call_next):

    if request.method == "OPTIONS":
        return JSONResponse(
            content={"message": "CORS preflight OK"},
            headers={
                "Access-Control-Allow-Origin": "https://nlp-emotion-classifer-1.onrender.com",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )

    response = await call_next(request)

    response.headers["Access-Control-Allow-Origin"] = (
        "https://nlp-emotion-classifer-1.onrender.com"
    )
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"

    return response


# --------------------------------------------------
# Load Model
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "model.pkl")
tfidf = joblib.load(BASE_DIR / "tfidf.pkl")

print("MODEL CLASSES =", model.classes_)
print("MODEL TYPE =", type(model))


# --------------------------------------------------
# Emotion Mapping
# --------------------------------------------------

emotion_mapping = {
    0: "sadness",
    1: "anger",
    2: "love",
    3: "surprise",
    4: "fear",
    5: "joy"
}


# --------------------------------------------------
# Request Schema
# --------------------------------------------------

class TextInput(BaseModel):
    text: str


# --------------------------------------------------
# Text Preprocessing
# --------------------------------------------------

def preprocess_text(text):

    text = text.lower()

    text = text.translate(
        str.maketrans("", "", string.punctuation)
    )

    text = re.sub(r"\d+", "", text)

    text = " ".join(text.split())

    return text


# --------------------------------------------------
# Home Route
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "Emotion Classifier API is running"
    }


# --------------------------------------------------
# Prediction Route
# --------------------------------------------------

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

    print("RAW PREDICTION =", prediction)

    emotion = emotion_mapping.get(
        int(prediction),
        "unknown"
    )

    print("MAPPED EMOTION =", emotion)

    return {
        "text": text,
        "emotion": emotion
    }


print("NEW MAIN.PY LOADED")