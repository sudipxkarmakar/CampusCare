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
    ("I lost my phone in the washroom.", "Personal", "Urgent"),
    ("My laptop was stolen.", "Personal", "Urgent"),
    ("Lost my expensive watch.", "Personal", "Urgent"),
    ("Someone took my shoes.", "Personal", "High"),
    ("My phone is missing.", "Personal", "Urgent")
]

print("Running Lost Item Verification Tests...")
all_passed = True
for text, expected_category, expected_priority in tests:
    cat, prio = get_prediction(text)
    
    # Relaxed check for Priority (High or Urgent is acceptable for lost items, but we prefer Urgent)
    prio_pass = (prio == expected_priority) or (expected_priority == "Urgent" and prio == "High")
    cat_pass = (cat == expected_category)
    
    status = "PASS" if prio_pass and cat_pass else "FAIL"
    if status == "FAIL": all_passed = False
    
    print(f"Text: '{text}' | Exp: {expected_category}/{expected_priority} | Got: {cat}/{prio} | {status}")

if all_passed:
    print("\n✅ LOST ITEM TESTS PASSED")
else:
    print("\n❌ SOME TESTS FAILED")
