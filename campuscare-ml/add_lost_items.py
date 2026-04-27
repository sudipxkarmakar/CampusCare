import csv
import json
import urllib.request
import time

DATA_PATH = "data/complaints.csv"
FEEDBACK_URL = "http://127.0.0.1:8000/feedback"

# Data to add (High priority for lost items)
lost_items_data = [
    ("I lost my phone in the washroom.", "Personal", "Urgent"),
    ("My laptop was stolen from my room.", "Personal", "Urgent"),
    ("I cannot find my wallet.", "Personal", "Urgent"),
    ("My expensive watch is missing.", "Personal", "Urgent"),
    ("Someone took my shoes.", "Personal", "High"),
    ("I lost my gold chain.", "Personal", "Urgent"),
    ("My phone is missing.", "Personal", "Urgent"),
    ("Lost my power bank.", "Personal", "High"),
    ("My earphones are stolen.", "Personal", "Medium"),
    ("I lost my ID card and wallet.", "Personal", "Urgent"),
    ("My mobile phone is lost.", "Personal", "Urgent"),
    ("Theft of my belongings.", "Personal", "Urgent"),
    ("I lost my phone.", "Personal", "Urgent")
]

# Weighting to ensure it overrides existing patterns
# We will add 50 copies of this dataset
weighted_data = lost_items_data * 50

# We will save ALL but the LAST item directly to CSV
# The LAST item will be sent via API to trigger reload
items_to_append = weighted_data[:-1]
trigger_item = weighted_data[-1]

print(f"Appending {len(items_to_append)} items to {DATA_PATH}...")

try:
    with open(DATA_PATH, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(items_to_append)
    print("Appended data successfully.")
except Exception as e:
    print(f"Error appending data: {e}")
    exit(1)

print("Sending trigger item to API to reload models...")
print(f"Trigger item: {trigger_item}")

payload = {
    "text": trigger_item[0],
    "category": trigger_item[1],
    "priority": trigger_item[2]
}

req = urllib.request.Request(
    FEEDBACK_URL, 
    data=json.dumps(payload).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        print(f"API Response: {result}")
        print("Success! Models should be retraining and reloading now.")
except urllib.error.URLError as e:
    print(f"Failed to call API: {e}")
    print("Make sure the ML service (app.py) is running on port 8000.")
