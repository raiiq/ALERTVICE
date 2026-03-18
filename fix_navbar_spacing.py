import sys

with open('src/app/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Remove the placeholder spacing from the navbar logic
c = c.replace('            {/* SPACING FOR MOBILE BOTTOM NAV */}\n            <div className="block lg:hidden h-[90px]" />', '')

with open('src/app/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Append mobile padding to globals.css safely
with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    gc = f.read()

if 'padding-bottom: 90px;' not in gc:
    gc += """

/* Mobile bottom nav safe padding padding */
@media (max-width: 1024px) {
  body {
    padding-bottom: 90px;
  }
}
"""
    with open('src/app/globals.css', 'w', encoding='utf-8') as f:
        f.write(gc)
