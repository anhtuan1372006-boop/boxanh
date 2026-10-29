/* Chi tiết đơn BX2027-0015 (trang theo đúng thiết kế): xác nhận / điều chỉnh báo giá */
(function () {
  const CODE = 'BX2027-0015';
  const p = new URLSearchParams(location.search).get('ma');
  // the design shows this order before the quote is confirmed; anything else uses the data-driven page
  if (p && p !== CODE) { location.replace('chi-tiet-don.html?ma=' + encodeURIComponent(p) + location.hash); return; }
  document.addEventListener('DOMContentLoaded', () => {
    const { $, data, fmt, toast, dialog, closeModal, validate, icon, paintUnread } = BX;
    const order = () => data.orders().find(o => o.code === CODE);
    if (order() && order().quote.confirmed) { location.replace('chi-tiet-don.html?ma=' + CODE); return; }

    const confirm = () => {
      const list = data.orders();
      const o = list.find(x => x.code === CODE);
      if (o) {
        const now = new Date();
        o.quote.confirmed = true;
        o.step = 3;
        o.stepTimes[3] = `${fmt.date(now)} ${fmt.time(now)}`;
        o.quote.history.unshift([`${fmt.date(now)} ${fmt.time(now)}`, 'Bạn đã xác nhận báo giá 800.000 đ. Lịch được chốt.']);
        data.saveOrders(list);
        const n = data.notifs();
        n.unshift({ id: 'n' + Date.now(), icon: 'calendar-check', tone: '', title: `Đã chốt lịch đơn ${CODE}`, time: `${fmt.date(now)} · ${fmt.time(now)}`, text: 'Đội Minh – Hằng sẽ thực hiện vào Thứ Ba, 12/01/2027 (08:00 – 11:00).', href: `chi-tiet-don.html?ma=${CODE}`, read: false });
        data.saveNotifs(n);
        paintUnread();
      }
      const m = dialog(`<div class="modal-ic green">${icon('check-circle')}</div><h2>Đã xác nhận báo giá 800.000 đ</h2>
        <p class="modal-text">Chúng tôi đã chốt lịch và chuẩn bị triển khai theo thông tin hiện tại. Bạn sẽ nhận thông báo trước giờ thực hiện.</p>
        <div class="modal-actions"><a class="btn btn-primary" href="chi-tiet-don.html?ma=${CODE}">Xem đơn hàng ${icon('arrow-right')}</a></div>`);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.modal-close')) location.href = 'chi-tiet-don.html?ma=' + CODE; });
    };

    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'quote-ok') { e.stopImmediatePropagation(); confirm(); }
      if (act === 'quote-confirm') {
        e.stopImmediatePropagation();
        const ok = $('#q-ok');
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ok.animate([{ boxShadow: '0 0 0 0 rgba(34,160,111,.8)' }, { boxShadow: '0 0 0 14px rgba(34,160,111,0)' }], { duration: 900, iterations: 2 });
        toast('Bấm “Đồng ý” trong hộp xác nhận để chốt báo giá 800.000 đ.', 'info');
      }
      if (act === 'quote-later') { e.stopImmediatePropagation(); toast('Bạn có thể xác nhận báo giá bất cứ lúc nào trước 48 giờ.', 'info'); }
      if (act === 'quote-adjust') {
        e.stopImmediatePropagation();
        const m = dialog(`<div class="modal-ic">${icon('pencil')}</div><h2>Yêu cầu điều chỉnh báo giá</h2><p class="modal-text">Cho BOXANH biết hạng mục bạn muốn xem lại. Nhân viên sẽ phản hồi trong 2 giờ làm việc.</p>
          <form novalidate id="adj-form"><div class="field mt-16"><label class="label" for="adj-note">Nội dung <span class="req">*</span></label><textarea class="textarea" id="adj-note" required minlength="10" maxlength="300" placeholder="Ví dụ: Tôi có thể tự bốc xếp đồ nhỏ, mong giảm 1 nhân viên."></textarea></div>
          <div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">${icon('send')} Gửi yêu cầu</button></div></form>`);
        m.querySelector('[data-x]').addEventListener('click', () => closeModal(m));
        m.querySelector('#adj-form').addEventListener('submit', ev => {
          ev.preventDefault();
          if (!validate(ev.target)) return;
          const list = data.orders();
          const o = list.find(x => x.code === CODE);
          if (o) { o.quote.history.unshift([`${fmt.date(new Date())} ${fmt.time(new Date())}`, `Bạn yêu cầu điều chỉnh: “${m.querySelector('#adj-note').value.trim()}”.`]); data.saveOrders(list); }
          closeModal(m);
          toast('Đã gửi yêu cầu điều chỉnh. BOXANH sẽ phản hồi sớm.');
        });
      }
    }, true);
  });
})();
