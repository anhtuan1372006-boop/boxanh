"""Pixel difference between a mockup (or crop of it) and a render. usage: pixdiff.py mockup render [x0 y0 x1 y1] [--heat out.png]"""
import sys
import numpy as np
from PIL import Image, ImageChops
args = [a for a in sys.argv[1:] if not a.startswith('--')]
mock = Image.open(args[0]).convert('RGB')
if len(args) >= 6:
    mock = mock.crop(tuple(map(int, args[2:6])))
ren = Image.open(args[1]).convert('RGB')
ren = ren.resize((mock.width, round(ren.height * mock.width / ren.width)), Image.LANCZOS).crop((0, 0, mock.width, mock.height))
arr = np.array(ImageChops.difference(mock, ren).convert('L')).astype(float)
print(f'mean {arr.mean():.2f}  p95 {np.percentile(arr, 95):.0f}  p99 {np.percentile(arr, 99):.0f}  >40: {(arr > 40).mean() * 100:.2f}%')
if '--heat' in sys.argv:
    out = sys.argv[sys.argv.index('--heat') + 1]
    heat = Image.fromarray(np.clip(arr * 4, 0, 255).astype(np.uint8)).convert('RGB')
    Image.blend(mock, heat, 0.6).save(out)
