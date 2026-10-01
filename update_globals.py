import re

with open('app/globals.css', 'r') as f:
    content = f.read()

# Update buttons by adding them at the end or near .btn-tactile
btn_styles = """
/* ============ New Academic Journal Buttons ============ */
.btn-primary {
  background-color: #49372D;
  color: #F7F3EA;
  border-radius: 6px;
  transition: all 0.15s ease;
}
.btn-primary:hover {
  filter: brightness(1.1);
}
.btn-primary:active {
  transform: translateY(1px);
}

.btn-secondary {
  background-color: #F7F3EA;
  color: #49372D;
  border: 1px solid #654A3A;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-reward {
  background-color: #D79A45;
  color: #FFFFFF;
  border-radius: 6px;
  transition: all 0.15s ease;
}

/* ============ Academic Journal Utilities ============ */
.journal-sheet {
  background-color: #F7F3EA;
  border: 1px solid #D6CCBF;
  border-radius: 0.5rem;
}
.dark .journal-sheet {
  background-color: #221B17;
  border-color: #3D322B;
}

.field-rule {
  height: 1px;
  background-color: #D6CCBF;
}
.dark .field-rule {
  background-color: #3D322B;
}

.badge-seal {
  border-radius: 50%;
  border: 2px double currentColor;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
"""

if "New Academic Journal Buttons" not in content:
    content += "\n" + btn_styles

# Update xp-bar-track
content = re.sub(
    r'\.xp-bar-track\s*\{[^}]*\}',
    '.xp-bar-track {\n  height: 8px;\n  background: #EAE3D8;\n  border-radius: 4px;\n  overflow: hidden;\n  position: relative;\n}',
    content, count=1
)

# Update xp-bar-fill
content = re.sub(
    r'\.xp-bar-fill\s*\{[^}]*\}',
    '.xp-bar-fill {\n  height: 100%;\n  background: #D79A45;\n  border-radius: 4px;\n  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);\n}',
    content, count=1
)

with open('app/globals.css', 'w') as f:
    f.write(content)

print("Done")
