/* Canvas pages: every text line was measured on the mockup (ink left, baseline, ink width,
   x-height). Here each line gets the font-size + letter-spacing that reproduce both its
   x-height and its width, and is placed so its ink starts and sits exactly where the
   mockup's did. All values are in design px; CSS turns them into container units. */
(function () {
  'use strict';
  const FAMILY = '"Be Vietnam Pro"';
  const ctx = document.createElement('canvas').getContext('2d');
  const xhCache = {};

  function metrics(el) {
    const s = el.dataset.s;
    const wt = el.dataset.wt || 400;
    ctx.font = `${wt} 100px ${FAMILY}`;
    if (!xhCache[wt]) xhCache[wt] = ctx.measureText('x').actualBoundingBoxAscent;
    const m = ctx.measureText(s);
    return { m, xh100: xhCache[wt], n: [...s].length };
  }

  function fitOne(el) {
    const d = el.dataset;
    const x = +d.x, base = +d.b, w = +d.w, xh = +d.xh;
    const { m, xh100, n } = metrics(el);
    const ink100 = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const fsW = (w / ink100) * 100;            // size that matches the width
    const fsH = (xh / xh100) * 100;            // size that matches the x-height
    // the mockup's lettering is a little condensed: keep its x-height and squeeze horizontally
    let fs = fsW, sx = 1;
    const mode = d.fit || (el.tagName === 'INPUT' ? 'w' : 'both'); // inputs can't be squeezed
    if (mode !== 'w' && n > 1) {
      fs = Math.min(fsH, fsW * 1.3);
      sx = fsW / fs;
    }
    if (d.fs) { fs = +d.fs; sx = fsW / fs; }
    const A = (m.fontBoundingBoxAscent * fs) / 100;
    const D = (m.fontBoundingBoxDescent * fs) / 100;
    const top = base - (fs + A - D) / 2;        // line-height: 1 → baseline sits at (fs + A - D) / 2
    const ox = x + (m.actualBoundingBoxLeft * fs * sx) / 100;
    const st = el.style;
    st.setProperty('--fs', fs.toFixed(3));
    st.setProperty('--sx', sx.toFixed(4));
    st.setProperty('--ls', '0');
    if (el.tagName === 'INPUT') {
      // inputs centre their text in the content box, so make the content box exactly one line tall
      const pt = top - +d.by;
      st.setProperty('--pl', (ox - +d.bx).toFixed(3));
      st.setProperty('--pt', pt.toFixed(3));
      st.setProperty('--pb', Math.max(0, +d.bh - pt - fs).toFixed(3));
    } else {
      st.setProperty('--ox', ox.toFixed(3));
      st.setProperty('--oy', top.toFixed(3));
    }
  }

  function plates() {
    document.querySelectorAll('.cv').forEach(cv => {
      const bg = cv.querySelector('.cv-bg');
      if (bg) cv.style.setProperty('--plate', `url("${bg.src}")`);
      if (cv.dataset.clean) cv.style.setProperty('--clean', `url("${new URL(cv.dataset.clean, document.baseURI).href}")`);
    });
  }

  async function fitAll() {
    plates();
    const els = [...document.querySelectorAll('.cv [data-s]')].filter(e => e.dataset.x);
    const weights = [...new Set(els.map(e => e.dataset.wt || 400))];
    try {
      await Promise.all(weights.map(wt => document.fonts.load(`${wt} 100px ${FAMILY}`, 'Ứớcđịnh')));
    } catch (e) { /* fall through with whatever font is available */ }
    els.forEach(fitOne);
    document.documentElement.classList.add('cv-ready');
  }

  // never leave the text hidden if fonts are slow or blocked
  setTimeout(() => document.documentElement.classList.add('cv-ready'), 2500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fitAll);
  else fitAll();

  /* ---------- interactions that the static design can't show ---------- */
  document.addEventListener('click', e => {
    const faq = e.target.closest('.cv-faq');
    const dd = e.target.closest('.cv-dd');
    document.querySelectorAll('.cv-pop.is-open').forEach(p => {
      if (!p.contains(e.target) && p.previousElementSibling !== faq && p.previousElementSibling !== dd) {
        p.classList.remove('is-open');
        if (p.previousElementSibling) p.previousElementSibling.setAttribute('aria-expanded', 'false');
      }
    });
    if (faq || dd) {
      const btn = faq || dd;
      const pop = btn.nextElementSibling;
      const open = !pop.classList.contains('is-open');
      pop.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.cv-pop.is-open').forEach(p => p.classList.remove('is-open'));
  });
  // multi-line placeholders are separate text lines: hide them while the field has text
  const syncField = i => {
    i.classList.toggle('has-v', !!i.value);
    document.querySelectorAll(`.cv-ph[data-ph-for="${i.id}"]`).forEach(p => { p.hidden = !!i.value; });
  };
  document.addEventListener('input', e => { if (e.target.matches && e.target.matches('.cv-in')) syncField(e.target); });
  document.addEventListener('change', e => { if (e.target.matches && e.target.matches('.cv-in')) syncField(e.target); });
  window.addEventListener('pageshow', () => document.querySelectorAll('.cv-in').forEach(syncField));
  // design toggles (checkbox / radio groups)
  document.addEventListener('click', e => {
    const t = e.target.closest('.cv-tog');
    if (!t) return;
    if (t.dataset.group) {
      document.querySelectorAll(`.cv-tog[data-group="${t.dataset.group}"]`).forEach(o => o.setAttribute('aria-checked', o === t));
    } else {
      t.setAttribute('aria-checked', t.getAttribute('aria-checked') !== 'true');
    }
    t.dispatchEvent(new Event('change', { bubbles: true }));
  });
  // switches + steppers
  document.addEventListener('click', e => {
    const ck = e.target.closest('.cv-chk');
    if (ck) { ck.setAttribute('aria-checked', ck.getAttribute('aria-checked') !== 'true'); ck.dispatchEvent(new Event('change', { bubbles: true })); return; }
    const out = e.target.closest('a[href="#dang-xuat"]');
    if (out && window.BX) { e.preventDefault(); BX.logout(); BX.store.set('flash', 'Bạn đã đăng xuất. Hẹn gặp lại!'); location.href = BX.url('index.html'); return; }
    const sw = e.target.closest('.cv-sw');
    if (sw) { sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true'); sw.dispatchEvent(new Event('change', { bubbles: true })); return; }
    const b = e.target.closest('.cv-step [data-d]');
    if (!b) return;
    const box = b.parentElement, i = box.querySelector('input');
    const v = Math.min(+box.dataset.max, Math.max(+box.dataset.min, (parseInt(i.value, 10) || 0) + +b.dataset.d));
    i.value = v;
    i.classList.toggle('changed', String(v) !== i.dataset.v0);
    i.dispatchEvent(new Event('input', { bubbles: true }));
  });
  document.addEventListener('input', e => {
    const i = e.target;
    if (i.matches && i.matches('.cv-num')) { i.value = i.value.replace(/\D/g, '').slice(0, 2); i.classList.toggle('changed', i.value !== i.dataset.v0); }
  });
  // options (slots, days)
  document.addEventListener('click', e => {
    const o = e.target.closest('.cv-opt');
    if (!o) return;
    if (o.getAttribute('aria-disabled') === 'true') { if (window.BX) BX.toast(o.dataset.why || 'Ngày này không còn trống. Vui lòng chọn ngày khác.', 'info'); return; }
    document.querySelectorAll(`.cv-opt[data-group="${o.dataset.group}"]`).forEach(x => x.setAttribute('aria-checked', x === o));
    o.dispatchEvent(new CustomEvent('optchange', { bubbles: true, detail: { group: o.dataset.group, value: o.dataset.value } }));
  });
  // upload zones
  document.addEventListener('change', e => {
    const i = e.target;
    if (i.matches && i.matches('.cv-file input') && i.files.length && window.BX) {
      BX.toast(i.dataset.done.replace('{n}', i.files.length));
    }
  });
  // generic actions on hotspots: data-act="toast:Message" | "info:Message" | "go:url"
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || !window.BX || !b.closest('.cv')) return;
    const [type, ...rest] = b.dataset.act.split(':');
    const msg = rest.join(':');
    if (type === 'toast') BX.toast(msg);
    else if (type === 'info') BX.toast(msg, 'info');
    else if (type === 'warn') BX.toast(msg, 'warn');
    else if (type === 'go') location.href = msg;
  });
  // forms that just confirm: <form data-done="Title|Text">
  document.addEventListener('submit', e => {
    const f = e.target;
    if (!f.matches('.cv-anchor[data-done]')) return;
    e.preventDefault();
    const missing = [...f.elements].find(x => x.required && !x.value.trim());
    if (missing) { BX.toast(`Vui lòng nhập ${missing.getAttribute('aria-label') || 'thông tin còn thiếu'}.`, 'warn'); missing.focus(); return; }
    const phone = [...f.elements].find(x => x.name === 'phone' && x.value);
    if (phone && !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone.value.replace(/[\s.]/g, ''))) { BX.toast('Số điện thoại chưa đúng (10 số, ví dụ 0987 654 321).', 'warn'); phone.focus(); return; }
    const [title, text] = f.dataset.done.split('|');
    BX.dialog(`<div class="modal-ic green">${BX.icon('check-circle')}</div><h2>${title}</h2><p class="modal-text">${text || ''}</p>`);
    [...f.elements].forEach(x => { if (x.matches('.cv-in')) { x.value = ''; x.dispatchEvent(new Event('input', { bubbles: true })); } });
  });
  // date fields show the design's "Chọn ngày" placeholder until focused
  document.addEventListener('focusin', e => {
    const i = e.target;
    if (i.matches('.cv-in[data-date]')) { i.type = 'date'; if (!i.min) { const t = new Date(); i.min = t.toISOString().slice(0, 10); } }
  });
  document.addEventListener('focusout', e => {
    const i = e.target;
    if (i.matches('.cv-in[data-date]') && !i.value) i.type = 'text';
  });
})();
