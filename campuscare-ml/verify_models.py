import pickle
import os
import sys

# Paths
MODELS_DIR = "models/"
VECTORIZER_PATH = os.path.join(MODELS_DIR, "text_vectorizer.pkl")
CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.pkl")
OUTPUT_FILE = "verify_output.txt"

def test_prediction():
    with open(OUTPUT_FILE, "w") as f_out:
        print("Loading models...", file=f_out)
        try:
            with open(VECTORIZER_PATH, "rb") as f:
                vectorizer = pickle.load(f)
            with open(CATEGORY_MODEL_PATH, "rb") as f:
                category_model = pickle.load(f)
            with open(PRIORITY_MODEL_PATH, "rb") as f:
                priority_model = pickle.load(f)
            print("Models loaded.", file=f_out)
        except Exception as e:
            print(f"Error loading models: {e}", file=f_out)
            return

        test_cases = [
            ("The wifi is not working in the hostel.", "IT", "High"),
            ("There is a water leakage in the bathroom.", "Sanitation", "High"),
            ("The food in the mess is cold and stale.", "Mess", "Medium"),
            ("I am feeling very lonely and depressed.", "Personal", "High"), # This should be categorized as Personal
            ("The fan in my room is broken.", "Electrical", "Medium")
        ]

        print("\nRunning test cases:", file=f_out)
        for text, expected_category, expected_priority in test_cases:
            try:
                vec = vectorizer.transform([text])
                cat = category_model.predict(vec)[0]
                prio = priority_model.predict(vec)[0]
                print(f"Input: '{text}'", file=f_out)
                print(f"  Predicted Category: {cat} (Expected: {expected_category})", file=f_out)
                print(f"  Predicted Priority: {prio} (Expected: {expected_priority})", file=f_out)
            except Exception as e:
                print(f"Error predicting for '{text}': {e}", file=f_out)

if __name__ == "__main__":
    test_prediction()
