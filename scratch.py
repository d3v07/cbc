import os

with open(r'docs\design\hifi\theme.css', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "'Playfair Display'": "var(--font-playfair-display)",
    "'EB Garamond'": "var(--font-eb-garamond)",
    "'JetBrains Mono'": "var(--font-jetbrains-mono)",
    "'Special Elite'": "var(--font-special-elite)",
    "'Caveat'": "var(--font-caveat)",
    "'Fraunces'": "var(--font-fraunces)"
}

for k, v in replacements.items():
    content = content.replace(k, v)

final_content = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n" + content

with open(r'app\globals.css', 'w', encoding='utf-8') as f:
    f.write(final_content)
