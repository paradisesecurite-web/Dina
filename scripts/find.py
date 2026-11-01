# Trouve le centre d'un élément de l'écran Android (par texte ou description).
import re, sys, xml.etree.ElementTree as ET
xml, want = sys.argv[1], sys.argv[2]
prefix = want.endswith('*')
want = want.rstrip('*')
best = None
for n in ET.parse(xml).iter('node'):
    t, d = n.get('text', ''), n.get('content-desc', '')
    ok = (t.startswith(want) or d.startswith(want)) if prefix else (t == want or d == want)
    if not ok:
        continue
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', n.get('bounds')))
    if y2 - y1 < 12 or x2 - x1 < 12:
        continue  # élément caché ou coupé par le bord de l'écran
    score = 0
    if best is None or score < best[0]:
        best = (score, (x1 + x2) // 2, (y1 + y2) // 2)
if best:
    print(best[1], best[2])
else:
    sys.exit(1)
