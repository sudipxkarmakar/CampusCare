import os
import re

render_url = "https://campuscare-backend-96cn.onrender.com"
# Correct replacement logic: ${ternary}
ternary_js = "${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '" + render_url + "'}"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already fixed
    if "window.location.hostname === 'localhost'" in content and render_url in content:
        return

    # Pattern: 'http://localhost:5000/api' or "http://localhost:5000/api"
    # Match quotes and the URL
    pattern = r"(['\"])(http://localhost:5000)([^'\"]*)\1"
    
    def replacer(match):
        path = match.group(3)
        return f"`{ternary_js}{path}`"

    new_content = re.sub(pattern, replacer, content)
    
    # Handle cases like `http://localhost:5000${some_var}`
    new_content = new_content.replace("http://localhost:5000", ternary_js)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

for root, dirs, files in os.walk('docs'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            fix_file(os.path.join(root, file))
