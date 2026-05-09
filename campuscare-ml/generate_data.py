import csv
import random

random.seed(42)

def make_generator(items, issues, locations, templates, category, count=250):
    complaints = []
    seen = set()
    attempts = 0
    while len(complaints) < count and attempts < 15000:
        attempts += 1
        template, default_prio = random.choice(templates)
        
        kwargs = {}
        if "{item}" in template: kwargs["item"] = random.choice(items)
        if "{issue}" in template: kwargs["issue"] = random.choice(issues)
        if "{location}" in template: kwargs["location"] = random.choice(locations)
        
        try:
            text = template.format(**kwargs)
        except KeyError:
            continue
            
        if text not in seen:
            seen.add(text)
            prio = default_prio
            if random.random() < 0.10: # Add 10% randomness for realistic variability
                prio = random.choice(["Low", "Medium", "High", "Urgent"])
            complaints.append((text, category, prio))
    
    while len(complaints) < count:
        base, _, prio = random.choice(complaints)
        text = base + f" (Log: {random.randint(1000, 9999)})"
        if text not in seen:
            seen.add(text)
            complaints.append((text, category, prio))
            
    return complaints

def generate_civil():
    items = ["bench", "door", "windowpane", "chair", "desk", "wall", "ceiling", "roof", "staircase", "elevator door", "whiteboard", "pathway", "shed", "gym equipment", "water cooler stand", "blackboard", "bookshelf", "podium", "projector", "smart board", "speaker", "tile", "railing", "fan blade", "curtain rod", "lock", "handle", "cupboard", "notice board", "bench leg", "stage", "curtain"]
    issues = ["broken", "damaged", "cracked", "shattered", "leaking", "jammed", "scratched", "rusted", "collapsed", "peeling", "wobbly", "unstable", "falling apart", "not working", "malfunctioning", "loose", "hanging dangerously", "missing", "squeaking", "vibrating"]
    locations = ["classroom 101", "classroom 302", "the library", "block B corridor", "the seminar hall", "the auditorium", "hostel room", "the faculty room", "the canteen", "the main gate", "the study room", "the guest house", "the lab", "the sports complex", "nb 201", "the amphitheatre", "the common room", "the garden", "the gym"]
    
    templates = [
        ("The {item} in {location} is {issue} and needs immediate replacement.", "Medium"),
        ("There is a {issue} {item} near {location} that poses a risk.", "Medium"),
        ("{location} has a {issue} {item} which needs fixing.", "Low"),
        ("Please repair the {issue} {item} at {location} as soon as possible.", "Medium"),
        ("Emergency: The {item} in {location} has {issue} completely blocking the way.", "Urgent"),
        ("A {item} fell and is now {issue} in {location}.", "Medium"),
        ("I noticed a {issue} {item} when I visited {location}.", "Low"),
        ("Can someone look at the {issue} {item} in {location}?", "Low"),
        ("The {item} is {issue} at {location}, causing inconvenience.", "Medium"),
        ("Huge problem in {location}: {item} is totally {issue}.", "Medium"),
        ("We need a new {item} in {location} because the old one is {issue}.", "Low"),
        ("The {item} structure at {location} looks {issue} and might fall.", "High"),
        ("My {item} inside the {location} is {issue}.", "Medium"),
        ("the {item} isn't working", "Medium"),
        ("{item} is {issue}", "Low"),
        ("the projector is not working", "Urgent"),
        ("projector issue in {location}", "Urgent"),
        ("we cannot start class because the projector in {location} is broken", "Urgent"),
        ("urgent: projector in {location} is malfunctioning", "Urgent"),
        ("Broken {item} in {location}", "Medium")
    ]
    return make_generator(items, issues, locations, templates, "Civil", count=250)

def generate_electrical():
    items = ["fan", "air conditioner", "tube light", "bulb", "switchboard", "socket", "power outlet", "water heater", "microwave", "elevator", "main gate motor", "fire alarm", "generator", "exhaust fan", "street light", "laptop charger", "UPS", "biometric machine", "router power", "lab equipment", "fridge"]
    issues = ["not working", "sparking", "flickering", "making a loud noise", "fused", "completely dead", "giving electric shocks", "short-circuited", "malfunctioning", "unresponsive", "smoking", "burnt out", "exposed wires", "tripping the circuit"]
    locations = ["my hostel room", "the corridor", "lecture hall 2", "the server room", "the library", "the washroom", "the pantry", "the auditorium", "block C", "the parking lot", "the main entrance", "the computer lab", "the mess"]
    
    templates = [
        ("The {item} in {location} is {issue}.", "Medium"),
        ("Warning: The {item} near {location} is {issue}!", "Urgent"),
        ("Total power failure affecting the {item} at {location}.", "High"),
        ("Please fix the {item} in {location}, it is {issue}.", "Medium"),
        ("I got shocked because the {item} in {location} is {issue}.", "Urgent"),
        ("The {item} just started {issue} in {location}.", "High"),
        ("Could you replace the {item} in {location}? It seems to be {issue}.", "Low"),
        ("Emergency! {item} is {issue} and causing a fire hazard in {location}.", "Urgent"),
        ("The {item} is {issue} again at {location}.", "Medium"),
        ("We have no power because the {item} is {issue} in {location}.", "High"),
        ("Fire hazard: {item} is {issue} and sparking in {location}", "Urgent"),
        ("Smoke coming out of {item} in {location}", "Urgent")
    ]
    return make_generator(items, issues, locations, templates, "Electrical", count=250)

def generate_sanitation():
    items = ["washroom", "toilet", "drainage", "sewage pipe", "water cooler", "dustbin", "sink", "shower", "drinking water filter", "garbage dump", "urinal", "hallway", "lobby", "staircase", "water tank", "stray dogs", "monkeys", "pests", "rats", "cockroaches", "mosquitoes"]
    issues = ["dirty", "leaking", "blocked", "overflowing", "flooded", "smelly", "clogged", "unusable", "dispensing brown water", "full of mosquitoes", "not cleaned", "filthy", "covered in mud", "infested", "unhygienic", "stinking", "rotting"]
    locations = ["the boys hostel", "the girls hostel", "block A", "the canteen area", "the academic block", "the ground floor", "the library", "the sports complex", "mess area", "the parking lot"]
    
    templates = [
        ("The {item} near {location} is extremely {issue}.", "High"),
        ("Please clean the {item} in {location}, it is {issue}.", "Medium"),
        ("Disgusting: the {item} at {location} is {issue}.", "High"),
        ("Major hygiene issue! {item} is {issue} in {location}.", "Urgent"),
        ("The {item} is {issue} affecting everyone in {location}.", "High"),
        ("Can the sweeping staff look at the {issue} {item} in {location}?", "Low"),
        ("The {item} in {location} has been {issue} for three days.", "High"),
        ("Water and waste everywhere because the {item} in {location} is {issue}.", "Urgent"),
        ("There is a {issue} {item} near {location}.", "Medium"),
        ("The {item} is completely {issue} at {location}.", "Medium"),
        ("Public health concern: {item} in {location} is {issue}", "Urgent"),
        ("The {item} in {location} is infested with {item}", "High")
    ]
    return make_generator(items, issues, locations, templates, "Sanitation", count=250)

def generate_it():
    items = ["WiFi", "internet", "college website", "student portal", "ERP login page", "lab computers", "department database", "smart board", "printer", "VPN", "biometric attendance", "campus app", "email server", "course registration", "moodle", "canvas", "library portal"]
    issues = ["very slow", "completely down", "crashing", "throwing a 500 error", "hacked", "infected with ransomware", "unresponsive", "locked out", "disconnecting frequently", "showing wrong data", "having huge latency", "not accepting credentials", "showing blank page"]
    locations = ["my room", "the library", "lecture hall 2", "the computer lab", "all departments", "the server room", "my phone", "the entire campus"]
    
    templates = [
        ("The {item} is {issue} in {location}.", "Medium"),
        ("I cannot access my work because the {item} is {issue}.", "High"),
        ("The {item} is {issue} across {location}.", "High"),
        ("Urgent tech support needed: {item} is {issue}.", "Urgent"),
        ("Please fix the {item}, it keeps {issue} in {location}.", "Medium"),
        ("The {item} system is {issue}.", "High"),
        ("Is the {item} {issue} for everyone in {location}?", "Low"),
        ("Security breach: The {item} seems to be {issue}!", "Urgent"),
        ("The {item} is {issue} and it is delaying our project in {location}.", "High"),
        ("My {item} connection in {location} is {issue}.", "Medium"),
        ("I am unable to submit my assignment because {item} is {issue}", "High")
    ]
    return make_generator(items, issues, locations, templates, "IT", count=250)

def generate_mess():
    items = ["food", "rice", "curry", "milk", "tea", "drinking glasses", "plates", "dinner", "breakfast", "lunch", "soup", "kitchen counter", "diet plan", "canteen food", "water bottle", "chapati", "paneer", "dal", "salad", "curd"]
    issues = ["too spicy", "completely raw", "undercooked", "sour and spoiled", "unwashed and oily", "tasteless", "served very late", "cold", "unhygienic", "overpriced", "full of insects", "rotten", "smelly", "burnt", "salty"]
    locations = ["the mess", "canteen", "cafeteria", "hostel mess"]
    
    templates = [
        ("The {item} today was {issue}.", "Medium"),
        ("I found the {item} to be {issue} in the mess.", "High"),
        ("Food safety alert: The {item} is {issue}!", "Urgent"),
        ("Can we improve the {item}? It is always {issue}.", "Low"),
        ("The {item} was {issue} and made several students sick.", "Urgent"),
        ("Please ensure the {item} is not {issue} tomorrow.", "Low"),
        ("The {item} served at the mess is {issue}.", "Medium"),
        ("Extremely disappointed with the {issue} {item}.", "High"),
        ("The {item} is {issue}, please take action against the contractor.", "High"),
        ("We are being served {issue} {item}.", "Medium"),
        ("Health hazard: Found a dead insect in the {item} in {location}", "Urgent"),
        ("The {item} in {location} smells {issue}", "High")
    ]
    return make_generator(items, issues, locations, templates, "Mess", count=250)

def generate_disciplinary():
    items = ["phone", "wallet", "laptop", "gold chain", "power bank", "spectacles", "cycle", "bag", "charger", "jewellery", "watch", "headphones", "vehicle", "helmet", "purse", "keys", "id card"]
    actions = ["stolen", "missing", "taken", "lost", "snatched", "misplaced", "robbed"]
    locations = ["the library", "my hostel room", "the lab", "the classroom", "the parking lot", "the canteen", "the ground", "my desk"]
    
    templates = [
        ("My {item} was {action} from {location}.", "Urgent"),
        ("Someone {action} my {item} while I was in {location}.", "High"),
        ("I {action} my {item} near {location}, suspecting theft.", "High"),
        ("My {item} is {action} from {location}.", "High"),
        ("Can't find my {item}, it was {action} in {location}.", "Medium"),
        ("The {item} was {action} from {location}!", "Urgent"),
        ("I left my {item} in {location} and now it is {action}.", "High"),
        ("I was bullied near {location}", "Urgent"),
        ("Ragging incident reported in {location}", "Urgent"),
        ("Physical fight between students in {location}", "Urgent"),
        ("Harassment by someone in {location}", "Urgent"),
        ("Verbal abuse in {location}", "High"),
        ("Theft of {item} in {location}", "Urgent")
    ]
    
    complaints = []
    seen = set()
    while len(complaints) < 250:
        template, default_prio = random.choice(templates)
        if "{item}" in template:
            text = template.format(item=random.choice(items), action=random.choice(actions), location=random.choice(locations))
        else:
            text = template.format(location=random.choice(locations))
            
        if text not in seen:
            seen.add(text)
            complaints.append((text, "Disciplinary", default_prio))
            
    return complaints

def generate_personal():
    issues = ["headache", "fever", "stomach pain", "anxiety", "depression", "dizziness", "panic attack", "allergic reaction", "back pain", "bleeding", "vomiting", "chest pain", "nausea", "food poisoning", "fracture", "infection", "cold", "flu"]
    actions = ["fainted", "injured my leg", "broke my arm", "cut my finger", "twisted my ankle", "collapsed", "slipped", "got burnt", "unconscious", "hit my head"]
    feelings = ["lonely and homesick", "stressed about my exams", "suicidal", "extremely overwhelmed", "depressed", "mental health crisis", "hopeless"]
    locations = ["in the hostel", "in the classroom", "in the lab", "in the library", "on the ground", "in my room"]
    
    templates = [
        ("I have a severe {issue} and need medical help.", "Urgent"),
        ("I am suffering from chronic {issue}.", "Medium"),
        ("A sudden {issue} started an hour ago.", "High"),
        ("I feel {feeling} and need counseling.", "High"),
        ("I {action} {location} and cannot walk properly.", "Urgent"),
        ("Emergency: I {action} {location}.", "Urgent"),
        ("I am having a {issue} and need immediate support.", "Urgent"),
        ("I am experiencing {feeling}.", "Medium"),
        ("My friend {action} {location}.", "Urgent"),
        ("I have a mild {issue} today.", "Low"),
        ("I am suffering from {issue} {location}.", "High"),
        ("Please send someone, I {action} {location}.", "Urgent"),
        ("I have thoughts of {feeling}", "Urgent"),
        ("Medical emergency: severe {issue}", "Urgent"),
        ("I am feeling very {feeling}", "High")
    ]
    
    complaints = []
    seen = set()
    attempts = 0
    while len(complaints) < 250 and attempts < 15000:
        attempts += 1
        template, default_prio = random.choice(templates)
        kwargs = {}
        if "{issue}" in template: kwargs["issue"] = random.choice(issues)
        if "{action}" in template: kwargs["action"] = random.choice(actions)
        if "{feeling}" in template: kwargs["feeling"] = random.choice(feelings)
        if "{location}" in template: kwargs["location"] = random.choice(locations)
        
        text = template.format(**kwargs)
            
        if text not in seen:
            seen.add(text)
            prio = default_prio
            complaints.append((text, "Personal", prio))
            
    return complaints

def generate_financial():
    items = ["fee payment", "scholarship amount", "refund for hostel fees", "caution money", "stipend for the internship", "financial aid disbursement", "bus transport fee", "mess fee deduction", "semester fee", "library fine", "late fee penalty", "education loan document", "transaction", "bank account", "wallet balance", "hostel deposit"]
    issues = ["not reflecting in the system", "delayed by two months", "wrongfully rejected", "showing incorrect amount", "higher than my actual consumption", "severely delayed causing me hardship", "deducted but transaction failed", "showing double payment", "crashing during submission", "overcharged", "not credited", "pending for long time"]
    locations = [""]
    
    templates = [
        ("My {item} is {issue}.", "High"),
        ("The {item} is {issue}.", "High"),
        ("I am facing an issue because {item} is {issue}.", "Medium"),
        ("Urgent: {item} is {issue} and I need help.", "Urgent"),
        ("Why is the {item} {issue}?", "Low"),
        ("Please check my account, the {item} is {issue}.", "Medium"),
        ("I notice the {item} is {issue} on the portal.", "High"),
        ("Can someone explain why {item} is {issue}?", "Low"),
        ("I want to report that {item} is {issue}.", "Medium"),
        ("There is an error: {item} is {issue}.", "High"),
        ("I have been overcharged for {item}", "High"),
        ("{item} was deducted twice", "High")
    ]
    return make_generator(items, issues, locations, templates, "Financial", count=250)

all_data = []
all_data.extend(generate_civil())
all_data.extend(generate_electrical())
all_data.extend(generate_sanitation())
all_data.extend(generate_it())
all_data.extend(generate_mess())
all_data.extend(generate_disciplinary())
all_data.extend(generate_personal())
all_data.extend(generate_financial())

file_path = "data/complaints.csv"
with open(file_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["text", "category", "priority"])
    for row in all_data:
        writer.writerow(row)

print(f"Generated {len(all_data)} complaints successfully.")
