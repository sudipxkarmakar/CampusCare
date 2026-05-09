import pickle
import os

MODELS_DIR = "models/"
VECTORIZER_PATH = os.path.join(MODELS_DIR, "text_vectorizer.pkl")
CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.pkl")

with open(VECTORIZER_PATH, "rb") as f:
    vectorizer = pickle.load(f)
with open(CATEGORY_MODEL_PATH, "rb") as f:
    category_model = pickle.load(f)
with open(PRIORITY_MODEL_PATH, "rb") as f:
    priority_model = pickle.load(f)

test_cases = [
    ("the projector isn't working", "Civil", "High"),
    ("bench broken", "Civil", "Medium"),
    ("WiFi is very slow in library", "IT", "Medium"),
    ("Found a cockroach in the curry", "Mess", "Urgent"),
    ("I have severe fever and vomiting", "Personal", "Urgent"),
    ("My fee payment is not reflecting", "Financial", "High"),
    ("Fan is sparking", "Electrical", "Urgent"),
    ("My phone was stolen from library", "Disciplinary", "Urgent")
]

print("Global Robustness Verification...")
print("-" * 60)
for text, exp_cat, exp_prio in test_cases:
    vec = vectorizer.transform([text])
    cat = category_model.predict(vec)[0]
    prio = priority_model.predict(vec)[0]
    print(f"Text: '{text}'")
    print(f"  Category: {cat} (Expected: {exp_cat})")
    print(f"  Priority: {prio} (Expected: {exp_prio})")
    print("-" * 60)
