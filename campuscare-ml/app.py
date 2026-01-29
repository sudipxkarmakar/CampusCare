import pickle
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import subprocess
import threading
import csv

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

class FeedbackInput(BaseModel):
    text: str
    category: str
    priority: str

def retrain_model_task():
    print('Starting background retraining...')
    try:
        # Run train_model.py as a subprocess
        result = subprocess.run(['python', 'train_model.py'], capture_output=True, text=True)
        print(result.stdout)
        if result.returncode == 0:
            print('Retraining successful. Reloading models...')
            # Reload models into memory
            global vectorizer, category_model, priority_model
            with open(VECTORIZER_PATH, 'rb') as f:
                vectorizer = pickle.load(f)
            with open(CATEGORY_MODEL_PATH, 'rb') as f:
                category_model = pickle.load(f)
            with open(PRIORITY_MODEL_PATH, 'rb') as f:
                priority_model = pickle.load(f)
            print('Models reloaded.')
        else:
            print(f'Retraining failed: {result.stderr}')
    except Exception as e:
        print(f'Error during retraining: {e}')

@app.post('/feedback')
async def feedback(input_data: FeedbackInput, background_tasks: BackgroundTasks):
    # 1. Append to dataset
    try:
        data_path = "data/complaints.csv"
        # Check if file ends with newline
        with open(data_path, 'r') as f:
            content = f.read()
            if not content.endswith('\n'):
                prefix = '\n'
            else:
                prefix = ''
        
        with open(data_path, 'a', newline='') as f:
            if prefix:
                f.write(prefix)
            writer = csv.writer(f)
            writer.writerow([input_data.text, input_data.category, input_data.priority])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to save feedback: {str(e)}')

    # 2. Trigger Retraining in Background
    background_tasks.add_task(retrain_model_task)

    return {'message': 'Feedback received and retraining triggered.'}

