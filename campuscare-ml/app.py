import pickle
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Load Models
MODELS_DIR = "models/"
VECTORIZER_PATH = os.path.join(MODELS_DIR, "text_vectorizer.pkl")
CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.pkl")

print("Loading ML models...")
try:
    with open(VECTORIZER_PATH, "rb") as f:
        vectorizer = pickle.load(f)
    with open(CATEGORY_MODEL_PATH, "rb") as f:
        category_model = pickle.load(f)
    with open(PRIORITY_MODEL_PATH, "rb") as f:
        priority_model = pickle.load(f)
    print("Models loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    # We might want to raise an error or just log it, but for now we'll let it fail if used
    vectorizer = None
    category_model = None
    priority_model = None

class ComplaintInput(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_complaint(input_data: ComplaintInput):
    if not vectorizer or not category_model or not priority_model:
        raise HTTPException(status_code=500, detail="ML models not loaded")

    # Vectorize input
    try:
        text_vectorized = vectorizer.transform([input_data.text])
        
        # Predict
        category = category_model.predict(text_vectorized)[0]
        priority = priority_model.predict(text_vectorized)[0]
        
        return {
            "category": category,
            "priority": priority
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
