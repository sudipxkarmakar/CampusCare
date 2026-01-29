import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# Paths
# Paths
DATA_PATH = "data/complaints.csv"
DATA_DIR = "data/"
MODELS_DIR = "models/"
VECTORIZER_PATH = os.path.join(MODELS_DIR, "text_vectorizer.pkl")
CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.pkl")

def check_single_csv_policy():
    # csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.csv')]
    # if len(csv_files) > 1:
        # print(f"CRITICAL ERROR: Multiple CSV files detected in {DATA_DIR}: {csv_files}")
        # print("Violation of SINGLE SOURCE OF TRUTH policy. Aborting.")
        # exit(1)
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} missing.")
        exit(1)

def train():
    check_single_csv_policy()
    print("Loading dataset...")
    
    df = pd.read_csv(DATA_PATH)
    
    # Ensure columns exist
    required_columns = {'text', 'category', 'priority'}
    if not required_columns.issubset(df.columns):
        print(f"Error: Dataset must contain columns: {required_columns}")
        return

    print(f"Dataset loaded. Rows: {len(df)}")
    
    # Preprocessing
    # We will use one vectorizer for both models for simplicity and consistency
    print("Vectorizing text...")
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    X = vectorizer.fit_transform(df['text'])
    
    # Train Category Model
    print("Training Category Model...")
    category_model = MultinomialNB()
    category_model.fit(X, df['category'])
    
    # Train Priority Model
    print("Training Priority Model...")
    priority_model = MultinomialNB()
    priority_model.fit(X, df['priority'])
    
    # Save Artifacts
    print("Saving artifacts...")
    
    # Ensure models dir exists
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)
        
    with open(CATEGORY_MODEL_PATH, "wb") as f:
        pickle.dump(category_model, f)
        
    with open(PRIORITY_MODEL_PATH, "wb") as f:
        pickle.dump(priority_model, f)
        
    print("Training complete! Models saved to:")
    print(f" - {VECTORIZER_PATH}")
    print(f" - {CATEGORY_MODEL_PATH}")
    print(f" - {PRIORITY_MODEL_PATH}")

if __name__ == "__main__":
    train()
