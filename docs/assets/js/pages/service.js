/* Service pages: chuyển trọ, dọn phòng, bàn giao phòng */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, fmt, toast, validate, createOrder, requestDone, user, confirm, dialog, icon, img, openModal, closeModal } = BX;
  const u = user();

  // logged-in customers don't retype their contact details
  if (u) $$('input[name=name]').forEach(i => { if (!i.value) i.value = u.name; });
  if (u) $$('input[name=phone]').forEach(i => { if (!i.value) i.value = u.phone || ''; });

  const busy = (btn, on) => { btn.classList.toggle('is-loading', on); btn.disabled = on; };

  /* ---------- chuyển trọ ---------- */
  const moveForm = $('#service-form');
  if (moveForm) {
    moveForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(moveForm)) return;
      const f = new FormData(moveForm);
      const tasks = f.getAll('task');
      const btn = $('button[type=submit]', moveForm);
      busy(btn, true);
      setTimeout(() => {
        const order = createOrder({
          services: ['chuyen-tro'], from: f.get('from'), to: f.get('to'), date: f.get('date'), floor: f.get('floor'),
          note: [tasks.join(', '), f.get('size')].filter(Boolean).join(' · '),
          name: f.get('name'), phone: f.get('phone'), boxes: tasks.includes('Sử dụng hộp BOXANH') ? 10 : 0,
        });
        busy(btn, false);
        moveForm.reset();
        $$('[data-upload]', moveForm).forEach(x => x.reset && x.reset());
        if (u) { moveForm.elements['name'].value = u.name; moveForm.elements['phone'].value = u.phone || ''; }
        requestDone(order);
      }, 600);
    });
  }

  /* ---------- dọn phòng: live estimate ---------- */
  const cleanForm = $('#clean-form');
  if (cleanForm) {
    const BASE = { 'dinh-ky': 300000, 'truoc-khi-vao': 340000, 'sau-khi-di': 360000 };
    const LABEL = { 'dinh-ky': 'Dọn định kỳ', 'truoc-khi-vao': 'Dọn trước khi chuyển vào', 'sau-khi-di': 'Dọn sau khi chuyển đi' };
    const round = n => Math.round(n / 50000) * 50000;
    let est = [450000, 750000];
    const calc = () => {
      const f = new FormData(cleanForm);
      const area = Math.min(200, Math.max(8, +f.get('area') || 25));
      const rooms = Math.min(6, Math.max(1, +f.get('rooms') || 1));
      const cond = +f.get('cond') || 1;
      const low = round((BASE[f.get('type')] + area * 6000 + (rooms - 1) * 80000) * cond);
      const high = round(low * 1.65);
      est = [low, high];
      const condText = $('#c-cond').selectedOptions[0].textContent;
      const date = f.get('date') ? fmt.date(fmt.fromIso(f.get('date'))) : 'Chưa chọn';
      $('#clean-summary').innerHTML = [
        ['Loại dịch vụ', LABEL[f.get('type')]], ['Diện tích phòng', area + ' m²'], ['Số phòng', rooms + ' phòng'],
        ['Tình trạng hiện tại', condText], ['Ngày mong muốn', date], ['Ảnh đính kèm', ($('[data-upload]', cleanForm).files || []).length + ' ảnh'],
      ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      $('#clean-price').textContent = fmt.range(low, high);
    };
    cleanForm.addEventListener('input', calc);
    cleanForm.addEventListener('change', calc);
    $('[data-upload]', cleanForm).addEventListener('change', calc);
    calc();
    cleanForm.addEventListener('submit', e => {
      e.preventDefault();
      const area = $('#c-area'), rooms = $('#c-rooms');
      if (!(+area.value >= 8 && +area.value <= 200)) { BX.setError(area, 'Diện tích từ 8 đến 200 m².'); area.focus(); return; }
      if (!(+rooms.value >= 1 && +rooms.value <= 6)) { BX.setError(rooms, 'Số phòng từ 1 đến 6.'); rooms.focus(); return; }
      calc();
      const price = $('#clean-price');
      price.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 400 });
      if (matchMedia('(max-width: 1180px)').matches) price.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(`Ước tính: ${fmt.range(est[0], est[1])}. Bấm “Đặt lịch dọn phòng” để giữ lịch.`, 'info');
    });
    $('#clean-book').addEventListener('click', () => {
      $('#book-price').textContent = fmt.range(est[0], est[1]);
      const d = $('#c-date').value;
      if (d) $('#b-date').value = d;
      openModal('book-modal');
    });
    const bookForm = $('#book-form');
    bookForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(bookForm)) return;
      const f = new FormData(bookForm);
      const type = new FormData(cleanForm).get('type');
      const order = createOrder({
        services: ['don-phong'], from: f.get('addr'), date: f.get('date'), time: f.get('time'),
        note: `${LABEL[type]} · ${$('#c-area').value} m² · ${$('#c-rooms').value} phòng`, estimate: est,
        name: f.get('name'), phone: f.get('phone'),
      });
      closeModal($('#book-modal'));
      bookForm.reset();
      if (u) { bookForm.elements['name'].value = u.name; bookForm.elements['phone'].value = u.phone || ''; }
      requestDone(order);
    });
  }

  /* ---------- bàn giao phòng ---------- */
  const dl = $('#dl-checklist');
  if (dl) {
    dl.addEventListener('click', () => {
      const rows = [['Hạng mục', 'Nội dung kiểm tra', 'Trạng thái', 'Ghi chú']]
        .concat($$('#checklist tbody tr').map(tr => $$('td', tr).map(td => td.textContent.trim())));
      const csv = '﻿' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'BOXANH-checklist-ban-giao-phong.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('Đã tải mẫu checklist bàn giao (CSV, mở được bằng Excel).');
    });

    $('#fix-quote').addEventListener('click', () => dialog(`
      <div class="modal-ic">${icon('wrench')}</div><h2>Báo giá hạng mục FIX</h2>
      <p class="modal-text">Sửa bản lề tủ bếp · Bảo hành 30 ngày · Dữ liệu minh họa</p>
      <dl class="kv-rows mt-16">
        <div><dt>${icon('clipboard-check')} Kiểm tra &amp; căn chỉnh</dt><dd>50.000 – 80.000 đ</dd></div>
        <div><dt>${icon('wrench')} Thay bản lề (2 chiếc)</dt><dd>80.000 – 160.000 đ</dd></div>
        <div><dt>${icon('box')} Vật tư phụ</dt><dd>20.000 – 60.000 đ</dd></div>
      </dl>
      <div class="total-row"><span>Tổng dự kiến</span><span class="v">150.000 – 300.000 đ</span></div>
      <p class="hint mt-12">Giá cuối cùng được xác nhận sau khi kỹ thuật viên kiểm tra thực tế và bạn đồng ý.</p>`));

    $('#fix-approve').addEventListener('click', async e => {
      const btn = e.currentTarget;
      const ok = await confirm({ title: 'Duyệt hạng mục “Sửa bản lề tủ”?', text: 'Kỹ thuật viên sẽ thực hiện trong buổi bàn giao với chi phí dự kiến 150.000 – 300.000 đ. Giá cuối cùng xác nhận lại sau kiểm tra.', ok: 'Duyệt hạng mục', ic: 'wrench' });
      if (!ok) return;
      $('#fix-status').className = 'badge b-green';
      $('#fix-status').innerHTML = icon('check') + ' Bạn đã đồng ý';
      btn.disabled = true;
      btn.innerHTML = icon('check') + ' Đã duyệt';
      toast('Đã duyệt hạng mục FIX. Kỹ thuật viên sẽ chuẩn bị vật tư phù hợp.');
    });

    const gallery = () => dialog(`<h2>Hình ảnh bàn giao (12)</h2><p class="modal-text">Ảnh minh họa của biên bản mẫu BX2026-0284.</p>
      <div class="grid g-4 keep-2 gap-sm mt-16">${['check-1', 'check-2', 'check-3', 'check-4', 'room-after', 'area-san', 'area-bep', 'area-ve-sinh', 'area-cua', 'hand-kiem-tra', 'hand-ve-sinh', 'hand-bien-ban']
        .map((n, i) => `<img class="thumb" style="width:100%;height:110px" src="${img(n)}" alt="Ảnh bàn giao ${i + 1}">`).join('')}</div>`, 'lg');
    $$('[data-gallery]').forEach(b => b.addEventListener('click', gallery));

    $('#view-record').addEventListener('click', () => {
      const m = dialog(`
        <div class="row between wrap"><div><span class="badge b-green">${icon('file-check')} Đã ký 2 bên</span><h2 class="mt-8">Biên bản bàn giao phòng</h2><p class="modal-text">Mã biên bản: BB-2026-0284 · Lập ngày 20/12/2026 · Dữ liệu minh họa</p></div>
        <button class="btn btn-light btn-sm" type="button" data-print>${icon('printer')} In biên bản</button></div>
        <div class="grid g-2 mt-16">
          <div class="panel"><b class="small">Bên bàn giao (khách thuê)</b><p class="small mt-4">Nguyễn Tuấn Anh</p></div>
          <div class="panel"><b class="small">Bên nhận phòng</b><p class="small mt-4">Trần Minh Khoa – Chủ trọ</p></div>
        </div>
        <p class="small mt-16"><b>Địa chỉ:</b> Số 15 ngõ 102 Trần Duy Hưng, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội</p>
        <div class="table-wrap mt-16"><table class="table"><thead><tr><th>Hạng mục</th><th>Kết quả</th><th>Ghi chú</th></tr></thead><tbody>
          <tr><td>Tường &amp; sơn</td><td><span class="badge b-green">Đạt</span></td><td>Bình thường</td></tr>
          <tr><td>Điện &amp; đèn</td><td><span class="badge b-green">Đạt</span></td><td>Đã thay 1 bóng đèn</td></tr>
          <tr><td>Nước &amp; thiết bị</td><td><span class="badge b-green">Đạt</span></td><td>Hoạt động tốt</td></tr>
          <tr><td>Nội thất</td><td><span class="badge b-green">Đạt</span></td><td>Đã sửa bản lề tủ bếp (FIX)</td></tr>
          <tr><td>Vệ sinh</td><td><span class="badge b-green">Đạt</span></td><td>Đã vệ sinh toàn bộ</td></tr>
          <tr><td>Chìa khóa</td><td><span class="badge b-green">Đạt</span></td><td>2 chìa phòng, 1 thẻ từ</td></tr>
        </tbody></table></div>
        <p class="hint mt-12">Biên bản được lưu kèm 12 ảnh hiện trạng. Việc hoàn trả cọc (nếu có) là thỏa thuận riêng giữa khách thuê và chủ trọ.</p>`, 'lg');
      $('[data-print]', m).addEventListener('click', () => window.print());
    });

    const hf = $('#handover-form');
    hf.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(hf)) return;
      const up = $('#h-photos');
      if ((up.files || []).length + 3 < 3) { toast('Vui lòng thêm tối thiểu 3 ảnh hiện trạng.', 'warn'); return; }
      const f = new FormData(hf);
      const order = createOrder({
        services: ['ban-giao'], from: f.get('addr'), date: f.get('date'), time: f.get('time'),
        note: f.get('note') || 'Kiểm tra, vệ sinh, xử lý FIX và lập biên bản', name: f.get('name'), phone: f.get('phone'),
      });
      hf.reset();
      up.reset();
      if (u) { hf.elements['name'].value = u.name; hf.elements['phone'].value = u.phone || ''; }
      $('#h-note').dispatchEvent(new Event('input'));
      requestDone(order);
    });
  }
});
