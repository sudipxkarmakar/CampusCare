import urllib.request
import json

url = "http://127.0.0.1:8000/analyze"
test_cases = [
    "FIRE IN LOBBY",
    "A STUDENT FAINTED",
    "Water leak",
    "Internet not working"
]
headers = {"Content-Type": "application/json"}

for text in test_cases:
    data = {"text": text}
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"'{text}' -> P:{result.get('priority')} C:{result.get('category')}")
    except Exception as e:
        print(f"'{text}' -> Error: {e}")
