
import csv
import random

# Target file
output_file = 'complaints.csv'

# STRICT TARGETS
TARGETS = {
    'Civil': 220,
    'Sanitation': 220,
    'Electrical': 180,
    'IT': 160,
    'Mess': 130,
    'Disciplinary': 130,
    'Other': 60
}

# ---------------------------------------------------------
# VARIABLES
# ---------------------------------------------------------
rooms = [str(n) for n in range(101, 500)]
hostels = ['Block A', 'Block B', 'Girls Hostel', 'Boys Hostel', 'New Wing', 'Old Block']
locs_common = ['Common Room', 'Lobby', 'Corridor', 'Stairs', 'Terrace', 'Main Gate', 'Back Gate', 'Parking']
locs_academic = ['Library', 'Computer Centre', 'Lab 1', 'Lab 2', 'Classroom 5', 'Office']
washrooms = ['Ground Floor Washroom', 'First Floor Toilet', 'Common Washroom', 'Hostel Mesh', 'Restroom near Canteen']

# ---------------------------------------------------------
# TEMPLATE LIBRARY
# ---------------------------------------------------------

civil_templates = [
    # Door/Lock - Safety (Urgent/High)
    ("The lock on my door in Room {room} is completely broken, cannot lock it.", "Urgent"),
    ("Safety concern: Door latch in Room {room} not working properly.", "Urgent"),
    ("My room door ({room}) doesn't close fully, lock is misaligned.", "High"),
    ("Main door handle of Room {room} came off, unable to secure room.", "High"),
    ("Lock jammed in Room {room}, I was stuck inside for 10 mins.", "Urgent"),
    ("The latch on the bathroom door in {room} is broken.", "High"),
    ("Door lock key is stuck inside the keyhole in Room {room}.", "High"),
    ("Night latch broken in Room {room}, feeling unsafe.", "Urgent"),
    
    # Windows
    ("Window glass shattered in Room {room} due to wind.", "High"),
    ("Window pane missing in Room {room}, mosquitoes entering.", "Medium"),
    ("Cannot close the window in Room {room}, latch broken.", "High"),
    ("Window grill is rusted and loose in Room {room}.", "High"),
    
    # Furniture (Bed, Table, Cupboard)
    ("My bed leg is wobbling dangerously in Room {room}.", "High"),
    ("Cupboard door hinge broken in Room {room}.", "Medium"),
    ("Study table in Room {room} has a large crack.", "Medium"),
    ("Chair backrest broken in {room}, need replacement.", "Medium"),
    ("The mattress in Room {room} is torn and old.", "Low"),
    ("Bed plank broke while sleeping in Room {room}.", "High"),
    ("Drawer lock in my study table (Room {room}) is stuck.", "Medium"),
    
    # Building Infra (Wall, Ceiling, Floor)
    ("Ceiling dampness and peeling paint in Room {room}.", "Medium"),
    ("Floor tiles cracked and sharp in {common}.", "High"),
    ("Water seepage from the ceiling in {hostel} corridor.", "High"),
    ("Plaster falling from ceiling in {room}, dangerous.", "Urgent"),
    ("Boundary wall near {hostel} has a hole, outsiders entering.", "Urgent"),
    ("Tiles broken in the bathroom of Room {room}.", "Medium"),
    ("Roof leaking heavily in {common} during rain.", "High"),
    ("Corridor floor in {hostel} is uneven and tripping hazard.", "Medium"),
    ("Rainwater entering Room {room} through the balcony door.", "High"),
    ("Huge crack appeared on the wall of Room {room}.", "High"),
    
    # General Civil
    ("Curtain rod fell down in Room {room}.", "Low"),
    ("Mirror fell off the wall in {washroom}.", "Medium"),
    ("Notice board in {common} fell down.", "Low"),
    ("Benches in {common} are broken.", "Medium"),
    ("Door closer in {academic} is leaking oil.", "Low")
]

sanitation_templates = [
    # Water Supply
    ("No water supply in {hostel} since this morning.", "Urgent"),
    ("Water coming from tap in {room} is muddy.", "Urgent"),
    ("Low water pressure in {washroom} showers.", "Medium"),
    ("Hot water geyser not giving water in {washroom}.", "High"),
    ("Taps run dry every evening in {hostel}.", "High"),
    ("Drinking water cooler in {hostel} is empty.", "High"),
    
    # Cleanliness/Hygiene
    ("Washroom in {hostel} is extremely dirty and unhygienic.", "High"),
    ("Cleaning staff has not visited {room} for 3 days.", "Medium"),
    ("Dustbins overflowing in {common} area.", "Medium"),
    ("Foul smell coming from the drains near {hostel}.", "High"),
    ("Dead pigeon in the {common} balcony causing smell.", "High"),
    ("Fungus growing on bathroom walls in Room {room}.", "High"),
    ("Corridors in {hostel} are full of mud and trash.", "Medium"),
    ("Garbage piled up near {hostel} entrance.", "Medium"),
    
    # Plumbing Fixtures
    ("Flush not working in {washroom} toilet.", "Urgent"),
    ("Sink is clogged and overflowing in {washroom}.", "High"),
    ("Tap is leaking continuously in Room {room}, wasting water.", "Medium"),
    ("Shower head broken in {washroom}.", "Medium"),
    ("Pipe burst in {washroom}, water flooding the floor.", "Urgent"),
    ("Toilet seat broken in {washroom}.", "High"),
    ("Jet spray not working in {hostel} toilet.", "Medium"),
    ("Water cooler in {common} is leaking.", "Medium"),
    
    # Pests/Others
    ("Too many mosquitoes in {common} due to stagnant water.", "High"),
    ("Cockroach infestation in {hostel} washrooms.", "High"),
    ("Drain blockage causing backflow in {washroom}.", "Urgent")
]

electrical_templates = [
    # Specific Electrical Items
    ("Ceiling fan in Room {room} is not working.", "High"),
    ("Fan in Room {room} making loud noise and wobbling.", "High"),
    ("Regulator for fan in Room {room} is not working.", "Medium"),
    ("Tube light improperly flickering in Room {room}.", "Medium"),
    ("Bulb fused in {washroom}, pitch dark at night.", "Urgent"),
    ("Switch board hanging loose in Room {room}, exposed wires.", "Urgent"),
    ("Sparking observed from the socket in Room {room}.", "Urgent"),
    ("Charging point in {room} is dead.", "medium"),
    ("Extension board in {academic} caught fire briefly.", "Urgent"),
    ("Corridor lights invalid/off in {hostel} at night.", "Urgent"),
    
    # Power Supply
    ("Power cut in {hostel} for over 4 hours.", "High"),
    ("Frequent voltage fluctuation in {room} damaging laptop.", "High"),
    ("No electricity in {academic} lab section.", "High"),
    ("Inverter backup not working in {hostel} during outage.", "High"),
    
    # Appliances
    ("Water cooler in {hostel} gave me an electric shock.", "Urgent"),
    ("Geyser in {washroom} not heating water.", "Medium"),
    ("Air conditioner in {academic} is dripping water.", "Medium"),
    ("Street light near {hostel} entrance is broken.", "High"),
    ("MCB trips frequently in Room {room}.", "High")
]

it_templates = [
    # Internet/Wifi
    ("Wifi signal is extremely weak in Room {room}.", "Medium"),
    ("Internet disconnects every 5 minutes in {hostel}.", "Medium"),
    ("No internet connectivity in {academic} for lecture.", "High"),
    ("Wifi speed is too slow to open basic websites in {room}.", "Medium"),
    ("Access point in {common} seems dead, no signal.", "Medium"),
    ("Cannot connect to 'CampusWifi' in {hostel}.", "Medium"),
    ("Wifi range does not reach the corner rooms like {room}.", "Medium"),
    
    # LAN/Hardware
    ("LAN port in Room {room} is broken.", "Medium"),
    ("Ethernet cable socket damaged in {academic}.", "Medium"),
    ("PC in {academic} not booting up.", "High"),
    ("Projector in {academic} has display issues.", "Medium"),
    ("Printer in {academic} assumes offline status.", "Medium"),
    
    # Software/Portal
    ("Cannot login to the student ERP portal from {hostel}.", "High"),
    ("Attendance not reflecting in the app.", "Medium"),
    ("Biometric device at {hostel} gate not accepting fingerprint.", "High"),
    ("Library search kiosk is frozen.", "Low"),
    ("Unable to submit assignment on the internal server.", "High"),
    ("Forgot password reset link not working.", "Medium"),
    ("Server down error when accessing exam results.", "High")
]

mess_templates = [
    # Food Quality (Added {hostel} to create variations)
    ("Found a worm in the cauliflower curry today in {hostel} mess.", "Urgent"),
    ("Rice served for lunch in {hostel} mess was undercooked and hard.", "High"),
    ("Dal was completely watery and tasteless in {hostel} mess.", "Medium"),
    ("Stale smell coming from the food served tonight in {hostel} mess.", "Urgent"),
    ("Hair found in the chapati at {hostel} mess.", "High"),
    ("Food was extremely spicy and oily, caused stomach ache.", "High"),
    ("Milk served at breakfast in {hostel} was sour.", "High"),
    ("Bread served in {hostel} mess was expired and had fungus.", "Urgent"),
    
    # Hygiene
    ("Mess plates in {hostel} are greasy and not washed properly.", "High"),
    ("Tables in the {hostel} mess hall are sticky and dirty.", "Medium"),
    ("Cats seen roaming inside the {hostel} mess kitchen.", "Urgent"),
    ("Mess workers in {hostel} not wearing gloves or hairnets.", "Medium"),
    ("Fly infestation near the food serving counter in {hostel}.", "High"),
    ("Water dispenser in {hostel} mess is dirty.", "High"),
    
    # Service/Quantity
    ("Food finished before mess timing ended in {hostel}.", "Medium"),
    ("Mess staff behavior in {hostel} is very rude.", "Medium"),
    ("Long queues due to slow service at {hostel} counters.", "Low"),
    ("Not enough nutritious options for vegetarian students in {hostel} mess.", "Low"),
    ("Breakfast timing in {hostel} is too short.", "Medium"),
    
    # Extras
    ("There is a dead insect in the rice bowl in {hostel}.", "Urgent"),
    ("Vegetable curry in {hostel} mess is smelling rotten.", "Urgent"),
    ("Chapatis in {hostel} mess are too hard to eat.", "Medium"),
    ("Dinner was served cold again in {hostel}.", "Medium"),
    ("No water in the {hostel} mess wash basin.", "High"),
    ("Dirty smell in the {hostel} dining hall.", "High"),
    ("Mess contractor in {hostel} is using cheap oil.", "High"),
    ("Found a stone in the dal in {hostel} mess.", "High"),
    ("Curd served in {hostel} was sour and old.", "High"),
    ("Not enough seating space in the {hostel} mess.", "Low"),
    ("Menu is not being followed in {hostel} mess.", "Low"),
    ("Lunch served very late today in {hostel}.", "Medium")
]

disciplinary_templates = [
    # Ragging/Harassment (Urgent)
    ("Seniors harassing juniors in {hostel} corridor.", "Urgent"),
    ("Ragging incident reported near {hostel} block.", "Urgent"),
    ("Verbal abuse and bullying by a group in {common}.", "Urgent"),
    ("Female students catcalled near {hostel} gate.", "Urgent"),
    ("Threatening behavior by a student in Room {room}.", "Urgent"),
    ("Physical fight broke out in the {hostel} mess hall.", "Urgent"),
    
    # Security Breaches
    ("Unauthorized outsiders drinking alcohol near {hostel}.", "Urgent"),
    ("Student smoking in the non-smoking {common} area.", "High"),
    ("Loud music playing in Room {room} late at night disturbing others.", "High"),
    ("Theft: My laptop was stolen from Room {room}.", "Urgent"),
    ("Wallet stolen from my bag in {academic}.", "Urgent"),
    ("Suspicious person seen roaming in {hostel} at night.", "Urgent"),
    ("Security guard was sleeping during night shift at {hostel}.", "Urgent"),
    ("Main gate of {hostel} was left open all night.", "Urgent"),
    ("Vandalism: Someone smashed the mirror in {washroom}.", "High"),
    
    # Extras
    ("Drunk students creating nuisance in {hostel}.", "Urgent"),
    ("Someone busted the fire extinguisher in {common}.", "High"),
    ("Gambling activity seen in Room {room}.", "High"),
    ("Stalking incident reported by a student in library.", "Urgent")
]

other_templates = [
    ("Lost my ID card near {academic}.", "Low"),
    ("Found a set of keys in {common}, submitted to office.", "Low"),
    ("Bus to {hostel} stop was late by 20 minutes today.", "Low"),
    ("Need permission to organize a coding event in {academic}.", "Low"),
    ("Parking space is always full behind {hostel}.", "Low"),
    ("Gym equipment in the sports complex near {hostel} is rusted.", "Medium"),
    ("Suggestion to increase library hours during exams.", "Low"),
    ("Request to add more books on AI in {academic}.", "Low"),
    ("Basketball court net near {hostel} is torn.", "Low"),
    ("There are too many stray dogs near {hostel} chasing students.", "Medium"),
    ("Why is the stationary shop near {academic} closed during college hours?", "Low"),
    ("Request for a new club for photography.", "Low"),
    ("Lost property: Blue bag left in {academic}.", "Low"),
    ("Can we have a vending machine in {hostel}?", "Low"),
    ("Request to extend curfew timings for {hostel}.", "Low")
]


# ---------------------------------------------------------
# EXPAND LOGIC
# ---------------------------------------------------------

def expand(templates, count_needed, category):
    generated = set()
    rows = []
    
    while len(rows) < count_needed:
        random.shuffle(templates)
        added_in_pass = 0
        for tmpl, prio in templates:
            if len(rows) >= count_needed: break
            
            # Create variations
            # Increased attempts to 50
            for _ in range(50):
                r_room = random.choice(rooms)
                r_hostel = random.choice(hostels)
                r_common = random.choice(locs_common)
                r_acad = random.choice(locs_academic)
                r_wash = random.choice(washrooms)
                
                try:
                    text = tmpl.format(
                        room=r_room, 
                        hostel=r_hostel, 
                        common=r_common, 
                        academic=r_acad, 
                        washroom=r_wash
                    )
                except:
                    text = tmpl # fallback
                
                if text not in generated:
                    generated.add(text)
                    rows.append({'text': text, 'category': category, 'priority': prio})
                    added_in_pass += 1
                    break
        
        if added_in_pass == 0:
            print(f"Warning: Could not generate enough unique rows for {category}. Stopped at {len(rows)}.")
            break
    
    return rows

# ---------------------------------------------------------
# EXECUTION
# ---------------------------------------------------------

all_data = []

print("Generating Civil...")
all_data.extend(expand(civil_templates, TARGETS['Civil'], 'Civil'))

print("Generating Sanitation...")
all_data.extend(expand(sanitation_templates, TARGETS['Sanitation'], 'Sanitation'))

print("Generating Electrical...")
all_data.extend(expand(electrical_templates, TARGETS['Electrical'], 'Electrical'))

print("Generating IT...")
all_data.extend(expand(it_templates, TARGETS['IT'], 'IT'))

print("Generating Mess...")
all_data.extend(expand(mess_templates, TARGETS['Mess'], 'Mess'))

print("Generating Disciplinary...")
all_data.extend(expand(disciplinary_templates, TARGETS['Disciplinary'], 'Disciplinary'))

print("Generating Other...")
all_data.extend(expand(other_templates, TARGETS['Other'], 'Other'))

# Final check and shuffle
random.shuffle(all_data)

# Trim if slightly over (unlikely given loop logic, but safe)
if len(all_data) > 1000:
    all_data = all_data[:1000]

print(f"Total Rows Generated: {len(all_data)}")

# Write to CSV
with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['text', 'category', 'priority'])
    writer.writeheader()
    writer.writerows(all_data)

print(f"Dataset successfully written to {output_file}")
