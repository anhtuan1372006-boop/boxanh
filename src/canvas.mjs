// Renders a canvas (src/canvas/<name>.json, written by tools/canvas.py) as HTML: the design
// plate plus links, buttons, inputs and pop-ups placed at the design's exact coordinates.
import fs from 'node:fs';
const artwork = JSON.parse(fs.readFileSync(new URL('./artwork.json', import.meta.url), 'utf8'));

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = v => +(+v).toFixed(2);
const box = b => `--l:${n(b[0])};--t:${n(b[1])};--bw:${n(b[2] - b[0])};--bh:${n(b[3] - b[1])}`;
const attrs = el => Object.entries(el.attrs || {}).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');

// rough no-JS placement; canvas.js replaces it with exact values once the font is loaded
const approx = m => {
  const fs = m.xh / 0.535;
  return `--fs:${n(fs)};--ox:${n(m.x)};--oy:${n(m.base - 0.8 * fs)}`;
};
const dataMetrics = (el, m) => `data-s="${esc(el.s)}" data-wt="${el.wt || 400}" data-x="${m.x}" data-b="${m.base}" data-w="${m.w}" data-xh="${m.xh}"${el.fit ? ` data-fit="${el.fit}"` : ''}${el.fs ? ` data-fs="${el.fs}"` : ''}`;

function input(el, plain) {
  const m = el.m;
  const b = el.box;
  const date = el.type === 'date';
  // without a measured placeholder (fs given) the text is vertically centred in the field
  const metrics = m
    ? `${dataMetrics({ ...el, s: el.s || (el.lines && el.lines[0].s) || '' }, m)} data-bx="${b[0]}" data-by="${b[1]}" data-bh="${b[3] - b[1]}"`
    : '';
  const style = m
    ? `${box(b)};--wt:${el.wt || 400};--c:${m.c};--fs:${n(m.xh / 0.535)};--pl:${n(m.x - b[0])};--pt:${n(m.base - b[1] - 0.8 * m.xh / 0.535)}`
    : `${box(b)};--wt:${el.wt || 400};--fs:${el.fs || 8};--pl:${el.pl ?? 6};--pt:${n((b[3] - b[1] - (el.fs || 8)) / 2)};--pb:${n((b[3] - b[1] - (el.fs || 8)) / 2)}`;
  const label = el.label || el.s || (el.lines ? el.lines.map(l => l.s).join(' ') : el.name);
  const tag = el.multi ? 'textarea' : 'input';
  const common = `class="cv-in${el.multi ? ' multi' : ''}${el.cls ? ' ' + el.cls : ''}" id="${el.id}" name="${el.name}"${el.form ? ` form="${el.form}"` : ''} aria-label="${esc(label)}" autocomplete="${el.ac || 'off'}"${el.max ? ` maxlength="${el.max}"` : ''}${el.mode ? ` inputmode="${el.mode}"` : ''}${el.req ? ' required' : ''}${attrs(el)} ${metrics} style="${style}"`;
  // baked plates already show the placeholder: keep the field empty-looking until typed into
  const ph = plain && el.s ? ` placeholder="${esc(el.s)}"` : ' placeholder=""';
  if (tag === 'textarea') return `<textarea ${common}${ph}>${esc(el.value || '')}</textarea>`;
  return `<input type="${el.type && !date ? el.type : 'text'}"${date ? ' data-date' : ''} ${common}${ph}${el.value ? ` value="${esc(el.value)}"` : ''}>`;
}

function item(el, plain) {
  const m = el.m;
  switch (el.k) {
    case 't': {
      const tag = el.href ? 'a' : el.for ? 'label' : (el.tag || 'span');
      const a = [
        `class="cv-t${el.cls ? ' ' + el.cls : ''}"`,
        el.href ? `href="${el.href}"` : '', el.for ? `for="${el.for}"` : '',
        dataMetrics(el, m), `style="--wt:${el.wt || 400};--c:${m.c};${approx(m)}"`,
      ].filter(Boolean).join(' ');
      return `<${tag} ${a}>${esc(el.s)}</${tag}>`;
    }
    case 'a': {
      const cls = `cv-a${el.pill ? ' pill' : ''}${el.card ? ' card' : ''}${el.cls ? ' ' + el.cls : ''}`;
      const style = `${box(el.box)}${el.card ? `;--r:${el.card}` : ''}${el.rad ? `;--r:${el.rad}` : ''}`;
      if (el.soon) return `<button class="${cls}" type="button" data-soon="${esc(el.soon)}" aria-label="${esc(el.label)}" style="${style}"></button>`;
      if (el.act) return `<button class="${cls}" type="button" data-act="${esc(el.act)}" aria-label="${esc(el.label)}"${attrs(el)} style="${style}"></button>`;
      return `<a class="${cls}" href="${el.href}" aria-label="${esc(el.label)}"${attrs(el)} style="${style}"></a>`;
    }
    case 'btn':
      return `<button class="cv-a pill${el.cls ? ' ' + el.cls : ''}" type="submit"${el.form ? ` form="${el.form}"` : ''} aria-label="${esc(el.label)}" style="${box(el.box)}${el.rad ? `;--r:${el.rad}` : ''}"></button>`;
    case 'form':
      return `<form id="${el.id}" class="cv-anchor" novalidate aria-label="${esc(el.label || 'Biểu mẫu')}"${attrs(el)}></form>`;
    case 'in': {
      if (el.lines) {
        const ph = el.lines.map(ln => `<span class="cv-t cv-ph" data-ph-for="${el.id}" ${dataMetrics({ s: ln.s, wt: ln.wt || el.wt }, ln.m)} style="--wt:${ln.wt || el.wt || 400};--c:${ln.m.c};${approx(ln.m)}">${esc(ln.s)}</span>`).join('');
        return ph + input(el, plain);
      }
      return input(el, plain);
    }
    case 'dd': {
      const b = el.box;
      const links = el.menu.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('');
      return `<button class="cv-a cv-dd" type="button" aria-expanded="false" aria-haspopup="true" aria-label="${esc(el.label || 'Dịch vụ')}" style="${box(b)}"></button><div class="cv-pop" style="--l:${el.pl ?? b[0]};--t:${b[3] + 4};--bw:${el.w || 128};--pf:${el.pf || 7.4}">${links}</div>`;
    }
    case 'faq': {
      const b = el.box;
      return `<button class="cv-a cv-faq" type="button" aria-expanded="false" aria-label="Xem câu trả lời" style="${box(b)};--r:${el.rad || 7}"></button><div class="cv-pop" role="note" style="--l:${b[0]};--t:${b[3] + 3};--bw:${b[2] - b[0]};--pf:${el.pf || 7.4}">${esc(el.a)}</div>`;
    }
    case 'sel': {
      const b = el.box, m = el.m;
      const opts = el.options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
      return `<select class="cv-in cv-sel" id="${el.id}" name="${el.name}"${el.form ? ` form="${el.form}"` : ''} aria-label="${esc(el.label || el.s)}" ${dataMetrics(el, m)} data-bx="${b[0]}" data-by="${b[1]}" data-bh="${b[3] - b[1]}" style="${box(b)};--wt:${el.wt || 400};--c:${m.c};--fs:${n(m.xh / 0.535)};--pl:${n(m.x - b[0])};--pt:${n(m.base - b[1] - 0.8 * m.xh / 0.535)}"><option value="" selected disabled hidden></option>${opts}</select>`;
    }
    case 'tog': {
      // a design checkbox/radio: shows pixels of the design's own "on" or "off" control
      const b = el.box, [ox, oy] = el.onAt, [fx, fy] = el.offAt;
      const hit = el.hit || b;
      const role = el.group ? 'radio' : 'checkbox';
      return `<button class="cv-tog${el.ring ? ' ring' : ''}" type="button" role="${role}" aria-checked="${!!el.on}"${el.on ? ' data-default' : ''} aria-label="${esc(el.label)}"${el.group ? ` data-group="${el.group}"` : ''} data-name="${esc(el.name || el.group || '')}" data-value="${esc(el.value || el.label)}" style="${box(hit)};--hr:${el.hr ?? 7}"><span style="--l:${n(b[0] - hit[0])};--t:${n(b[1] - hit[1])};--bw:${n(b[2] - b[0])};--bh:${n(b[3] - b[1])};--onx:${ox};--ony:${oy};--offx:${fx};--offy:${fy};--r:${el.rad ?? 3}"></span></button>`;
    }
    case 'chk': {
      // design shows the box ticked (default) or, with inv, empty; the other state is drawn over it
      const hit = el.hit || el.box, b = el.box;
      const inner = `--l:${n(b[0] - hit[0])};--t:${n(b[1] - hit[1])};--bw:${n(b[2] - b[0])};--bh:${n(b[3] - b[1])}`;
      return `<button class="cv-chk${el.inv ? ' inv' : ''}" type="button" role="checkbox" aria-checked="${el.inv ? 'false' : 'true'}" aria-label="${esc(el.label)}" data-name="${esc(el.name || '')}"${el.value ? ` data-value="${esc(el.value)}"` : ''} style="${box(hit)};--r:${el.rad ?? 4}"><i style="${inner}"></i></button>`;
    }
    case 'sw': // the design shows the switch "on"; the off state is drawn over it
      // inv: the design shows it "off"; the on state is drawn over it
      return `<button class="cv-sw${el.inv ? ' inv' : ''}" type="button" role="switch" aria-checked="${el.inv ? 'false' : 'true'}" aria-label="${esc(el.label)}" data-name="${esc(el.name)}" style="${box(el.box)}"><i></i></button>`;
    case 'step': {
      // number shown by the design + its −/+ buttons; v sits on a cleaned patch of the plate
      const [mb, pb, vb] = [el.minus, el.plus, el.vbox];
      return `<div class="cv-step" data-min="${el.min ?? 0}" data-max="${el.max ?? 99}" data-name="${esc(el.name)}"><button class="cv-a" type="button" data-d="-1" aria-label="Giảm ${esc(el.label)}" style="${box(mb)};--r:5"></button><input class="cv-in cv-num" type="text" inputmode="numeric" id="${el.id}" name="${el.name}"${el.form ? ` form="${el.form}"` : ''} value="${el.value}" data-v0="${el.value}" aria-label="${esc(el.label)}" style="${box(vb)};--fs:${el.fs};--wt:${el.wt || 500}"><button class="cv-a" type="button" data-d="1" aria-label="Tăng ${esc(el.label)}" style="${box(pb)};--r:5"></button></div>`;
    }
    case 'opt': {
      // selectable option drawn by the page in the design's style; the design's default option
      // only needs drawing when it is NOT selected, the others only when they are
      const b = el.box;
      return `<button class="cv-opt${el.on ? ' def' : ''}${el.dot ? ' dot' : ''}${el.cls ? ' ' + el.cls : ''}" type="button" role="radio" aria-checked="${!!el.on}" aria-label="${esc(el.aria || el.label)}" data-group="${el.group}" data-value="${esc(el.value ?? el.label)}"${el.disabled ? ' aria-disabled="true"' : ''} style="${box(b)};--r:${el.rad ?? 8};--fs:${el.fs || 12};--wt:${el.wt || 600}"><i>${esc(el.label)}</i></button>`;
    }
    case 'file':
      return `<label class="cv-a cv-file" style="${box(el.box)};--r:${el.rad || 6}" aria-label="${esc(el.label)}"><input type="file" accept="${el.accept || 'image/*'}"${el.multi === false ? '' : ' multiple'} data-done="${esc(el.done || 'Đã thêm {n} ảnh.')}"></label>`;
    case 'anchor':
      return `<span id="${el.id}" class="cv-anchor" style="--t:${el.y}"></span>`;
    case 'html':
      return el.html;
    default:
      throw new Error(`unknown canvas item ${el.k}`);
  }
}

export function renderCanvas(name, cls, root = '') {
  const d = JSON.parse(fs.readFileSync(`src/canvas/${name}.json`, 'utf8'));
  const art = artwork[name] || [];
  const plain = !d.bake;
  // url()s inside custom properties resolve against the stylesheet, so canvas.js turns these
  // page-relative paths into absolute --plate / --clean values
  const clean = d.clean ? ` data-clean="${root}assets/canvas/${name}-clean.webp"` : '';
  return `<div class="cv ${cls}${d.bake ? ' baked' : ''}" data-cv="${name}"${clean} style="--W:${d.W};--ar:${d.W}/${d.H}">
<img class="cv-bg" src="${root}assets/canvas/${name}.webp" alt="" width="${d.W * 2}" height="${d.H * 2}" decoding="async">
${art.map(a => `<img class="cv-art${a.round ? ' cv-art-round' : ''}${a.blend ? ' cv-art-blend' : ''}" src="${root}assets/img/${a.src}.webp" alt="" width="${a.box[2] - a.box[0]}" height="${a.box[3] - a.box[1]}" loading="${a.box[1] < 350 ? 'eager' : 'lazy'}" decoding="async" style="${box(a.box)};--r:${a.radius ?? 5}">${(a.close || a.src.startsWith('lost-')) ? `<span class="cv-art-close" aria-hidden="true" style="${box([a.box[2]-22,a.box[1]+3,a.box[2]-3,a.box[1]+22])}">×</span>` : ''}`).join('\n')}
${d.items.map(e => {
  const r = e.r;
  const covered = e.k === 't' && r && art.some(a => r[0] >= a.box[0] && r[1] >= a.box[1] && r[2] <= a.box[2] && r[3] <= a.box[3]);
  const b = e.box;
  const keep = b && ((e.k === 'a' && e.pill) || e.k === 'btn') && art.some(a => b[0] < a.box[2] && b[2] > a.box[0] && b[1] < a.box[3] && b[3] > a.box[1]);
  return item(covered || keep ? {...e, cls: `${e.cls || ''}${covered ? ' over-art' : ''}${keep ? ' cv-keep-ui' : ''}`.trim()} : e, plain);
}).join('\n')}
</div>`;
}

export function canvasMeta(name) {
  return JSON.parse(fs.readFileSync(`src/canvas/${name}.json`, 'utf8'));
}
