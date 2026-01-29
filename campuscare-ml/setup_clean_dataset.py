
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
        # URGENT - Animals / Hygiene Risk
        ["Poisonous snake found in water tank. Clean the tank immediately.", "Sanitation", "Urgent"],
        ["Cobra spotted near the hostel entrance.", "Other", "Urgent"],
        ["Scorpion found in the bathroom.", "Other", "Urgent"],
        ["Wild dogs chasing students near the mess.", "Other", "Urgent"],
        ["Monkey trying to attack students.", "Other", "Urgent"],
        ["Bee hive in the balcony.", "Other", "Urgent"],
        ["Wasp nest inside the room.", "Other", "Urgent"],
        ["Snake inside the room.", "Other", "Urgent"],
        ["Big spider in the bed.", "Other", "Urgent"],
        ["Bat flying inside the room.", "Other", "Urgent"],
        ["Stray dog bit a student.", "Other", "Urgent"],
        ["Cat found inside the mess kitchen.", "Mess", "Urgent"],
        ["Rat in the drinking water tank.", "Sanitation", "Urgent"],
        ["Dead animal in water tank.", "Sanitation", "Urgent"],
        ["Lizard found in the dal.", "Mess", "Urgent"],
        ["Insects found in the mess food.", "Mess", "Urgent"],

        # URGENT - Fire / Electrical Safety
        ["Fire in the corridor light switch.", "Electrical", "Urgent"],
        ["Sparks coming from the fan regulator.", "Electrical", "Urgent"],
        ["Burning smell from the main switchboard.", "Electrical", "Urgent"],
        ["Short circuit in the socket.", "Electrical", "Urgent"],
        ["Smoke coming out of the AC unit.", "Electrical", "Urgent"],
        ["Electric shock from the water cooler.", "Electrical", "Urgent"],
        ["Live wire hanging in the hallway.", "Electrical", "Urgent"],
        ["Switchboard is overheating and melting.", "Electrical", "Urgent"],
        ["Loud explosion sound from the transformer.", "Electrical", "Urgent"],
        ["Fan is wobbling dangerously and might fall.", "Electrical", "Urgent"],
        ["Ceiling fan fell down.", "Electrical", "Urgent"],
        ["Open wiring in the bathroom.", "Electrical", "Urgent"],
        ["Geyser overheating and making noise.", "Electrical", "Urgent"],
        ["Water heater gave shock.", "Electrical", "Urgent"],
        ["Iron box caught fire.", "Electrical", "Urgent"],
        ["Laptop charger exploded.", "Electrical", "Urgent"],
        ["Mobile battery blasted.", "Electrical", "Urgent"],
        ["Power bank caught fire.", "Electrical", "Urgent"],
        ["Induction stove short circuit.", "Electrical", "Urgent"],
        ["Kettle burning smell.", "Electrical", "Urgent"],
        ["Microwave sparking.", "Electrical", "Urgent"],
        ["Fire alarm ringing continuously.", "Other", "Urgent"],
        ["The light switch is burning and smells weird.", "Electrical", "Urgent"],

        # URGENT - Water / Sanitation
        ["Water smells like sewage.", "Sanitation", "Urgent"],
        ["Contaminated water coming from the tap.", "Sanitation", "Urgent"],
        ["Black water coming from the shower.", "Sanitation", "Urgent"],
        ["Worms in the drinking water.", "Sanitation", "Urgent"],
        ["Sewage backflow in the toilet.", "Sanitation", "Urgent"],
        ["Toilet clogged and overflowing.", "Sanitation", "Urgent"],
        ["Dirty water in the water cooler.", "Sanitation", "Urgent"],
        ["Water filter broken and leaking.", "Sanitation", "Urgent"],
        ["No water in the hostel for 2 days.", "Sanitation", "Urgent"],
        ["Toilet flush not working and smelling bad.", "Sanitation", "Urgent"],

        # URGENT - Infrastructure / Civil
        ["Ceiling plaster falling down.", "Civil", "Urgent"],
        ["Floor tiles popped up and dangerous.", "Civil", "Urgent"],
        ["Heavy water leakage flooding the room.", "Civil", "Urgent"],
        ["Pipe burst and flooding the corridor.", "Civil", "Urgent"],
        ["Manhole cover missing.", "Civil", "Urgent"],
        ["Open drain near the entrance.", "Civil", "Urgent"],
        ["Slippery floor causing accidents.", "Civil", "Urgent"],
        ["Elevator stuck with people inside.", "Civil", "Urgent"],
        ["Lift door opening while moving.", "Civil", "Urgent"],
        ["Washbasin broke and fell.", "Civil", "Urgent"],
        ["Door lock broken, cannot lock room.", "Civil", "Urgent"],
        ["Main door latch broken.", "Civil", "Urgent"],
        ["Window grill broken, security risk.", "Civil", "Urgent"],
        ["Balcony door not closing.", "Civil", "Urgent"],
        ["Storm water entering the room.", "Civil", "Urgent"],
        ["Roof leaking heavily during rain.", "Civil", "Urgent"],
        ["Tree branch fell on the building.", "Civil", "Urgent"],
        ["Glass window shattered and falling.", "Civil", "Urgent"],
        ["Railling broken on the 3rd floor balcony.", "Civil", "Urgent"],
        ["Sharp iron rod protruding from wall.", "Civil", "Urgent"],
        ["Termites destroying the door frame.", "Civil", "Urgent"],

        # URGENT - Mess / Gas
        ["Gas leak smell in the kitchen.", "Mess", "Urgent"],
        ["Cylinder caught fire.", "Mess", "Urgent"],
        ["Gas pipe leaking.", "Mess", "Urgent"],
        ["Oil spill in the kitchen causing fire.", "Mess", "Urgent"],
        ["Food smells rotten and poisonous.", "Mess", "Urgent"],
        ["Uncooked chicken serving.", "Mess", "Urgent"],
        ["Fungus in the bread.", "Mess", "Urgent"],
        ["Expired milk served.", "Mess", "Urgent"],
        ["Glass pieces found in rice.", "Mess", "Urgent"],

        # URGENT - Security / Other
        ["Intruder trying to enter the hostel.", "Other", "Urgent"],
        ["Stranger lurking in the corridor at night.", "Other", "Urgent"],
        ["Thief spotted in the cycle stand.", "Other", "Urgent"],
        ["Harassment by outsiders near the gate.", "Other", "Urgent"],
        ["Physical fight in the common room.", "Other", "Urgent"],
        ["Student fainted in the hallway.", "Other", "Urgent"],
        ["Medical emergency in Room 302.", "Other", "Urgent"],
        ["Severe food poisoning in the mess.", "Mess", "Urgent"],
        ["Sanitary pad disposal machine burning.", "Other", "Urgent"],
        ["Dustbin catching fire.", "Other", "Urgent"],
        ["Trash burning near the window.", "Other", "Urgent"],
        ["Chemical smell from the lab.", "Other", "Urgent"],
        ["Gas leak in the chemistry lab.", "Other", "Urgent"],
        ["Acid spill in the corridor.", "Other", "Urgent"],
        ["Mercury spill in the room.", "Other", "Urgent"],
        ["Broken glass bottle on the floor.", "Other", "Urgent"],

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
