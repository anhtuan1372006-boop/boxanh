"""Turn a design mockup into a "canvas page": the mockup itself as the page plate, plus
interactive elements (links, buttons, inputs, menus) placed exactly over the design.

usage: python tools/canvas.py design/<name>.json [...]   (Pillow + OpenCV venv)

Spec keys
  src     mockup image;  crop: [x0,y0,x1,y1] to cut one screen out of a multi-screen mockup
  bake    true (default): the plate is the untouched mockup, so the page is pixel-identical.
          Text items ("t") are measured and rendered as an invisible, selectable text layer.
          Inputs get a second "clean" plate (placeholder erased) shown only while typing.
  items   coordinates are in full-mockup px (crop is subtracted automatically)
    t   text line: r = region, s = exact text, wt = weight            -> invisible text layer
    in  input: r = placeholder region (measured for font size/caret), box or at
    a / btn / faq / dd: box = [x0,y0,x1,y1], or at = [x,y] to flood-fill the shape around it
Outputs src/assets/canvas/<name>.webp (+ <name>-clean.webp) and src/canvas/<name>.json.
"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def runs(mask_1d, min_gap):
    idx = np.flatnonzero(mask_1d)
    if not len(idx):
        return []
    out, s, p = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - p > min_gap:
            out.append((s, p + 1)); s = i
        p = i
    out.append((s, p + 1))
    return out


def ink_map(img, x0, y0, x1, y1, opts):
    crop = img[y0:y1, x0:x1].astype(np.float32)
    ring = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.array(opts['bg'], np.float32) if 'bg' in opts else np.median(ring, axis=0)
    dist = np.sqrt(((crop - bg) ** 2).sum(axis=2))
    thr = float(np.clip(0.45 * np.percentile(dist, 99.5), 28, 90))
    return dist > thr


def grow_region(img, r, opts):
    """Widen a hand-measured region until text-coloured ink no longer touches its sides."""
    H, W = img.shape[:2]
    x0, y0, x1, y1 = [int(round(v)) for v in r]
    if opts.get('fixed'):
        return x0, y0, x1, y1
    h = y1 - y0
    core = slice(int(h * 0.3), max(int(h * 0.3) + 1, int(h * 0.75)))
    ink0 = ink_map(img, x0, y0, x1, y1, opts)
    if not ink0.any():
        return x0, y0, x1, y1
    text_col = np.median(img[y0:y1, x0:x1][ink0].astype(np.float32), axis=0)

    def text_ink(cols):
        ink = ink_map(img, x0, y0, x1, y1, opts)[core][:, cols]
        px = img[y0:y1, x0:x1][core][:, cols].astype(np.float32)
        return (ink & (np.sqrt(((px - text_col) ** 2).sum(axis=2)) < 70)).any()

    for _ in range(12):
        changed = False
        if x1 < W and x1 - int(r[2]) < max(24, h * 1.6) and text_ink(slice(-2, None)):
            x1 = min(W, x1 + 3); changed = True
        if x0 > 0 and int(r[0]) - x0 < max(12, h) and text_ink(slice(0, 2)):
            x0 = max(0, x0 - 2); changed = True
        if not changed:
            break
    return x0, y0, x1, y1


def measure(img, r, opts):
    """Ink metrics of the text inside region r: left x, width, baseline, x-height, colour."""
    x0, y0, x1, y1 = grow_region(img, r, opts)
    crop = img[y0:y1, x0:x1].astype(np.float32)
    ring = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.array(opts['bg'], np.float32) if 'bg' in opts else np.median(ring, axis=0)
    dist = np.sqrt(((crop - bg) ** 2).sum(axis=2))
    p99 = np.percentile(dist, 99.5)
    thr = float(np.clip(0.45 * p99, 28, 90))
    ink = dist > thr
    strong0 = dist >= 0.8 * p99
    if strong0.sum() > 8:  # keep only ink with the text's own colour (drops swooshes, artwork)
        tc = np.median(crop[strong0], axis=0)
        cd = np.sqrt(((crop - tc) ** 2).sum(axis=2))
        ok = cd < max(60.0, 0.7 * float(np.sqrt(((bg - tc) ** 2).sum())))
        ink &= ok
        dist = np.where(ok, dist, 0)
    h = y1 - y0
    spans = runs(ink.sum(axis=0) > 0, max(4, int(h * 0.9)))
    if not spans:
        raise ValueError(f'no ink in region {r}')
    sl, sr = (spans[0][0], spans[-1][1])
    prof = ink[:, sl:sr].sum(axis=1).astype(float)
    band = np.flatnonzero(prof >= 0.5 * prof.max())
    xtop, base = band[0], band[-1] + 1
    strong = dist[:, sl:sr] >= 0.8 * p99
    col = np.median(crop[:, sl:sr][strong], axis=0) if strong.any() else crop[:, sl:sr][ink[:, sl:sr]].mean(axis=0)
    sl, sr, xtop, base = int(sl), int(sr), int(xtop), int(base)
    return {
        'x': round(x0 + sl, 2), 'w': round(float(sr - sl), 2), 'base': round(y0 + float(base), 2),
        'xh': round(float(base - xtop), 2), 'c': '#%02x%02x%02x' % tuple(int(v) for v in np.clip(col, 0, 255)),
    }, (x0, y0, x1, y1, dist, thr)


def flood_box(img, at, tol=7, limit=None):
    """Bounding box of the uniform/smoothly shaded shape (button, card, field) around point at."""
    H, W = img.shape[:2]
    x, y = int(round(at[0])), int(round(at[1]))
    mask = np.zeros((H + 2, W + 2), np.uint8)
    src = cv2.GaussianBlur(img, (3, 3), 0)
    cv2.floodFill(src.copy(), mask, (x, y), (0, 0, 0), (tol,) * 3, (tol,) * 3, 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
    m = mask[1:-1, 1:-1]
    ys, xs = np.nonzero(m)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    if limit and ((x1 - x0) > limit[0] or (y1 - y0) > limit[1]):
        raise ValueError(f'flood at {at} leaked: {(x0, y0, x1, y1)}')
    return [int(x0), int(y0), int(x1), int(y1)]


def shift(v, dx, dy):
    return [v[0] - dx, v[1] - dy] + ([v[2] - dx, v[3] - dy] if len(v) == 4 else [])


def main(spec_path):
    spec = json.load(open(spec_path, encoding='utf-8'))
    name = spec['name']
    src = spec['src'] if os.path.isabs(spec['src']) else os.path.join(ROOT, spec['src'])
    full = np.array(Image.open(src).convert('RGB'))
    cx0, cy0, cx1, cy1 = spec.get('crop', [0, 0, full.shape[1], full.shape[0]])
    img = np.ascontiguousarray(full[cy0:cy1, cx0:cx1])
    H, W = img.shape[:2]
    bake = spec.get('bake', True)
    mask_all = np.zeros((H, W), np.uint8)   # every text line (used when not baking)
    mask_in = np.zeros((H, W), np.uint8)    # input placeholders only (for the clean plate)
    out, n_in = [], 0
    grow = spec.get('grow', 0.28)

    def add_mask(target, m, region):
        x0, y0, x1, y1, dist, thr = region
        rg = cv2.dilate((dist > thr * 0.3).astype(np.uint8), np.ones((3, 3), np.uint8), iterations=int(max(1, round(m['xh'] * grow))))
        target[y0:y1, x0:x1] |= rg

    for el in spec['items']:
        el = dict(el)
        for key in ('r', 'box', 'at', 'hit', 'onAt', 'offAt'):
            if key in el:
                el[key] = shift(el[key], cx0, cy0)
        if 'lines' in el:
            el['lines'] = [dict(ln, r=shift(ln['r'], cx0, cy0)) for ln in el['lines']]
        if 'at' in el and 'box' not in el:
            el['box'] = flood_box(img, el['at'], el.get('tol', 7), el.get('limit', [W * 0.9, H * 0.6]))
        if 'pad' in el and 'box' in el:
            p = el['pad']; b = el['box']; el['box'] = [b[0] - p, b[1] - p, b[2] + p, b[3] + p]
        k = el['k']
        if k == 'sel' and 'r' in el:
            m, reg = measure(img, el['r'], el)
            el['m'] = m
            add_mask(mask_in, m, reg); n_in += 1
            out.append(el)
            continue
        if k == 'in' and 'lines' in el:
            for ln in el['lines']:
                lm, reg = measure(img, ln['r'], ln)
                ln['m'] = lm
                add_mask(mask_in, lm, reg); add_mask(mask_all, lm, reg)
            el['m'] = el['lines'][0]['m']
            n_in += 1
        elif k in ('t', 'in') and 'r' in el:
            m, reg = measure(img, el['r'], el)
            el['m'] = m
            if 'c' in el:
                m['c'] = el['c']
            if not el.get('keep'):
                add_mask(mask_all, m, reg)
            if k == 'in':
                add_mask(mask_in, m, reg); n_in += 1
        elif k == 'in':
            n_in += 1
        if k == 'erase':
            x0, y0, x1, y1 = [int(round(v)) for v in el['r']]
            mask_all[y0:y1, x0:x1] = 1
            continue
        out.append(el)

    def inpaint(mask):
        mask = cv2.dilate(mask * 255, np.ones((3, 3), np.uint8), iterations=1)
        bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        clean = cv2.inpaint(bgr, mask, spec.get('radius', 6), cv2.INPAINT_TELEA)
        soft = cv2.GaussianBlur(clean, (0, 0), 2.2)
        alpha = cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 1.5)[..., None]
        return cv2.cvtColor((soft * alpha + clean * (1 - alpha)).astype(np.uint8), cv2.COLOR_BGR2RGB)

    S = spec.get('scale', 2)
    os.makedirs(os.path.join(ROOT, 'src/assets/canvas'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'src/canvas'), exist_ok=True)

    def save(arr, fname):
        im = Image.fromarray(arr).resize((W * S, H * S), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=45, threshold=2))
        im.save(os.path.join(ROOT, f'src/assets/canvas/{fname}.webp'), 'WEBP', quality=spec.get('quality', 86), method=6)

    save(img if bake else inpaint(mask_all), name)
    clean = False
    if bake and n_in:
        save(inpaint(mask_in), name + '-clean'); clean = True
    edge = np.concatenate([img[:, :3].reshape(-1, 3), img[:, -3:].reshape(-1, 3)])
    bg = spec.get('bg') or '#%02x%02x%02x' % tuple(int(v) for v in np.median(edge, axis=0))
    meta = {'name': name, 'W': W, 'H': H, 'bake': bake, 'clean': clean, 'bg': bg, 'items': out}
    json.dump(meta, open(os.path.join(ROOT, f'src/canvas/{name}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if spec.get('debug') or '--debug' in sys.argv:
        dbg = Image.fromarray(img).convert('RGB').resize((W * 2, H * 2))
        from PIL import ImageDraw
        d = ImageDraw.Draw(dbg)
        for e in out:
            if 'box' in e:
                b = [v * 2 for v in e['box']]
                d.rectangle(b, outline=(255, 0, 255) if e['k'] in ('a', 'btn', 'dd', 'faq') else (0, 120, 255), width=2)
                lab = e.get('href') or e.get('label') or e.get('name') or e['k']
                d.text((b[0] + 3, b[1] + 2), str(lab)[:28], fill=(255, 0, 0))
        dbg.save(os.path.join(ROOT, f'tools/.debug-{name}.png'))
    print(f'{name}: {W}x{H}, {sum(1 for e in out if e["k"] == "t")} text, {n_in} inputs, {sum(1 for e in out if e["k"] in ("a", "btn", "dd", "faq"))} hotspots')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        if not p.startswith('--'):
            main(p)
