import os
import re

render_url = "https://campuscare-backend-96cn.onrender.com"
ternary = "${window.location.hostname === 'localhost' ? 'http://localhost:5000' : '" + render_url + r"'}"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Clean up ALL previous messy attempts
    # Match any variation of the ternary or broken ternary
    content = re.sub(r'\(window\.location\.hostname === ["\']localhost["\'] \? [^:]* : ["\']https://campuscare-backend-96cn\.onrender\.com["\']\) \+ ["\']', 'http://localhost:5000', content)
    content = re.sub(r'\(window\.location\.hostname === ["\']localhost["\'] \? http://localhost:5000 \+ "" : ["\']https://campuscare-backend-96cn\.onrender\.com["\']\) \+ ', 'http://localhost:5000', content)
    content = re.sub(r'\$\(window\.location\.hostname === ["\']localhost["\'] \? ["\']http://localhost:5000["\'] : ["\']https://campuscare-backend-96cn\.onrender\.com["\']\)', 'http://localhost:5000', content)
    
    # 2. Convert hardcoded strings to template literals with ternary
    # Match 'http://localhost:5000...' or "http://localhost:5000..."
    content = re.sub(r"'http://localhost:5000([^']*)'", r"`" + ternary + r"\1`", content)
    content = re.sub(r'"http://localhost:5000([^"]*)"', r"`" + ternary + r"\1`", content)
    
    # Also handle cases like `http://localhost:5000${c.image}`
    content = re.sub(r'http://localhost:5000', ternary, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('docs'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            fix_file(os.path.join(root, file))
