
import pickle
import os

# Paths
MODELS_DIR = "models/"
VECTORIZER_PATH = os.path.join(MODELS_DIR, "text_vectorizer.pkl")
CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.pkl")

def get_prediction(text):
    try:
        with open(VECTORIZER_PATH, "rb") as f:
            vectorizer = pickle.load(f)
        with open(CATEGORY_MODEL_PATH, "rb") as f:
            category_model = pickle.load(f)
        with open(PRIORITY_MODEL_PATH, "rb") as f:
            priority_model = pickle.load(f)
            
        text_vectorized = vectorizer.transform([text])
        category = category_model.predict(text_vectorized)[0]
        priority = priority_model.predict(text_vectorized)[0]
        return category, priority
    except Exception as e:
        return "Error", str(e)

tests = [
    ("The hostel room door lock is broken and feels unsafe at night.", "Urgent"),
    ("Internet speed is slow in Room 304.", "Medium"),
    ("My room caught fire help", "Urgent"),
    ("Light bulb burn", "Urgent"),
    ("Bulb on fire", "Urgent"),
    ("cat found in mess kitchen", "Urgent"),
    ("Water leakage from the ceiling", "High")
]

print("Running Verification Tests...")
all_passed = True
for text, expected_priority in tests:
    cat, prio = get_prediction(text)
    status = "PASS" if prio == expected_priority else "FAIL"
    if status == "FAIL": all_passed = False
    print(f"Text: '{text[:20]}...' | Exp: {expected_priority} | Got: {prio} | {status}")

if all_passed:
    print("\n✅ ALL TESTS PASSED")
else:
    print("\n❌ SOME TESTS FAILED")
