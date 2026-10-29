"""Patch spec items by their text. usage: patch.py design/x.json '{"Text": {"r": [..]}, ...}'"""
import json, sys
path, patches = sys.argv[1], json.loads(sys.argv[2])
spec = json.load(open(path, encoding='utf-8'))
hit = set()
for el in spec['items']:
    s = el.get('s')
    if s in patches:
        el.update(patches[s]); hit.add(s)
json.dump(spec, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
miss = set(patches) - hit
print('patched', len(hit), 'missing', sorted(miss))
