/* Đăng ký đối tác */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, store, validate, setError, toast, icon, fmt, dialog } = BX;
  const form = $('#partner-form');

  $$('[data-pick-group]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const box = $$('input[name=groups]').find(i => i.value === b.dataset.pickGroup);
    box.checked = true;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    $('#ho-so').scrollIntoView({ behavior: 'smooth' });
    toast(`Đã chọn nhóm “${b.dataset.pickGroup}” trong hồ sơ.`, 'info');
  }));

  // "Không áp dụng" disables the price input on the same row
  $$('[data-na]').forEach(c => c.addEventListener('change', () => {
    const input = c.closest('tr').querySelector('input.input');
    input.disabled = c.checked;
    if (c.checked) input.value = '';
  }));

  const renderStatus = app => {
    const box = $('#pt-status');
    box.hidden = false;
    box.innerHTML = `<div class="row row-top"><span class="feat-ic">${icon('file-check')}</span><div class="grow"><div class="row between wrap"><b>Hồ sơ đang được xem xét</b><span class="badge b-yellow"><span class="dot"></span>Đang xem xét</span></div>
      <p class="small mt-4">Mã hồ sơ: <b class="num">${app.code}</b><br>Ngày nộp: ${app.date} · ${app.org}</p>
      <button class="link small mt-8" type="button" data-track>Theo dõi tiến độ ${icon('arrow-right')}</button></div></div>`;
    $('[data-track]', box).addEventListener('click', () => dialog(`<div class="modal-ic green">${icon('clipboard-check')}</div><h2>Tiến độ hồ sơ ${app.code}</h2><p class="modal-text">${app.org} · Nhóm: ${app.groups.join(', ')}</p>
      <div class="vtl mt-16"><div><time>${app.date}</time><b>Tiếp nhận hồ sơ</b><p>Đã nhận đủ thông tin và 2 tài liệu chứng minh.</p></div>
      <div class="warn"><time>Dự kiến trong 2 ngày làm việc</time><b>Đối chiếu giá &amp; điều kiện</b><p>Bộ phận vận hành đối tác sẽ gọi điện xác minh.</p></div>
      <div class="gray"><b>Thử 1 – 3 đơn nhỏ</b><p>Phối hợp một số đơn dịch vụ để đánh giá chất lượng.</p></div>
      <div class="gray"><b>Đánh giá &amp; phê duyệt</b><p>Thông báo kết quả qua điện thoại và SMS.</p></div></div>`));
  };
  const saved = store.get('partnerApp', null);
  if (saved) renderStatus(saved);

  $('#pt-sample').addEventListener('click', () => {
    const el = form.elements;
    el.org.value = 'Đội An Phát';
    el.owner.value = 'Trần Văn Phát';
    el.phone.value = '0901 234 567';
    el.area.value = 'Nội thành Hà Nội';
    $$('input[name=groups]').forEach(i => { i.checked = i.value === 'Vận chuyển & bốc xếp'; });
    el.cap.value = '5 nhân sự, có tổ trưởng';
    el.tools.value = '1 xe tải 1.5 tấn, đầy đủ dụng cụ bốc xếp';
    el.hours.value = 'Thứ 2 – Chủ nhật, 8:00 – 20:00';
    $('#doc-price').setDemo('bang-gia-dich-vu.jpg', 2.4 * 1048576, 'image/jpeg');
    $('#doc-terms').setDemo('dieu-kien-dich-vu.png', 1.8 * 1048576, 'image/png');
    [['p1', '300.000 – 500.000'], ['p2', '50.000 / tầng'], ['p3', '50.000 / giờ'], ['p4', '100.000 / người'], ['p5', '+30% sau 20:00'], ['p6', '50.000 – 200.000']].forEach(([n, v]) => { el[n].disabled = false; el[n].value = v; });
    $$('[data-na]').forEach(c => { c.checked = false; });
    $$('[aria-invalid]', form).forEach(BX.clearError);
    $$('.is-invalid', form).forEach(x => { x.classList.remove('is-invalid'); const er = x.querySelector('.field-error'); if (er) er.remove(); });
    toast('Đã điền dữ liệu mẫu. Hãy đánh dấu đồng ý điều khoản trước khi gửi.', 'info');
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = validate(form);
    [['#doc-price', 'Vui lòng tải lên bảng giá bằng văn bản.'], ['#doc-terms', 'Vui lòng tải lên điều kiện dịch vụ.']].forEach(([sel, msg]) => {
      const root = $(sel);
      if (!root.file) { setError($('input[type=file]', root), msg); if (ok) root.scrollIntoView({ behavior: 'smooth', block: 'center' }); ok = false; }
    });
    const priced = $$('#price-table tbody tr').some(tr => { const i = $('input.input', tr); return i.value.trim() || $('[data-na]', tr).checked; });
    if (ok && !priced) { toast('Vui lòng nhập ít nhất một mức giá hoặc đánh dấu “Không áp dụng”.', 'warn'); ok = false; }
    if (!ok) return;
    const btn = $('#pt-submit');
    btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      const f = new FormData(form);
      const app = { code: 'DT-2027-' + String(15 + Math.floor(Math.random() * 80)).padStart(4, '0'), date: fmt.date(new Date()), org: f.get('org'), groups: f.getAll('groups') };
      store.set('partnerApp', app);
      renderStatus(app);
      btn.classList.remove('is-loading'); btn.disabled = false;
      btn.innerHTML = `${icon('check')} Đã gửi hồ sơ – gửi lại nếu cần cập nhật`;
      $('#pt-status').scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(`Đã gửi hồ sơ ${app.code}. BOXANH sẽ liên hệ trong 2 ngày làm việc.`);
    }, 800);
  });
});
