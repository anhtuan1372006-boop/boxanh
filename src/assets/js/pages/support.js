/* Hỗ trợ: FAQ filter + gửi yêu cầu CSKH */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, icon, fmt, toast, validate, data, user, param, dialog, paintUnread } = BX;
  const u = user();

  /* ---------- FAQ ---------- */
  const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  let cat = 'all';
  const filter = () => {
    const q = fold($('#faq-q').value.trim());
    let shown = 0;
    $$('#faq-list details').forEach(d => {
      const ok = (cat === 'all' || d.dataset.cat === cat) && (!q || fold(d.textContent).includes(q));
      d.hidden = !ok;
      if (ok) shown++;
      if (q && ok && shown === 1) d.open = true;
    });
    $('#faq-empty').hidden = shown > 0;
  };
  $('#faq-cats').addEventListener('segchange', e => { cat = e.detail; filter(); });
  $('#faq-q').addEventListener('input', BX.debounce(filter, 150));
  $('#faq-search').addEventListener('submit', e => { e.preventDefault(); filter(); $('#faq').scrollIntoView({ behavior: 'smooth' }); });

  /* ---------- support form ---------- */
  const form = $('#support-form');
  const orderSel = $('#sf-order');
  const boxSel = $('#sf-box');
  const orders = u ? data.orders().filter(o => !o.canceled) : [];
  orderSel.insertAdjacentHTML('beforeend', orders.map(o => `<option value="${o.code}">${o.code} · ${esc(o.title)}</option>`).join(''));
  const fillBoxes = () => {
    const list = orderSel.value === 'BX2027-0015' ? data.boxes() : [];
    boxSel.innerHTML = '<option value="">Không chọn</option>' + list.map(b => `<option>${b.code}</option>`).join('');
    boxSel.disabled = !list.length;
    $('#sf-order-label').textContent = orderSel.value || '—';
  };
  orderSel.addEventListener('change', fillBoxes);
  const syncWhere = () => { $('#sf-where-wrap').hidden = $('#sf-issue').value !== 'Không tìm thấy đồ'; };
  $('#sf-issue').addEventListener('change', syncWhere);

  const hop = param('hop');
  if (orders.find(o => o.code === 'BX2027-0015')) orderSel.value = 'BX2027-0015';
  else if (orders[0]) orderSel.value = orders[0].code;
  fillBoxes();
  if (hop && [...boxSel.options].some(o => o.value === hop)) {
    boxSel.value = hop;
    $('#sf-issue').value = 'Hộp bị hư hỏng';
  }
  syncWhere();
  if (u) { form.elements['name'].value = u.name; form.elements['phone'].value = u.phone || ''; }

  const renderTickets = () => {
    const mine = data.tickets().filter(t => u || t.guest);
    $('#ticket-list').innerHTML = mine.length ? mine.map(t => `
      <div class="notif yellow" style="align-items:center">
        <span class="notif-ic">${icon('clock')}</span>
        <div class="grow"><div class="row between wrap"><b class="num">${t.code} · ${esc(t.status)}</b><span class="xs muted">${t.date}</span></div>
        <p class="small">${esc(t.issue)}${t.order ? ' · ' + t.order : ''}</p><button class="link small" type="button" data-ticket="${t.code}">Xem tiến độ ${icon('arrow-right')}</button></div>
      </div>`).join('') : `<p class="muted small">Yêu cầu bạn gửi sẽ hiển thị ở đây.${u ? '' : ' <a class="link" href="dang-nhap.html?next=ho-tro.html">Đăng nhập</a> để xem toàn bộ lịch sử.'}</p>`;
  };
  renderTickets();
  $('#ticket-list').addEventListener('click', e => {
    const b = e.target.closest('[data-ticket]');
    if (!b) return;
    const t = data.tickets().find(x => x.code === b.dataset.ticket);
    dialog(`<div class="modal-ic">${icon('headset')}</div><h2>Yêu cầu ${t.code}</h2><p class="modal-text">${esc(t.issue)}${t.order ? ' · Đơn ' + t.order : ''}${t.box ? ' · Hộp ' + t.box : ''}</p>
      <div class="steps-scroll mt-20"><div class="steps sm keep" style="--n:5">
        <div class="step is-done"><span class="step-dot">${icon('check')}</span><div><b>Tiếp nhận</b><small>${t.date}</small></div></div>
        <div class="step ${t.status === 'Đã tiếp nhận' ? 'is-current' : 'is-done'}"><span class="step-dot">${t.status === 'Đã tiếp nhận' ? 2 : icon('check')}</span><div><b>Thu thập dữ liệu</b><small>QR, seal, ảnh</small></div></div>
        <div class="step ${t.status === 'Đang kiểm tra' ? 'is-current' : 'is-todo'}"><span class="step-dot">3</span><div><b>Đối chiếu</b></div></div>
        <div class="step is-todo"><span class="step-dot">4</span><div><b>Phản hồi</b></div></div>
        <div class="step is-todo"><span class="step-dot">5</span><div><b>Hoàn tất</b></div></div>
      </div></div>
      <div class="note info mt-20">${icon('info')}<div>${esc(t.text)}</div></div>`);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(form)) return;
    const f = new FormData(form);
    const list = data.tickets();
    const code = data.nextCode('YC-', list);
    const where = $('#sf-where-wrap').hidden ? '' : ` (${f.get('where')})`;
    list.unshift({ code, issue: f.get('issue') + where, order: f.get('order'), box: f.get('box'), date: fmt.date(new Date()), status: 'Đã tiếp nhận', guest: !u, text: 'CSKH đã nhận yêu cầu và sẽ liên hệ trong 24 giờ để thu thập thêm thông tin.' });
    data.saveTickets(list);
    if (u) {
      const n = data.notifs();
      n.unshift({ id: 'n' + Date.now(), icon: 'headset', tone: 'yellow', title: `Đã tiếp nhận yêu cầu ${code}`, time: `${fmt.date(new Date())} · ${fmt.time(new Date())}`, text: `CSKH BOXANH đang xử lý: ${f.get('issue')}.`, href: 'ho-tro.html#gui-yeu-cau', read: false });
      data.saveNotifs(n);
      paintUnread();
    }
    form.reset();
    $('#sf-photos').reset();
    if (u) { form.elements['name'].value = u.name; form.elements['phone'].value = u.phone || ''; }
    fillBoxes(); syncWhere();
    $('#sf-desc').dispatchEvent(new Event('input'));
    renderTickets();
    $('#ticket-list').scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast(`Đã gửi yêu cầu ${code} cho CSKH. Chúng tôi sẽ phản hồi trong 24 giờ.`);
  });
});
