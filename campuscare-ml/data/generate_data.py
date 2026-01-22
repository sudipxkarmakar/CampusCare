
import csv
import random

# Define the target file
file_path = 'complaints.csv'

# Define Categories and Priorities
categories = ['Electrical', 'Sanitation', 'IT', 'Mess', 'Civil', 'Disciplinary', 'Other']
priorities = ['Low', 'Medium', 'High', 'Urgent']

# Locations and Items for randomization
rooms = [f"Room {n}" for n in range(101, 400)]
blocks = ['Hostel Block A', 'Hostel Block B', 'Girls Hostel', 'Boys Hostel']
washrooms = ['Washroom A', 'Washroom B', 'Ground Floor Washroom', 'Hostel Restroom']
mess_items = ['Dal', 'Rice', 'Roti', 'Vegetable', 'Curry', 'Food']

# Issue Groups with Templates and Default metadata
# Tuple format: (Template list, Category, Priority Rule)

groups = {
    'A_Hostel_Infra': {
        'category': 'Civil',
        'templates': [
            "{room} lock is broken", "{room} door check nut closing properly", "Door latch damaged in {room}",
            "Cupboard lock stuck in {room}", "Window glass broken in {room}", "Ceiling plaster falling in {room}",
            "Bed leg broken in {room}", "Wall cracks observed in {room}", "Table broken in {room}",
            "Wardrobe hinge broken in {room}", "Curtain rod came off in {room}", "Floor tiles broken in {room}"
        ],
        'priority': lambda: random.choice(['High', 'Medium'])  # Locks/broken things usually High/Medium
    },
    'B_Hostel_Safety': {
        'category': 'Civil', # Or Disciplinary often related to safety, prompt says Civil/Disciplinary depending on context. 
                             # But "Gate not locking" is Civil/Infra failure affecting safety. "Unauthorized entry" is Disciplinary.
                             # Prompt says "Hostel Safety & Security -> Civil / Disciplinary"
                             # I will mix them.
        'templates': [
            "Hostel main gate not locking at night", "CCTV camera not working in {block} corridor",
            "Security guard absent at {block} gate", "Back door of {block} left open",
            "Boundary wall damaged near {block}", "Street light near {block} not working"
        ],
        'priority': lambda: 'Urgent'
    },
    'B_Hostel_Safety_Disc': {
        'category': 'Disciplinary',
        'templates': [
            "Unauthorized person seen in {block}", " Stranger roaming in {block} corridor",
            "Unknown person entered {room} without permission", "Suspicious activity near {block}"
        ],
        'priority': lambda: 'Urgent'
    },
    'C_Washroom': {
        'category': 'Sanitation',
        'templates': [
            "{washroom} is extremely dirty", "Toilet blocked in {washroom}", "No water supply in {washroom}",
            "Foul smell coming from {washroom}", "Flush not working in {washroom}", "Basin clogged in {washroom}",
            "Tap leaking in {washroom}", "Soap dispenser broken in {washroom}", "Cleaning not done in {washroom} for 2 days"
        ],
        'priority': lambda: random.choice(['High', 'Urgent'])
    },
    'D_Electrical': {
        'category': 'Electrical',
        'templates': [
            "Fan not working in {room}", "Tube light flickering in {room}", "Power cut in {block} since morning",
            "Charging socket not working in {room}", "Switch board loose in {room}", "Sparks coming from socket in {room}",
            "AC not cooling in common room", "Geyser not working in {washroom}", "Exhaust fan broken in {washroom}"
        ],
        'priority': lambda text: 'Urgent' if 'Spark' in text else random.choice(['Medium', 'High'])
    },
    'E_IT': {
        'category': 'IT',
        'templates': [
            "Wifi signal very weak in {room}", "No internet connectivity in {block}", "LAN port damaged in {room}",
            "Biometric device not working at {block} entrance", "Cannot login to student portal", "ERP showing internal server error",
            "Wifi disconnects frequently in {room}", "Internet speed too slow for work in {block}"
        ],
        'priority': lambda: random.choice(['Medium', 'High'])
    },
    'F_Mess': {
        'category': 'Mess',
        'templates': [
            "Food quality is very bad today", "Found insect in {item}", "{item} is undercooked",
            "Mess area is very unhygienic", "Flies hovering over food counter", "Meal served very late",
            "Stale food served in dinner", "{item} too salty", "Drinking water tastes bad in mess",
            "Plates are not washed properly"
        ],
        'priority': lambda text: 'Urgent' if 'insect' in text or 'stale' in text else 'Medium'
    },
    'G_Discipline': {
        'category': 'Disciplinary',
        'templates': [
            "Ragging incident in {block}", "Seniors harassing juniors in {block}", "Verbal abuse by student in mess",
            "Bullying reported in {block}", "Loud music played late night in {block}", "Fighting in {block} corridor",
            "Alcohol consumption suspected in {block}", "Smoking in non-smoking area near {block}"
        ],
        'priority': lambda: 'Urgent'
    }
}

new_rows = []

# Target: Add ~400 rows.
# Distribution:
# A: 60, B: 40, C: 60, D: 60, E: 60, F: 60, G: 60 = ~400
counts = {
    'A_Hostel_Infra': 60,
    'B_Hostel_Safety': 20,
    'B_Hostel_Safety_Disc': 20,
    'C_Washroom': 60,
    'D_Electrical': 60,
    'E_IT': 60,
    'F_Mess': 60,
    'G_Discipline': 60
}

for group_key, count in counts.items():
    group = groups[group_key]
    category = group['category']
    templates = group['templates']
    
    for _ in range(count):
        template = random.choice(templates)
        
        # Fill placeholders
        text = template.replace("{room}", random.choice(rooms))
        text = text.replace("{block}", random.choice(blocks))
        text = text.replace("{washroom}", random.choice(washrooms))
        text = text.replace("{item}", random.choice(mess_items))
        
        # Determine priority
        priority_func = group['priority']
        if callable(priority_func):
            try:
                priority = priority_func(text) # if it accepts an arg
            except TypeError:
                priority = priority_func()     # if it doesn't
        else:
            priority = priority_func

        new_rows.append([text, category, priority])

# Append to file
with open(file_path, 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(new_rows)

print(f"Successfully appended {len(new_rows)} rows to {file_path}")
