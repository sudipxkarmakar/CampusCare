
import csv
import random
import os
import subprocess
import sys

# TARGET FILE
DATA_FILE = "data/complaints.csv"

# ---------------------------------------------------------
# GENERATION LOGIC (Simplified for robustness)
# ---------------------------------------------------------
rooms = [str(n) for n in range(101, 500)]
hostels = ['Block A', 'Block B', 'Girls Hostel']

common_templates = [
    ("Fan not working in Room {room}", "Electrical", "High"),
    ("Water not coming in {hostel} washroom", "Sanitation", "High"),
    ("Internet slow in Room {room}", "IT", "Medium"),
    ("Mess food in {hostel} is stale", "Mess", "High"),
    ("Window broken in Room {room}", "Civil", "Medium"),
    ("Lost ID card", "Other", "Low")
]

def generate_base():
    print(f"Generating base dataset into {DATA_FILE}...")
    rows = []
    # Generate ~900 rows
    for _ in range(950):
        tmpl, cat, prio = random.choice(common_templates)
        text = tmpl.format(room=random.choice(rooms), hostel=random.choice(hostels))
        rows.append([text, cat, prio])
    
    # Write
    try:
        with open(DATA_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["text", "category", "priority"])
            writer.writerows(rows)
        print("Base generation complete.")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to write to {DATA_FILE}. Is it locked? {e}")
        sys.exit(1)

# ---------------------------------------------------------
# AUGMENTATION LOGIC (User Priorities)
# ---------------------------------------------------------
def augment():
    print("Augmenting with strict priority examples...")
    # Read existing
    with open(DATA_FILE, 'r') as f:
        reader = list(csv.reader(f))
        header = reader[0]
        data = reader[1:]

    new_examples = [
        # URGENT - Security / Fire
        ["The light switch is burning and smells weird.", "Electrical", "Urgent"],
        ["Light bulb burn", "Electrical", "Urgent"],
        ["Bulb on fire", "Electrical", "Urgent"],
        ["Spark from switchboard", "Electrical", "Urgent"],
        
        # URGENT - Animals / Hygiene Risk
        ["Cats are roaming inside the mess kitchen.", "Mess", "Urgent"],
        ["cat found in mess kitchen", "Mess", "Urgent"],
        ["Dead animal in water tank", "Sanitation", "Urgent"],
        
        # URGENT - Security / Access
        ["The hostel room door lock is broken and feels unsafe.", "Civil", "Urgent"],
        ["Broken lock on main door", "Civil", "Urgent"],
        ["Theft in room", "Disciplinary", "Urgent"],
        ["Harassment in corridor", "Disciplinary", "Urgent"],

        # HIGH - Service Unavailable
        ["Water leakage from the ceiling", "Civil", "High"],
        ["No water supply", "Sanitation", "High"],
        ["Geyser not working", "Electrical", "High"],

        # MEDIUM - Inconvenience
        ["Tube light is flickering in corridor.", "Electrical", "Medium"],
        ["Internet speed is slow", "IT", "Medium"],
        ["Wifi is weak", "IT", "Medium"]
    ]
    
    # Expand new examples to ensure weight
    final_data = data + (new_examples * 5) # 5x weight
    
    with open(DATA_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(final_data)
    print("Augmentation complete.")

# ---------------------------------------------------------
# TRAINING LOGIC
# ---------------------------------------------------------
def train():
    print("Running training...")
    try:
        subprocess.run(["python", "train_model.py"], check=True)
    except subprocess.CalledProcessError:
        print("Training failed.")
        sys.exit(1)

# ---------------------------------------------------------
# EXECUTION
# ---------------------------------------------------------
if __name__ == "__main__":
    # Check lock first
    try:
        with open(DATA_FILE, 'a') as f:
            pass
    except PermissionError:
        print("\n" + "="*60)
        print("🔴 CRITICAL ERROR: 'data/complaints.csv' IS LOCKED 🔴")
        print("You MUST reboot your computer to release this lock.")
        print("After reboot, run this script again.")
        print("="*60 + "\n")
        sys.exit(1)

    if os.path.exists(DATA_FILE):
        try:
            os.remove(DATA_FILE)
            print(f"Removed old {DATA_FILE}")
        except:
             # Should be caught by above check, but just in case
             print(f"Warning: Could not remove {DATA_FILE}.")
    
    generate_base()
    augment()
    train()
    print("\n✅ SETUP COMPLETE. Dataset is clean and single-source.")
