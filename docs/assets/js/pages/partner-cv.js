/* Đăng ký đối tác (trang theo đúng thiết kế 10) */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, store, toast, dialog, icon, fmt } = BX;
  const form = $('#pt-form');
  const groups = $$('.cv-chk[data-name^="g"]');
  const naAll = $('.cv-chk[data-name="na-all"]');
  const na = $$('.cv-chk[data-name^="na"]').filter(c => c !== naAll);
  const prices = [1, 2, 3, 4, 5, 6].map(i => $('#pt-p' + i));
  const on = c => c.getAttribute('aria-checked') === 'true';
  const files = $$('.cv-file input');

  // cards at the top tick the matching service group and jump to the form
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act^="pick:"]');
    if (b) {
      e.stopImmediatePropagation();
      const c = $(`.cv-chk[data-name="${b.dataset.act.slice(5)}"]`);
      c.setAttribute('aria-checked', 'true');
      $('#ho-so').scrollIntoView({ behavior: 'smooth' });
      toast(`Đã chọn nhóm “${c.dataset.value}” trong hồ sơ.`, 'info');
    }
    const t = e.target.closest('[data-act="track"]');
    if (t) {
      e.stopImmediatePropagation();
      const app = store.get('partnerApp', { code: 'BX2027-0015', date: '12/01/2027' });
      dialog(`<div class="modal-ic green">${icon('clipboard-check')}</div><h2>Tiến độ hồ sơ ${app.code}</h2><p class="modal-text">Ngày nộp ${app.date} · Trạng thái: Đang xem xét</p>
        <div class="vtl mt-16"><div><time>${app.date}</time><b>Tiếp nhận hồ sơ</b><p>Đã nhận đủ thông tin và tài liệu chứng minh.</p></div>
        <div class="warn"><time>Dự kiến trong 2 ngày làm việc</time><b>Đối chiếu giá &amp; điều kiện</b><p>Bộ phận vận hành đối tác sẽ gọi điện xác minh.</p></div>
        <div class="gray"><b>Thử 1 – 3 đơn nhỏ</b><p>Phối hợp một số đơn dịch vụ để đánh giá chất lượng.</p></div>
        <div class="gray"><b>Đánh giá &amp; phê duyệt</b><p>Thông báo kết quả qua điện thoại và SMS.</p></div></div>`);
    }
  }, true);

  // "Không áp dụng" clears and locks the price on the same row
  const syncRow = i => {
    const p = prices[i];
    p.disabled = on(na[i]);
    if (p.disabled) { p.value = ''; p.dispatchEvent(new Event('input', { bubbles: true })); }
    p.style.opacity = p.disabled ? '.35' : '';
  };
  na.forEach((c, i) => c.addEventListener('change', () => { syncRow(i); naAll.setAttribute('aria-checked', na.every(on)); }));
  naAll.addEventListener('change', () => { na.forEach((c, i) => { c.setAttribute('aria-checked', on(naAll)); syncRow(i); }); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const need = [['#pt-org', 'tên đơn vị / nhóm'], ['#pt-owner', 'người phụ trách'], ['#pt-phone', 'số điện thoại']];
    for (const [sel, label] of need) {
      if (!$(sel).value.trim()) { toast(`Vui lòng nhập ${label}.`, 'warn'); $(sel).focus(); return; }
    }
    if (!/^0(3|5|7|8|9)\d{8}$/.test($('#pt-phone').value.replace(/[\s.]/g, ''))) { toast('Số điện thoại chưa đúng (10 số, ví dụ 0901 234 567).', 'warn'); $('#pt-phone').focus(); return; }
    if (!$('#pt-area').value) { toast('Vui lòng chọn khu vực phục vụ.', 'warn'); $('#pt-area').focus(); return; }
    if (!groups.some(on)) { toast('Vui lòng chọn ít nhất một nhóm dịch vụ.', 'warn'); groups[0].focus(); return; }
    const priced = prices.some((p, i) => p.value.trim() || on(na[i]));
    if (!priced) { toast('Vui lòng nhập ít nhất một mức giá hoặc đánh dấu “Không áp dụng”.', 'warn'); prices[0].focus(); return; }
    const code = 'DT-2027-' + String(15 + Math.floor(Math.random() * 80)).padStart(4, '0');
    const app = { code, date: fmt.date(new Date()), org: $('#pt-org').value.trim(), groups: groups.filter(on).map(c => c.dataset.value), files: files.reduce((s, f) => s + f.files.length, 0) };
    store.set('partnerApp', app);
    dialog(`<div class="modal-ic green">${icon('check-circle')}</div><h2>Đã gửi hồ sơ đăng ký</h2>
      <p class="modal-text">Mã hồ sơ: <b>${code}</b> · ${BX.esc(app.org)}<br>Nhóm dịch vụ: ${app.groups.map(BX.esc).join(', ')}.<br>BOXANH sẽ liên hệ với bạn trong 2 ngày làm việc. Giai đoạn tìm hiểu chưa cam kết sản lượng hoặc thanh toán cố định.</p>`);
  });
});
