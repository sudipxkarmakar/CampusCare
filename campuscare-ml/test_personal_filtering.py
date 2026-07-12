import pickle
import os

MODELS_DIR = "models/"
VECTORIZER_PATH = os.path.join(MODELS_DIR, "text_vectorizer.pkl")
CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.pkl")

def verify_personal_filtering():
    print("==================================================")
    print("Testing ML Classification for Personal/Medical Issues")
    print("==================================================")

    # 1. Load trained models
    if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(CATEGORY_MODEL_PATH):
        print("Error: Models are not found. Please train models first using train_model.py")
        return

    with open(VECTORIZER_PATH, "rb") as f:
        vectorizer = pickle.load(f)
    with open(CATEGORY_MODEL_PATH, "rb") as f:
        category_model = pickle.load(f)
    with open(PRIORITY_MODEL_PATH, "rb") as f:
        priority_model = pickle.load(f)

    # Test cases related to headache, medical, mental health, personal issues
    test_cases = [
        "I have a severe headache and cannot attend class today.",
        "I am feeling sick and have a high fever in the hostel.",
        "symptoms: headache and nausea after lunch",
        "I feel extremely stressed, anxious and depressed about my exams.",
        "I need a doctor, my roommate is unconscious.",
        "My stomach is aching badly since morning."
    ]

    for text in test_cases:
        # Transform and predict
        vec = vectorizer.transform([text])
        category = category_model.predict(vec)[0]
        priority = priority_model.predict(vec)[0]
        
        print(f"Complaint Text: '{text}'")
        print(f" -> Classified Category: {category}")
        print(f" -> Predicted Priority:  {priority}")
        
        # Verify the privacy filtering logic
        is_private = (category == "Personal")
        print(f" -> Will it go to Public/Transparency Wall? {'NO (Filtered out)' if is_private else 'YES (Visible)'}")
        print("-" * 50)

if __name__ == "__main__":
    verify_personal_filtering()
