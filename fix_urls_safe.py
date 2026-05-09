import os

render_url = "https://campuscare-backend-96cn.onrender.com"
replacement = "(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '" + render_url + "') + '"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Specifically replace 'http://localhost:5000 with the ternary logic
    # This is safe because it only matches the exact hardcoded string
    new_content = content.replace("'http://localhost:5000", replacement)
    new_content = new_content.replace('"http://localhost:5000', replacement.replace("'", '"'))

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

for root, dirs, files in os.walk('docs'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            fix_file(os.path.join(root, file))
