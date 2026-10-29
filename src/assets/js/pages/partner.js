/* Cổng đối tác: tổng quan, giao nhận QR, lịch tuần, đơn được giao, hồ sơ, đối soát */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, icon, img, fmt, toast, confirm, dialog, closeModal, store, db, validate, param } = BX;
  const D = window.BX_DATA;
  const TODAY = new Date(2027, 0, 12); // the demo day used by every partner screen
  const jobs = () => db('pjobs', D.jobs);
  const saveJobs = v => store.set('pjobs', v);
  const STATUS = {
    'Chờ xác nhận': ['b-yellow', 'wait'], 'Đã nhận': ['b-green', 'ok'], 'Đang thực hiện': ['b-purple', 'doing'], 'Hoàn tất': ['b-gray', 'done'],
  };
  const badge = s => `<span class="badge ${STATUS[s][0]}"><span class="dot"></span>${s}</span>`;
  const download = (name, text, type = 'text/plain') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: type + ';charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  // other days of the demo week (12/01 comes from the editable job store)
  const WEEK_EXTRA = [
    { d: '2027-01-11', code: 'BX2027-0014', time: '08:00', service: 'Chuyển trọ', area: 'Quận Ba Đình', status: 'Hoàn tất', price: 620000 },
    { d: '2027-01-11', code: 'BX2027-0010', time: '14:00', service: 'Dọn phòng', area: 'Quận Cầu Giấy', status: 'Hoàn tất', price: 380000 },
    { d: '2027-01-13', code: 'BX2027-0024', time: '09:00', service: 'Chuyển trọ', area: 'Quận Đống Đa', status: 'Đã nhận', price: 590000 },
    { d: '2027-01-14', code: 'BX2027-0026', time: '08:30', service: 'Dọn phòng', area: 'Quận Cầu Giấy', status: 'Đã nhận', price: 360000 },
    { d: '2027-01-14', code: 'BX2027-0027', time: '15:00', service: 'Chuyển trọ', area: 'Quận Hà Đông', status: 'Chờ xác nhận', price: 710000 },
    { d: '2027-01-15', code: 'BX2027-0015', time: '08:00', service: 'Thu hồi hộp', area: 'Quận Cầu Giấy', status: 'Đã nhận', price: 80000 },
    { d: '2027-01-16', code: 'BX2027-0030', time: '07:30', service: 'Chuyển trọ', area: 'Quận Long Biên', status: 'Chờ xác nhận', price: 650000 },
    { d: '2027-01-16', code: 'BX2027-0031', time: '13:00', service: 'Bàn giao / FIX', area: 'Quận Thanh Xuân', status: 'Đã nhận', price: 300000 },
  ];
  const extraState = () => store.get('pextra', {});
  const allWeek = () => {
    const st = extraState();
    return jobs().map(j => ({ d: '2027-01-12', code: j.code, time: j.time, service: j.service, area: j.from.split(',').slice(-2, -1)[0].trim(), status: j.status, price: j.price, main: true }))
      .concat(WEEK_EXTRA.map(j => ({ ...j, status: st[j.code + j.d] || j.status })));
  };
  const extraDialog = j => dialog(`<div class="modal-ic green">${icon('clipboard-list')}</div><h2>${j.code} · ${j.service}</h2>
    <p class="modal-text">${fmt.weekday(fmt.fromIso(j.d))}, ${fmt.date(fmt.fromIso(j.d))} · ${j.time} · ${j.area}</p>
    <div class="row wrap mt-16">${badge(j.status)}<span class="badge b-gray">Giá thống nhất: ${fmt.vnd(j.price)}</span></div>
    <p class="hint mt-16">Chi tiết địa chỉ và liên hệ khách được mở 24 giờ trước giờ làm việc.</p>`);

  /* ---------- tổng quan ---------- */
  if ($('#job-list')) {
    let offset = 0;
    let selected = param('ma') && jobs().some(j => j.code === param('ma')) ? param('ma') : jobs()[0].code;
    const ho = code => store.get('handover_' + code, {});

    const renderKpis = () => {
      const list = offset === 0 ? jobs() : [];
      const n = s => list.filter(j => j.status === s).length;
      $('#pt-kpis').innerHTML = [
        ['calendar-days', 'Hôm nay', list.length, ''],
        ['play', 'Đang thực hiện', n('Đang thực hiện'), 'yellow'],
        ['clock', 'Chờ xác nhận', n('Chờ xác nhận'), 'peach'],
      ].map(([ic, t, v, tone]) => `<div class="kpi ${tone}"><span class="kpi-ic">${icon(ic)}</span><span><span class="kpi-label">${t}</span><span class="kpi-num" style="display:block">${v} <small>việc</small></span></span></div>`).join('');
    };
    const renderList = () => {
      const d = new Date(TODAY); d.setDate(d.getDate() + offset);
      const label = `${fmt.weekday(d)}, ${fmt.date(d)}`;
      $('#pt-date').textContent = label;
      $('#sch-sub').textContent = label;
      $('#sch-title').textContent = offset === 0 ? 'Lịch công việc hôm nay' : 'Lịch công việc';
      if (offset !== 0) {
        const others = allWeek().filter(j => j.d === fmt.iso(d));
        $('#job-list').innerHTML = others.length
          ? others.map(j => `<article class="job ${STATUS[j.status][1] === 'wait' ? '' : 'green'}" role="button" tabindex="0" data-extra="${j.code}|${j.d}"><div><div class="job-time"><b>${j.time}</b>${badge(j.status)}</div><h3>${j.service} · ${j.code}</h3><p class="addr">${icon('map-pin')} ${j.area}, Hà Nội</p></div><div class="job-img"><img src="${img('job-chuyen-tro')}" alt=""></div></article>`).join('')
          : `<div class="empty">${icon('calendar')}<p>Không có công việc trong ngày này.</p><a class="link" href="lich-cong-viec.html">Xem lịch cả tuần ${icon('arrow-right')}</a></div>`;
        $('#job-detail').innerHTML = `<div class="empty">${icon('clipboard-list')}<p>Chọn ngày ${fmt.date(TODAY)} để xem chi tiết công việc đang được phân công.</p><button class="btn btn-light btn-sm mt-12" type="button" data-today>Về hôm nay</button></div>`;
        renderKpis();
        return;
      }
      $('#job-list').innerHTML = jobs().map(j => `
        <article class="job ${j.tone}${j.code === selected ? ' is-active' : ''}" role="button" tabindex="0" data-job="${j.code}" aria-pressed="${j.code === selected}">
          <div>
            <div class="job-time"><b>${j.time}</b>${badge(j.status)}</div>
            <h3>${j.service} · ${j.code}</h3>
            <p class="addr">${icon('map-pin')} ${esc(j.from)}</p>
            ${j.to ? `<p class="addr">${icon('arrow-right')} ${esc(j.to)}</p>` : ''}
            <div class="team"><span class="avatars"><img class="avatar" src="${img('avatar-minh')}" alt=""><img class="avatar" src="${img('avatar-cskh')}" alt=""></span>${j.team}</div>
          </div>
          <div class="job-img"><img src="${img(j.img)}" alt=""></div>
        </article>`).join('');
      renderKpis();
      renderDetail();
    };
    const renderDetail = () => {
      const j = jobs().find(x => x.code === selected);
      const h = ho(j.code);
      const steps = [['Quét QR nhận hộp', h.scanned], ['Chụp seal lúc nhận', h.photo], ['Giao đúng điểm', h.done], ['Đối chiếu seal khi giao', h.done], ['Khách xác nhận', h.done]];
      const primary = {
        'Chờ xác nhận': `<button class="btn btn-primary btn-lg" type="button" data-act="accept">${icon('check')} Nhận việc ${icon('arrow-right')}</button>`,
        'Đã nhận': `<button class="btn btn-primary btn-lg" type="button" data-act="start">${icon('play')} Bắt đầu thực hiện</button>`,
        'Đang thực hiện': `<a class="btn btn-primary btn-lg" href="giao-nhan.html?ma=${j.code}">${icon('scan-qr')} Tiếp tục giao nhận</a>`,
        'Hoàn tất': `<span class="btn btn-soft btn-lg is-disabled">${icon('check-circle')} Đã hoàn tất</span>`,
      }[j.status];
      $('#job-detail').innerHTML = `
        <div class="card-hd"><h2 class="card-title">${j.code} · ${j.service}</h2><div class="row">${badge(j.status)}<span class="tag-demo">Dữ liệu minh họa</span></div></div>
        <div class="grid g-2 gap-sm">
          <div class="card card-sm row row-top">${icon('map-pin', 'ic-lg green')}<div><b class="small">${j.to ? 'Điểm lấy đồ' : 'Địa chỉ'}</b><p class="small muted mt-4">${esc(j.from)}</p></div></div>
          ${j.to ? `<div class="card card-sm row row-top">${icon('map-pin', 'ic-lg red')}<div><b class="small">Điểm đến</b><p class="small muted mt-4">${esc(j.to)}</p></div></div>` : `<div class="card card-sm row row-top">${icon('clock', 'ic-lg green')}<div><b class="small">Khung giờ</b><p class="small muted mt-4">${j.time} · ${fmt.date(TODAY)}</p></div></div>`}
        </div>
        <div class="grid g-2 mt-16" style="align-items:start">
          <div><p class="small strong">Nguồn lực được phân công</p><div class="row wrap mt-8"><span class="res">${icon('truck')} ${j.res.car} xe</span><span class="res">${icon('user')} ${j.res.people} người</span><span class="res">${icon('box')} ${j.res.boxes} hộp</span></div></div>
          <div><p class="small strong">Hạng mục công việc đã thống nhất</p><button class="file-chip mt-8 w-full" type="button" data-act="doc" style="text-align:left"><span class="fc-ic" style="background:var(--r100);color:var(--r600)">${icon('file-text')}</span><span class="grow"><b>${j.doc.replace('.pdf', '.txt')}</b><small>Phiếu công việc · ${fmt.vnd(j.price)}</small></span>${icon('download')}</button></div>
        </div>
        <div class="note mt-16"><span class="note-ic">${icon('info')}</span><div><b>Chỉ thực hiện phạm vi và mức giá đã thống nhất.</b><br><span class="xs">Mọi phát sinh cần có xác nhận của BOXANH và khách trước khi thực hiện.</span></div></div>
        <div class="grid g-2 mt-16">${primary}<button class="btn btn-light btn-lg" type="button" data-act="adjust">${icon('pencil')} Đề nghị điều chỉnh</button></div>
        <p class="small strong mt-20">Checklist thực hiện công việc</p>
        <div class="steps-scroll mt-12"><div class="steps sm keep" style="--n:5">${steps.map(([t, ok], i) => `<div class="step ${ok ? 'is-done' : i === steps.findIndex(s => !s[1]) ? 'is-current' : 'is-todo'}"><span class="step-dot">${ok ? icon('check') : i + 1}</span><div><b>${t}</b></div></div>`).join('')}</div></div>
        <div class="grid g-2 mt-16">
          <a class="btn btn-primary" href="giao-nhan.html?ma=${j.code}">${icon('scan-qr')} Mở công cụ giao nhận ${icon('arrow-right')}</a>
          <button class="btn btn-light" type="button" data-act="extra" style="color:var(--r600);border-color:#f2b8b8">${icon('alert-circle')} Báo phát sinh</button>
        </div>
        <p class="xs muted mt-8 right">Chờ BOXANH và khách xác nhận trước khi làm thêm.</p>`;
    };

    $('#job-list').addEventListener('click', e => {
      const b = e.target.closest('[data-job]');
      if (b) { selected = b.dataset.job; renderList(); if (matchMedia('(max-width: 1180px)').matches) $('#job-detail').scrollIntoView({ behavior: 'smooth' }); return; }
      const x = e.target.closest('[data-extra]');
      if (x) { const [code, d] = x.dataset.extra.split('|'); extraDialog(allWeek().find(j => j.code === code && j.d === d)); }
    });
    $('#job-list').addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-job], [data-extra]')) { e.preventDefault(); e.target.click(); }
    });
    $$('[data-open-job]').forEach(b => b.addEventListener('click', () => { offset = 0; selected = b.dataset.openJob; renderList(); $('#job-detail').scrollIntoView({ behavior: 'smooth' }); }));
    $$('[data-day]').forEach(b => b.addEventListener('click', () => { offset = Math.max(-1, Math.min(4, offset + +b.dataset.day)); renderList(); }));

    $('#job-detail').addEventListener('click', async e => {
      if (e.target.closest('[data-today]')) { offset = 0; renderList(); return; }
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const list = jobs();
      const j = list.find(x => x.code === selected);
      const act = b.dataset.act;
      if (act === 'accept') {
        const ok = await confirm({ title: `Nhận việc ${j.code}?`, text: `${j.service} lúc ${j.time} ${fmt.date(TODAY)} · Giá thống nhất ${fmt.vnd(j.price)}. Bạn cam kết đúng giờ và đúng phạm vi đã thống nhất.`, ok: 'Nhận việc', ic: 'check-circle' });
        if (!ok) return;
        j.status = 'Đã nhận'; saveJobs(list); renderList();
        toast(`Đã nhận việc ${j.code}. BOXANH đã thông báo cho khách hàng.`);
      } else if (act === 'start') {
        j.status = 'Đang thực hiện'; saveJobs(list); renderList();
        toast('Đã bắt đầu. Hãy mở công cụ giao nhận để quét QR từng hộp.', 'info');
      } else if (act === 'doc') {
        download(j.doc.replace('.pdf', '.txt'), `PHIẾU CÔNG VIỆC BOXANH (dữ liệu minh họa)\r\nMã đơn: ${j.code}\r\nDịch vụ: ${j.service}\r\nThời gian: ${j.time} ${fmt.date(TODAY)}\r\nĐịa chỉ: ${j.from}${j.to ? '\r\nĐiểm đến: ' + j.to : ''}\r\nNguồn lực: ${j.res.car} xe, ${j.res.people} người, ${j.res.boxes} hộp\r\nGiá thống nhất: ${fmt.vnd(j.price)}\r\nĐội thực hiện: ${j.team}\r\n\r\nLưu ý: Chỉ thực hiện phạm vi và mức giá đã thống nhất. Mọi phát sinh cần BOXANH và khách xác nhận trước.`);
        toast('Đã tải phiếu công việc.');
      } else if (act === 'adjust' || act === 'extra') {
        const isExtra = act === 'extra';
        const m = dialog(`<div class="modal-ic ${isExtra ? 'red' : ''}">${icon(isExtra ? 'alert-circle' : 'pencil')}</div><h2>${isExtra ? 'Báo phát sinh' : 'Đề nghị điều chỉnh'} · ${j.code}</h2>
          <p class="modal-text">${isExtra ? 'Mô tả hạng mục phát sinh và chi phí đề xuất. Chỉ làm khi BOXANH và khách đã xác nhận.' : 'Đề nghị thay đổi giờ, nguồn lực hoặc phạm vi công việc.'}</p>
          <form id="pt-req" novalidate>
            <div class="field mt-16"><label class="label" for="pr-what">${isExtra ? 'Hạng mục phát sinh' : 'Nội dung điều chỉnh'} <span class="req">*</span></label><textarea class="textarea" id="pr-what" required minlength="10" maxlength="300" placeholder="${isExtra ? 'Ví dụ: Tủ quần áo lớn cần tháo rời để đưa qua cầu thang hẹp.' : 'Ví dụ: Đề nghị dời sang 08:30 do xe đang ở đơn trước.'}"></textarea></div>
            ${isExtra ? '<div class="field mt-12"><label class="label" for="pr-cost">Chi phí đề xuất (đ)</label><input class="input" id="pr-cost" inputmode="numeric" placeholder="Ví dụ: 100.000"></div>' : ''}
            <div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">${icon('send')} Gửi BOXANH</button></div>
          </form>`);
        $('[data-x]', m).addEventListener('click', () => closeModal(m));
        $('#pt-req', m).addEventListener('submit', ev => {
          ev.preventDefault();
          if (!validate(ev.target)) return;
          closeModal(m);
          toast(isExtra ? 'Đã gửi phát sinh. Chờ BOXANH và khách xác nhận trước khi thực hiện.' : 'Đã gửi đề nghị điều chỉnh cho điều phối viên.');
        });
      }
    });
    renderList();
  }

  /* ---------- giao nhận QR ---------- */
  if ($('#gn-tabs')) {
    const code = param('ma') && jobs().some(j => j.code === param('ma')) ? param('ma') : 'BX2027-0015';
    const job = jobs().find(j => j.code === code);
    const key = 'handover_' + code;
    const st = Object.assign({ step: 1, scanned: false, photo: false, photoSrc: '', photoTime: '', seal: 'ok', checks: [false, false, false, false], done: false, issueSent: false }, store.get(key, {}));
    const save = () => { const { photoSrc, ...rest } = st; store.set(key, { ...rest, photoSrc: photoSrc.startsWith('blob:') ? '' : photoSrc }); };
    const boxCode = 'BX-000128', sealCode = 'SL-004281';
    $$('[data-gn-code]').forEach(e => { e.textContent = code; });
    $$('[data-gn-svc]').forEach(e => { e.textContent = job.service; });
    $('#gn-order').href = 'index.html?ma=' + code;
    const now = () => `${fmt.date(TODAY)} ${fmt.time(new Date())}`;

    const goStep = n => {
      st.step = n; save();
      $$('#gn-tabs [data-step]').forEach(t => { const on = +t.dataset.step === n; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
      $$('.gn-step').forEach(p => { p.hidden = +p.dataset.panel !== n; });
      renderSide();
    };
    const renderSide = () => {
      const items = [
        ['Quét QR nhận hộp', st.scanned ? `Đã nhận diện ${boxCode}` : 'Chưa quét', st.scanned ? '' : 'gray'],
        ['Chụp ảnh seal lúc nhận', st.photo ? st.photoTime : 'Chưa chụp', st.photo ? '' : 'gray'],
        ['Đối chiếu &amp; khách ký', st.done ? 'Khách đã xác nhận' : `${st.checks.filter(Boolean).length}/4 mục`, st.done ? '' : 'gray'],
        [st.issueSent ? 'Đã báo bất thường' : 'Hoàn tất giao nhận', st.issueSent ? 'Chờ CSKH kiểm tra' : st.done ? 'Hoàn tất' : '—', st.issueSent ? 'red' : st.done ? '' : 'gray'],
      ];
      $('#gn-progress').innerHTML = items.map(([t, s, c]) => `<div class="${c}"><b>${t}</b><p>${s}</p></div>`).join('');
      const scanned = st.done ? 10 : st.scanned ? 1 : 0;
      $('#gn-bar').style.width = scanned * 10 + '%';
      $('#gn-bar-text').textContent = `Đã quét ${scanned}/10 hộp${st.scanned && !st.done ? ' · bản demo quét hộp đầu tiên' : ''}`;
    };
    const showScan = () => {
      $('#scan').classList.add('is-done');
      const r = $('#scan-result');
      r.hidden = false;
      r.innerHTML = `${icon('check-circle')}<div><b>Đã nhận diện ${boxCode}</b><br>Mã seal: ${sealCode} · Hộp 1/10 của đơn ${code}</div>`;
    };
    const showPhoto = () => {
      $('#seal-shot').hidden = !st.photo;
      if (st.photo) { $('#seal-img').src = st.photoSrc || img('seal-photo'); $('#seal-time').textContent = st.photoTime; }
    };

    $$('#gn-tabs [data-step]').forEach(t => t.addEventListener('click', () => goStep(+t.dataset.step)));
    $$('[data-goto-step]').forEach(b => b.addEventListener('click', () => { $$('input[name=seal]').forEach(r => { r.checked = r.value === 'bad'; }); st.seal = 'bad'; goStep(+b.dataset.gotoStep); }));

    $('#scan-btn').addEventListener('click', e => {
      const btn = e.currentTarget;
      btn.classList.add('is-loading'); btn.disabled = true;
      $('#scan').classList.remove('is-done');
      $('#scan').classList.add('is-scanning');
      setTimeout(() => {
        btn.classList.remove('is-loading'); btn.disabled = false;
        $('#scan').classList.remove('is-scanning');
        st.scanned = true; save(); showScan(); renderSide();
        toast(`Quét thành công ${boxCode}.`);
      }, 1500);
    });
    $('#manual-form').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#manual-code').value.trim().toUpperCase().replace(/\s/g, '');
      const m = v.match(/^BX-?(\d{6})$/);
      if (!m) { toast('Mã hộp có dạng BX-000128.', 'warn'); return; }
      const n = +m[1];
      if (n < 128 || n > 137) { toast(`Hộp BX-${m[1]} không thuộc đơn ${code}. Vui lòng kiểm tra lại.`, 'error'); return; }
      st.scanned = true; save(); showScan(); renderSide();
      toast(`Đã xác nhận thủ công BX-${m[1]}.`);
    });
    $$('input[name=seal]').forEach(r => r.addEventListener('change', () => { st.seal = r.value; save(); }));
    $('#seal-cam').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('Vui lòng chọn ảnh.', 'warn'); return; }
      st.photo = true; st.photoSrc = URL.createObjectURL(f); st.photoTime = now();
      save(); showPhoto(); renderSide();
      e.target.value = '';
      toast('Đã lưu ảnh seal.');
    });
    $('#seal-sample').addEventListener('click', () => { st.photo = true; st.photoSrc = img('seal-photo'); st.photoTime = now(); save(); showPhoto(); renderSide(); });
    $('#seal-del').addEventListener('click', () => { st.photo = false; st.photoSrc = ''; save(); showPhoto(); renderSide(); });
    $('#step1-next').addEventListener('click', () => {
      if (!st.scanned) { toast('Vui lòng quét mã QR của hộp trước.', 'warn'); return; }
      if (!st.photo) { toast('Vui lòng chụp ảnh seal (thấy rõ mã seal).', 'warn'); return; }
      goStep(st.seal === 'bad' ? 3 : 2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const checks = $$('#chk input');
    const syncChecks = () => {
      const n = checks.filter(c => c.checked).length;
      $('#chk-count').textContent = `Đã kiểm tra ${n}/4`;
      st.checks = checks.map(c => c.checked); save(); renderSide();
    };
    checks.forEach((c, i) => { c.checked = !!st.checks[i]; c.addEventListener('change', syncChecks); });
    syncChecks();
    $('#sig-clear').addEventListener('click', () => $('#sig').clear());
    $('#handover-btn').addEventListener('click', async () => {
      if (st.done) { toast('Đơn này đã được bàn giao xong.', 'info'); return; }
      if (checks.some(c => !c.checked)) { toast('Vui lòng hoàn thành đủ 4 mục kiểm tra cùng khách.', 'warn'); return; }
      if (!$('#sig').isSigned()) { toast('Vui lòng để khách hàng ký xác nhận.', 'warn'); return; }
      if (!$('#sig-name').value.trim()) { toast('Vui lòng nhập tên người nhận.', 'warn'); $('#sig-name').focus(); return; }
      const ok = await confirm({ title: 'Xác nhận bàn giao?', text: `Khách ${esc($('#sig-name').value.trim())} đã kiểm tra mã hộp, mã seal và ký nhận. Thao tác này không thể hoàn tác.`, ok: 'Xác nhận bàn giao', ic: 'check-circle' });
      if (!ok) return;
      st.done = true; save();
      $('#deliver-time').textContent = now();
      const list = jobs();
      const j = list.find(x => x.code === code);
      j.status = 'Hoàn tất'; saveJobs(list);
      renderSide();
      const m = dialog(`<div class="modal-ic green">${icon('check-circle')}</div><h2>Bàn giao thành công!</h2><p class="modal-text">Đơn ${code} đã hoàn tất. Biên bản giao nhận kèm ảnh seal và chữ ký đã được gửi cho khách hàng.</p><div class="modal-actions"><a class="btn btn-primary" href="index.html">Về tổng quan công việc</a></div>`);
      m.querySelector('a').focus();
    });

    const issue = $('#issue-form');
    const paintIssue = () => {
      if (!st.issueSent) return;
      $('#issue-state').className = 'badge b-orange';
      $('#issue-state').textContent = 'Chờ CSKH kiểm tra';
      $('#issue-steps').innerHTML = `<div class="step is-done"><span class="step-dot">${icon('check')}</span><div><b>Tiếp nhận</b></div></div><div class="step is-current"><span class="step-dot">2</span><div><b>Kiểm tra</b></div></div><div class="step is-todo"><span class="step-dot">3</span><div><b>Phản hồi</b></div></div>`;
    };
    paintIssue();
    issue.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(issue)) return;
      if (st.issueSent) { toast('Sự cố này đã được gửi CSKH.', 'info'); return; }
      const inc = db('incidents', D.incidents);
      const yc = BX.data.nextCode('YC-', inc);
      inc.unshift({ code: yc, type: issue.elements['type'].value, customer: 'Nguyễn Tuấn Anh', order: code, box: boxCode, created: now(), state: 'moi', step: 0, owner: 'Chưa phân công', from: 'Đối tác Nguyễn Văn Minh', desc: issue.elements['desc'].value.trim() });
      store.set('incidents', inc);
      st.issueSent = true; save(); paintIssue(); renderSide();
      toast(`Đã gửi CSKH (mã ${yc}). Không cắt seal cho đến khi có hướng dẫn.`);
    });
    $('#issue-save').addEventListener('click', () => { store.set('issueDraft_' + code, issue.elements['desc'].value); toast('Đã lưu ghi nhận nháp trên thiết bị.'); });

    if (st.scanned) showScan();
    if (!st.photoSrc && st.photo) st.photoSrc = img('seal-photo');
    showPhoto();
    if (st.seal === 'bad') $$('input[name=seal]').forEach(r => { r.checked = r.value === 'bad'; });
    goStep(st.step || 1);
  }

  /* ---------- lịch tuần ---------- */
  if ($('#week-grid')) {
    let week = 0;
    const render = () => {
      const start = new Date(2027, 0, 11 + week * 7);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      $('#week-label').textContent = `${fmt.date(start).slice(0, 5)} – ${fmt.date(end)}`;
      const list = allWeek();
      let html = '';
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        const day = list.filter(j => j.d === fmt.iso(d)).sort((a, b) => a.time.localeCompare(b.time));
        html += `<div class="week-col"><div class="week-hd${d.getTime() === TODAY.getTime() ? ' is-today' : ''}">${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]} ${fmt.date(d).slice(0, 5)}<small>${day.length} việc</small></div><div class="week-body">${day.length ? day.map(j => `<button class="wjob ${STATUS[j.status][1]}" type="button" data-w="${j.code}|${j.d}"><b>${j.time} · ${j.service}</b>${j.code}<br><span class="xs">${j.area}</span></button>`).join('') : '<p class="wempty">Chưa có lịch</p>'}</div></div>`;
      }
      $('#week-grid').innerHTML = html;
    };
    $$('[data-week]').forEach(b => b.addEventListener('click', () => { week = Math.max(-2, Math.min(2, week + +b.dataset.week)); render(); }));
    $('#week-grid').addEventListener('click', e => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      const [code, d] = b.dataset.w.split('|');
      const j = allWeek().find(x => x.code === code && x.d === d);
      if (j.main) location.href = 'index.html?ma=' + code;
      else extraDialog(j);
    });
    render();
  }

  /* ---------- đơn được giao ---------- */
  if ($('#assigned')) {
    let mode = 'all';
    const render = () => {
      const list = allWeek().filter(j => mode === 'all' || STATUS[j.status][1] === mode || (mode === 'doing' && ['Đã nhận', 'Đang thực hiện'].includes(j.status)));
      $('#assigned').innerHTML = list.length ? list.map(j => `<tr>
        <td class="num"><b>${j.code}</b></td><td>${j.service}</td><td class="num">${fmt.date(fmt.fromIso(j.d))}<span class="sub">${j.time}</span></td><td>${j.area}</td>
        <td class="small">${j.main ? (() => { const r = jobs().find(x => x.code === j.code).res; return `${r.car} xe · ${r.people} người · ${r.boxes} hộp`; })() : '—'}</td>
        <td>${badge(j.status)}</td>
        <td class="right"><div class="row" style="justify-content:flex-end">${j.status === 'Chờ xác nhận' ? `<button class="btn btn-primary btn-xs" type="button" data-accept="${j.code}|${j.d}">${icon('check')} Nhận việc</button>` : ''}<button class="btn btn-light btn-xs" type="button" data-view="${j.code}|${j.d}">Chi tiết</button></div></td></tr>`).join('')
        : `<tr><td colspan="7" class="empty">${icon('inbox')}Không có đơn trong mục này.</td></tr>`;
    };
    $('#jobs-filter').addEventListener('segchange', e => { mode = e.detail; render(); });
    $('#assigned').addEventListener('click', async e => {
      const a = e.target.closest('[data-accept]');
      const v = e.target.closest('[data-view]');
      if (v) {
        const [code, d] = v.dataset.view.split('|');
        const j = allWeek().find(x => x.code === code && x.d === d);
        if (j.main) location.href = 'index.html?ma=' + code; else extraDialog(j);
      }
      if (a) {
        const [code, d] = a.dataset.accept.split('|');
        const ok = await confirm({ title: `Nhận việc ${code}?`, text: 'Bạn cam kết thực hiện đúng giờ và đúng phạm vi đã thống nhất.', ok: 'Nhận việc', ic: 'check-circle' });
        if (!ok) return;
        if (d === '2027-01-12') { const list = jobs(); list.find(x => x.code === code).status = 'Đã nhận'; saveJobs(list); }
        else { const s = extraState(); s[code + d] = 'Đã nhận'; store.set('pextra', s); }
        render();
        toast(`Đã nhận việc ${code}.`);
      }
    });
    render();
  }

  /* ---------- hồ sơ ---------- */
  if ($('#pt-scores')) {
    const s = [['clock', 'Đúng giờ', 4.5], ['tag', 'Mức giá', 4.0], ['shield', 'Bảo quản đồ', 4.5], ['smile', 'Thái độ', 5.0], ['message', 'Giao tiếp', 4.0], ['file-check', 'Đúng giá đã thống nhất', 4.5]];
    $('#pt-scores').innerHTML = s.map(([ic, t, v]) => `<div class="score-row" style="grid-template-columns:26px minmax(90px,1fr) minmax(80px,1.2fr) 56px">${icon(ic)}<span class="label-txt">${t}</span><span class="bar"><i style="width:${v * 20}%"></i></span><b class="num">${v.toFixed(1).replace('.', ',')}</b></div>`).join('');
    $('#edit-profile').addEventListener('click', () => {
      const m = dialog(`<div class="modal-ic green">${icon('pencil')}</div><h2>Cập nhật hồ sơ đối tác</h2><p class="modal-text">Thay đổi năng lực, phương tiện hoặc bảng giá cần BOXANH duyệt lại trước khi áp dụng.</p>
        <form id="pf-req" novalidate><div class="field mt-16"><label class="label" for="pf-what">Nội dung cần cập nhật <span class="req">*</span></label><textarea class="textarea" id="pf-what" required minlength="10" maxlength="300" placeholder="Ví dụ: Bổ sung 1 xe tải 2 tấn, biển số 29H-678.90."></textarea></div>
        <div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">${icon('send')} Gửi yêu cầu</button></div></form>`);
      $('[data-x]', m).addEventListener('click', () => closeModal(m));
      $('#pf-req', m).addEventListener('submit', ev => { ev.preventDefault(); if (!validate(ev.target)) return; closeModal(m); toast('Đã gửi yêu cầu cập nhật hồ sơ. BOXANH sẽ duyệt trong 1 ngày làm việc.'); });
    });
  }

  /* ---------- đối soát ---------- */
  if ($('#rec-rows')) {
    const PERIODS = {
      '2027-01': { rows: [['BX2027-0004', '06/01/2027', 'Bàn giao / FIX', 350000, 120000], ['BX2027-0006', '08/01/2027', 'Chuyển trọ', 600000, 70000], ['BX2027-0008', '09/01/2027', 'Chuyển trọ', 560000, 0], ['BX2027-0010', '11/01/2027', 'Dọn phòng', 380000, 0], ['BX2027-0014', '11/01/2027', 'Chuyển trọ', 620000, 50000]], state: 'Chờ đối soát' },
      '2026-12': { rows: [['BX2026-0281', '17/12/2026', 'Chuyển trọ', 540000, 0], ['BX2026-0286', '20/12/2026', 'Dọn phòng', 350000, 40000], ['BX2026-0290', '23/12/2026', 'Chuyển trọ', 680000, 100000], ['BX2026-0295', '28/12/2026', 'Bàn giao / FIX', 300000, 0]], state: 'Đã thanh toán' },
    };
    const confirmed = store.get('recConfirmed', {});
    const rowsOf = p => {
      const rows = PERIODS[p].rows.slice();
      if (p === '2027-01') jobs().filter(j => j.status === 'Hoàn tất').forEach(j => rows.push([j.code, '12/01/2027', j.service, j.price, 0]));
      return rows;
    };
    const render = () => {
      const p = $('#period').value;
      const rows = rowsOf(p);
      const sum = i => rows.reduce((s, r) => s + r[i], 0);
      const state = confirmed[p] ? 'Đã xác nhận' : PERIODS[p].state;
      $('#rec-kpis').innerHTML = [['clipboard-check', 'Số đơn', rows.length, ''], ['tag', 'Giá thống nhất', fmt.vnd(sum(3)), 'blue'], ['plus', 'Phát sinh đã duyệt', fmt.vnd(sum(4)), 'yellow'], ['wallet', 'Thực nhận', fmt.vnd(sum(3) + sum(4)), '']]
        .map(([ic, t, v, tone]) => `<div class="kpi ${tone}"><span class="kpi-ic">${icon(ic)}</span><span><span class="kpi-label">${t}</span><span class="kpi-num" style="display:block;font-size:22px">${v}</span></span></div>`).join('');
      $('#rec-rows').innerHTML = rows.map(r => `<tr><td class="num"><b>${r[0]}</b></td><td class="num">${r[1]}</td><td>${r[2]}</td><td class="num">${fmt.vnd(r[3])}</td><td class="num">${r[4] ? fmt.vnd(r[4]) : '—'}</td><td class="num"><b>${fmt.vnd(r[3] + r[4])}</b></td></tr>`).join('') +
        `<tr><td colspan="3"><b>Tổng cộng</b></td><td class="num"><b>${fmt.vnd(sum(3))}</b></td><td class="num"><b>${fmt.vnd(sum(4))}</b></td><td class="num"><b>${fmt.vnd(sum(3) + sum(4))}</b></td></tr>`;
      const st = $('#rec-state');
      st.className = 'badge ' + (state === 'Chờ đối soát' ? 'b-yellow' : 'b-green');
      st.textContent = state;
      const btn = $('#rec-confirm');
      btn.disabled = state !== 'Chờ đối soát';
      btn.innerHTML = state === 'Chờ đối soát' ? `${icon('check-circle')} Xác nhận đối soát` : `${icon('check')} ${state}`;
    };
    $('#period').addEventListener('change', render);
    $('#rec-confirm').addEventListener('click', async () => {
      const p = $('#period').value;
      const ok = await confirm({ title: 'Xác nhận số liệu đối soát?', text: 'Bạn đồng ý với danh sách đơn và số tiền thực nhận của kỳ này. BOXANH thanh toán trong 3 ngày làm việc.', ok: 'Xác nhận', ic: 'check-circle' });
      if (!ok) return;
      confirmed[p] = true; store.set('recConfirmed', confirmed); render();
      toast('Đã xác nhận đối soát. Thanh toán dự kiến trong 3 ngày làm việc.');
    });
    $('#export-csv').addEventListener('click', () => {
      const p = $('#period').value;
      const rows = [['Mã đơn', 'Ngày', 'Dịch vụ', 'Giá thống nhất', 'Phát sinh đã duyệt', 'Thực nhận']].concat(rowsOf(p).map(r => [r[0], r[1], r[2], r[3], r[4], r[3] + r[4]]));
      download(`BOXANH-doi-soat-${p}.csv`, rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n'), 'text/csv');
      toast('Đã tải bảng đối soát.');
    });
    render();
  }
});
