import csv
import os

DATA_PATH = "data/complaints.csv"

new_data = [
    # Personal Issues (High Priority usually, but hidden from public wall)
    ("I am feeling very lonely and depressed.", "Personal", "High"),
    ("My roommate is harassing me and I feel unsafe.", "Personal", "High"),
    ("I am having a hard time adjusting to hostel life.", "Personal", "Medium"),
    ("I feel very anxious about my exams.", "Personal", "Medium"),
    ("My roommate fights with me every night.", "Personal", "High"),
    ("I am homesick and sad.", "Personal", "Medium"),
    ("Depression is affecting my studies.", "Personal", "High"),
    ("I want to talk to a counselor about my stress.", "Personal", "High"),
    ("My roommate plays loud music and I can't sleep.", "Personal", "Medium"),
    ("I am having suicidal thoughts.", "Personal", "Urgent"),
    ("I feel isolated and have no friends.", "Personal", "Medium"),
    ("Mental health support is needed.", "Personal", "High"),
    ("I am stressed and cannot focus.", "Personal", "Medium"),
    ("Anxiety panic attacks are frequent.", "Personal", "High"),
    
    # Disciplinary Issues
    ("Students are drinking alcohol in the hostel.", "Disciplinary", "High"),
    ("There was a physical fight in the common room.", "Disciplinary", "Urgent"),
    ("Someone stole my laptop from my room.", "Disciplinary", "High"),
    ("Loud noise and partying in room 303 after curfew.", "Disciplinary", "Medium"),
    ("Ragging incident near the canteen.", "Disciplinary", "Urgent"),
    ("Smoking in the corridors.", "Disciplinary", "High"),
    ("Unauthorized entry of outsiders in the hostel.", "Disciplinary", "High"),
    ("Vandalism of college property in the hallway.", "Disciplinary", "High"),
    ("Harassment by seniors.", "Disciplinary", "Urgent"),
    
    # More IT (to fix existing misclassification)
    ("Wifi is not connecting in my laptop.", "IT", "Medium"),
    ("Internet speed is too slow to attend online classes.", "IT", "High"),
    ("LAN port is broken in my room.", "IT", "Medium"),
    ("Cannot access the college portal.", "IT", "High"),
    ("Wifi signal is weak in the corner rooms.", "IT", "Medium"),
    
    # More Electrical
    ("Tube light is flickering.", "Electrical", "Low"),
    ("Switch board is sparking.", "Electrical", "High"),
    ("Power cut in the hostel for 3 hours.", "Electrical", "High"),
    
    # More Sanitation
    ("Bathroom is dirty and smells bad.", "Sanitation", "Medium"),
    ("Water cooler is not working.", "Sanitation", "High"),
    ("Flush is broken in the toilet.", "Sanitation", "High")
]

def append_data():
    # Read existing to verify we don't duplicate too much if run multiple times
    # (Simple check: if "Personal" exists, maybe don't add? Or just add anyway for weight)
    # We'll just append.
    
    # Overcome class imbalance by duplicating the new data
    weighted_data = new_data * 20 

    with open(DATA_PATH, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(weighted_data)
    
    print(f"Added {len(weighted_data)} new samples to {DATA_PATH}")

if __name__ == "__main__":
    append_data()
