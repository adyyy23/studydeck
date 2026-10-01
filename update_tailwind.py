import re

with open('tailwind.config.ts', 'r') as f:
    content = f.read()

# Replace the `colors: {` block to add the new colors
new_colors = """colors: {
        "primary-ink": "#332821",
        "espresso": "#49372D",
        "primary-brown": "#654A3A",
        "chestnut": "#805B43",
        "caramel": "#B77A45",
        "reward-gold": "#D79A45",
        "warm-paper": "#F7F3EA",
        "canvas": "#F2EEE6",
        "elevated-paper": "#FFFCF6",
        "muted-surface": "#EAE3D8",
        "warm-border": "#D6CCBF",
        "success-sage": "#3D6B4F",
        "danger-coral": "#B84A39",
        "ai-plum": "#6B4E71",
"""

content = content.replace("colors: {", new_colors, 1)

with open('tailwind.config.ts', 'w') as f:
    f.write(content)

print("Done")
