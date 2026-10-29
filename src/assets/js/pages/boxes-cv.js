/* Hộp của tôi / Thông tin hộp / Lịch thu hồi (trang theo đúng thiết kế 09) */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, store, toast, dialog, icon, fmt, data, param } = BX;
  const setVal = (id, v, design) => {
    const i = $('#' + id);
    if (!i) return;
    i.value = v === design ? '' : v;
    i.classList.toggle('has-v', v !== design);
  };

  /* ---------- Thông tin hộp ---------- */
  if ($('#bi-title')) {
    const boxes = data.boxes();
    const b = boxes.find(x => x.code === (param('ma') || 'BX-000128')) || boxes[0];
    document.title = `Hộp ${b.code} | BOXANH`;
    setVal('bi-title', `BOXANH – ${b.code} (${b.idx})`, 'BOXANH – BX-000128 (1)');
    setVal('bi-seal', b.seal, 'SL-004281');
    $('#bi-report').href = `ho-tro.html?hop=${b.code}#gui-yeu-cau`;
    document.addEventListener('click', e => {
      if (!e.target.closest('[data-act="box-history"]')) return;
      e.stopImmediatePropagation();
      dialog(`<div class="modal-ic green">${icon('history')}</div><h2>Lịch sử hộp ${b.code}</h2><p class="modal-text">Hộp đang ở vòng sử dụng thứ ${b.uses}. Mỗi lần quét QR đều được ghi lại.</p>
        <div class="vtl mt-16">
          <div><time>12/01/2027 08:10</time><b>Giao cho khách hàng</b><p>Đơn ${b.order} · Quét QR, niêm phong seal ${b.seal}</p></div>
          <div><time>11/01/2027 17:30</time><b>Sẵn sàng tái sử dụng</b><p>Kiểm tra vỏ, nắp, tem QR đạt</p></div>
          <div><time>11/01/2027 09:15</time><b>Vệ sinh &amp; khử khuẩn</b><p>Khu vệ sinh – Kho</p></div>
          <div class="gray"><time>08/01/2027 18:40</time><b>Thu hồi từ khách</b><p>Đủ hộp và nắp</p></div>
        </div>`);
    }, true);
  }

  /* ---------- Hộp của tôi: chọn hộp + đặt lịch ---------- */
  if ($('#pickup-form')) {
    const all = $('.cv-chk[data-name="all"]');
    const rows = $$('.cv-chk[data-name^="row"]');
    const sizes = [1, 1, 1, 7];
    const count = () => rows.reduce((s, r, i) => s + (r.getAttribute('aria-checked') === 'true' ? sizes[i] : 0), 0);
    const paint = () => {
      const n = count();
      setVal('bx-selected', `Đã chọn ${n} hộp`, 'Đã chọn 10 hộp');
      all.setAttribute('aria-checked', n === 10);
    };
    all.addEventListener('change', () => { const on = all.getAttribute('aria-checked') === 'true'; rows.forEach(r => r.setAttribute('aria-checked', on)); paint(); });
    rows.forEach(r => r.addEventListener('change', paint));
    // keep a previously booked pickup visible when changing it
    const prev = store.get('pickup', null);
    if (prev) {
      const d = $$('.cv-opt[data-group="day"]').find(o => o.dataset.value === prev.date);
      const s = $$('.cv-opt[data-group="slot"]').find(o => o.dataset.value === prev.slot);
      if (d) $$('.cv-opt[data-group="day"]').forEach(o => o.setAttribute('aria-checked', o === d));
      if (s) $$('.cv-opt[data-group="slot"]').forEach(o => o.setAttribute('aria-checked', o === s));
      const note = $('#pk-note'); note.value = prev.note || ''; note.dispatchEvent(new Event('input', { bubbles: true }));
    }
    $('#pickup-form').addEventListener('submit', e => {
      e.preventDefault();
      const n = count();
      if (!n) { toast('Vui lòng chọn ít nhất một hộp cần thu hồi.', 'warn'); return; }
      const day = $('.cv-opt[data-group="day"][aria-checked="true"]').dataset.value;
      const slot = $('.cv-opt[data-group="slot"][aria-checked="true"]').dataset.value;
      const isNew = !store.get('pickup', null);
      store.set('pickup', { date: day, slot, count: n, boxes: data.boxes().slice(0, n).map(b => b.code), addr: '123 Nguyễn Văn Cừ, P. An Lạc, Q. Bình Thạnh, TP. Hồ Chí Minh', note: $('#pk-note').value.trim() });
      const list = data.notifs();
      list.unshift({ id: 'n' + Date.now(), icon: 'calendar-check', tone: '', title: isNew ? 'Lịch thu hồi đã được xác nhận' : 'Lịch thu hồi đã được cập nhật', time: `${fmt.date(new Date())} · ${fmt.time(new Date())}`, text: `Nhân viên BOXANH sẽ đến thu hồi ${n} hộp vào ${fmt.date(fmt.fromIso(day))}, ${slot}.`, href: 'lich-thu-hoi.html', read: false });
      data.saveNotifs(list);
      store.set('flash', isNew ? 'Đã gửi lịch thu hồi. BOXANH đã xác nhận lịch hẹn của bạn!' : 'Đã cập nhật lịch thu hồi.');
      location.href = 'lich-thu-hoi.html';
    });
    paint();
  }

  /* ---------- Lịch thu hồi ---------- */
  if ($('#pk-when')) {
    const p = store.get('pickup', null);
    if (p) {
      setVal('pk-when', `${fmt.date(fmt.fromIso(p.date))} • ${p.slot}`, '15/01/2027 • 08:00 – 10:00');
      setVal('pk-count', `${p.count || p.boxes.length} hộp`, '10 hộp');
    }
  }
});
