import os
import re

render_url = "https://campuscare-backend-96cn.onrender.com"
api_base_js = 'const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "' + render_url + '";'

def fix_file(filepath):
    if 'api.js' in filepath: return # Skip manually fixed file

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Clean up any previous attempts (PowerShell mess or nested ternaries)
    # Match anything like $(window...) or (window... ? ... : ...)
    content = re.sub(r'\$\(window\.location\.hostname === "localhost" \? "http://localhost:5000" : "https://campuscare-backend-96cn\.onrender\.com"\)', 'http://localhost:5000', content)
    content = re.sub(r'\(window\.location\.hostname === ["\']localhost["\'] \? ["\']http://localhost:5000["\'] : ["\']https://campuscare-backend-96cn\.onrender\.com["\']\)', 'http://localhost:5000', content)

    # 2. Perform the replacement in a way that works for most cases
    # We'll use the template literal approach if it's already inside a string
    # But since we have many 'http://localhost:5000/api' cases, we can do:
    # 'http://localhost:5000/api' -> `${window.location.hostname === "localhost" ? "http://localhost:5000" : "https://campuscare-backend-96cn.onrender.com"}/api`
    
    # Replace single quoted strings
    content = re.sub(r"'http://localhost:5000([^']*)'", r"`${window.location.hostname === 'localhost' ? 'http://localhost:5000' : '" + render_url + r"'}\1`", content)
    
    # Replace double quoted strings
    content = re.sub(r'"http://localhost:5000([^"]*)"', r"`${window.location.hostname === 'localhost' ? 'http://localhost:5000' : '" + render_url + r"'}\1`", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('docs'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            fix_file(os.path.join(root, file))
