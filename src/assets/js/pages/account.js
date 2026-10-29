/* Customer account pages: overview, orders, order detail, boxes, pickup, notifications, profile */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, icon, img, fmt, toast, confirm, dialog, data, store, user, login, validate, param, openModal, closeModal, paintUser, paintUnread, closeModal: close } = BX;
  const D = window.BX_DATA;
  const u = user();
  if (!u) return; // the head script already redirected to the login page

  /* ---------- shared renderers ---------- */
  const badgeOf = o => o.canceled ? ['Đã hủy', 'b-gray'] : data.orderBadge(o);
  const badge = o => { const [t, c] = badgeOf(o); return `<span class="badge ${c}"><span class="dot"></span>${t}</span>`; };
  const addr = a => a ? [a.line, a.area, a.city].filter(Boolean).join(', ') : '';
  const short = a => a ? [a.line, a.area.split(',').pop()].filter(Boolean).join(', ').trim() : '';
  const stepsHtml = (o, sm) => D.ORDER_STEPS.map((name, i) => {
    const st = o.canceled ? 'is-todo' : i < o.step || o.step === 5 ? 'is-done' : i === o.step ? 'is-current' : 'is-todo';
    const t = (o.stepTimes[i] || '').split(' ');
    const label = i === 2 && o.step !== 2 ? 'Xác nhận báo giá' : name;
    return `<div class="step ${st}"><span class="step-dot">${st === 'is-done' ? icon('check') : i + 1}</span><div><b>${label}</b><small>${st === 'is-current' && i === 2 ? 'Xem và xác nhận báo giá' : t[0] || '—'}${!sm && t[1] && st === 'is-done' ? '<br>' + t[1] : ''}</small></div></div>`;
  }).join('');
  const orders = data.orders();
  const total = o => data.orderTotal(o);
  const priceText = o => total(o) ? fmt.vnd(total(o)) : o.estimate ? fmt.range(o.estimate[0], o.estimate[1]) : 'Chờ báo giá';
  const pickup = data.pickup();
  const boxes = data.boxes();
  const defaultAddr = () => data.addresses().find(a => a.isDefault) || data.addresses()[0];

  const orderCard = o => `
    <article class="card card-pad order-card">
      <a class="media" href="don-hang-chi-tiet.html?ma=${o.code}" tabindex="-1" aria-hidden="true"><img src="${img(o.thumb)}" alt=""></a>
      <div>
        <div class="row between wrap"><b class="num">#${o.code}</b><span class="small muted row" style="gap:6px">${icon('calendar', 'ic-sm')} ${o.date}${o.time ? ' · ' + o.time : ''}</span></div>
        <h3 class="h3 mt-4"><a href="don-hang-chi-tiet.html?ma=${o.code}">${esc(o.title)}</a></h3>
        <div class="row wrap mt-8">${badge(o)}<span class="small muted">${priceText(o)}</span></div>
        <p class="route mt-8">${icon('map-pin')} ${esc(short(o.from))}${o.to ? ` ${icon('arrow-right')} ${esc(short(o.to))}` : ''}</p>
        <div class="row wrap mt-16"><a class="btn btn-light btn-sm" href="don-hang-chi-tiet.html?ma=${o.code}">Xem chi tiết</a>${o.step === 2 && !o.canceled ? `<a class="btn btn-primary btn-sm" href="don-hang-chi-tiet.html?ma=${o.code}#bao-gia">${icon('check')} Xác nhận báo giá</a>` : ''}</div>
      </div>
    </article>`;

  /* ---------- tổng quan ---------- */
  if ($('#acc-kpis')) {
    const active = orders.filter(o => o.step < 5 && !o.canceled);
    $('#acc-kpis').innerHTML = [
      ['don-hang.html', 'clipboard-list', 'Đơn đang thực hiện', active.length, ''],
      ['hop-cua-toi.html', 'box', 'Hộp đang sử dụng', boxes.filter(b => b.status === 'Đang sử dụng').length, 'yellow'],
      ['lich-thu-hoi.html', 'calendar-days', 'Lịch thu hồi', pickup ? 1 : 0, 'peach'],
    ].map(([href, ic, label, n, tone]) => `<a class="kpi ${tone}" href="${href}"><span class="kpi-ic">${icon(ic)}</span><span><span class="kpi-label">${label}</span><span class="kpi-num" style="display:block">${n}</span></span><span class="round-arrow">${icon('arrow-right')}</span></a>`).join('');

    const o = active[0];
    $('#active-order').innerHTML = o ? `
      <div class="order-card">
        <a class="media" href="don-hang-chi-tiet.html?ma=${o.code}" tabindex="-1" aria-hidden="true"><img src="${img(o.thumb)}" alt=""></a>
        <div>
          <div class="row between wrap"><b class="num">#${o.code}</b><span class="small muted row" style="gap:6px">${icon('calendar', 'ic-sm')} ${o.date}</span></div>
          <h3 class="h3 mt-4">${esc(o.title)}</h3>
          <div class="mt-8">${badge(o)}</div>
          <p class="route mt-8">${icon('map-pin')} ${esc(short(o.from))}${o.to ? ` ${icon('arrow-right')} ${esc(short(o.to))}` : ''}</p>
        </div>
      </div>
      <div class="steps-scroll mt-20"><div class="steps sm keep" style="--n:6">${stepsHtml(o, true)}</div></div>
      <div class="grid g-2 mt-20">
        <a class="btn btn-outline" href="don-hang-chi-tiet.html?ma=${o.code}">Xem chi tiết</a>
        <a class="btn btn-primary" href="${o.step === 2 ? `don-hang-chi-tiet.html?ma=${o.code}#bao-gia` : 'ho-tro.html#gui-yeu-cau'}">${o.step === 2 ? icon('check') + ' Xác nhận báo giá' : icon('message-dots') + ' Liên hệ BOXANH'}</a>
      </div>` : `<div class="empty">${icon('clipboard-list')}<p>Bạn chưa có đơn hàng đang thực hiện.</p><a class="btn btn-primary mt-12" href="uoc-tinh-chi-phi.html">Tạo yêu cầu mới</a></div>`;

    $('#pickup-promo').innerHTML = pickup
      ? `<div class="promo" style="background:linear-gradient(100deg,#e3f4ea,#f6fbf8);border-color:#cfe9db"><span class="promo-ic" style="background:var(--g500);color:#fff">${icon('calendar-check')}</span><div class="grow"><h3>Lịch thu hồi đã được xác nhận</h3><p>${fmt.weekday(fmt.fromIso(pickup.date))}, ${fmt.date(fmt.fromIso(pickup.date))} · ${pickup.slot} · ${pickup.boxes.length} hộp</p></div><a class="btn btn-primary btn-sm" href="lich-thu-hoi.html">Xem lịch ${icon('arrow-right')}</a></div>`
      : `<div class="promo"><span class="promo-ic">${icon('archive')}</span><div class="grow"><h3>Bạn có ${boxes.length} hộp cần đặt lịch thu hồi</h3><p>Hãy đặt lịch thu hồi khi không còn sử dụng để cùng BOXANH lan tỏa lối sống xanh nhé!</p></div><a class="btn btn-yellow btn-sm" href="hop-cua-toi.html#dat-lich">Đặt lịch ${icon('arrow-right')}</a><img src="${img('box-banner')}" alt=""></div>`;

    $('#order-history').innerHTML = orders.slice(0, 5).map(o => `<tr><td><b class="num nowrap">${o.code}</b><span class="sub">${esc(o.title)}</span></td><td class="num">${o.created}</td><td>${badge(o)}</td><td class="right"><a class="link nowrap" href="don-hang-chi-tiet.html?ma=${o.code}">Chi tiết ${icon('arrow-right')}</a></td></tr>`).join('');

    $('#latest-notifs').innerHTML = data.notifs().slice(0, 2).map(n => `<a class="notif ${n.tone}${n.read ? '' : ''}" href="${n.href}" data-nid="${n.id}"><span class="notif-ic">${icon(n.icon)}</span><span class="grow"><b>${esc(n.title)}</b><span class="time">${n.time}</span><p>${esc(n.text)}</p></span>${icon('chevron-right')}</a>`).join('');
    const a = defaultAddr();
    $('#me-info').innerHTML = `<div><dt>${icon('user')} Họ và tên</dt><dd>${esc(u.name)}</dd></div><div><dt>${icon('phone')} Số điện thoại</dt><dd>${BX.maskPhone(u.phone)}</dd></div><div><dt>${icon('map-pin')} Địa chỉ mặc định</dt><dd style="max-width:60%">${a ? esc(a.line + ', ' + a.city) : '—'}</dd></div>`;
  }

  // reading a notification marks it as read (anywhere on the account pages)
  document.addEventListener('click', e => {
    const n = e.target.closest('[data-nid]');
    if (!n) return;
    const list = data.notifs();
    const item = list.find(x => x.id === n.dataset.nid);
    if (item && !item.read) { item.read = true; data.saveNotifs(list); }
  });

  /* ---------- danh sách đơn ---------- */
  if ($('#order-list')) {
    const render = mode => {
      const list = orders.filter(o => mode === 'all' || (mode === 'active' ? o.step < 5 && !o.canceled : o.step === 5 || o.canceled));
      $('#order-count').textContent = `${list.length} đơn hàng`;
      $('#order-list').innerHTML = list.length ? list.map(orderCard).join('') : `<div class="card empty">${icon('inbox')}<p>Chưa có đơn hàng nào trong mục này.</p></div>`;
    };
    $('#order-filter').addEventListener('segchange', e => render(e.detail));
    render('all');
  }

  /* ---------- chi tiết đơn ---------- */
  if ($('#od')) {
    const code = param('ma') || 'BX2027-0015';
    const getOrder = () => data.orders().find(o => o.code === code);
    if (!getOrder()) { $('#od-missing').hidden = false; return; }
    $('#od').hidden = false;
    const tabs = $('[data-tabs]');
    const goTab = (id, anchor) => {
      tabs.activate(id);
      const t = anchor ? document.getElementById(anchor) : tabs;
      setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const render = () => {
      const o = getOrder();
      document.title = `Đơn hàng ${o.code} | BOXANH`;
      $('#od-code').textContent = o.code;
      $('#od-created').textContent = o.created;
      $('#od-badge').innerHTML = o.step === 2 && !o.canceled ? `<span class="badge b-yellow b-lg">${icon('history')} Chờ xác nhận báo giá</span>` : badge(o).replace('class="badge', 'class="badge b-lg');
      $('#od-steps').innerHTML = stepsHtml(o);
      const svcs = o.services.map(s => D.SERVICES[s]);
      const card = (ic, label, body, pic) => `<div class="card card-sm row row-top">${icon(ic, 'ic-lg green')}<div class="grow"><p class="small strong">${label}</p>${body}</div>${pic ? `<img class="thumb" style="width:56px;height:56px" src="${img(pic)}" alt="">` : ''}</div>`;
      $('#od-cards').innerHTML = [
        card('map-pin', o.to ? 'Nơi đi' : 'Địa chỉ', `<p class="small mt-4">${esc(addr(o.from))}</p>${o.from.floor ? `<p class="xs muted mt-4">${esc(o.from.floor)}${o.from.lift ? ' · ' + esc(o.from.lift) : ''}</p>` : ''}`, o.code === 'BX2027-0015' ? 'addr-from' : ''),
        o.to ? card('map-pin', 'Nơi đến', `<p class="small mt-4">${esc(addr(o.to))}</p>${o.to.floor ? `<p class="xs muted mt-4">${esc(o.to.floor)}${o.to.lift ? ' · ' + esc(o.to.lift) : ''}</p>` : ''}`, o.code === 'BX2027-0015' ? 'addr-to' : '') : '',
        card('calendar', 'Ngày dự kiến', `<p class="h3 mt-4 num">${o.date}</p><p class="small muted">${o.weekday ? o.weekday + ' · ' : ''}${o.time}</p>`),
        card(svcs[0].icon, 'Dịch vụ yêu cầu', `<p class="h4 mt-4">${svcs[0].name}</p><p class="xs muted">${o.services[0] === 'chuyen-tro' ? 'Vận chuyển đồ đạc đến nơi ở mới' : esc(o.extra || '')}</p>`),
        card(svcs[1] ? svcs[1].icon : 'sparkles', 'Dịch vụ bổ sung', svcs[1] ? `<p class="h4 mt-4">${svcs.slice(1).map(s => s.name).join(', ')}</p><p class="xs muted">${esc(o.extra)}</p>` : `<p class="small mt-4">${esc(o.extra || 'Không có')}</p>`),
        card('users', 'Nguồn lực dự kiến', `<p class="small mt-4">${esc(o.resources)}</p><p class="xs muted">Đối tác được xác nhận khi chốt lịch</p>`),
      ].join('');

      $('#od-box-sub').textContent = o.boxes ? `Tổng ${o.boxes} hộp · Được niêm phong và vận chuyển an toàn` : 'Đơn này không sử dụng hộp BOXANH';
      const myBoxes = o.code === 'BX2027-0015' ? boxes : [];
      $('#od-boxes').innerHTML = myBoxes.length ? `
        <div class="media" style="aspect-ratio:3.6"><img src="${img('boxes-group')}" alt="Các hộp BOXANH của đơn hàng"></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Mã hộp</th><th>Mã seal</th><th>Trạng thái</th></tr></thead><tbody>
        ${myBoxes.slice(0, 3).map(b => `<tr><td class="num">${b.code}</td><td class="num">${b.seal}</td><td><span class="badge b-green"><span class="dot"></span>${b.status}</span></td></tr>`).join('')}
        <tr><td colspan="3" class="center"><a class="link small" href="hop-cua-toi.html">+${myBoxes.length - 3} hộp khác</a></td></tr></tbody></table></div>`
        : `<p class="muted small" style="grid-column:1/-1">${o.boxes ? 'Hộp sẽ được giao trước ngày thực hiện 1 ngày, kèm mã QR và seal riêng.' : 'Bạn có thể thêm hộp tái sử dụng khi trao đổi với nhân viên BOXANH.'}</p>`;

      const items = o.quote.items;
      $('#od-quote-table').innerHTML = items.length
        ? items.map(([ic, n, v]) => `<tr><td><span class="cell-ic">${icon(ic)} ${n}</span></td><td class="num">${fmt.vnd(v)}</td></tr>`).join('') + `<tr><td><b>Tổng cộng</b></td><td class="num"><b>${fmt.vnd(total(o))}</b></td></tr>`
        : `<tr><td colspan="2" class="empty">${icon('hourglass')}Báo giá chính thức đang được chuẩn bị${o.estimate ? ` · Ước tính ${fmt.range(o.estimate[0], o.estimate[1])}` : ''}.</td></tr>`;
      $('#od-history').innerHTML = o.quote.history.length
        ? o.quote.history.map(([t, x], i) => `<div class="${i ? 'gray' : ''}"><time>${t}</time><p>${esc(x)}</p></div>`).join('')
        : '<div class="gray"><p class="muted">Chưa có điều chỉnh nào.</p></div>';
      $('#od-box-table').innerHTML = myBoxes.length
        ? myBoxes.map(b => `<tr><td class="num"><b>${b.code}</b> <span class="muted">(${b.idx})</span></td><td class="num">${b.seal}</td><td><span class="badge b-green"><span class="dot"></span>${b.status}</span></td><td class="right"><a class="link small" href="thong-tin-hop.html?ma=${b.code}">Chi tiết ${icon('chevron-right')}</a></td></tr>`).join('')
        : `<tr><td colspan="4" class="empty">${icon('box')}Chưa có hộp nào được giao cho đơn này.</td></tr>`;
      const photos = o.code === 'BX2027-0015' ? ['pr-photo-1', 'pr-photo-2', 'pr-photo-3', 'pr-photo-4', 'addr-from', 'addr-to'] : [];
      $('#od-photos').innerHTML = photos.length
        ? photos.map((p, i) => `<figure class="media" style="aspect-ratio:1.2"><img src="${img(p)}" alt="Ảnh khảo sát ${i + 1}" loading="lazy"><figcaption class="media-label">${i < 4 ? 'Khảo sát 09/01' : i === 4 ? 'Điểm đi' : 'Điểm đến'}</figcaption></figure>`).join('')
        : `<div class="empty" style="grid-column:1/-1">${icon('images')}<p>Ảnh khảo sát sẽ được cập nhật sau khi nhân viên liên hệ.</p></div>`;

      // side column
      let side;
      const lines = items.map(([ic, n, v]) => `<div><dt>${icon(ic)} ${n}</dt><dd>${fmt.vnd(v)}</dd></div>`).join('');
      if (o.canceled) {
        side = `<div class="card card-pad"><h2 class="card-title">${icon('x-circle')} Đơn đã hủy</h2><p class="card-sub">Bạn có thể tạo yêu cầu mới bất cứ lúc nào.</p><a class="btn btn-primary btn-block mt-16" href="uoc-tinh-chi-phi.html">Tạo yêu cầu mới</a></div>`;
      } else if (o.step === 5) {
        side = `<div class="card card-pad"><div class="row between"><h2 class="card-title">${icon('check-circle')} Đơn đã hoàn tất</h2></div><dl class="kv-rows mt-12">${lines}</dl><div class="total-row"><span>Tổng cộng</span><span class="v">${fmt.vnd(total(o))}</span></div>
          <div class="grid g-2 mt-16"><a class="btn btn-light" href="uoc-tinh-chi-phi.html?dv=${o.services[0]}">${icon('refresh')} Đặt lại</a><button class="btn btn-yellow" type="button" data-rate>${icon('star')} Đánh giá</button></div></div>`;
      } else if (!items.length) {
        side = `<div class="card card-pad tint-yellow"><h2 class="card-title">${icon('hourglass')} Báo giá đang chuẩn bị</h2><p class="card-sub">Nhân viên BOXANH sẽ liên hệ trong 2 giờ làm việc để khảo sát và gửi báo giá chính thức.</p>${o.estimate ? `<p class="small strong mt-16">Khoảng giá ước tính</p><p class="price">${fmt.range(o.estimate[0], o.estimate[1])}</p>` : ''}<button class="btn btn-ghost btn-block mt-16" type="button" data-cancel>${icon('x-circle')} Hủy yêu cầu</button></div>`;
      } else {
        const confirmed = o.quote.confirmed;
        side = `<div class="card card-pad">
          <div class="row between wrap"><h2 class="card-title">${icon('box')} ${confirmed ? 'Báo giá đã xác nhận' : 'Báo giá cần bạn xác nhận'}</h2><span class="badge ${confirmed ? 'b-green' : 'b-yellow'}">${confirmed ? icon('check') + ' Đã xác nhận' : 'Giá minh họa'}</span></div>
          <p class="card-sub">${confirmed ? 'Lịch đã được chốt. Bạn thanh toán sau khi dịch vụ hoàn tất.' : 'Đây là chi phí dự kiến dựa trên thông tin hiện tại. Giá cuối cùng sẽ được xác nhận sau khi chốt đầy đủ thông tin đơn hàng.'}</p>
          <dl class="kv-rows card card-sm mt-16">${lines}</dl>
          <div class="total-row"><span>Tổng cộng</span><span class="v">${fmt.vnd(total(o))}</span></div>
          <p class="hint mt-8">${icon('info', 'ic-sm')} Chi phí phát sinh cần được bạn đồng ý trước khi thực hiện.</p>
          ${confirmed ? '' : `<button class="btn btn-primary btn-lg btn-block mt-16" type="button" data-confirm>${icon('check-circle')} Xác nhận báo giá</button>
          <button class="btn btn-outline btn-lg btn-block mt-8" type="button" data-adjust>${icon('pencil')} Yêu cầu điều chỉnh</button>`}
          <div class="mt-12"><button class="dd-item" type="button" data-goto="dieu-kien">${icon('file-text')}<b>Điều kiện áp dụng</b></button><button class="dd-item" type="button" data-goto="lich-su-dieu-chinh">${icon('history')}<b>Lịch sử điều chỉnh</b></button></div>
        </div>`;
      }
      side += `<div class="card card-pad row row-top"><span class="feat-ic">${icon('message-dots')}</span><div class="grow"><b>Cần hỗ trợ?</b><p class="small muted">Nhắn BOXANH để được tư vấn thêm về đơn hàng này.</p><button class="btn btn-outline btn-sm mt-12" type="button" data-help>${icon('message')} Nhắn BOXANH</button></div></div>`;
      $('#od-side').innerHTML = side;
    };
    render();

    $('#od-side').addEventListener('click', async e => {
      const t = e.target.closest('button');
      if (!t) return;
      const list = data.orders();
      const o = list.find(x => x.code === code);
      if (t.matches('[data-goto]')) goTab('bao-gia', t.dataset.goto);
      else if (t.matches('[data-help]')) goTab('ho-tro-don');
      else if (t.matches('[data-confirm]')) {
        const ok = await confirm({ title: `Xác nhận báo giá ${fmt.vnd(total(o))}?`, text: 'Sau khi xác nhận, chúng tôi sẽ chốt lịch và chuẩn bị triển khai theo thông tin hiện tại.', ok: 'Đồng ý', cancel: 'Quay lại' });
        if (!ok) return;
        const now = new Date();
        o.quote.confirmed = true;
        o.step = 3;
        o.stepTimes[2] = o.stepTimes[2] || `${fmt.date(now)} ${fmt.time(now)}`;
        o.stepTimes[3] = `10/01/2027 ${fmt.time(now)}`;
        o.resources = o.resources.includes('Đội') ? o.resources : o.resources + ' • Đội Minh – Hằng';
        o.quote.history.unshift([`10/01/2027 ${fmt.time(now)}`, `Bạn đã xác nhận báo giá ${fmt.vnd(total(o))}. Lịch được chốt.`]);
        data.saveOrders(list);
        const n = data.notifs();
        n.unshift({ id: 'n' + Date.now(), icon: 'calendar-check', tone: '', title: `Đã chốt lịch đơn ${o.code}`, time: `10/01/2027 · ${fmt.time(now)}`, text: `Đội Minh – Hằng sẽ thực hiện vào ${o.weekday}, ${o.date} (${o.time}).`, href: `don-hang-chi-tiet.html?ma=${o.code}`, read: false });
        data.saveNotifs(n);
        paintUnread();
        render();
        toast('Đã xác nhận báo giá. Lịch thực hiện đã được chốt!');
      } else if (t.matches('[data-adjust]')) {
        const m = dialog(`<div class="modal-ic">${icon('pencil')}</div><h2>Yêu cầu điều chỉnh báo giá</h2><p class="modal-text">Cho BOXANH biết hạng mục bạn muốn xem lại. Nhân viên sẽ phản hồi trong 2 giờ làm việc.</p>
          <form novalidate id="adj-form"><div class="stack mt-16" style="--gap:8px" data-need-one="Chọn ít nhất một hạng mục.">${o.quote.items.map(([, n]) => `<label class="check"><input type="checkbox" name="item" value="${n}"><span>${n}</span></label>`).join('')}</div>
          <div class="field mt-12"><label class="label" for="adj-note">Ghi chú</label><textarea class="textarea" id="adj-note" name="note" maxlength="300" placeholder="Ví dụ: Tôi có thể tự bốc xếp đồ nhỏ, mong giảm 1 nhân viên."></textarea></div>
          <div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">${icon('send')} Gửi yêu cầu</button></div></form>`);
        $('[data-x]', m).addEventListener('click', () => close(m));
        $('#adj-form', m).addEventListener('submit', ev => {
          ev.preventDefault();
          if (!validate(ev.target)) return;
          const f = new FormData(ev.target);
          o.quote.history.unshift([`${fmt.date(new Date())} ${fmt.time(new Date())}`, `Bạn yêu cầu xem lại: ${f.getAll('item').join(', ')}${f.get('note') ? ' – “' + f.get('note') + '”' : ''}.`]);
          data.saveOrders(list);
          close(m);
          render();
          toast('Đã gửi yêu cầu điều chỉnh. BOXANH sẽ phản hồi sớm.');
        });
      } else if (t.matches('[data-cancel]')) {
        const ok = await confirm({ title: 'Hủy yêu cầu này?', text: 'Yêu cầu chưa có báo giá nên bạn được hủy miễn phí.', ok: 'Hủy yêu cầu', cancel: 'Giữ lại', tone: 'red', ic: 'x-circle' });
        if (!ok) return;
        o.canceled = true;
        data.saveOrders(list);
        render();
        toast('Đã hủy yêu cầu.', 'info');
      } else if (t.matches('[data-rate]')) {
        const m = dialog(`<div class="modal-ic">${icon('star')}</div><h2>Đánh giá dịch vụ</h2><p class="modal-text">Đơn ${o.code} · ${esc(o.title)}</p>
          <div class="row mt-16" role="radiogroup" aria-label="Số sao" style="gap:6px" id="rate">${[1, 2, 3, 4, 5].map(i => `<button class="icon-btn" type="button" data-star="${i}" aria-label="${i} sao" style="color:var(--y500)">${icon('star', 'ic-lg')}</button>`).join('')}</div>
          <div class="field mt-12"><label class="label" for="rate-note">Nhận xét</label><textarea class="textarea" id="rate-note" maxlength="300" placeholder="Điều bạn hài lòng hoặc muốn BOXANH cải thiện…"></textarea></div>
          <div class="modal-actions"><button class="btn btn-primary" type="button" data-send>${icon('send')} Gửi đánh giá</button></div>`);
        let stars = 5;
        const paint = () => $$('[data-star]', m).forEach(b => { b.querySelector('svg').style.fill = +b.dataset.star <= stars ? 'currentColor' : 'none'; b.setAttribute('aria-pressed', +b.dataset.star <= stars); });
        $$('[data-star]', m).forEach(b => b.addEventListener('click', () => { stars = +b.dataset.star; paint(); }));
        paint();
        $('[data-send]', m).addEventListener('click', () => { close(m); toast(`Cảm ơn bạn đã đánh giá ${stars} sao!`); });
      }
    });

    const help = $('#od-help');
    help.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(help)) return;
      help.reset();
      $('#od-msg').dispatchEvent(new Event('input'));
      toast('Đã gửi tin nhắn. Nhân viên phụ trách sẽ phản hồi qua điện thoại hoặc SMS.');
    });
  }

  /* ---------- hộp của tôi ---------- */
  if ($('#box-list')) {
    let expanded = false;
    const picked = new Set(pickup ? pickup.boxes : boxes.map(b => b.code));
    const row = b => `<div class="box-row"><input class="cbx" type="checkbox" data-box="${b.code}" aria-label="Chọn hộp ${b.code}" ${picked.has(b.code) ? 'checked' : ''}><img src="${img('box-thumb')}" alt=""><div class="grow"><b class="num">${b.code} (${b.idx})</b><small>Seal: ${b.seal}</small></div><span class="badge b-green"><span class="dot"></span>${b.status}</span><a class="icon-btn sm" href="thong-tin-hop.html?ma=${b.code}" aria-label="Xem thông tin hộp ${b.code}">${icon('chevron-right')}</a></div>`;
    const renderList = () => {
      $('#box-list').innerHTML = (expanded ? boxes : boxes.slice(0, 3)).map(row).join('');
      const rest = boxes.slice(3);
      const more = $('#box-more');
      more.innerHTML = `<img src="${img('box-thumb')}" alt=""><span class="grow"><b>${expanded ? 'Thu gọn danh sách' : `${rest.length} hộp còn lại`}</b><small>${rest[0].code} → ${rest[rest.length - 1].code}</small></span>${icon(expanded ? 'chevron-up' : 'chevron-down')}`;
      more.setAttribute('aria-expanded', expanded);
      syncCount();
    };
    const syncCount = () => {
      $('#box-selected').textContent = picked.size;
      const all = $('#box-all');
      all.checked = picked.size === boxes.length;
      all.indeterminate = picked.size > 0 && picked.size < boxes.length;
    };
    $('#box-total').textContent = boxes.length;
    $('#box-order-sub').textContent = `${boxes.length} hộp · Đang sử dụng · Nhận ngày ${boxes[0].received}`;
    $('#box-list').addEventListener('change', e => {
      const c = e.target.closest('[data-box]');
      if (!c) return;
      c.checked ? picked.add(c.dataset.box) : picked.delete(c.dataset.box);
      syncCount();
    });
    $('#box-all').addEventListener('change', e => {
      boxes.forEach(b => (e.target.checked ? picked.add(b.code) : picked.delete(b.code)));
      renderList();
    });
    $('#box-more').addEventListener('click', () => { expanded = !expanded; renderList(); });
    renderList();

    // calendar
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const earliest = new Date(2027, 0, 13);
    const min = today > earliest ? today : earliest;
    const max = new Date(min); max.setDate(max.getDate() + 45);
    const freeUntil = new Date(2027, 0, 18);
    let sel = pickup ? fmt.fromIso(pickup.date) : (new Date(2027, 0, 15) >= min ? new Date(2027, 0, 15) : new Date(min));
    let view = new Date(sel.getFullYear(), sel.getMonth(), 1);
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const renderCal = () => {
      const first = new Date(view);
      const offset = (first.getDay() + 6) % 7;
      const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      const canPrev = new Date(view.getFullYear(), view.getMonth(), 0) >= min;
      const canNext = new Date(view.getFullYear(), view.getMonth() + 1, 1) <= max;
      let cells = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => `<span class="dow">${d}</span>`).join('');
      cells += '<span></span>'.repeat(offset);
      for (let d = 1; d <= days; d++) {
        const dt = new Date(view.getFullYear(), view.getMonth(), d);
        const dis = dt < min || dt > max;
        const isSel = dt.getTime() === sel.getTime();
        cells += `<button type="button" data-day="${fmt.iso(dt)}" ${dis ? 'disabled' : ''} class="${isSel ? 'is-selected' : ''}${dt.getTime() === today.getTime() ? ' is-today' : ''}" aria-pressed="${isSel}" aria-label="${fmt.weekday(dt)}, ${fmt.date(dt)}">${d}</button>`;
      }
      $('#cal').innerHTML = `<div class="cal-hd"><button class="icon-btn sm" type="button" data-nav="-1" ${canPrev ? '' : 'disabled'} aria-label="Tháng trước">${icon('chevron-left')}</button><b>${months[view.getMonth()]}, ${view.getFullYear()}</b><button class="icon-btn sm" type="button" data-nav="1" ${canNext ? '' : 'disabled'} aria-label="Tháng sau">${icon('chevron-right')}</button></div><div class="cal-grid">${cells}</div>`;
      $('#pick-hint').innerHTML = `${icon('info', 'ic-sm')} Đã chọn <b>${fmt.weekday(sel)}, ${fmt.date(sel)}</b>. ${sel <= freeUntil ? 'Thu hồi miễn phí (trong 7 ngày kể từ ngày nhận hộp).' : 'Sau 18/01/2027 phí thu hồi là 50.000 đ/lượt.'}`;
    };
    $('#cal').addEventListener('click', e => {
      const n = e.target.closest('[data-nav]');
      if (n && !n.disabled) { view.setMonth(view.getMonth() + +n.dataset.nav); renderCal(); return; }
      const d = e.target.closest('[data-day]');
      if (d && !d.disabled) { sel = fmt.fromIso(d.dataset.day); renderCal(); }
    });
    renderCal();

    const sel2 = $('#pk-addr');
    sel2.innerHTML = data.addresses().map(a => `<option value="${a.id}" ${a.isDefault ? 'selected' : ''}>${esc(a.label)} – ${esc(a.line)}, ${esc(a.city)}</option>`).join('');
    if (pickup) {
      sel2.value = pickup.addrId || sel2.value;
      $('#pk-note').value = pickup.note || '';
      $$('input[name=slot]').forEach(r => { r.checked = r.value === pickup.slot; });
      $('#pick-submit').textContent = 'Cập nhật lịch thu hồi';
      $('#pickup-banner').innerHTML = `<div class="note info">${icon('calendar-check')}<div class="grow">Bạn đã có lịch thu hồi <b>${fmt.date(fmt.fromIso(pickup.date))} · ${pickup.slot}</b>. Chọn ngày giờ khác bên dưới để đổi lịch.</div><a class="link" href="lich-thu-hoi.html">Xem lịch ${icon('arrow-right')}</a></div>`;
    }
    $('#dat-lich').addEventListener('submit', e => {
      e.preventDefault();
      if (!picked.size) { toast('Vui lòng chọn ít nhất một hộp cần thu hồi.', 'warn'); $('#box-all').focus(); return; }
      const a = data.addresses().find(x => x.id === sel2.value) || defaultAddr();
      const isNew = !pickup;
      store.set('pickup', {
        date: fmt.iso(sel), slot: new FormData(e.target).get('slot'), addrId: a.id, addr: `${a.line}, ${a.city}`,
        note: $('#pk-note').value.trim(), boxes: boxes.filter(b => picked.has(b.code)).map(b => b.code),
      });
      const n = data.notifs();
      n.unshift({ id: 'n' + Date.now(), icon: 'calendar-check', tone: '', title: isNew ? 'Lịch thu hồi đã được xác nhận' : 'Lịch thu hồi đã được cập nhật', time: `${fmt.date(new Date())} · ${fmt.time(new Date())}`, text: `Nhân viên BOXANH sẽ đến thu hồi ${picked.size} hộp vào ${fmt.date(sel)}, ${new FormData(e.target).get('slot')}.`, href: 'lich-thu-hoi.html', read: false });
      data.saveNotifs(n);
      store.set('flash', isNew ? 'Đã gửi lịch thu hồi. BOXANH đã xác nhận lịch hẹn của bạn!' : 'Đã cập nhật lịch thu hồi.');
      location.href = 'lich-thu-hoi.html';
    });
  }

  /* ---------- thông tin hộp ---------- */
  if ($('#box-detail')) {
    const code = param('ma') || boxes[0].code;
    const i = Math.max(0, boxes.findIndex(b => b.code === code));
    const b = boxes[i];
    document.title = `Hộp ${b.code} | BOXANH`;
    $('#bi-title').textContent = `BOXANH – ${b.code} (${b.idx})`;
    $('#bi-status').textContent = b.status;
    $('#bi-rows').innerHTML = [
      ['file-text', 'Thuộc đơn hàng', `<a class="link" href="don-hang-chi-tiet.html?ma=${b.order}">${b.order}</a>`],
      ['calendar', 'Ngày nhận', b.received], ['box', 'Số hộp của đơn', boxes.length], ['shield-check', 'Số seal', b.seal], ['refresh', 'Lần sử dụng', `Vòng thứ ${b.uses}`],
    ].map(([ic, k, v]) => `<div><dt>${icon(ic)} ${k}</dt><dd class="num">${v}</dd></div>`).join('');
    $('#bi-report').href = `ho-tro.html?hop=${b.code}#gui-yeu-cau`;
    const prev = boxes[i - 1], next = boxes[i + 1];
    $('#box-nav').innerHTML = `<a class="btn btn-light btn-sm${prev ? '' : ' is-disabled'}" ${prev ? `href="thong-tin-hop.html?ma=${prev.code}"` : 'aria-disabled="true"'}>${icon('chevron-left')} Hộp trước</a><a class="btn btn-light btn-sm${next ? '' : ' is-disabled'}" ${next ? `href="thong-tin-hop.html?ma=${next.code}"` : 'aria-disabled="true"'}>Hộp sau ${icon('chevron-right')}</a>`;
    // illustrative QR pattern (deterministic per box code)
    let seed = 0;
    for (const c of b.code) seed = (seed * 33 + c.charCodeAt(0)) >>> 0;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#10251c"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#10251c"/>`;
    let cells = '';
    for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) {
      const inFinder = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20);
      if (!inFinder && rnd() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    $('#bi-qr').innerHTML = `<g fill="#10251c">${cells}</g>${finder(0, 0)}${finder(22, 0)}${finder(0, 22)}`;
    $('#bi-history').addEventListener('click', () => dialog(`<div class="modal-ic green">${icon('history')}</div><h2>Lịch sử hộp ${b.code}</h2><p class="modal-text">Hộp đang ở vòng sử dụng thứ ${b.uses}. Mỗi lần quét QR đều được ghi lại.</p>
      <div class="vtl mt-16">
        <div><time>11/01/2027 08:10</time><b>Giao cho khách hàng</b><p>Đơn ${b.order} · Quét QR, niêm phong seal ${b.seal}</p></div>
        <div><time>10/01/2027 17:30</time><b>Sẵn sàng tái sử dụng</b><p>Kiểm tra vỏ, nắp, tem QR đạt · Kho Cầu Giấy</p></div>
        <div><time>10/01/2027 09:15</time><b>Vệ sinh &amp; khử khuẩn</b><p>Khu vệ sinh – Kho Cầu Giấy</p></div>
        <div class="gray"><time>08/01/2027 18:40</time><b>Thu hồi từ khách</b><p>Đơn BX2027-0006 · Đủ hộp và nắp</p></div>
        <div class="gray"><time>03/2026</time><b>Đưa vào sử dụng</b><p>Nhựa PP tái chế, tải trọng 25 kg</p></div>
      </div>`));
  }

  /* ---------- lịch thu hồi ---------- */
  if ($('#pk-view')) {
    if (!pickup) { $('#pk-empty').hidden = false; }
    else {
      $('#pk-view').hidden = false;
      const d = fmt.fromIso(pickup.date);
      $('#pk-info').innerHTML = [
        ['calendar', 'Thời gian', `${fmt.date(d)} · ${pickup.slot}<br><span class="small muted">${fmt.weekday(d)}</span>`],
        ['box', 'Số lượng', `${pickup.boxes.length} hộp`],
        ['map-pin', 'Địa điểm', esc(pickup.addr)],
        ['message', 'Ghi chú', pickup.note ? esc(pickup.note) : '<span class="muted">Không có</span>'],
      ].map(([ic, k, v]) => `<div><dt>${icon(ic)} ${k}</dt><dd style="max-width:62%">${v}</dd></div>`).join('');
      $('#lc-pick').textContent = 'Dự kiến ' + fmt.date(d);
      $('#pk-cancel').addEventListener('click', async () => {
        const ok = await confirm({ title: 'Hủy lịch thu hồi?', text: 'Bạn có thể đặt lại lịch bất cứ lúc nào trong mục Hộp của tôi.', ok: 'Hủy lịch', cancel: 'Giữ lịch', tone: 'red', ic: 'x-circle' });
        if (!ok) return;
        store.del('pickup');
        store.set('flash', 'Đã hủy lịch thu hồi.');
        location.reload();
      });
    }
  }

  /* ---------- thông báo ---------- */
  if ($('#notif-list')) {
    let mode = 'all';
    const render = () => {
      const list = data.notifs().filter(n => mode === 'all' || !n.read);
      $('#notif-list').innerHTML = list.length ? list.map(n => `<a class="notif ${n.read ? 'is-read' : n.tone}" href="${n.href}" data-nid="${n.id}"><span class="notif-ic">${icon(n.icon)}</span><span class="grow"><b>${esc(n.title)}</b><span class="time">${n.time}</span><p>${esc(n.text)}</p></span>${n.read ? '' : '<span class="unread-dot" aria-label="Chưa đọc"></span>'}</a>`).join('')
        : `<div class="card empty">${icon('bell')}<p>Bạn đã đọc hết thông báo.</p></div>`;
    };
    $('#notif-filter').addEventListener('segchange', e => { mode = e.detail; render(); });
    $('#mark-all').addEventListener('click', () => {
      const list = data.notifs();
      list.forEach(n => { n.read = true; });
      data.saveNotifs(list);
      paintUnread();
      render();
      toast('Đã đánh dấu tất cả là đã đọc.');
    });
    render();
  }

  /* ---------- hồ sơ ---------- */
  if ($('#profile-form')) {
    const pf = $('#profile-form');
    const accounts = store.get('accounts', {});
    const extra = store.get('profile', {});
    pf.elements['name'].value = u.name;
    pf.elements['phone'].value = BX.prettyPhone(u.phone);
    pf.elements['email'].value = u.email || '';
    pf.elements['dob'].value = extra.dob || '';
    pf.elements['dob'].max = fmt.iso(new Date());
    pf.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(pf)) return;
      const name = pf.elements['name'].value.trim().replace(/\s+/g, ' ');
      const w = name.split(' ');
      const nu = { ...u, name, short: w.length > 2 ? w.slice(-2).join(' ') : w[w.length - 1], email: pf.elements['email'].value.trim() };
      login(nu);
      accounts[u.phone] = { name, email: nu.email };
      store.set('accounts', accounts);
      store.set('profile', { dob: pf.elements['dob'].value });
      Object.assign(u, nu);
      paintUser();
      toast('Đã lưu thông tin cá nhân.');
    });
    $('#change-phone').addEventListener('click', () => toast('Để đổi số điện thoại, vui lòng gửi yêu cầu cho CSKH kèm số mới – chúng tôi xác minh bằng OTP cho cả hai số.', 'info', 5200));

    const renderAddr = () => {
      const list = data.addresses();
      $('#addr-list').innerHTML = list.map(a => `<div class="card card-sm ${a.isDefault ? 'tint-green' : ''}"><div class="row between"><b>${esc(a.label)}</b>${a.isDefault ? '<span class="badge b-green">Mặc định</span>' : ''}</div><p class="small mt-4">${esc(a.line)}</p><p class="small muted">${esc(a.city)}</p>
        <div class="row wrap mt-12">${a.isDefault ? '' : `<button class="btn btn-ghost btn-xs" type="button" data-def="${a.id}">Đặt mặc định</button>`}<button class="btn btn-light btn-xs" type="button" data-edit="${a.id}">${icon('pencil')} Sửa</button>${list.length > 1 ? `<button class="btn btn-ghost btn-xs" type="button" data-del="${a.id}">${icon('trash')} Xóa</button>` : ''}</div></div>`).join('');
    };
    renderAddr();
    const af = $('#addr-form');
    const openAddr = a => {
      af.reset();
      $$('[aria-invalid]', af).forEach(BX.clearError);
      $('#addr-title').textContent = a ? 'Sửa địa chỉ' : 'Thêm địa chỉ';
      af.elements['id'].value = a ? a.id : '';
      if (a) { af.elements['label'].value = a.label; af.elements['line'].value = a.line; af.elements['city'].value = a.city; af.elements['isDefault'].checked = a.isDefault; }
      openModal('addr-modal');
    };
    $('#add-addr').addEventListener('click', () => openAddr(null));
    $('#addr-list').addEventListener('click', async e => {
      const b = e.target.closest('button');
      if (!b) return;
      const list = data.addresses();
      if (b.dataset.def) { list.forEach(a => { a.isDefault = a.id === b.dataset.def; }); data.saveAddresses(list); renderAddr(); toast('Đã đổi địa chỉ mặc định.'); }
      if (b.dataset.edit) openAddr(list.find(a => a.id === b.dataset.edit));
      if (b.dataset.del) {
        const a = list.find(x => x.id === b.dataset.del);
        if (!(await confirm({ title: `Xóa địa chỉ “${esc(a.label)}”?`, ok: 'Xóa', tone: 'red', ic: 'trash' }))) return;
        const rest = list.filter(x => x.id !== a.id);
        if (a.isDefault && rest[0]) rest[0].isDefault = true;
        data.saveAddresses(rest);
        renderAddr();
        toast('Đã xóa địa chỉ.', 'info');
      }
    });
    af.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(af)) return;
      const f = new FormData(af);
      const list = data.addresses();
      const id = f.get('id') || 'a' + Date.now();
      const item = { id, label: f.get('label').trim(), line: f.get('line').trim(), city: f.get('city').trim(), isDefault: !!f.get('isDefault') || !list.length };
      const idx = list.findIndex(a => a.id === id);
      if (idx >= 0) { item.isDefault = item.isDefault || list[idx].isDefault; list[idx] = item; } else list.push(item);
      if (item.isDefault) list.forEach(a => { a.isDefault = a.id === id; });
      data.saveAddresses(list);
      closeModal($('#addr-modal'));
      renderAddr();
      toast(idx >= 0 ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.');
    });

    const prefs = store.get('prefs', null);
    $$('#prefs input').forEach(i => {
      if (prefs && i.name in prefs) i.checked = prefs[i.name];
      i.addEventListener('change', () => {
        const p = {};
        $$('#prefs input').forEach(x => { p[x.name] = x.checked; });
        store.set('prefs', p);
        toast('Đã lưu cài đặt thông báo.');
      });
    });
  }
});
