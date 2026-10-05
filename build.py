# Бір файлды index.html жинайды: src/shell.html ішіндегі <script src="..."> орнына файлдың өзі қойылады.
# Мазмұнды өзгерту: src/tx_kk.js, src/tx_en.js (мәтін), src/data.js (жаттығу, кері байланыс, үлгі стори).
import re
from pathlib import Path
d = Path(__file__).parent
h = (d/'src/shell.html').read_text(encoding='utf-8')
h = re.sub(r'<script src="([^"]+)"></script>',
           lambda m: '<script>\n' + (d/'src'/m.group(1)).read_text(encoding='utf-8') + '\n</script>', h)
(d/'index.html').write_text(h, encoding='utf-8')
print('index.html', len(h.encode()), 'bytes')
