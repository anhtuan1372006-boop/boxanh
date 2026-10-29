/* Nội bộ vận hành: tổng quan, đơn hàng, điều phối, đối tác, định giá, kho hộp, sự cố, báo cáo */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, icon, img, fmt, toast, confirm, dialog, closeModal, store, db, validate, data, param } = BX;
  const D = window.BX_DATA;
  const SVC = D.SERVICES;
  const ST = { 'Chờ báo giá': 'b-yellow', 'Chờ điều phối': 'b-orange', 'Đã phân công': 'b-blue', 'Đang thực hiện': 'b-purple', 'Hoàn tất': 'b-green', 'Có sự cố': 'b-red' };
  const stBadge = s => `<span class="badge ${ST[s] || 'b-gray'}"><span class="dot"></span>${s}</span>`;
  const svcCell = s => `<span class="cell-ic">${icon(SVC[s].icon)} ${SVC[s].name}</span>`;
  const nowStamp = () => `${fmt.date(new Date(2027, 0, 12))} ${fmt.time(new Date())}`;
  const download = (name, rows) => {
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  // admin orders + new requests sent from the customer website
  const district = a => {
    const parts = [a.line, ...String(a.area || '').split(',')].map(s => s.trim()).filter(Boolean);
    return parts.find(p => /^(Quận|Huyện|Thị xã|Thành phố|TP)/i.test(p)) || parts[parts.length - 1] || 'Chưa rõ';
  };
  const baseOrders = () => db('aorders', D.adminOrders);
  const saveBase = v => store.set('aorders', v);
  const allOrders = () => {
    const base = baseOrders();
    const web = data.orders().filter(o => o.step <= 1 && !o.canceled && !base.some(b => b.code === o.code)).map(o => ({
      code: o.code, svc: o.services[0], date: o.date, time: o.time, area: district(o.from),
      customer: o.contact || 'Khách website', status: 'Chờ báo giá', value: o.estimate ? o.estimate[0] : 0, need: 'Chờ khảo sát', img: o.thumb, web: true,
    }));
    return web.concat(base);
  };
  const incidents = () => db('incidents', D.incidents);
  const paintIncCount = () => {
    const n = incidents().filter(i => i.state !== 'hoan-tat').length;
    $$('[data-incident-count]').forEach(el => { el.textContent = n; el.hidden = !n; });
  };
  const saveInc = v => { store.set('incidents', v); paintIncCount(); };
  paintIncCount();

  const kpi = (href, ic, label, n, tone) => `<${href ? `a href="${href}"` : 'div'} class="kpi ${tone}"><span class="kpi-ic">${icon(ic)}</span><span><span class="kpi-label">${label}</span><span class="kpi-num" style="display:block">${n}</span></span>${href ? `<span class="round-arrow">${icon('arrow-right')}</span>` : ''}</${href ? 'a' : 'div'}>`;

  /* ======================= TỔNG QUAN ======================= */
  if ($('#ov-kpis')) {
    const list = allOrders();
    const today = list.filter(o => o.date === '12/01/2027');
    const inUse = db('iboxes', D.internalBoxes).filter(b => b.status === 'dang-dung').length + 183;
    const openInc = incidents().filter(i => i.state !== 'hoan-tat').length;
    $('#ov-kpis').innerHTML = [
      kpi('don-hang.html', 'clipboard-list', 'Đơn hôm nay', today.length, ''),
      kpi('bao-cao.html', 'wallet', 'Doanh thu dự kiến', (today.reduce((s, o) => s + o.value, 0) / 1e6).toFixed(2).replace('.', ',') + '<small>tr</small>', 'yellow'),
      kpi('kho-hop.html', 'box', 'Hộp đang lưu hành', inUse, 'blue'),
      kpi('su-co.html', 'alert-triangle', 'Sự cố đang mở', openInc, 'peach'),
    ].join('');
    const days = [['06/01', 8], ['07/01', 11], ['08/01', 9], ['09/01', 14], ['10/01', 10], ['11/01', 13], ['12/01', today.length]];
    const max = Math.max(...days.map(d => d[1]));
    $('#ov-bars').innerHTML = days.map(([d, n]) => `<div title="${d}: ${n} đơn"><b class="xs">${n}</b><i style="height:${(n / max) * 100}%"></i><span>${d}</span></div>`).join('');
    $('#ov-orders').innerHTML = list.slice(0, 6).map(o => `<tr><td class="num"><a class="link" href="don-hang.html">${o.code}</a>${o.web ? ' <span class="badge b-blue">Mới</span>' : ''}</td><td>${svcCell(o.svc)}</td><td>${esc(o.customer)}</td><td class="num">${o.date}<span class="sub">${o.time}</span></td><td>${stBadge(o.status)}</td></tr>`).join('');
    const n = s => list.filter(o => o.status === s).length;
    const pick = store.get('pickup', null);
    const todo = [
      ['truck', `${n('Chờ điều phối')} đơn chờ điều phối`, 'Phân công đối tác và nhóm bốc xếp', 'dieu-phoi.html', 'yellow'],
      ['tag', `${n('Chờ báo giá')} đơn chờ báo giá`, 'Dự toán nguồn lực và gửi báo giá', 'dinh-gia.html', ''],
      ['alert-triangle', `${incidents().filter(i => i.state === 'moi').length} sự cố mới`, 'Cần tiếp nhận và phân công CSKH', 'su-co.html', 'peach'],
      ['box', `${3 + (pick ? 1 : 0)} lịch thu hồi hộp`, 'Trong 3 ngày tới', 'kho-hop.html', ''],
      ['users', `${store.get('partnerApp', null) ? 2 : 1} hồ sơ đối tác chờ duyệt`, 'Đối chiếu giá & điều kiện', 'doi-tac.html', ''],
    ];
    $('#ov-todo').innerHTML = todo.map(([ic, t, s, href, tone]) => `<a class="notif ${tone}" href="${href}"><span class="notif-ic">${icon(ic)}</span><span class="grow"><b>${t}</b><p class="small muted">${s}</p></span>${icon('chevron-right')}</a>`).join('');
  }

  /* ======================= ĐƠN HÀNG ======================= */
  if ($('#o-rows')) {
    let q = '';
    try { q = sessionStorage.getItem('bx_admin_q') || ''; sessionStorage.removeItem('bx_admin_q'); } catch (e) { /* ignore */ }
    $('#o-q').value = q;
    const tbq = $('#tb-q'); if (tbq) tbq.value = q;
    const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    const filtered = () => {
      const k = fold($('#o-q').value.trim());
      return allOrders().filter(o => (!k || fold(`${o.code} ${o.customer} ${o.area}`).includes(k)) && (!$('#o-svc').value || o.svc === $('#o-svc').value) && (!$('#o-st').value || o.status === $('#o-st').value));
    };
    const render = () => {
      const list = filtered();
      $('#o-rows').innerHTML = list.length ? list.map(o => `<tr data-code="${o.code}" tabindex="0"><td class="num"><b>${o.code}</b>${o.web ? ' <span class="badge b-blue">Từ website</span>' : ''}</td><td>${svcCell(o.svc)}</td><td>${esc(o.customer)}</td><td class="num">${o.date}<span class="sub">${o.time}</span></td><td>${esc(o.area)}</td><td class="num">${o.value ? fmt.vnd(o.value) : '—'}</td><td>${stBadge(o.status)}</td></tr>`).join('')
        : `<tr><td colspan="7" class="empty">${icon('search')}Không tìm thấy đơn phù hợp.</td></tr>`;
      $('#o-count').textContent = `${list.length} / ${allOrders().length} đơn`;
    };
    ['#o-q', '#o-svc', '#o-st'].forEach(s => $(s).addEventListener('input', render));
    document.addEventListener('admin-search', e => { $('#o-q').value = e.detail; render(); });
    const open = code => {
      const o = allOrders().find(x => x.code === code);
      dialog(`<div class="row row-top" style="gap:16px"><img class="thumb" style="width:110px;height:80px" src="${img(o.img)}" alt=""><div><span class="badge b-gray num">${o.code}</span><h2 class="mt-8">${SVC[o.svc].name}</h2><p class="modal-text">${esc(o.customer)} · ${esc(o.area)}</p></div></div>
        <dl class="kv-rows mt-16"><div><dt>${icon('calendar')} Thời gian</dt><dd>${o.date} · ${o.time}</dd></div><div><dt>${icon('users')} Nguồn lực</dt><dd>${esc(o.need)}</dd></div><div><dt>${icon('wallet')} Giá trị</dt><dd>${o.value ? fmt.vnd(o.value) : 'Chưa báo giá'}</dd></div><div><dt>${icon('info')} Trạng thái</dt><dd>${stBadge(o.status)}</dd></div></dl>
        <div class="modal-actions"><a class="btn btn-light" href="dinh-gia.html?ma=${o.code}">${icon('tag')} Định giá</a><a class="btn btn-primary" href="dieu-phoi.html?ma=${o.code}">${icon('truck')} Điều phối</a></div>`);
    };
    $('#o-rows').addEventListener('click', e => { const r = e.target.closest('[data-code]'); if (r) open(r.dataset.code); });
    $('#o-rows').addEventListener('keydown', e => { const r = e.target.closest('[data-code]'); if (r && e.key === 'Enter') open(r.dataset.code); });
    $('#orders-csv').addEventListener('click', () => {
      download('BOXANH-don-hang.csv', [['Mã đơn', 'Dịch vụ', 'Khách hàng', 'Ngày', 'Giờ', 'Khu vực', 'Giá trị', 'Trạng thái']].concat(filtered().map(o => [o.code, SVC[o.svc].name, o.customer, o.date, o.time, o.area, o.value, o.status])));
      toast('Đã xuất danh sách đơn hàng (CSV).');
    });
    render();
  }

  /* ======================= ĐIỀU PHỐI ======================= */
  if ($('#dp-rows')) {
    const isDispatch = o => ['Chờ điều phối', 'Chờ báo giá', 'Đã phân công'].includes(o.status) && (o.date === '12/01/2027' || o.web);
    let selected = param('ma') || 'BX2027-0015';
    const activity = () => store.get('dpActivity', [
      ['check-circle', '10:24', 'Đã duyệt báo giá', 'Đơn BX2027-0013 · Dọn phòng', 'area-ve-sinh'],
      ['box', '10:12', 'Đã giữ 10 hộp', 'Cho đơn BX2027-0015', 'feat-hop'],
      ['calendar', '09:45', 'Cập nhật lịch làm việc', 'Nhóm Bốc Xanh · Thêm ca chiều 12/01', 'job-don-phong'],
    ]);
    const PARTNERS = [
      { name: 'Anh Minh Transport', fit: 92, area: 'Quận Đống Đa', free: 'Còn 2 xe', price: '500.000 – 700.000đ', img: 'dp-partner-1', ok: true },
      { name: 'Đội Bốc Xanh', fit: 88, area: 'Quận Đống Đa', free: 'Còn 3 người', price: '300.000 – 450.000đ', img: 'dp-partner-2', ok: true },
      { name: 'Trường Phát Logistics', fit: 78, area: 'Quận Hai Bà Trưng', free: 'Còn 1 xe', price: '450.000 – 650.000đ', img: 'dp-partner-3', ok: false },
    ];
    const renderKpis = () => {
      const list = allOrders();
      const n = s => list.filter(o => o.status === s).length;
      $('#dp-kpis').innerHTML = [
        kpi('', 'file-text', 'Chờ báo giá', n('Chờ báo giá'), 'yellow'),
        kpi('', 'box', 'Chờ điều phối', n('Chờ điều phối'), 'blue'),
        kpi('', 'truck', 'Đang thực hiện', n('Đang thực hiện') + n('Đã phân công'), ''),
        kpi('kho-hop.html', 'package-in', 'Cần thu hồi', 3 + (store.get('pickup', null) ? 1 : 0), 'peach'),
      ].join('');
    };
    const rows = () => {
      const k = $('#dp-q').value.trim().toLowerCase();
      return allOrders().filter(isDispatch).filter(o => (!k || `${o.code} ${o.customer} ${o.area}`.toLowerCase().includes(k)) && (!$('#dp-svc').value || o.svc === $('#dp-svc').value));
    };
    const renderRows = () => {
      const list = rows();
      $('#dp-count').textContent = list.length;
      if (!list.some(o => o.code === selected) && list[0]) selected = list[0].code;
      $('#dp-rows').innerHTML = list.length ? list.map(o => `<tr data-code="${o.code}" class="${o.code === selected ? 'is-selected' : ''}"><td><input class="cbx" type="radio" name="dp-sel" ${o.code === selected ? 'checked' : ''} aria-label="Chọn đơn ${o.code}"></td><td><b class="num nowrap">${o.code}</b><span class="sub">${esc(o.area)}</span></td><td>${svcCell(o.svc)}</td><td class="num">${o.date}<span class="sub">${o.time}</span></td><td>${stBadge(o.status)}</td></tr>`).join('')
        : `<tr><td colspan="5" class="empty">${icon('check-circle')}Không còn đơn cần xử lý.</td></tr>`;
    };
    const bar = (start, end, label, sub, tone) => `<span class="g-bar ${tone}" style="left:${((start - 7) / 11) * 100}%;width:${((end - start) / 11) * 100}%" title="${label}${sub ? ' · ' + sub : ''}">${label}${sub ? `<small>${sub}</small>` : ''}</span>`;
    const renderGantt = () => {
      const assigned = code => (baseOrders().find(o => o.code === code) || {}).status === 'Đã phân công';
      const a15 = assigned('BX2027-0015');
      const rowsG = [
        ['truck', 'Xe tải - Anh Minh', '29H-123.45', bar(8, 10.5, 'BX2027-0015', 'Chuyển trọ', a15 ? 'blue' : 'yellow') + bar(14, 16.5, 'BX2027-0018', 'Chuyển trọ', 'blue')],
        ['truck', 'Xe tải - Hoàng Long', '29H-678.90', bar(8.5, 10.4, '⚠ Trùng lịch', '', 'red') + bar(10.5, 13, 'Dọn phòng', '', 'yellow') + bar(15, 17.5, 'Bàn giao phòng', '', 'blue')],
        ['users', 'Nhóm 1 - Bốc Xanh', '2 người', bar(8, 11, 'BX2027-0015', 'Bốc xếp', a15 ? 'blue' : '') + bar(12, 13.5, 'Vệ sinh', '', 'blue') + bar(15, 17.5, 'Bàn giao phòng', '', 'blue')],
        ['users', 'Nhóm 2 - An Phát', '2 người', bar(9, 11.5, 'Dọn phòng', '', 'yellow') + bar(11.75, 13.5, 'Vệ sinh', '', 'blue') + bar(14, 16, 'FIX', '', 'peach')],
      ];
      $('#gantt').innerHTML = `<div class="g-row g-head"><div class="g-label">Đối tác / Nhóm</div><div class="g-hours">${Array.from({ length: 11 }, (_, i) => `<span>${String(7 + i).padStart(2, '0')}:00</span>`).join('')}</div></div>` +
        rowsG.map(([ic, n, s, bars]) => `<div class="g-row"><div class="g-label">${icon(ic)}<span><b>${n}</b><small>${s}</small></span></div><div class="g-track">${bars}</div></div>`).join('');
    };
    const renderActivity = () => {
      $('#dp-activity').innerHTML = activity().slice(0, 3).map(([ic, t, title, sub, pic]) => `<div class="card card-sm row" style="align-items:center"><span class="feat-ic" style="width:40px;height:40px">${icon(ic)}</span><div class="grow"><b class="small">${title}</b> <span class="xs muted">· ${t}</span><span class="xs muted" style="display:block">${sub}</span></div><img class="thumb" style="width:64px;height:44px" src="${img(pic)}" alt=""></div>`).join('');
    };
    const renderPanel = () => {
      const o = allOrders().find(x => x.code === selected);
      const p = $('#dp-panel');
      if (!o) { p.innerHTML = `<div class="empty">${icon('clipboard-list')}<p>Chọn một đơn để phân công.</p></div>`; return; }
      const head = `<div class="card-hd"><h2 class="card-title">Phân công ${o.code}</h2>${stBadge(o.status)}</div>
        <div class="row between"><b class="small">Thông tin đơn hàng</b><a class="link small" href="don-hang.html">Xem chi tiết ${icon('arrow-right')}</a></div>
        <div class="row row-top mt-8"><img class="thumb" style="width:120px;height:90px" src="${img(o.img)}" alt=""><dl class="kv small grow" style="grid-template-columns:auto 1fr"><dt>Dịch vụ</dt><dd>${SVC[o.svc].name}</dd><dt>Thời gian</dt><dd>${o.date} ${o.time}</dd><dt>Khu vực</dt><dd>${esc(o.area)}, Hà Nội</dd><dt>Yêu cầu</dt><dd>${esc(o.need)}</dd></dl></div>`;
      if (o.status === 'Chờ báo giá') {
        p.innerHTML = head + `<div class="note mt-16">${icon('tag')}<div><b>Đơn chưa có báo giá.</b> Cần dự toán nguồn lực và gửi báo giá trước khi điều phối.</div></div><a class="btn btn-primary btn-block mt-16" href="dinh-gia.html?ma=${o.code}">${icon('tag')} Định giá ngay ${icon('arrow-right')}</a>`;
        return;
      }
      if (o.status === 'Đã phân công') {
        p.innerHTML = head + `<div class="note info mt-16">${icon('check-circle')}<div><b>Đã gửi phân công cho ${esc(o.partner || 'đối tác')}.</b><br><span class="small">${esc(o.group || '')} · Kho xuất hộp: ${esc(o.store || 'Kho Cầu Giấy')}. Chờ đối tác xác nhận nhận việc.</span></div></div><button class="btn btn-light btn-block mt-16" type="button" data-unassign>${icon('x-circle')} Hủy phân công</button>`;
        return;
      }
      p.innerHTML = head + `
        <p class="small strong mt-16">Tài nguyên cần thiết</p>
        <div class="row wrap mt-8"><span class="res">${icon('truck')} 1 xe tải</span><span class="res">${icon('users')} 2 người</span><span class="res">${icon('box')} 10 hộp</span><span class="badge b-green">Hiện có: 3 xe · 120 hộp trống</span></div>
        <form id="assign" class="form-grid mt-16" novalidate>
          <div class="field"><label class="label small" for="as-partner">Đối tác vận chuyển</label><select class="select" id="as-partner" required data-msg="Chọn đối tác vận chuyển."><option value="">Chọn đối tác</option>${PARTNERS.map(x => `<option>${x.name}</option>`).join('')}</select></div>
          <div class="field"><label class="label small" for="as-group">Nhóm bốc xếp</label><select class="select" id="as-group" required data-msg="Chọn nhóm bốc xếp."><option value="">Chọn nhóm</option><option>Nhóm 1 - Bốc Xanh</option><option>Nhóm 2 - An Phát</option></select></div>
          <div class="field full"><label class="label small" for="as-date">Thời gian thực hiện</label><div class="input-row"><input class="input" id="as-date" type="date" value="2027-01-12"><input class="input" type="text" value="${o.time.replace(/\s/g, '')}" aria-label="Khung giờ"></div></div>
          <div class="field full"><label class="label small" for="as-store">Kho xuất hộp</label><select class="select" id="as-store"><option>Kho Cầu Giấy</option><option>Kho A – Đống Đa</option><option>Kho B – Hà Đông</option></select></div>
        </form>
        <div class="row between mt-20"><b class="small">Đề xuất đối tác phù hợp</b><a class="link small" href="doi-tac.html">Xem so sánh đối tác ${icon('arrow-right')}</a></div>
        <div class="stack mt-8" style="--gap:10px">${PARTNERS.map(x => `<div class="card card-sm row row-top"><img class="thumb" style="width:64px;height:48px" src="${img(x.img)}" alt=""><div class="grow"><div class="row between" style="gap:8px"><b class="small">${x.name}</b><button class="btn ${x.ok ? 'btn-soft' : 'btn-light'} btn-xs" type="button" data-pick="${x.name}">${x.ok ? icon('check') + ' Chọn' : 'Chọn'}</button></div><p class="xs muted">Phù hợp ${x.fit}% · ${x.area} · ${x.free}</p><p class="xs">Giá minh họa: <b class="nowrap">${x.price}</b></p></div></div>`).join('')}</div>
        <button class="btn btn-primary btn-lg btn-block mt-16" type="button" data-send>${icon('send')} Gửi phân công</button>
        <p class="xs muted center mt-8">${icon('clock', 'ic-sm')} Chờ đối tác xác nhận nhận việc</p>`;
    };
    $('#dp-rows').addEventListener('click', e => { const r = e.target.closest('[data-code]'); if (!r) return; selected = r.dataset.code; renderRows(); renderPanel(); if (matchMedia('(max-width: 1180px)').matches) $('#dp-panel').scrollIntoView({ behavior: 'smooth' }); });
    ['#dp-q', '#dp-svc'].forEach(s => $(s).addEventListener('input', () => { renderRows(); renderPanel(); }));
    $('#dp-panel').addEventListener('click', async e => {
      const pk = e.target.closest('[data-pick]');
      if (pk) {
        const sel = $('#as-partner');
        if (/Bốc Xanh/.test(pk.dataset.pick)) { $('#as-group').value = 'Nhóm 1 - Bốc Xanh'; BX.clearError($('#as-group')); toast('Đã chọn nhóm bốc xếp Bốc Xanh.', 'info'); }
        else { sel.value = pk.dataset.pick; BX.clearError(sel); toast(`Đã chọn ${pk.dataset.pick}.`, 'info'); }
        return;
      }
      if (e.target.closest('[data-send]')) {
        if (!validate($('#assign'))) return;
        const partner = $('#as-partner').value, group = $('#as-group').value, st = $('#as-store').value;
        const ok = await confirm({ title: `Gửi phân công ${selected}?`, text: `${partner} + ${group} · Xuất hộp từ ${st}. Đối tác sẽ nhận thông báo để xác nhận.`, ok: 'Gửi phân công', ic: 'send' });
        if (!ok) return;
        const list = baseOrders();
        const o = list.find(x => x.code === selected);
        if (o) { o.status = 'Đã phân công'; o.partner = partner; o.group = group; o.store = st; saveBase(list); }
        const act = activity(); act.unshift(['send', fmt.time(new Date()), `Đã gửi phân công ${selected}`, `${partner} · ${group}`, 'feat-van-chuyen']); store.set('dpActivity', act);
        renderKpis(); renderRows(); renderPanel(); renderGantt(); renderActivity();
        toast(`Đã gửi phân công ${selected}. Chờ ${partner} xác nhận.`);
      }
      if (e.target.closest('[data-unassign]')) {
        const ok = await confirm({ title: `Hủy phân công ${selected}?`, text: 'Đơn sẽ quay lại trạng thái Chờ điều phối.', ok: 'Hủy phân công', tone: 'red', ic: 'x-circle' });
        if (!ok) return;
        const list = baseOrders();
        const o = list.find(x => x.code === selected);
        o.status = 'Chờ điều phối'; delete o.partner; saveBase(list);
        renderKpis(); renderRows(); renderPanel(); renderGantt();
        toast('Đã hủy phân công.', 'info');
      }
    });
    renderKpis(); renderRows(); renderPanel(); renderGantt(); renderActivity();
  }

  /* ======================= ĐỐI TÁC ======================= */
  if ($('#cmp')) {
    const G = D.partnerGroups();
    const CRIT = [['clock', 'Đúng giờ'], ['coins', 'Mức giá'], ['shield', 'Bảo quản đồ'], ['smile', 'Thái độ'], ['message', 'Giao tiếp'], ['file-check', 'Đúng giá đã thống nhất']];
    const STAGES = ['Đang khảo sát', 'Thử nghiệm', 'Đủ điều kiện', 'Đối tác chính thức'];
    const NOTES = { A: 'Đội ngũ chuyên nghiệp, đúng giờ, đồ đạc được bảo quản tốt. Cần thương lượng thêm về phụ phí tầng cao.', B: 'Giá cạnh tranh, năng lực lớn. Cần theo dõi thêm thái độ khi đơn đông.', C: 'Giá tốt nhưng phạm vi khu vực hẹp, phụ phí ngoài giờ cao.' };
    const state = store.get('review', {});
    let group = 'van-chuyen', pick = 'A';
    const rec = () => {
      state[group] = state[group] || {};
      if (!state[group][pick]) state[group][pick] = { scores: G[group].scores[pick].slice(), note: NOTES[pick], stage: pick === 'A' ? 1 : 0 };
      return state[group][pick];
    };
    const avg = r => r.scores.reduce((s, v) => s + v, 0) / r.scores.length;
    const fmt1 = v => v.toFixed(1).replace('.', ',');
    const trialsOf = () => (pick === 'A' ? G[group].trials : pick === 'B' ? G[group].trials.slice(0, 1) : []);
    const renderCmp = () => {
      const g = G[group];
      const th = g.partners.map(p => `<th class="${p.key === pick ? 'is-pick' : ''}"><button type="button" data-pk="${p.key}" aria-pressed="${p.key === pick}"><b>Đối tác ${p.key}</b><small>${p.name}</small></button></th>`).join('');
      const td = vals => vals.map((v, i) => `<td class="${g.partners[i].key === pick ? 'is-pick' : ''}">${v}</td>`).join('');
      $('#cmp').innerHTML = `<thead><tr><th>Tiêu chí</th>${th}</tr></thead><tbody>` +
        g.rows.map(([k, vals]) => `<tr><td>${k}</td>${td(vals)}</tr>`).join('') +
        `<tr><td>Bảng giá &amp; điều kiện</td>${td(g.partners.map(p => `<button class="link small" type="button" data-file="${p.file}">${icon('file-text', 'ic-sm')} ${p.file}</button>`))}</tr>` +
        `<tr><td>Khu vực</td>${td(g.partners.map(p => p.area))}</tr><tr><td>Năng lực</td>${td(g.partners.map(p => p.cap))}</tr></tbody>`;
      const t = trialsOf();
      $('#trial-of').textContent = `Đối tác ${pick} · ${g.partners.find(p => p.key === pick).name}`;
      $('#trials').innerHTML = t.length ? t.map(([n, d, real, agreed, s], i) => {
        const diff = real == null ? null : real - agreed;
        const imgs = G[group].trialImgs[i];
        return `<tr><td><b>${n}</b></td><td class="num">${d}</td><td class="num">${real == null ? '—' : fmt.vnd(real)}</td><td class="num">${fmt.vnd(agreed)}</td>
          <td class="num" style="color:${diff > 0 ? 'var(--r600)' : 'inherit'}">${diff == null ? '—' : (diff > 0 ? '+' : '') + fmt.vnd(diff) + `<span class="sub">(${diff > 0 ? '+' : ''}${(diff / agreed * 100).toFixed(1).replace('.', ',')}%)</span>`}</td>
          <td>${imgs ? `<span class="row" style="gap:4px">${imgs.map(x => `<img class="thumb" style="width:40px;height:30px;border-radius:6px" src="${img(x)}" alt="">`).join('')}<span class="xs muted">+${i + 2}</span></span>` : '<span class="xs muted">Đang cập nhật…</span>'}</td>
          <td>${s === 'Hoàn thành' ? `<span class="badge b-green">${icon('check')} Hoàn thành</span>` : `<span class="badge b-yellow">${icon('clock')} Đang thực hiện</span>`}</td></tr>`;
      }).join('') : `<tr><td colspan="7" class="empty">${icon('clipboard-list')}Chưa có đơn thử cho đối tác này.</td></tr>`;
    };
    const renderScore = () => {
      const r = rec();
      const p = G[group].partners.find(x => x.key === pick);
      $('#sc-who').innerHTML = `Đối tác ${pick} · ${p.name}`;
      $('#sc-rows').innerHTML = CRIT.map(([ic, name], i) => `<div class="score-row with-pick">${icon(ic)}<span class="label-txt">${name}</span><b class="num">${fmt1(r.scores[i])} / 5</b><span class="bar"><i style="width:${r.scores[i] * 20}%"></i></span><span class="score-pick" role="group" aria-label="Chấm ${name}">${[1, 2, 3, 4, 5].map(v => `<button type="button" class="${Math.round(r.scores[i]) === v ? 'is-on' : ''}" data-c="${i}" data-v="${v}" aria-label="${name} ${v} điểm">${v}</button>`).join('')}</span></div>`).join('');
      const a = avg(r);
      $('#sc-total').textContent = `${fmt1(a)} / 5`;
      $('#sc-stars').innerHTML = [1, 2, 3, 4, 5].map(i => icon('star', i <= Math.round(a) ? '' : 'off')).join('');
      $('#sc-note').value = r.note;
      $('#sc-note').dispatchEvent(new Event('input'));
      $('#approve-steps').innerHTML = STAGES.map((s, i) => `<div class="step ${i < r.stage ? 'is-done' : i === r.stage ? 'is-current' : 'is-todo'}"><span class="step-dot">${i < r.stage ? icon('check') : i + 1}</span><div><b>${s}</b></div></div>`).join('');
      $('#negotiate').disabled = r.stage < 2;
      $('#negotiate').innerHTML = `${icon(r.stage < 2 ? 'lock' : 'trending-up')} Đàm phán giá theo sản lượng`;
      $('#negotiate-hint').textContent = r.stage < 2 ? 'Chỉ khả dụng sau khi đủ điều kiện' : 'Đối tác đã đủ điều kiện – có thể đàm phán theo sản lượng';
    };
    const renderAll = () => { renderCmp(); renderScore(); };
    $('#grp-tabs').addEventListener('tabchange', e => { group = e.detail.replace('grp-', ''); pick = 'A'; renderAll(); });
    $('#cmp').addEventListener('click', e => {
      const b = e.target.closest('[data-pk]');
      if (b) { pick = b.dataset.pk; renderAll(); return; }
      const f = e.target.closest('[data-file]');
      if (f) dialog(`<div class="modal-ic green">${icon('file-text')}</div><h2>${f.dataset.file}</h2><p class="modal-text">Tài liệu đối tác đã nộp kèm hồ sơ (bản xem trước minh họa).</p><div class="table-wrap mt-16"><table class="table"><tbody>${G[group].rows.map(([k, v]) => `<tr><td>${k}</td><td>${v[G[group].partners.findIndex(p => p.file === f.dataset.file)]}</td></tr>`).join('')}</tbody></table></div>`, 'lg');
    });
    $('#sc-rows').addEventListener('click', e => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      rec().scores[+b.dataset.c] = +b.dataset.v;
      renderScore();
    });
    $('#sc-note').addEventListener('input', () => { rec().note = $('#sc-note').value; });
    $('#sc-save').addEventListener('click', () => { store.set('review', state); toast(`Đã lưu đánh giá đối tác ${pick} (${fmt1(avg(rec()))}/5).`); });
    $('#questions').addEventListener('click', () => dialog(`<div class="modal-ic green">${icon('list-checks')}</div><h2>Bộ câu hỏi chung</h2><p class="modal-text">Hỏi cùng một bộ câu hỏi cho mọi đối tác trong nhóm để so sánh công bằng.</p><ol class="stack mt-16" style="--gap:10px;list-style:decimal;padding-left:20px">
      <li>Cách tính giá chuyến, phụ phí tầng, phí chờ và ngoài giờ?</li><li>Năng lực tối đa mỗi ngày (số xe, số người)?</li><li>Quy trình bảo quản đồ dễ vỡ, đồ giá trị?</li><li>Cách xử lý khi đồ bị hư hỏng, thất lạc?</li><li>Thời gian phản hồi khi có đơn gấp?</li><li>Có xuất hóa đơn / chứng từ không?</li><li>Khu vực phục vụ và phụ phí khu vực xa?</li><li>Cam kết tuân thủ giá đã thống nhất và báo phát sinh trước?</li></ol>`, 'lg'));
    $('#approve-file').addEventListener('click', () => {
      const r = rec();
      const done = trialsOf().filter(t => t[4] === 'Hoàn thành').length;
      const a = avg(r);
      const canQualify = r.stage === 1 && a >= 4 && done >= 2;
      const m = dialog(`<div class="modal-ic green">${icon('file-check')}</div><h2>Hồ sơ phê duyệt · Đối tác ${pick}</h2><p class="modal-text">${G[group].partners.find(p => p.key === pick).name} · Nhóm ${G[group].label}</p>
        <dl class="kv-rows mt-16"><div><dt>${icon('star')} Điểm tổng</dt><dd>${fmt1(a)} / 5</dd></div><div><dt>${icon('clipboard-check')} Đơn thử hoàn thành</dt><dd>${done} / 3</dd></div><div><dt>${icon('flag')} Giai đoạn</dt><dd>${STAGES[r.stage]}</dd></div></dl>
        <div class="note ${canQualify || r.stage === 2 ? 'info' : ''} mt-16">${icon('info')}<div>${r.stage >= 3 ? 'Đối tác đã chính thức.' : canQualify ? 'Đủ điều kiện: điểm ≥ 4,0 và ít nhất 2 đơn thử hoàn thành.' : r.stage === 2 ? 'Đã đủ điều kiện. Có thể công nhận đối tác chính thức sau khi đàm phán.' : 'Cần điểm tổng ≥ 4,0 và ít nhất 2 đơn thử hoàn thành.'}</div></div>
        <div class="modal-actions">${canQualify ? `<button class="btn btn-primary" type="button" data-stage="2">${icon('check')} Đánh dấu đủ điều kiện</button>` : r.stage === 2 ? `<button class="btn btn-primary" type="button" data-stage="3">${icon('trophy')} Công nhận đối tác chính thức</button>` : '<button class="btn btn-light" type="button" data-close-x>Đóng</button>'}</div>`);
      m.addEventListener('click', e => {
        const s = e.target.closest('[data-stage]');
        if (s) { r.stage = +s.dataset.stage; store.set('review', state); closeModal(m); renderScore(); toast(r.stage === 2 ? 'Đối tác đã đủ điều kiện. Có thể đàm phán giá theo sản lượng.' : 'Đã công nhận đối tác chính thức!'); }
        if (e.target.closest('[data-close-x]')) closeModal(m);
      });
    });
    $('#negotiate').addEventListener('click', () => {
      const m = dialog(`<div class="modal-ic">${icon('trending-up')}</div><h2>Đàm phán giá theo sản lượng</h2><p class="modal-text">Đề xuất chiết khấu theo số đơn mỗi tháng (minh họa).</p>
        <div class="table-wrap mt-16"><table class="table"><thead><tr><th>Sản lượng / tháng</th><th>Chiết khấu đề xuất</th></tr></thead><tbody><tr><td>20 – 49 đơn</td><td>3%</td></tr><tr><td>50 – 99 đơn</td><td>5%</td></tr><tr><td>Từ 100 đơn</td><td>8%</td></tr></tbody></table></div>
        <div class="modal-actions"><button class="btn btn-primary" type="button" data-go>${icon('send')} Gửi đề xuất cho đối tác</button></div>`);
      $('[data-go]', m).addEventListener('click', () => { closeModal(m); toast('Đã gửi đề xuất đàm phán. Chưa phát sinh cam kết sản lượng.'); });
    });
    renderAll();
  }

  /* ======================= ĐỊNH GIÁ ======================= */
  if ($('#pr-form')) {
    const code = param('ma') || 'BX2027-0015';
    $('#pr-form .card-hd .badge').textContent = code;
    const DEF = { base: 250000, perKm: 30000, perPeople: 75000, liftFlat: 50000, perFloor: 30000, perBox: 5000, clean: 300000, hand: 250000, margin: 1.23, ver: 'v1.2', by: 'Nguyễn Minh Anh', at: '10/01/2027 14:30' };
    let R = Object.assign({}, DEF, store.get('rules', {}));
    let option = 'A';
    let quote = 0;
    const calc = () => {
      const f = new FormData($('#pr-form'));
      const km = Math.max(0, +f.get('km') || 0), cars = Math.max(0, +f.get('cars') || 0), people = Math.max(0, +f.get('people') || 0), boxes = Math.max(0, +f.get('boxes') || 0);
      const lines = [];
      const ot = $('#pr-slot').value === '1' ? 1.3 : 1;
      if (f.get('svcMove')) {
        const v = cars * (R.base + km * R.perKm);
        lines.push(['truck', 'Xe &amp; vận chuyển', cars ? R.base + km * R.perKm : 0, v * ot]);
        lines.push(['user', 'Nhân công', R.perPeople, people * R.perPeople * ot]);
        const fl = f.get('lift') === '1' ? R.liftFlat : ((+f.get('fromFloor') - 1) + (+f.get('toFloor') - 1)) * R.perFloor;
        lines.push(['stairs', 'Phụ phí tầng', f.get('lift') === '1' ? R.liftFlat : R.perFloor, fl]);
      }
      if (boxes) lines.push(['box', 'Thu hồi &amp; vệ sinh hộp', R.perBox, boxes * R.perBox]);
      if (f.get('svcClean')) lines.push(['broom', 'Dọn phòng', R.clean, R.clean]);
      if (f.get('svcHand')) lines.push(['clipboard-check', 'Bàn giao phòng', R.hand, R.hand]);
      const cost = lines.reduce((s, l) => s + l[3], 0);
      quote = Math.ceil((cost * R.margin) / 50000) * 50000;
      $('#pr-lines').innerHTML = lines.length ? lines.map(([ic, n, u, t]) => `<tr><td><span class="cell-ic">${icon(ic)} ${n}</span></td><td class="num">${fmt.num(u)}</td><td class="num"><b>${fmt.num(t)}</b></td></tr>`).join('') : `<tr><td colspan="3" class="empty">Chọn ít nhất một dịch vụ.</td></tr>`;
      $('#pr-cost').textContent = fmt.vnd(cost);
      $('#pr-quote').textContent = fmt.vnd(quote);
      $('#pr-margin').textContent = fmt.vnd(quote - cost);
      const opts = [
        { k: 'A', name: 'Đối tác A', img: 'pr-partner-a', q: 4.8, c: cost, best: true },
        { k: 'B', name: 'Đối tác B', img: 'pr-partner-b', q: 4.6, c: cost + 50000 },
        { k: 'C', name: 'Đối tác C', img: 'pr-partner-c', q: 4.4, c: Math.max(0, cost - 30000) },
      ];
      $('#pr-options').innerHTML = opts.map(o => `<label class="card card-sm ${o.k === option ? 'tint-green' : ''}" style="cursor:pointer;display:block;${o.k === option ? 'border-color:var(--g400);box-shadow:0 0 0 3px rgba(34,160,111,.12)' : ''}">
        <div class="row row-top"><input class="cbx" type="radio" name="opt" value="${o.k}" ${o.k === option ? 'checked' : ''} style="border-radius:50%;margin-top:4px"><img class="thumb" style="width:64px;height:64px" src="${img(o.img)}" alt="">
        <div class="grow"><div class="row wrap" style="gap:8px"><b>${o.name}</b>${o.best ? `<span class="badge b-yellow">${icon('star')} Đề xuất</span>` : ''}</div><span class="badge b-green mt-4"><span class="dot"></span>Có sẵn</span>
        <div class="row wrap mt-8" style="gap:14px"><span class="xs"><span class="muted">Đánh giá chất lượng</span><br><b class="h4">${String(o.q).replace('.', ',')}</b> / 5</span><span class="xs"><span class="muted">Chi phí ước tính</span><br><b class="h4">${fmt.vnd(o.c)}</b></span></div></div></div>
        ${o.k === option ? `<p class="badge b-green mt-12" style="white-space:normal">${icon('check-circle')} Phù hợp lịch • Đủ nguồn lực • Chi phí phù hợp</p>` : ''}</label>`).join('');
    };
    $('#pr-form').addEventListener('input', calc);
    $('#pr-form').addEventListener('change', calc);
    $('#pr-options').addEventListener('change', e => { if (e.target.name === 'opt') { option = e.target.value; calc(); } });
    $('#pr-save').addEventListener('click', () => toast(`Đã lưu bản tính ${code} lúc ${fmt.time(new Date())}.`));
    $('#pr-send').addEventListener('click', async () => {
      const ok = await confirm({ title: `Gửi báo giá ${fmt.vnd(quote)} cho khách?`, text: `Đơn ${code}. Khách hàng sẽ nhận thông báo và xác nhận báo giá trên tài khoản. Chi phí đối tác không hiển thị cho khách.`, ok: 'Gửi báo giá', ic: 'send' });
      if (!ok) return;
      const list = data.orders();
      const o = list.find(x => x.code === code);
      if (o) {
        const a = Math.round(quote * 0.625 / 10000) * 10000, b = Math.round(quote * 0.25 / 10000) * 10000;
        o.quote.items = [['truck', 'Vận chuyển', a], ['users', 'Bốc xếp', b], ['stairs', 'Phụ phí tầng', quote - a - b], ['clock', 'Phí chờ', 0], ['moon', 'Ngoài giờ', 0]];
        o.quote.confirmed = false;
        o.step = 2;
        o.stepTimes[1] = o.stepTimes[1] || nowStamp();
        o.stepTimes[2] = nowStamp();
        o.quote.history.unshift([nowStamp(), `BOXANH gửi báo giá ${fmt.vnd(quote)} (quy tắc ${R.ver}).`]);
        data.saveOrders(list);
        const n = data.notifs();
        n.unshift({ id: 'n' + Date.now(), icon: 'file-text', tone: '', title: 'Báo giá đã được cập nhật', time: nowStamp().replace(' ', ' · '), text: `Đơn ${code} đã có báo giá ${fmt.vnd(quote)}. Vui lòng xem chi tiết để xác nhận.`, href: `don-hang-chi-tiet.html?ma=${code}#bao-gia`, read: false });
        data.saveNotifs(n);
        const base = baseOrders(); const bo = base.find(x => x.code === code);
        if (bo && bo.status === 'Chờ báo giá') { bo.status = 'Chờ điều phối'; bo.value = quote; saveBase(base); }
      }
      toast(`Đã gửi báo giá ${fmt.vnd(quote)} cho khách hàng (${code}).`);
    });
    $('#perf').addEventListener('click', () => dialog(`<div class="modal-ic green">${icon('bar-chart')}</div><h2>Hiệu suất đối tác (30 ngày)</h2>
      <div class="table-wrap mt-16"><table class="table"><thead><tr><th>Đối tác</th><th class="num">Đơn</th><th class="num">Đúng giờ</th><th class="num">Chênh dự toán</th><th class="num">Điểm</th></tr></thead><tbody>
      <tr><td>Đối tác A · An Phát Movers</td><td class="num">24</td><td class="num">96%</td><td class="num">-1,2%</td><td class="num">4,8</td></tr>
      <tr><td>Đối tác B · Nhanh Gọn 247</td><td class="num">31</td><td class="num">91%</td><td class="num">+0,8%</td><td class="num">4,6</td></tr>
      <tr><td>Đối tác C · Thành Đạt Pro</td><td class="num">12</td><td class="num">88%</td><td class="num">+2,4%</td><td class="num">4,4</td></tr></tbody></table></div>`, 'lg'));
    $('#rules').addEventListener('click', () => {
      const fields = [['base', 'Giá mở chuyến / xe'], ['perKm', 'Đơn giá mỗi km'], ['perPeople', 'Nhân công / người'], ['liftFlat', 'Phụ phí tầng (có thang)'], ['perFloor', 'Phụ phí mỗi tầng (không thang)'], ['perBox', 'Thu hồi & vệ sinh / hộp'], ['clean', 'Dọn phòng'], ['hand', 'Bàn giao phòng']];
      const m = dialog(`<div class="modal-ic">${icon('settings')}</div><h2>Cập nhật quy tắc giá</h2><p class="modal-text">Phiên bản hiện tại ${R.ver}. Thay đổi áp dụng cho các bản tính mới.</p>
        <form id="rule-form" novalidate><div class="form-grid mt-16">${fields.map(([k, l]) => `<div class="field"><label class="label small" for="r-${k}">${l} (đ)</label><input class="input input-sm" id="r-${k}" name="${k}" type="number" min="0" step="1000" value="${R[k]}" required></div>`).join('')}
        <div class="field"><label class="label small" for="r-margin">Hệ số báo giá</label><input class="input input-sm" id="r-margin" name="margin" type="number" min="1" max="2" step="0.01" value="${R.margin}" required></div></div>
        <div class="modal-actions"><button class="btn btn-light" type="button" data-reset>Về mặc định</button><button class="btn btn-primary" type="submit">Lưu quy tắc</button></div></form>`, 'lg');
      $('[data-reset]', m).addEventListener('click', () => { store.del('rules'); R = Object.assign({}, DEF); closeModal(m); calc(); paintRule(); toast('Đã khôi phục quy tắc giá mặc định v1.2.', 'info'); });
      $('#rule-form', m).addEventListener('submit', e => {
        e.preventDefault();
        if (!validate(e.target)) return;
        const f = new FormData(e.target);
        fields.forEach(([k]) => { R[k] = Math.max(0, +f.get(k)); });
        R.margin = Math.min(2, Math.max(1, +f.get('margin')));
        const v = R.ver.match(/v(\d+)\.(\d+)/);
        R.ver = `v${v[1]}.${+v[2] + 1}`; R.by = 'Nguyễn Minh Anh'; R.at = nowStamp();
        store.set('rules', R);
        closeModal(m); calc(); paintRule();
        toast(`Đã cập nhật quy tắc giá ${R.ver}.`);
      });
    });
    const paintRule = () => { $('#rule-ver').textContent = `Quy tắc ${R.ver}`; $('#rule-meta').textContent = `Người cập nhật: ${R.by} · ${R.at}`; };
    paintRule();
    calc();
  }

  /* ======================= KHO HỘP ======================= */
  if ($('#bx-rows')) {
    const STS = Object.assign({ 'da-giao': ['Đã giao', 'b-blue'] }, D.boxStatuses);
    const boxes = () => db('iboxes', D.internalBoxes);
    const saveBoxes = v => store.set('iboxes', v);
    let selected = 'BX-000121';
    let filterSt = '';
    const CHECKS = [['Vỏ hộp &amp; đáy', 'Không nứt vỡ, còn chắc chắn'], ['Nắp &amp; khóa', 'Đóng mở bình thường'], ['Tem QR', 'Rõ nét, dễ quét'], ['Vệ sinh', 'Đã lau rửa sạch'], ['Khô sạch', 'Đảm bảo khô hoàn toàn']];
    const checks = store.get('boxChecks', {});
    $('#bx-st').insertAdjacentHTML('beforeend', Object.entries(STS).map(([k, [t]]) => `<option value="${k}">${t}</option>`).join(''));
    const stB = s => `<span class="badge ${STS[s][1]}"><span class="dot"></span>${STS[s][0]}</span>`;
    const renderFlow = () => {
      const list = boxes();
      const c = s => list.filter(b => b.status === s).length;
      const chip = (s, ic) => `<button class="lc-chip" type="button" data-f="${s}" aria-pressed="${filterSt === s}" style="${filterSt === s ? 'border-color:var(--g500);box-shadow:0 0 0 3px rgba(34,160,111,.12)' : ''}">${icon(ic)}<span>${STS[s][0]}<br><b class="num">${c(s)}</b> <span class="xs muted">hộp</span></span></button>`;
      $('#lc-flow').innerHTML = [chip('san-sang', 'box'), icon('arrow-right'), chip('da-giao', 'truck'), icon('arrow-right'), chip('dang-dung', 'home'), icon('arrow-right'), chip('da-thu-hoi', 'package-in'), icon('arrow-right'), chip('kiem-tra', 'sparkles')].join('');
      $('#lc-special').innerHTML = [['bao-tri', 'wrench', 'background:#fff7e0;color:#8a6200'], ['that-lac', 'alert-triangle', 'background:var(--r100);color:var(--r600)'], ['tai-che', 'recycle', 'background:var(--g100);color:var(--g700)']]
        .map(([s, ic, sty]) => `<button class="special" type="button" data-f="${s}" style="${sty};${filterSt === s ? 'outline:2px solid currentColor' : ''}">${icon(ic)} ${STS[s][0]} <b class="num">(${c(s)})</b></button>`).join('');
    };
    const filtered = () => {
      const k = $('#bx-q').value.trim().toUpperCase();
      const st = filterSt || $('#bx-st').value;
      const wh = $('#bx-where').value;
      return boxes().filter(b => (!k || `${b.code} ${b.order}`.toUpperCase().includes(k)) && (!st || b.status === st) && (!wh || (wh === '__out' ? /^(KH|SV)/.test(b.where) : b.where === wh)));
    };
    const renderRows = () => {
      const list = filtered();
      $('#bx-rows').innerHTML = list.length ? list.map(b => `<tr data-code="${b.code}" class="${b.code === selected ? 'is-selected' : ''}"><td><input class="cbx" type="checkbox" data-chk="${b.code}" aria-label="Chọn ${b.code}"></td><td><b class="num nowrap">${b.code}</b><span class="sub nowrap">${b.order || 'Chưa gắn đơn'}</span></td><td>${stB(b.status)}</td><td>${esc(b.where)}<span class="sub nowrap">Quét ${b.scan}</span></td></tr>`).join('')
        : `<tr><td colspan="4" class="empty">${icon('search')}Không có hộp phù hợp.</td></tr>`;
      $('#bx-count').textContent = `${list.length} / ${boxes().length} hộp${filterSt ? ` · Đang lọc: ${STS[filterSt][0]}` : ''}`;
    };
    const renderDetail = () => {
      const b = boxes().find(x => x.code === selected);
      if (!b) { $('#bx-detail').innerHTML = `<div class="empty">${icon('box')}<p>Chọn một hộp để xem chi tiết.</p></div>`; return; }
      const ck = checks[b.code] || (b.status === 'san-sang' ? [1, 1, 1, 1, 1] : b.status === 'kiem-tra' || b.status === 'da-thu-hoi' ? [1, 1, 1, 0, 0] : [0, 0, 0, 0, 0]);
      checks[b.code] = ck;
      const canReady = ['da-thu-hoi', 'kiem-tra', 'bao-tri'].includes(b.status);
      $('#bx-detail').innerHTML = `
        <div class="card-hd"><h2 class="h2 row num">${icon('qr-code', 'ic-lg')} ${b.code}</h2><div class="row">${stB(b.status)}</div></div>
        <div class="stack" style="--gap:14px">
          <div class="media" style="aspect-ratio:2.6"><img src="${img('box-detail')}" alt="Hộp ${b.code}"></div>
          <dl class="kv small"><dt>Đơn hàng liên quan</dt><dd>${b.order || '—'}</dd><dt>Vị trí hiện tại</dt><dd>${esc(b.where)}</dd><dt>Mã tem niêm phong</dt><dd>${b.seal}</dd><dt>Lần quét mới nhất</dt><dd>${b.scan}<br><span class="muted" style="font-weight:400">${esc(b.by)}</span></dd><dt>Lần quét trước đó</dt><dd style="font-weight:500">${esc(b.prev)}</dd></dl>
        </div>
        <div class="card card-sm mt-16">
          <b class="small">Kiểm tra &amp; vệ sinh</b>
          <div class="grid g-2 gap-sm mt-8">${CHECKS.map(([t, s], i) => `<label class="check"><input type="checkbox" data-ck="${i}" ${ck[i] ? 'checked' : ''} ${canReady ? '' : 'disabled'}><span><b style="color:var(--ink)">${t}</b><br><span class="xs muted">${s}</span></span></label>`).join('')}</div>
          <div class="grid g-3 gap-sm mt-12" style="align-items:start">
            <figure><img class="thumb" style="width:100%;height:70px" src="${img('clean-before')}" alt="Trước vệ sinh"><figcaption class="xs muted mt-4">Trước vệ sinh</figcaption></figure>
            <figure><img class="thumb" style="width:100%;height:70px" src="${img('clean-after')}" alt="Sau vệ sinh"><figcaption class="xs muted mt-4">Sau vệ sinh</figcaption></figure>
            <div class="field"><label class="label xs" for="bx-note">Ghi chú bảo trì</label><textarea class="textarea" id="bx-note" style="min-height:70px;font-size:13px" maxlength="200" placeholder="Nhập ghi chú…">${esc(b.note || '')}</textarea></div>
          </div>
        </div>
        <div class="grid g-2 gap-sm mt-16 btn-grid">
          <button class="btn btn-primary" type="button" data-a="ready" ${canReady ? '' : 'disabled'}>${icon('check')} Đạt • Sẵn sàng</button>
          <button class="btn btn-yellow" type="button" data-a="fix" ${['bao-tri', 'that-lac', 'tai-che'].includes(b.status) ? 'disabled' : ''}>${icon('wrench')} Chuyển bảo trì</button>
          <button class="btn btn-light" type="button" data-a="lost" ${['that-lac', 'tai-che'].includes(b.status) ? 'disabled' : ''}>${icon('alert-triangle')} Ghi nhận thất lạc</button>
          <button class="btn btn-light" type="button" data-a="recycle" ${b.status === 'tai-che' ? 'disabled' : ''}>${icon('recycle')} Kết thúc vòng đời / Tái chế</button>
        </div>
        <p class="xs muted mt-12 row" style="gap:6px">${icon('history', 'ic-sm')} Lưu lịch sử: ${b.uses} vòng sử dụng · ${Math.max(1, b.uses - 1)} lần kiểm tra · ${b.uses > 6 ? 2 : 1} lần bảo trì${b.order ? ' · Đơn liên quan: ' + b.order : ''}</p>`;
    };
    const update = (code, patch, msg) => {
      const list = boxes();
      const b = list.find(x => x.code === code);
      Object.assign(b, patch, { prev: `${b.scan} – ${b.where}`, scan: nowStamp(), by: 'Nguyễn Minh Anh' });
      saveBoxes(list); renderFlow(); renderRows(); renderDetail();
      if (msg) toast(msg);
    };
    $('#bx-rows').addEventListener('click', e => {
      if (e.target.closest('[data-chk]')) return;
      const r = e.target.closest('[data-code]');
      if (r) { selected = r.dataset.code; renderRows(); renderDetail(); if (matchMedia('(max-width: 1180px)').matches) $('#bx-detail').scrollIntoView({ behavior: 'smooth' }); }
    });
    $('#bx-all').addEventListener('change', e => $$('[data-chk]').forEach(c => { c.checked = e.target.checked; }));
    ['#bx-q', '#bx-st', '#bx-where'].forEach(s => $(s).addEventListener('input', () => { if (s === '#bx-st') filterSt = ''; renderFlow(); renderRows(); }));
    document.addEventListener('click', e => {
      const f = e.target.closest('[data-f]');
      if (!f) return;
      filterSt = filterSt === f.dataset.f ? '' : f.dataset.f;
      $('#bx-st').value = '';
      renderFlow(); renderRows();
    });
    $('#bx-detail').addEventListener('change', e => {
      const c = e.target.closest('[data-ck]');
      if (c) { checks[selected][+c.dataset.ck] = c.checked ? 1 : 0; store.set('boxChecks', checks); }
      if (e.target.id === 'bx-note') { const list = boxes(); list.find(x => x.code === selected).note = e.target.value; saveBoxes(list); toast('Đã lưu ghi chú bảo trì.'); }
    });
    $('#bx-detail').addEventListener('click', async e => {
      const a = e.target.closest('[data-a]');
      if (!a) return;
      const act = a.dataset.a;
      if (act === 'ready') {
        if (checks[selected].some(v => !v)) { toast('Cần đạt đủ 5 mục kiểm tra & vệ sinh trước khi đưa về Sẵn sàng.', 'warn'); return; }
        update(selected, { status: 'san-sang', where: 'Kho A', order: '', seal: '—' }, `${selected} đã sẵn sàng tái sử dụng.`);
      } else if (act === 'fix') {
        update(selected, { status: 'bao-tri', where: 'Khu bảo trì' }, `Đã chuyển ${selected} sang bảo trì.`);
      } else if (act === 'lost') {
        if (!(await confirm({ title: `Ghi nhận ${selected} thất lạc?`, text: 'Hộp sẽ bị loại khỏi kho khả dụng. CSKH được thông báo để đối chiếu với khách/đối tác.', ok: 'Ghi nhận', tone: 'red', ic: 'alert-triangle' }))) return;
        update(selected, { status: 'that-lac', where: '—' }, `Đã ghi nhận ${selected} thất lạc.`);
      } else if (act === 'recycle') {
        if (!(await confirm({ title: `Kết thúc vòng đời ${selected}?`, text: 'Hộp sẽ được chuyển cho đơn vị tái chế nhựa. Thao tác không thể hoàn tác.', ok: 'Chuyển tái chế', tone: 'red', ic: 'recycle' }))) return;
        update(selected, { status: 'tai-che', where: 'Đơn vị tái chế', order: '' }, `${selected} đã chuyển tái chế.`);
      }
    });
    $('#bx-scan').addEventListener('click', () => {
      const m = dialog(`<div class="modal-ic green">${icon('scan-qr')}</div><h2>Quét QR hộp</h2><p class="modal-text">Dùng máy quét cầm tay hoặc nhập mã hộp.</p><form id="scan-f" novalidate><div class="field mt-16"><label class="label" for="scan-code">Mã hộp</label><input class="input" id="scan-code" placeholder="BX-000128" required autocomplete="off"></div><div class="modal-actions"><button class="btn btn-primary" type="submit">Tìm hộp</button></div></form>`);
      $('#scan-f', m).addEventListener('submit', ev => {
        ev.preventDefault();
        const v = $('#scan-code', m).value.trim().toUpperCase().replace(/^BX-?/, 'BX-');
        const b = boxes().find(x => x.code === v);
        if (!b) { BX.setError($('#scan-code', m), 'Không tìm thấy hộp với mã này.'); return; }
        closeModal(m);
        selected = b.code; filterSt = ''; $('#bx-q').value = ''; $('#bx-st').value = ''; $('#bx-where').value = '';
        update(b.code, {}, `Đã quét ${b.code}.`);
        $(`[data-code="${b.code}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    $('#bx-in').addEventListener('click', () => {
      const inUse = boxes().filter(b => ['dang-dung', 'da-giao'].includes(b.status));
      const m = dialog(`<div class="modal-ic green">${icon('package-in')}</div><h2>Nhập hộp</h2><p class="modal-text">Ghi nhận hộp thu hồi từ khách hoặc hộp mới nhập kho.</p>
        <form id="in-f" novalidate><div class="field mt-16"><label class="label" for="in-code">Hộp thu hồi</label><select class="select" id="in-code" required data-msg="Chọn hộp cần nhập.">${inUse.length ? inUse.map(b => `<option>${b.code}</option>`).join('') : '<option value="">Không có hộp đang ở khách</option>'}</select></div>
        <div class="field mt-12"><label class="label" for="in-where">Nhập về</label><select class="select" id="in-where"><option>Kho A</option><option>Kho B</option></select></div>
        <div class="modal-actions"><button class="btn btn-light" type="button" data-new>${icon('plus')} Thêm 1 hộp mới</button><button class="btn btn-primary" type="submit">Nhập hộp</button></div></form>`);
      $('[data-new]', m).addEventListener('click', () => {
        const list = boxes();
        const n = Math.max(...list.map(b => +b.code.slice(3))) + 1;
        const code = 'BX-' + String(n).padStart(6, '0');
        list.push({ code, status: 'kiem-tra', where: 'Khu vệ sinh', order: '', seal: '—', scan: nowStamp(), by: 'Nguyễn Minh Anh', prev: 'Hộp mới từ nhà cung cấp', uses: 0 });
        saveBoxes(list); closeModal(m); selected = code; renderFlow(); renderRows(); renderDetail();
        toast(`Đã thêm hộp mới ${code} – chờ kiểm tra trước khi sử dụng.`);
      });
      $('#in-f', m).addEventListener('submit', ev => {
        ev.preventDefault();
        if (!validate(ev.target)) return;
        const code = $('#in-code', m).value;
        closeModal(m); selected = code;
        update(code, { status: 'da-thu-hoi', where: $('#in-where', m).value }, `Đã nhập ${code} về ${$('#in-where', m).value}.`);
      });
    });
    $('#bx-out').addEventListener('click', () => {
      const ready = boxes().filter(b => b.status === 'san-sang');
      const m = dialog(`<div class="modal-ic">${icon('package-out')}</div><h2>Xuất hộp</h2><p class="modal-text">Chỉ xuất hộp đã kiểm tra và vệ sinh đạt yêu cầu. Hiện có <b>${ready.length}</b> hộp sẵn sàng.</p>
        <form id="out-f" novalidate><div class="field mt-16"><label class="label" for="out-order">Cho đơn hàng</label><select class="select" id="out-order"><option>BX2027-0018</option><option>BX2027-0019</option><option>BX2027-0020</option></select></div>
        <div class="field mt-12"><label class="label" for="out-n">Số hộp</label><input class="input" id="out-n" type="number" min="1" max="${Math.max(1, ready.length)}" value="${Math.min(1, ready.length)}" required ${ready.length ? '' : 'disabled'}></div>
        <div class="modal-actions"><button class="btn btn-primary" type="submit" ${ready.length ? '' : 'disabled'}>Xuất hộp</button></div></form>`);
      $('#out-f', m).addEventListener('submit', ev => {
        ev.preventDefault();
        const n = Math.min(ready.length, Math.max(1, +$('#out-n', m).value || 1));
        const order = $('#out-order', m).value;
        const list = boxes();
        ready.slice(0, n).forEach((r, i) => { const b = list.find(x => x.code === r.code); Object.assign(b, { status: 'da-giao', where: 'Đang giao – ' + order, order, seal: 'SL-0049' + String(10 + i), prev: `${b.scan} – ${b.where}`, scan: nowStamp(), by: 'Nguyễn Minh Anh', uses: b.uses + 1 }); });
        saveBoxes(list); closeModal(m); renderFlow(); renderRows(); renderDetail();
        toast(`Đã xuất ${n} hộp cho đơn ${order}.`);
      });
    });
    $('#bx-pick').addEventListener('click', () => {
      const p = store.get('pickup', null);
      const rows = [['13/01/2027', '08:00 – 10:00', 'BX2027-0014', 15, 'Quận Ba Đình'], ['14/01/2027', '14:00 – 16:00', 'BX2027-0012', 8, 'Quận Long Biên'], ['14/01/2027', '16:00 – 18:00', 'BX2027-0013', 6, 'Quận Cầu Giấy']];
      if (p) rows.unshift([fmt.date(fmt.fromIso(p.date)), p.slot, 'BX2027-0015', p.boxes.length, p.addr]);
      dialog(`<div class="modal-ic green">${icon('calendar')}</div><h2>Lịch thu hồi sắp tới</h2><div class="table-wrap mt-16"><table class="table"><thead><tr><th>Ngày</th><th>Khung giờ</th><th>Đơn</th><th class="num">Số hộp</th><th>Địa điểm</th></tr></thead><tbody>${rows.map(r => `<tr><td class="num">${r[0]}</td><td class="num">${r[1]}</td><td class="num"><b>${r[2]}</b></td><td class="num">${r[3]}</td><td>${esc(r[4])}</td></tr>`).join('')}</tbody></table></div>${p ? '<p class="hint mt-12">Lịch BX2027-0015 do khách đặt trên website.</p>' : ''}`, 'lg');
    });
    renderFlow(); renderRows(); renderDetail();
  }

  /* ======================= SỰ CỐ ======================= */
  if ($('#inc-main')) {
    const STATES = { moi: ['Yêu cầu mới', 'b-blue'], 'dang-xu-ly': ['Đang xử lý', 'b-yellow'], 'cho-thong-tin': ['Chờ thông tin', 'b-orange'], 'hoan-tat': ['Đã hoàn tất', 'b-green'] };
    const STEPS = ['Tiếp nhận', 'Thu thập dữ liệu', 'Đối chiếu', 'Phản hồi', 'Hoàn tất'];
    const TEMPLATES = {
      more: 'BOXANH đã ghi nhận yêu cầu của bạn và đang đối chiếu thông tin. Chúng tôi sẽ sớm liên hệ lại khi có thêm kết quả. Bạn vui lòng gửi thêm hình ảnh khu vực đặt đồ để chúng tôi xác minh nhanh hơn.',
      found: 'BOXANH đã đối chiếu dữ liệu quét QR và ảnh giao nhận. Món đồ được ghi nhận nằm trong hộp tại thời điểm giao. Nhân viên sẽ liên hệ để hỗ trợ bạn kiểm tra lại.',
      comp: 'BOXANH xin lỗi vì sự cố. Sau khi đối chiếu, chúng tôi xác nhận trách nhiệm và sẽ hỗ trợ bồi thường theo điều khoản dịch vụ. Nhân viên sẽ liên hệ để thống nhất phương án.',
    };
    let filter = 'all';
    let selected = (incidents().find(i => i.code === param('ma')) || incidents().find(i => i.code === 'YC-0028') || incidents()[0]).code;
    let tab = 'don-hang';
    const notes = store.get('incNotes', {});
    const renderSide = () => {
      const list = incidents();
      const c = s => list.filter(i => i.state === s).length;
      $('#inc-filters').innerHTML = [['all', 'inbox', 'Danh sách sự cố', list.length], ['moi', 'file-text', 'Yêu cầu mới', c('moi')], ['dang-xu-ly', 'clock', 'Đang xử lý', c('dang-xu-ly')], ['cho-thong-tin', 'hourglass', 'Chờ thông tin', c('cho-thong-tin')], ['hoan-tat', 'check-circle', 'Đã hoàn tất', c('hoan-tat')]]
        .map(([k, ic, t, n]) => `<a href="#" data-flt="${k}" class="${filter === k ? 'is-active' : ''}">${icon(ic)}<span>${t}</span>${n ? `<em class="count">${n}</em>` : ''}</a>`).join('');
      $('#inc-list').innerHTML = list.filter(i => filter === 'all' || i.state === filter).map(i => `<button type="button" data-inc="${i.code}" class="dd-item" style="color:#fff;${i.code === selected ? 'background:rgba(255,255,255,.12)' : ''}"><span><b style="color:#fff">${i.code} · ${esc(i.type)}</b><small style="color:#9cc1ae">${i.created} · ${STATES[i.state][0]}</small></span></button>`).join('') || '<p class="xs" style="color:#9cc1ae">Không có sự cố.</p>';
    };
    const evidence = i => i.code === 'YC-0028' ? {
      timeline: [['12/01/2027 08:15', 'Quét nhận hộp tại nhà khách', 'BX-000128', ''], ['12/01/2027 08:18', 'Chụp seal thùng', 'SL-004281', ''], ['12/01/2027 10:42', 'Quét giao hộp tại nhà mới', 'BX-000128', ''], ['12/01/2027 11:20', 'Khách báo sự cố YC-0028', '', 'warn']],
      photos: [['evidence-seal', 'Ảnh seal lúc 08:18', 'SL-004281'], ['evidence-room', 'Ảnh bàn giao tổng thể lúc 10:42', 'Khu vực phòng khách']],
      checks: [['Vật dụng trong đơn hàng', 'ok', 'Đã đối chiếu'], ['Vật dụng ngoài hộp', 'warn', 'Cần xác minh thêm'], ['Ảnh hiện trường', 'ok', 'Đã có'], ['Dữ liệu quét QR', 'ok', 'Đầy đủ'], ['Báo cáo đối tác', 'ok', 'Đã nhận'], ['Tường trình khách hàng', 'ok', 'Đã có']],
      reported: 'Đồ để ngoài hộp', note: 'Seal nguyên vẹn không xác nhận được đồ ngoài hộp. Cần đối chiếu thêm dữ liệu.',
    } : {
      timeline: [[i.created, 'Ghi nhận sự cố ' + i.type, i.box, 'warn']],
      photos: [['seal-torn', 'Ảnh hiện trạng', i.box], ['seal-recv', 'Ảnh lúc nhận', 'Tại điểm đi']],
      checks: [['Dữ liệu quét QR', 'ok', 'Đầy đủ'], ['Ảnh hiện trường', 'ok', 'Đã có'], ['Báo cáo đối tác', i.from ? 'ok' : 'warn', i.from ? 'Đã nhận' : 'Chờ bổ sung'], ['Tường trình khách hàng', 'warn', 'Chờ bổ sung']],
      reported: i.desc || i.type, note: 'Cần thu thập đủ ảnh và tường trình trước khi kết luận.',
    };
    const renderMain = () => {
      const i = incidents().find(x => x.code === selected);
      if (!i) { $('#inc-main').innerHTML = `<div class="card empty">${icon('inbox')}<p>Không có sự cố.</p></div>`; return; }
      const ev = evidence(i);
      const n = notes[i.code] || { note: i.code === 'YC-0028' ? 'Đã kiểm tra ảnh seal và ảnh bàn giao. Tiếp tục liên hệ khách hàng để thu thập thêm hình ảnh khu vực đặt đồ ngoài hộp và làm rõ thông tin.' : '', plan: 'more', text: 'Liên hệ khách hàng để yêu cầu thêm ảnh khu vực đặt đồ và mô tả chi tiết hơn về thời điểm, vị trí.' };
      notes[i.code] = n;
      const stepHtml = STEPS.map((s, k) => `<div class="step ${k < i.step || i.state === 'hoan-tat' ? 'is-done' : k === i.step ? 'is-current' : 'is-todo'}"><span class="step-dot">${k < i.step || i.state === 'hoan-tat' ? icon('check') : k + 1}</span><div><b>${s}</b>${k === i.step && i.state !== 'hoan-tat' ? '<small class="green">Đang thực hiện</small>' : k === 0 ? `<small>${i.created.slice(0, 5)} ${i.created.slice(-5)}</small>` : ''}</div></div>`).join('');
      const tabs = [['don-hang', 'clipboard-list', 'Đơn hàng'], ['qr', 'history', 'Lịch sử QR'], ['anh', 'camera', 'Seal &amp; ảnh'], ['trao-doi', 'message', 'Trao đổi'], ['ket-qua', 'file-check', 'Kết quả']];
      const msgs = store.get('incMsgs', {})[i.code] || [['CSKH Nguyễn Minh Anh', '12/01/2027 11:35', 'Đã gọi khách xác nhận mô tả đồ thất lạc.']];
      let body = '';
      if (tab === 'don-hang') {
        body = `<h3 class="h4">Bằng chứng từ đơn hàng</h3><div class="grid g-2 mt-12" style="align-items:start">
          <div class="card card-sm"><b class="small">Dòng thời gian sự kiện</b><div class="vtl mt-12">${ev.timeline.map(([t, x, c, w]) => `<div class="${w}"><time>${t}</time><p>${x}</p>${c ? `<span class="badge b-gray mt-4">${c}</span>` : ''}</div>`).join('')}</div></div>
          <div class="card card-sm"><div class="row between"><b class="small">Ảnh bằng chứng</b><button class="link small" type="button" data-tab2="anh">Xem tất cả ${icon('arrow-right')}</button></div><div class="grid g-2 gap-sm mt-8">${ev.photos.map(([p, t, s]) => `<figure><div class="media" style="aspect-ratio:.95"><img src="${img(p)}" alt="${t}"></div><figcaption class="xs mt-4"><b>${t}</b><br><span class="muted">${s}</span></figcaption></figure>`).join('')}</div></div>
          <div class="card card-sm" style="grid-column:1/-1"><b class="small">Danh sách đối chiếu</b><dl class="grid g-2 mt-8 small" style="gap:0 24px">${ev.checks.map(([t, st, lb]) => `<div class="row between" style="padding:9px 0;border-top:1px solid var(--line-2)"><dt>${t}</dt><dd class="${st === 'ok' ? 'green' : ''}" style="${st === 'ok' ? '' : 'color:var(--o600)'}">${icon(st === 'ok' ? 'check-circle' : 'alert-circle', 'ic-sm')} ${lb}</dd></div>`).join('')}</dl>
          ${i.step === 1 && i.state !== 'hoan-tat' ? `<button class="btn btn-soft btn-sm mt-12" type="button" data-act="compare">${icon('check')} Hoàn tất thu thập, chuyển đối chiếu</button>` : ''}</div></div>`;
      } else if (tab === 'qr') {
        body = `<h3 class="h4">Lịch sử quét QR</h3><div class="table-wrap mt-12"><table class="table"><thead><tr><th>Thời gian</th><th>Sự kiện</th><th>Mã</th><th>Người quét</th></tr></thead><tbody>${ev.timeline.filter(t => t[2]).map(([t, x, c]) => `<tr><td class="num">${t}</td><td>${x}</td><td class="num">${c}</td><td>Nguyễn Văn Minh</td></tr>`).join('')}</tbody></table></div>`;
      } else if (tab === 'anh') {
        body = `<h3 class="h4">Seal &amp; ảnh</h3><div class="grid g-4 keep-2 gap-sm mt-12">${[...ev.photos.map(p => p[0]), 'seal-recv', 'seal-deliver', 'seal-photo', 'lost-bag'].slice(0, 6).map((p, k) => `<div class="media" style="aspect-ratio:1"><img src="${img(p)}" alt="Ảnh bằng chứng ${k + 1}"></div>`).join('')}</div>`;
      } else if (tab === 'trao-doi') {
        body = `<h3 class="h4">Trao đổi nội bộ</h3><div class="vtl mt-12">${msgs.map(([w, t, m]) => `<div><time>${t} · ${esc(w)}</time><p>${esc(m)}</p></div>`).join('')}</div>
          <form class="row mt-16" id="msg-f" novalidate><label class="sr-only" for="msg-in">Tin nhắn</label><input class="input" id="msg-in" placeholder="Nhập trao đổi nội bộ…" required><button class="btn btn-primary" type="submit">${icon('send')}</button></form>`;
      } else {
        body = `<h3 class="h4">Kết quả</h3>${i.state === 'hoan-tat' ? `<div class="note info mt-12">${icon('check-circle')}<div><b>${esc(i.result || 'Đã hoàn tất xử lý.')}</b></div></div>` : `<p class="muted mt-8">Chưa có kết luận. Chỉ có thể kết luận sau khi hoàn tất đối chiếu dữ liệu và phản hồi khách hàng.</p>`}`;
      }
      $('#inc-main').innerHTML = `
        <section class="card card-pad">
          <div class="row between wrap"><div class="row wrap"><h1 class="h2">Hồ sơ sự cố ${i.code}</h1><span class="badge b-gray">${icon('lock')} CSKH • Nội bộ</span><span class="badge ${STATES[i.state][1]} b-lg">${icon('clock')} ${i.state === 'dang-xu-ly' ? 'Đang xác minh' : STATES[i.state][0]}</span></div></div>
          <p class="small muted mt-4">Tạo ngày ${i.created} · Dữ liệu minh họa</p>
          <div class="steps-scroll mt-20"><div class="steps keep" style="--n:5">${stepHtml}</div></div>
        </section>
        <div class="grid g-4 gap-sm">
          <div class="card card-sm row">${icon('file-text', 'ic-lg')}<div><p class="xs muted">Đơn hàng liên quan</p><b class="num">${i.order}</b></div></div>
          <div class="card card-sm row">${icon('alert-triangle', 'ic-lg red')}<div><p class="xs muted">Vấn đề khách hàng báo</p><b>${esc(i.type)}</b></div></div>
          <div class="card card-sm row">${icon('box', 'ic-lg')}<div><p class="xs muted">Khách hàng báo</p><b>${esc(ev.reported)}</b></div></div>
          <div class="card card-sm row"><img class="avatar" src="${img('avatar-cskh')}" alt=""><div><p class="xs muted">Nhân sự phụ trách</p><b>${esc(i.owner)}</b></div></div>
        </div>
        <div class="seg" role="tablist" aria-label="Thông tin sự cố" style="flex-wrap:wrap">${tabs.map(([k, ic, t]) => `<button type="button" role="tab" data-tab2="${k}" class="${tab === k ? 'is-active' : ''}" aria-selected="${tab === k}">${icon(ic, 'ic-sm')}&nbsp;${t}</button>`).join('')}</div>
        <section class="card card-pad">${body}</section>
        <div class="grid g-2 gap-sm">
          <div class="note">${icon('alert-circle')}<div>${esc(ev.note)}</div></div>
          <div class="note info">${icon('scale')}<div><span class="xs muted">Đánh giá hiện tại</span><br><b>${i.state === 'hoan-tat' ? 'Đã có kết luận.' : 'Chưa đủ cơ sở kết luận trách nhiệm.'}</b></div></div>
        </div>
        <section class="grid g-2 gap-sm" style="align-items:start">
          <div class="card card-sm" style="grid-column:1/-1"><label class="label small" for="inc-note">Ghi nhận nội bộ</label><textarea class="textarea mt-8" id="inc-note" maxlength="1000">${esc(n.note)}</textarea><span class="counter" data-counter-for="inc-note">0/1000</span></div>
          <div class="card card-sm"><label class="label small" for="inc-plan">Hướng xử lý đề xuất</label><select class="select mt-8" id="inc-plan"><option value="more" ${n.plan === 'more' ? 'selected' : ''}>Yêu cầu bổ sung hình ảnh / trao đổi</option><option value="found" ${n.plan === 'found' ? 'selected' : ''}>Đồ có trong hộp – hỗ trợ khách kiểm tra lại</option><option value="comp" ${n.plan === 'comp' ? 'selected' : ''}>Xác nhận trách nhiệm – hỗ trợ bồi thường</option></select><label class="label small mt-12" for="inc-text">Nội dung đề xuất</label><textarea class="textarea mt-8" id="inc-text" style="min-height:80px">${esc(n.text)}</textarea></div>
          <div class="card card-sm"><b class="small">Mẫu phản hồi <span class="muted" style="font-weight:400">(xem trước)</span></b><div class="note info mt-8 small" id="inc-preview">${icon('message-dots')}<div>${TEMPLATES[n.plan]}</div></div></div>
        </section>
        <div class="row wrap">
          ${i.step === 0 ? `<button class="btn btn-primary" type="button" data-act="take">${icon('user-check')} Tiếp nhận &amp; phân công cho tôi</button>` : ''}
          <button class="btn btn-outline" type="button" data-act="save">${icon('lock')} Lưu hồ sơ</button>
          <button class="btn btn-primary" type="button" data-act="reply" ${i.step < 2 || i.state === 'hoan-tat' ? 'disabled' : ''}>${icon('send')} Soạn phản hồi</button>
          <button class="btn btn-light" type="button" data-act="close" ${i.step < 3 || i.state === 'hoan-tat' ? 'disabled' : ''}>${icon('check-circle')} Kết luận sự cố</button>
          <span class="xs muted">${i.state === 'hoan-tat' ? 'Sự cố đã đóng.' : i.step < 2 ? 'Cần hoàn tất thu thập dữ liệu trước khi phản hồi.' : i.step < 3 ? 'Chỉ có thể kết luận sau khi đã phản hồi khách hàng.' : 'Có thể kết luận sự cố.'}</span>
        </div>`;
    };
    const setInc = patch => { const list = incidents(); Object.assign(list.find(x => x.code === selected), patch); saveInc(list); };
    const syncTicket = (status, text) => {
      const t = data.tickets(); const tk = t.find(x => x.code === selected);
      if (tk) { tk.status = status; tk.text = text; data.saveTickets(t); }
    };
    $('#inc-filters').addEventListener('click', e => { const a = e.target.closest('[data-flt]'); if (!a) return; e.preventDefault(); filter = a.dataset.flt; renderSide(); });
    $('#inc-list').addEventListener('click', e => { const b = e.target.closest('[data-inc]'); if (!b) return; selected = b.dataset.inc; tab = 'don-hang'; renderSide(); renderMain(); $('#inc-main').scrollIntoView({ behavior: 'smooth' }); });
    $('#inc-main').addEventListener('click', async e => {
      const t2 = e.target.closest('[data-tab2]');
      if (t2) { tab = t2.dataset.tab2; renderMain(); return; }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const n = notes[selected];
      const act = a.dataset.act;
      if (act === 'take') { setInc({ step: 1, state: 'dang-xu-ly', owner: 'Nguyễn Minh Anh' }); renderSide(); renderMain(); toast(`Đã tiếp nhận ${selected}.`); }
      if (act === 'compare') { setInc({ step: 2 }); renderMain(); toast('Đã chuyển sang bước đối chiếu dữ liệu.'); }
      if (act === 'save') { n.note = $('#inc-note').value; n.text = $('#inc-text').value; store.set('incNotes', notes); toast('Đã lưu hồ sơ sự cố.'); }
      if (act === 'reply') {
        const m = dialog(`<div class="modal-ic green">${icon('send')}</div><h2>Phản hồi khách hàng · ${selected}</h2><p class="modal-text">Gửi qua SMS và mục Hỗ trợ trên tài khoản khách.</p><form id="rep-f" novalidate><div class="field mt-16"><label class="label" for="rep-text">Nội dung</label><textarea class="textarea" id="rep-text" required minlength="20" maxlength="600" style="min-height:150px">${TEMPLATES[$('#inc-plan').value]}</textarea></div><div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">${icon('send')} Gửi phản hồi</button></div></form>`, 'lg');
        $('[data-x]', m).addEventListener('click', () => closeModal(m));
        $('#rep-f', m).addEventListener('submit', ev => {
          ev.preventDefault();
          if (!validate(ev.target)) return;
          const text = $('#rep-text', m).value.trim();
          setInc({ step: 3, state: $('#inc-plan').value === 'more' ? 'cho-thong-tin' : 'dang-xu-ly' });
          syncTicket('Đã phản hồi', text);
          closeModal(m); renderSide(); renderMain();
          toast('Đã gửi phản hồi cho khách hàng.');
        });
      }
      if (act === 'close') {
        const m = dialog(`<div class="modal-ic">${icon('scale')}</div><h2>Kết luận sự cố ${selected}</h2><form id="cl-f" novalidate><div class="stack mt-16" style="--gap:10px">
          <label class="opt"><input type="radio" name="res" value="Khách đã tìm thấy đồ – đóng sự cố." checked><span class="opt-mark">${icon('check')}</span><b>Khách đã tìm thấy đồ</b></label>
          <label class="opt"><input type="radio" name="res" value="Không đủ cơ sở xác định trách nhiệm – đã giải thích với khách."><span class="opt-mark">${icon('check')}</span><b>Không đủ cơ sở xác định trách nhiệm</b></label>
          <label class="opt"><input type="radio" name="res" value="BOXANH xác nhận trách nhiệm – hỗ trợ bồi thường theo điều khoản."><span class="opt-mark">${icon('check')}</span><b>BOXANH chịu trách nhiệm, bồi thường</b></label></div>
          <div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">Kết luận &amp; đóng</button></div></form>`);
        $('[data-x]', m).addEventListener('click', () => closeModal(m));
        $('#cl-f', m).addEventListener('submit', ev => {
          ev.preventDefault();
          const res = new FormData(ev.target).get('res');
          setInc({ step: 4, state: 'hoan-tat', result: res });
          syncTicket('Đã hoàn tất', res);
          closeModal(m); tab = 'ket-qua'; renderSide(); renderMain();
          toast(`Đã kết luận và đóng sự cố ${selected}.`);
        });
      }
    });
    $('#inc-main').addEventListener('change', e => {
      if (e.target.id === 'inc-plan') { notes[selected].plan = e.target.value; $('#inc-preview').innerHTML = icon('message-dots') + `<div>${TEMPLATES[e.target.value]}</div>`; }
    });
    $('#inc-main').addEventListener('input', e => {
      if (e.target.id === 'inc-note') { const c = $('[data-counter-for="inc-note"]'); if (c) c.textContent = `${e.target.value.length}/1000`; }
    });
    $('#inc-main').addEventListener('submit', e => {
      if (e.target.id !== 'msg-f') return;
      e.preventDefault();
      const v = $('#msg-in').value.trim();
      if (!v) return;
      const all = store.get('incMsgs', {});
      all[selected] = (all[selected] || [['CSKH Nguyễn Minh Anh', '12/01/2027 11:35', 'Đã gọi khách xác nhận mô tả đồ thất lạc.']]).concat([['Nguyễn Minh Anh', nowStamp(), v]]);
      store.set('incMsgs', all);
      renderMain();
    });
    renderSide(); renderMain();
    const c = $('[data-counter-for="inc-note"]'); if (c) c.textContent = `${$('#inc-note').value.length}/1000`;
  }

  /* ======================= BÁO CÁO ======================= */
  if ($('#rp-kpis')) {
    const SCALE = { 7: 0.25, 30: 1, 90: 2.8 };
    let range = 30;
    const render = () => {
      const s = SCALE[range];
      const orders = Math.round(286 * s), revenue = Math.round(204.6 * s * 10) / 10;
      $('#rp-kpis').innerHTML = [
        kpi('', 'wallet', 'Doanh thu', `${String(revenue).replace('.', ',')}<small>tr</small>`, ''),
        kpi('', 'clipboard-list', 'Số đơn', orders, 'yellow'),
        kpi('', 'receipt', 'Giá trị TB / đơn', `${Math.round(revenue * 1000 / orders)}<small>k</small>`, 'blue'),
        kpi('', 'clock', 'Đúng hẹn', '94<small>%</small>', 'peach'),
      ].join('');
      const weeks = range === 7 ? [['T2', 6.1], ['T3', 7.4], ['T4', 5.8], ['T5', 8.9], ['T6', 9.6], ['T7', 12.2], ['CN', 4.1]]
        : range === 30 ? [['Tuần 49', 41.2], ['Tuần 50', 47.8], ['Tuần 51', 52.3], ['Tuần 52', 63.3]]
          : [['T10', 148.2], ['T11', 176.4], ['T12', 204.6]];
      const max = Math.max(...weeks.map(w => w[1]));
      $('#rp-revenue').innerHTML = weeks.map(([l, v]) => `<div title="${l}: ${String(v).replace('.', ',')} triệu"><b class="xs">${String(v).replace('.', ',')}</b><i style="height:${(v / max) * 100}%"></i><span>${l}</span></div>`).join('');
    };
    const mix = [['Chuyển trọ', 58, '#1a8360'], ['Dọn phòng', 27, '#f2c230'], ['Bàn giao phòng', 15, '#ef7d45']];
    let off = 25;
    $('#rp-donut').innerHTML = '<circle cx="21" cy="21" r="15.915" fill="none" stroke="#edf3ef" stroke-width="6"/>' + mix.map(([, p, c]) => { const el = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${off}"/>`; off = (off - p + 100) % 100; return el; }).join('') + '<text x="21" y="22.5" text-anchor="middle" font-size="5" font-weight="700" fill="#10251c">286 đơn</text>';
    $('#rp-legend').innerHTML = mix.map(([n, p, c]) => `<div class="row"><i style="width:12px;height:12px;border-radius:4px;background:${c};display:inline-block"></i><b class="small">${n}</b><span class="small muted">${p}%</span></div>`).join('');
    $('#rp-partners').innerHTML = [['An Phát Movers', 'Vận chuyển', 24, 96, -1.2, 4.8], ['Nhanh Gọn 247', 'Vận chuyển', 31, 91, 0.8, 4.6], ['Sạch Xanh Home', 'Vệ sinh', 19, 97, -0.4, 4.7], ['Thợ Tốt 24h', 'Sửa chữa', 11, 93, 1.5, 4.5], ['Thành Đạt Pro', 'Vận chuyển', 12, 88, 2.4, 4.4]]
      .map(([n, g, o, t, d, sc]) => `<tr><td><b>${n}</b></td><td>${g}</td><td class="num">${o}</td><td class="num">${t}%</td><td class="num" style="color:${d > 0 ? 'var(--r600)' : 'var(--g600)'}">${d > 0 ? '+' : ''}${String(d).replace('.', ',')}%</td><td><span class="stars">${icon('star')}</span> ${String(sc).replace('.', ',')}</td></tr>`).join('');
    $('#rp-boxes').innerHTML = [['box', 'Tổng hộp đang quản lý', '240'], ['truck', 'Đang lưu hành', '186'], ['refresh', 'Vòng quay trung bình', '6,2 lần / hộp'], ['calendar-check', 'Thu hồi đúng hạn', '94%'], ['alert-triangle', 'Tỷ lệ thất lạc', '0,8%'], ['recycle', 'Chuyển tái chế tháng này', '4 hộp']]
      .map(([ic, k, v]) => `<div><dt>${icon(ic)} ${k}</dt><dd>${v}</dd></div>`).join('');
    $('#rp-range').addEventListener('segchange', e => { range = +e.detail; render(); });
    $('#rp-csv').addEventListener('click', () => {
      download('BOXANH-bao-cao.csv', [['Chỉ số', 'Giá trị'], ['Khoảng thời gian', `${range} ngày`], ['Số đơn', Math.round(286 * SCALE[range])], ['Doanh thu (triệu đồng)', Math.round(204.6 * SCALE[range] * 10) / 10], ['Tỷ lệ đúng hẹn', '94%'], ['Cơ cấu: Chuyển trọ', '58%'], ['Cơ cấu: Dọn phòng', '27%'], ['Cơ cấu: Bàn giao phòng', '15%']]);
      toast('Đã xuất báo cáo (CSV).');
    });
    render();
  }
});
