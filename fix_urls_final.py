import os
import re

render_url = "https://campuscare-backend-96cn.onrender.com"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match 'http://localhost:5000/...' or "http://localhost:5000/..."
    # Replace with template literal version
    def replacer(match):
        path = match.group(2)
        return f"`${{window.location.hostname === 'localhost' ? 'http://localhost:5000' : '{render_url}'}}{path}`"

    content = re.sub(r"(['\"])(http://localhost:5000)([^'\"]*)\1", replacer, content)
    
    # Also handle some edge cases
    content = content.replace("`http://localhost:5000`", f"`${{window.location.hostname === 'localhost' ? 'http://localhost:5000' : '{render_url}'}}`")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('docs'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            fix_file(os.path.join(root, file))
