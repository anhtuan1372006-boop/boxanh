/* BOXANH – shared behaviour for every page */
window.BX = (function () {
  'use strict';
  const D = window.BX_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ROOT = (document.currentScript && document.currentScript.src || '').replace(/assets\/js\/app\.js.*$/, '');

  /* ---------- storage (always guarded: private mode / blocked storage) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bx_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('bx_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem('bx_' + k); } catch (e) { /* ignore */ } },
  };
  const db = (key, seed) => {
    let v = store.get(key, null);
    if (v == null) { v = seed(); store.set(key, v); }
    return v;
  };

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${(window.BX_ICONS || {})[n] || ''}</svg>`;
  const img = name => `${ROOT}assets/img/${name}.webp`;
  const url = path => ROOT + path;
  const pad = n => String(n).padStart(2, '0');
  const fmt = {
    num: n => Math.round(n).toLocaleString('vi-VN'),
    vnd: n => Math.round(n).toLocaleString('vi-VN') + ' đ',
    range: (a, b) => `${Math.round(a).toLocaleString('vi-VN')} – ${Math.round(b).toLocaleString('vi-VN')} đ`,
    date: d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: d => `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    iso: d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    fromIso: s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
    weekday: d => ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()],
    size: b => b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB',
  };
  const param = k => new URLSearchParams(location.search).get(k);
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---------- toast ---------- */
  function toast(msg, type = 'success', ms = 3600) {
    const box = $('#toasts');
    if (!box) return;
    const ic = { success: 'check-circle', info: 'info', warn: 'alert-triangle', error: 'alert-circle' }[type] || 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = icon(ic) + `<div>${msg}</div>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 260); }, ms);
  }

  /* ---------- modal ---------- */
  let lastFocus = null;
  function openModal(id) {
    const m = typeof id === 'string' ? document.getElementById(id) : id;
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const f = m.querySelector('[autofocus], input:not([type=hidden]), select, textarea, button:not(.modal-close)');
    setTimeout(() => f && f.focus(), 30);
  }
  function closeModal(m) {
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    if (!$('.modal.is-open')) document.body.style.overflow = '';
    if (m.dataset.temp) m.remove();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function confirm({ title, text = '', ok = 'Đồng ý', cancel = 'Quay lại', tone = '', ic = 'help' }) {
    return new Promise(resolve => {
      const m = document.createElement('div');
      m.className = 'modal';
      m.dataset.temp = '1';
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.innerHTML = `<div class="modal-box">
        <button class="icon-btn modal-close" type="button" aria-label="Đóng">${icon('x')}</button>
        <div class="modal-ic ${tone}">${icon(ic)}</div>
        <h2>${title}</h2>${text ? `<p class="modal-text">${text}</p>` : ''}
        <div class="modal-actions"><button class="btn btn-light" type="button" data-r="0">${cancel}</button><button class="btn ${tone === 'red' ? 'btn-danger' : 'btn-primary'}" type="button" data-r="1">${ok}</button></div></div>`;
      document.body.appendChild(m);
      const done = v => { closeModal(m); resolve(v); };
      m.addEventListener('click', e => {
        const b = e.target.closest('[data-r]');
        if (b) done(b.dataset.r === '1');
        else if (e.target === m || e.target.closest('.modal-close')) done(false);
      });
      m.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } });
      openModal(m);
      setTimeout(() => m.querySelector('[data-r="1"]').focus(), 40);
    });
  }
  function dialog(html, size = '') {
    const m = document.createElement('div');
    m.className = 'modal';
    m.dataset.temp = '1';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="modal-box ${size}"><button class="icon-btn modal-close" type="button" aria-label="Đóng">${icon('x')}</button>${html}</div>`;
    document.body.appendChild(m);
    openModal(m);
    return m;
  }

  /* ---------- auth ---------- */
  const user = () => store.get('user', null);
  function login(u) {
    store.set('user', u);
    document.documentElement.setAttribute('data-auth', 'in');
  }
  function logout() {
    store.del('user');
    document.documentElement.removeAttribute('data-auth');
  }
  function paintUser() {
    const u = user();
    if (!u) return;
    $$('[data-user-name]').forEach(el => { el.textContent = u.name; });
    $$('[data-user-short]').forEach(el => { el.textContent = u.short || u.name; });
    $$('[data-user-phone]').forEach(el => { el.textContent = u.phone ? maskPhone(u.phone) : ''; });
  }
  const maskPhone = p => {
    const d = String(p).replace(/\D/g, '');
    return d.length >= 4 ? '•••• ' + d.slice(-4) : p;
  };
  const prettyPhone = p => {
    const d = String(p).replace(/\D/g, '');
    return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : p;
  };

  /* ---------- shared data accessors ---------- */
  const data = {
    orders: () => db('orders', D.orders),
    saveOrders: v => store.set('orders', v),
    order: code => data.orders().find(o => o.code === code),
    boxes: () => db('boxes', D.boxes),
    notifs: () => db('notifs', D.notifs),
    saveNotifs: v => store.set('notifs', v),
    tickets: () => db('tickets', D.tickets),
    saveTickets: v => store.set('tickets', v),
    addresses: () => db('addresses', D.addresses),
    saveAddresses: v => store.set('addresses', v),
    pickup: () => store.get('pickup', null),
    unread: () => data.notifs().filter(n => !n.read).length,
    orderTotal: o => (o.quote && o.quote.items ? o.quote.items.reduce((s, i) => s + i[2], 0) : 0),
    orderBadge: o => D.ORDER_BADGE[o.step] || D.ORDER_BADGE[0],
    nextCode: (prefix, list, key = 'code') => {
      const nums = list.map(x => parseInt(String(x[key]).split('-').pop(), 10)).filter(n => !isNaN(n));
      return prefix + String(Math.max(0, ...nums) + 1).padStart(4, '0');
    },
  };

  function paintUnread() {
    const n = data.unread();
    $$('[data-unread]').forEach(el => {
      el.hidden = n === 0;
      if (el.tagName === 'EM') el.textContent = n;
    });
  }

  /* ---------- form validation ---------- */
  const PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setError(el, msg) {
    const field = el.closest('.field') || el.parentElement;
    field.classList.add('is-invalid');
    el.setAttribute('aria-invalid', 'true');
    let err = field.querySelector(':scope > .field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      field.appendChild(err);
    }
    err.innerHTML = icon('alert-circle') + msg;
  }
  function clearError(el) {
    const field = el.closest('.field') || el.parentElement;
    if (!field) return;
    field.classList.remove('is-invalid');
    el.removeAttribute('aria-invalid');
    const err = field.querySelector(':scope > .field-error');
    if (err) err.remove();
  }
  function validate(form) {
    let first = null;
    $$('[required], [data-phone], [type=email]', form).forEach(el => {
      if (el.disabled || el.closest('[hidden]') || (el.type !== 'file' && !el.getClientRects().length && !el.closest('.pick, .opt'))) return;
      clearError(el);
      const v = (el.value || '').trim();
      let msg = '';
      if (el.type === 'checkbox') { if (el.required && !el.checked) msg = el.dataset.msg || 'Vui lòng xác nhận mục này.'; }
      else if (el.required && !v) msg = el.dataset.msg || 'Vui lòng nhập thông tin này.';
      else if (v && el.hasAttribute('data-phone') && !PHONE.test(v.replace(/[\s.]/g, ''))) msg = 'Số điện thoại chưa đúng (10 số, ví dụ 0987 654 321).';
      else if (v && el.type === 'email' && !EMAIL.test(v)) msg = 'Email chưa đúng định dạng.';
      else if (v && el.minLength > 0 && v.length < el.minLength) msg = `Vui lòng nhập ít nhất ${el.minLength} ký tự.`;
      else if (el.type === 'date' && v && el.min && v < el.min) msg = 'Vui lòng chọn ngày từ hôm nay trở đi.';
      if (msg) { setError(el, msg); first = first || el; }
    });
    $$('[data-need-one]', form).forEach(group => {
      const err = group.querySelector('.field-error');
      if (err) err.remove();
      group.classList.remove('is-invalid');
      if (!$$('input:checked', group).length) {
        group.classList.add('is-invalid');
        const p = document.createElement('p');
        p.className = 'field-error';
        p.innerHTML = icon('alert-circle') + (group.dataset.needOne || 'Vui lòng chọn ít nhất một mục.');
        group.appendChild(p);
        first = first || group.querySelector('input');
      }
    });
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return !first;
  }
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.matches && el.matches('[aria-invalid="true"]')) clearError(el);
    const g = el.closest && el.closest('[data-need-one].is-invalid');
    if (g && $$('input:checked', g).length) { g.classList.remove('is-invalid'); const er = g.querySelector('.field-error'); if (er) er.remove(); }
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.matches && el.matches('[aria-invalid="true"]')) clearError(el);
  });

  /* ---------- uploads (image previews) ---------- */
  function initUpload(root) {
    const input = $('input[type=file]', root);
    const list = $('[data-previews]', root) || root.parentElement.querySelector('[data-previews]');
    const drop = $('.drop', root);
    const max = +root.dataset.max || 10;
    root.files = root.files || [];
    const render = () => {
      if (!list) return;
      list.querySelectorAll('.preview.is-new').forEach(n => n.remove());
      root.files.forEach((f, i) => {
        const el = document.createElement('div');
        el.className = 'preview is-new';
        const isImg = /^image\//.test(f.type);
        el.innerHTML = (isImg ? `<img src="${URL.createObjectURL(f)}" alt="${esc(f.name)}">` : `<div class="empty" style="padding:10px;font-size:11px">${icon('file')}${esc(f.name)}</div>`) +
          `<button class="rm" type="button" aria-label="Xóa ${esc(f.name)}">${icon('x')}</button>`;
        el.querySelector('.rm').addEventListener('click', () => { root.files.splice(i, 1); render(); root.dispatchEvent(new Event('change')); });
        list.insertBefore(el, list.querySelector('[data-upload-anchor]'));
      });
      const counter = $('[data-upload-count]', root.closest('.field') || root);
      if (counter) counter.textContent = `${root.files.length + (+root.dataset.existing || 0)}/${max} ảnh`;
    };
    const add = files => {
      const existing = +root.dataset.existing || 0;
      let skipped = 0;
      Array.from(files).forEach(f => {
        if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) && !(root.dataset.accept === 'doc' && /pdf$/.test(f.type))) { skipped++; return; }
        if (f.size > 10 * 1048576) { toast(`Ảnh "${esc(f.name)}" lớn hơn 10MB.`, 'warn'); return; }
        if (root.files.length + existing >= max) { skipped++; return; }
        root.files.push(f);
      });
      if (skipped) toast(`Một số tệp không được thêm (chỉ nhận ảnh JPG, PNG, tối đa ${max} ảnh).`, 'warn');
      render();
      root.dispatchEvent(new Event('change'));
    };
    if (input) input.addEventListener('change', () => { add(input.files); input.value = ''; });
    if (drop) {
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
      drop.addEventListener('drop', e => add(e.dataTransfer.files));
    }
    root.reset = () => { root.files = []; render(); };
    render();
  }

  /* single document upload with file chip (partner registration) */
  function initDoc(root) {
    const input = $('input[type=file]', root);
    const slot = $('[data-doc-slot]', root);
    const render = f => {
      slot.innerHTML = f ? `<div class="file-chip"><span class="fc-ic">${icon(/pdf$/.test(f.type) ? 'file-text' : 'image')}</span><span class="grow"><b>${esc(f.name)}</b><small>${fmt.size(f.size)}</small></span><button class="icon-btn sm" type="button" aria-label="Xóa tệp">${icon('x')}</button></div>` : '';
      root.classList.toggle('has-file', !!f);
      if (f) slot.querySelector('button').addEventListener('click', () => { root.file = null; render(null); root.dispatchEvent(new Event('change')); });
    };
    input.addEventListener('change', () => {
      const f = input.files[0];
      input.value = '';
      if (!f) return;
      if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.type)) { toast('Chỉ nhận tệp JPG, PNG hoặc PDF.', 'warn'); return; }
      if (f.size > 10 * 1048576) { toast('Tệp lớn hơn 10MB.', 'warn'); return; }
      root.file = f;
      render(f);
      const field = root.closest('.field');
      if (field) { field.classList.remove('is-invalid'); const er = field.querySelector('.field-error'); if (er) er.remove(); }
      root.dispatchEvent(new Event('change'));
    });
    root.setDemo = (name, size, type) => { root.file = { name, size, type, demo: true }; render(root.file); };
  }

  /* ---------- generic widgets ---------- */
  function initTabs(root) {
    const tabs = $$('[data-tab]', root);
    const activate = (id, push) => {
      tabs.forEach(t => {
        const on = t.dataset.tab === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        const p = document.getElementById(t.dataset.tab);
        if (p) p.classList.toggle('is-active', on);
      });
      if (push && root.hasAttribute('data-tabs-hash')) history.replaceState(null, '', '#' + id);
      root.dispatchEvent(new CustomEvent('tabchange', { detail: id }));
    };
    tabs.forEach(t => {
      t.setAttribute('role', 'tab');
      t.addEventListener('click', () => activate(t.dataset.tab, true));
      t.addEventListener('keydown', e => {
        const i = tabs.indexOf(t);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          n.focus(); activate(n.dataset.tab, true);
        }
      });
    });
    root.setAttribute('role', 'tablist');
    const fromHash = location.hash.slice(1);
    const initial = tabs.find(t => t.dataset.tab === fromHash) || tabs.find(t => t.classList.contains('is-active')) || tabs[0];
    if (initial) activate(initial.dataset.tab, false);
    root.activate = id => activate(id, true);
  }

  function initSeg(root) {
    $$('button', root).forEach(b => b.addEventListener('click', () => {
      $$('button', root).forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', x === b); });
      root.dispatchEvent(new CustomEvent('segchange', { detail: b.dataset.value }));
    }));
  }

  function initStepper(root) {
    const input = $('input', root);
    const min = +input.min || 0;
    const max = +input.max || 99;
    const [dec, inc] = $$('button', root);
    const sync = () => {
      let v = parseInt(input.value, 10);
      if (isNaN(v)) v = min;
      v = Math.min(max, Math.max(min, v));
      input.value = v;
      dec.disabled = v <= min;
      inc.disabled = v >= max;
    };
    dec.addEventListener('click', () => { input.value = (+input.value || 0) - 1; sync(); input.dispatchEvent(new Event('input', { bubbles: true })); });
    inc.addEventListener('click', () => { input.value = (+input.value || 0) + 1; sync(); input.dispatchEvent(new Event('input', { bubbles: true })); });
    input.addEventListener('change', sync);
    input.addEventListener('blur', sync);
    sync();
  }

  function initCounter(el) {
    const out = document.querySelector(`[data-counter-for="${el.id}"]`);
    if (!out) return;
    const max = el.maxLength > 0 ? el.maxLength : 500;
    const upd = () => { out.textContent = `${el.value.length}/${max}`; };
    el.addEventListener('input', upd);
    upd();
  }

  /* signature pad */
  function initSignature(root) {
    const canvas = $('canvas', root);
    const ctx = canvas.getContext('2d');
    let drawing = false, last = null;
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const data = root.classList.contains('has-ink') ? canvas.toDataURL() : null;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d3f8a';
      if (data) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = data; }
    };
    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.addEventListener('pointerdown', e => { drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p;
      if (!root.classList.contains('has-ink')) { root.classList.add('has-ink'); root.dispatchEvent(new Event('change')); }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => canvas.addEventListener(ev, () => { drawing = false; }));
    root.clear = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); root.classList.remove('has-ink'); root.dispatchEvent(new Event('change')); };
    root.isSigned = () => root.classList.contains('has-ink');
    window.addEventListener('resize', debounce(size, 150));
    requestAnimationFrame(size);
  }

  /* ---------- page chrome ---------- */
  function closeAllDd(except) {
    $$('[data-dd].is-open').forEach(dd => {
      if (dd === except) return;
      dd.classList.remove('is-open');
      const b = dd.querySelector(':scope > button');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function initChrome() {
    // dropdowns
    $$('[data-dd]').forEach(dd => {
      const btn = dd.querySelector(':scope > button');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const open = !dd.classList.contains('is-open');
        closeAllDd(dd);
        dd.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open);
      });
    });
    document.addEventListener('click', e => { if (!e.target.closest('[data-dd]')) closeAllDd(); });

    // drawer
    $$('[data-drawer]').forEach(b => b.addEventListener('click', () => {
      const d = document.getElementById(b.dataset.drawer);
      d.classList.add('is-open');
      d.setAttribute('aria-hidden', 'false');
      b.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { const c = d.querySelector('[data-drawer-close]'); if (c) c.focus(); }, 50);
    }));
    const closeDrawer = d => {
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      $$(`[data-drawer="${d.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    };
    $$('.drawer').forEach(d => {
      d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-drawer-close]') || e.target.closest('a')) closeDrawer(d); });
    });

    // portal sidebar
    const app = $('.app');
    $$('[data-side-open]').forEach(b => b.addEventListener('click', () => { app.classList.add('side-open'); document.body.style.overflow = 'hidden'; }));
    $$('[data-side-close]').forEach(b => b.addEventListener('click', () => { app.classList.remove('side-open'); document.body.style.overflow = ''; }));

    // escape closes everything
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      closeAllDd();
      $$('.drawer.is-open').forEach(closeDrawer);
      const m = $$('.modal.is-open').pop();
      if (m) closeModal(m);
      if (app && app.classList.contains('side-open')) { app.classList.remove('side-open'); document.body.style.overflow = ''; }
    });

    // modals declared in markup
    document.addEventListener('click', e => {
      const o = e.target.closest('[data-modal-open]');
      if (o) { e.preventDefault(); openModal(o.dataset.modalOpen); return; }
      const m = e.target.closest('.modal');
      if (m && !m.dataset.temp && (e.target === m || e.target.closest('[data-modal-close], .modal-close'))) closeModal(m);
    });

    // logout
    $$('[data-logout]').forEach(b => b.addEventListener('click', async () => {
      const ok = await confirm({ title: 'Đăng xuất khỏi BOXANH?', text: 'Bạn có thể đăng nhập lại bất cứ lúc nào bằng số điện thoại.', ok: 'Đăng xuất', ic: 'logout' });
      if (!ok) return;
      logout();
      store.set('flash', 'Bạn đã đăng xuất. Hẹn gặp lại!');
      location.href = url('index.html');
    }));

    // reset every demo record (keeps the login)
    $$('[data-reset-demo]').forEach(b => b.addEventListener('click', async () => {
      const ok = await confirm({ title: 'Khôi phục dữ liệu demo?', text: 'Đơn hàng, lịch hẹn, yêu cầu hỗ trợ và thao tác ở cổng đối tác / nội bộ sẽ trở về trạng thái ban đầu.', ok: 'Khôi phục', tone: 'red', ic: 'refresh' });
      if (!ok) return;
      try { Object.keys(localStorage).filter(k => k.startsWith('bx_') && !['bx_user', 'bx_accounts'].includes(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
      store.set('flash', 'Đã khôi phục dữ liệu demo.');
      location.reload();
    }));

    // "coming soon" social buttons
    $$('[data-soon]').forEach(b => b.addEventListener('click', () => toast(`${b.dataset.soon} của BOXANH sẽ sớm ra mắt. Theo dõi email để nhận thông báo nhé!`, 'info')));

    // newsletter
    $$('[data-newsletter]').forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      const inp = $('input[type=email]', f);
      if (!EMAIL.test(inp.value.trim())) { toast('Vui lòng nhập email hợp lệ.', 'warn'); inp.focus(); return; }
      toast('Đăng ký nhận tin thành công! Cảm ơn bạn đã quan tâm BOXANH.');
      f.reset();
    }));

    // admin global search
    $$('[data-admin-search]').forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      const q = $('input', f).value.trim();
      try { sessionStorage.setItem('bx_admin_q', q); } catch (er) { /* ignore */ }
      if (/don-hang\.html$/.test(location.pathname)) document.dispatchEvent(new CustomEvent('admin-search', { detail: q }));
      else location.href = 'don-hang.html';
    }));

    // portal notification dropdowns
    const pn = $('[data-portal-notifs]');
    if (pn) {
      const partner = document.body.classList.contains('l-partner');
      const items = partner
        ? [['clipboard-list', 'Đơn mới được giao', 'BX2027-0022 · Bàn giao phòng lúc 16:00', 'don-duoc-giao.html']]
        : [
          ['alert-triangle', 'Sự cố mới YC-0028', 'Khách báo không tìm thấy đồ · BX2027-0015', 'su-co.html'],
          ['clipboard-list', '4 đơn chờ điều phối', 'Ca sáng 12/01/2027', 'dieu-phoi.html'],
          ['users', 'Hồ sơ đối tác mới', 'Đội An Phát đăng ký nhóm Vận chuyển', 'doi-tac.html'],
          ['box', '3 lịch thu hồi hộp', 'Cần phân công trong hôm nay', 'kho-hop.html'],
        ];
      pn.innerHTML = `<div class="dd-head"><b>Thông báo</b><small>${partner ? '1 thông báo mới' : '8 thông báo chưa đọc'}</small></div>` +
        items.map(([ic, t, s, href]) => `<a class="dd-note" href="${href}"><span class="dd-ic">${icon(ic)}</span><span><b>${t}</b><small>${s}</small></span></a>`).join('');
    }

    // misc
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
    $$('[data-tabs]').forEach(initTabs);
    $$('[data-seg]').forEach(initSeg);
    $$('[data-stepper]').forEach(initStepper);
    $$('textarea[maxlength], input[data-count]').forEach(initCounter);
    $$('[data-upload]').forEach(initUpload);
    $$('[data-doc]').forEach(initDoc);
    $$('[data-sig]').forEach(initSignature);
    $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
      const t = b.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(`Đã sao chép "${esc(t)}"`), () => toast(t, 'info'));
    }));
    // dates: never allow picking a past day
    $$('input[type=date][data-future]').forEach(el => { el.min = fmt.iso(new Date()); });

    paintUser();
    paintUnread();
    const flash = store.get('flash', null);
    if (flash) { store.del('flash'); setTimeout(() => toast(flash), 300); }
  }

  /* ---------- customer requests (shared by every booking form) ---------- */
  const splitAddr = s => {
    const parts = String(s || '').split(',').map(x => x.trim()).filter(Boolean);
    return { line: parts.shift() || '—', area: parts.join(', '), city: '', floor: '', lift: '' };
  };
  function createOrder(o) {
    const list = data.orders();
    const now = new Date();
    const stamp = `${fmt.date(now)} ${fmt.time(now)}`;
    // codes up to BX2027-0040 are taken by the internal demo data, so website requests start after them
    const used = list.filter(x => x.code.startsWith('BX2027-')).map(x => parseInt(x.code.slice(7), 10)).filter(n => !isNaN(n));
    const code = 'BX2027-' + String(Math.max(40, ...used) + 1).padStart(4, '0');
    const svcNames = o.services.map(s => D.SERVICES[s].name);
    const order = {
      code, created: fmt.date(now), title: svcNames.join(' + '), services: o.services, step: 0,
      stepTimes: [stamp, '', '', '', '', ''],
      from: splitAddr(o.from), to: o.to ? splitAddr(o.to) : null,
      date: o.date ? fmt.date(fmt.fromIso(o.date)) : 'Chưa chọn', weekday: o.date ? fmt.weekday(fmt.fromIso(o.date)) : '', time: o.time || 'Sẽ thống nhất',
      extra: o.note || '', resources: 'Đang sắp xếp', estimate: o.estimate || null,
      quote: { items: [], confirmed: false, history: o.estimate ? [[stamp, `Ước tính từ website: ${fmt.range(o.estimate[0], o.estimate[1])}.`]] : [] },
      boxes: o.boxes || 0, thumb: D.SERVICES[o.services[0]].img, contact: o.name || (user() || {}).name || '', phone: o.phone || '',
    };
    if (o.from) order.from.floor = o.floor || '';
    list.unshift(order);
    data.saveOrders(list);
    const n = data.notifs();
    n.unshift({ id: 'n' + Date.now(), icon: 'clipboard-check', tone: '', title: `Đã nhận yêu cầu ${code}`, time: `${fmt.date(now)} · ${fmt.time(now)}`, text: `BOXANH sẽ liên hệ để khảo sát và gửi báo giá chính thức cho đơn ${order.title}.`, href: `don-hang-chi-tiet.html?ma=${code}`, read: false });
    data.saveNotifs(n);
    paintUnread();
    return order;
  }
  function requestDone(order) {
    const logged = !!user();
    const track = `don-hang-chi-tiet.html?ma=${order.code}`;
    const m = dialog(`
      <div class="row row-top" style="gap:16px">
        <img src="${img('success-mascot')}" alt="" width="110" height="92" style="border-radius:16px;flex:none">
        <div>
          <span class="badge b-green">${icon('check')} Đã gửi thành công</span>
          <h2 class="mt-8">Yêu cầu đã được gửi</h2>
          <p class="modal-text">Mã yêu cầu: <b class="num" style="color:var(--ink)">${order.code}</b><br>Trạng thái: <span class="badge b-yellow">Chờ xác nhận thông tin</span></p>
        </div>
      </div>
      <p class="modal-text">BOXANH sẽ liên hệ với bạn sớm (trong 2 giờ làm việc) để xác nhận thông tin và báo giá chính thức.</p>
      ${logged ? '' : `<div class="note info mt-16">${icon('info')}<div>Đăng nhập bằng số điện thoại đã cung cấp để theo dõi yêu cầu này bất cứ lúc nào.</div></div>`}
      <div class="modal-actions">
        <a class="btn btn-light" href="${url('index.html')}">Về trang chủ</a>
        <a class="btn btn-primary" href="${url(logged ? track : 'dang-nhap.html?next=' + encodeURIComponent(track))}">${logged ? 'Theo dõi yêu cầu' : 'Đăng nhập để theo dõi'} ${icon('arrow-right')}</a>
      </div>`);
    return m;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChrome);
  else initChrome();

  return { $, $$, store, db, esc, icon, img, url, fmt, param, debounce, toast, openModal, closeModal, confirm, dialog, user, login, logout, paintUser, paintUnread, maskPhone, prettyPhone, data, validate, setError, clearError, initUpload, initStepper, createOrder, requestDone, ROOT };
})();
