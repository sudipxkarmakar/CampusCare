import os
import re

render_url = "https://campuscare-backend-96cn.onrender.com"
replacement = '(window.location.hostname === "localhost" ? "http://localhost:5000" : "' + render_url + '")'

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Undo the broken replacement if present
    content = content.replace('$(window.location.hostname === "localhost" ? "http://localhost:5000" : "https://campuscare-backend-96cn.onrender.com")', 'http://localhost:5000')

    # Replace 'http://localhost:5000 with (window.location.hostname === "localhost" ? "http://localhost:5000" : "https://campuscare-backend-96cn.onrender.com") + '
    content = content.replace("'http://localhost:5000", replacement + " + '")
    content = content.replace('"http://localhost:5000', replacement + ' + "')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('docs'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            fix_file(os.path.join(root, file))
