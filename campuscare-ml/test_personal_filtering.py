import pickle
import os

MODELS_DIR = "models/"
VECTORIZER_PATH = os.path.join(MODELS_DIR, "text_vectorizer.pkl")
CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.pkl")

def verify_pro_testing():
    print("==================================================")
    print("Pro Tester: Verifying Complex/Overlapping Complaints")
    print("==================================================")

    if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(CATEGORY_MODEL_PATH):
        print("Error: Models are not found. Please train models first using train_model.py")
        return

    with open(VECTORIZER_PATH, "rb") as f:
        vectorizer = pickle.load(f)
    with open(CATEGORY_MODEL_PATH, "rb") as f:
        category_model = pickle.load(f)
    with open(PRIORITY_MODEL_PATH, "rb") as f:
        priority_model = pickle.load(f)

    # Complex/Overlapping edge cases designed by a pro tester to try to trick the ML/Filters
    test_cases = [
        # Overlapping location/non-personal words with personal medical issues
        ("I fell down and broke my leg in the mess hall.", "Personal"),
        ("I have a severe stomach ache after eating mess food.", "Personal"),
        ("I am feeling very depressed due to ragging in the hostel.", "Personal"),
        ("I have a headache because of the loud noise of the broken fan in my room.", "Personal"),
        ("Someone stole my medicine for fever.", "Personal"),
        ("I fainted in the IT lab while coding.", "Personal"),
        ("I cut my hand while cleaning the room.", "Personal"),
        ("I need a counselor, I am crying in my room because of stress.", "Personal"),
        ("My friend collapsed near the basketball court.", "Personal"),
        ("I have a burning fever today and need a first aid kit.", "Personal"),

        # Clear Non-Personal complaints
        ("The light bulb in the canteen is not working.", "Electrical"),
        ("Wifi is completely down in the IT lab.", "IT"),
        ("The water cooler in block B is dirty and needs cleaning.", "Sanitation")
    ]

    for text, expected in test_cases:
        # Transform and predict using python ML model
        vec = vectorizer.transform([text])
        category = category_model.predict(vec)[0]
        priority = priority_model.predict(vec)[0]
        
        print(f"Text: '{text}'")
        print(f" -> ML Predicted Category: {category}")
        print(f" -> ML Predicted Priority: {priority}")
        
        # Verify the heuristic safety-net + ML category selection
        # (This duplicates the double-insurance logic built in the node backend)
        
        # Helper includesAny function
        def includesAny(t, words):
            return any(word in t.lower() for word in words)

        personalKeywords = [
            'personal', 'mentor', 'teacher', 'fever', 'headache', 'sick', 'sickness',
            'anxiety', 'depression', 'stressed', 'stress', 'medical', 'vomit', 'vomiting',
            'illness', 'doctor', 'ankle', 'injury', 'injured', 'pain', 'hurt', 'wound',
            'hospital', 'accident', 'cough', 'bleed', 'bleeding', 'counseling', 'mental',
            'unconscious', 'fainted', 'faint', 'leg', 'arm', 'hand', 'foot', 'body',
            'stomach', 'chest', 'head', 'ear', 'eye', 'tooth', 'throat', 'ache', 'aching',
            'fracture', 'sprain', 'nausea', 'dizzy', 'dizziness', 'burn', 'burnt', 'cut',
            'medicine', 'pill', 'clinic', 'nurse', 'cramp', 'panic', 'suicidal', 'suicide',
            'homesick', 'sad', 'crying', 'depressed', 'fell down', 'collapsed', 'collapse',
            'disease', 'allergy', 'allergic', 'first aid', 'flu', 'cold', 'infection'
        ]

        final_category = category
        if includesAny(text, personalKeywords):
            final_category = 'Personal'

        is_private = (final_category == 'Personal')
        print(f" -> Final Category:        {final_category}")
        print(f" -> Public Wall Status:    {'PRIVATE (Filtered out)' if is_private else 'PUBLIC (Visible)'}")
        
        match_status = "PASS" if final_category == expected else "FAIL"
        print(f" -> Test Result:           [{match_status}]")
        print("-" * 60)

if __name__ == "__main__":
    verify_pro_testing()
