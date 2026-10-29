"""Plate preview with measured text metrics (debug). usage: plateview.py name out_prefix seg"""
import sys, json, os
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, out, seg = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(os.path.join(ROOT, f'src/assets/canvas/{name}.webp')).convert('RGB')
d = json.load(open(os.path.join(ROOT, f'src/canvas/{name}.json'), encoding='utf-8'))
S = im.width / d['W']
dr = ImageDraw.Draw(im)
for e in d['items']:
    if 'm' in e:
        m = e['m']
        x, b, w, xh = m['x'] * S, m['base'] * S, m['w'] * S, m['xh'] * S
        dr.rectangle([x, b - xh, x + w, b], outline=(255, 0, 0), width=1)
n = 0
for top in range(0, im.height, int(seg * S)):
    im.crop((0, top, im.width, min(im.height, top + int(seg * S)))).save(f'{out}_{n}.png'); n += 1
print(n, 'parts')
