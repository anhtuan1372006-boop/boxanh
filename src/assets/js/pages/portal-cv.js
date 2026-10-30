/* Cổng nội bộ & cổng đối tác (trang theo đúng thiết kế 11–17): hành động trên các nút của thiết kế */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, store, toast, dialog, closeModal, icon, esc, fmt, validate } = BX;
  const D = window.BX_DATA;
  const cv = $('.cv');
  const setVal = (id, v, design) => { const i = $('#' + id); if (!i) return; i.value = v === design ? '' : v; i.classList.toggle('has-v', v !== design); };
  const formDialog = (title, text, label, ph, done) => {
    const m = dialog(`<div class="modal-ic">${icon('pencil')}</div><h2>${title}</h2><p class="modal-text">${text}</p>
      <form novalidate><div class="field mt-16"><label class="label" for="pf-t">${label} <span class="req">*</span></label><textarea class="textarea" id="pf-t" required minlength="10" maxlength="300" placeholder="${ph}"></textarea></div>
      <div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">${icon('send')} Gửi</button></div></form>`);
    m.querySelector('[data-x]').addEventListener('click', () => closeModal(m));
    m.querySelector('form').addEventListener('submit', e => { e.preventDefault(); if (!validate(e.target)) return; closeModal(m); toast(done); });
  };

  // admin search box in the design's top bar
  const search = $('#adm-search');
  if (search) search.addEventListener('submit', e => {
    e.preventDefault();
    try { sessionStorage.setItem('bx_admin_q', $('#adm-q').value.trim()); } catch (er) { /* ignore */ }
    location.href = 'don-hang.html';
  });

  /* ---------- 11: đánh giá & phê duyệt đối tác ---------- */
  if (cv && cv.dataset.cv === 'nb-doi-tac') {
    const G = D.partnerGroups();
    const groupTable = key => {
      const g = G[key];
      return `<div class="table-wrap mt-16"><table class="table"><thead><tr><th>Tiêu chí</th>${g.partners.map(p => `<th>Đối tác ${p.key}<span class="sub">${esc(p.name)}</span></th>`).join('')}</tr></thead><tbody>
        ${g.rows.map(([k, v]) => `<tr><td><b>${k}</b></td>${v.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}
        <tr><td><b>Khu vực</b></td>${g.partners.map(p => `<td>${p.area}</td>`).join('')}</tr><tr><td><b>Năng lực</b></td>${g.partners.map(p => `<td>${p.cap}</td>`).join('')}</tr></tbody></table></div>`;
    };
    const avg = () => {
      const s = $$('.cv-opt.score[aria-checked="true"]').map(o => +o.dataset.value);
      return s.reduce((a, b) => a + b, 0) / s.length;
    };
    const bars = [392, 433, 475, 517, 560, 604];
    const designScores = [4.5, 4.0, 4.5, 5.0, 4.0, 4.5];
    document.addEventListener('optchange', e => {
      const i = +e.detail.group.slice(1);
      const v = +e.detail.value;
      setVal(`sc-v${i}`, `${v.toFixed(1).replace('.', ',')} / 5`, `${designScores[i].toFixed(1).replace('.', ',')} / 5`);
      let bar = $(`#bar-${i}`);
      if (!bar) {
        bar = document.createElement('span');
        bar.id = `bar-${i}`;
        bar.className = 'cv-barfix';
        bar.style.cssText = `--l:1144;--t:${bars[i] - 6};--bw:130;--bh:12`;
        bar.innerHTML = '<i></i>';
        cv.appendChild(bar);
      }
      bar.hidden = v === designScores[i];
      bar.firstChild.style.width = (v / 5 * 100) + '%';
      const a = avg();
      setVal('sc-total', `${a.toFixed(1).replace('.', ',')} / 5`, '4,5 / 5');
    });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const [act, arg] = b.dataset.act.split(':');
      if (act === 'group') {
        e.stopImmediatePropagation();
        dialog(`<div class="modal-ic green">${icon('users')}</div><h2>Bảng so sánh – ${G[arg].label}</h2><p class="modal-text">So sánh 2–3 đối tác mỗi nhóm · Chưa cam kết sản lượng hay thanh toán cố định.</p>${groupTable(arg)}`, 'xl');
      } else if (act === 'file') {
        e.stopImmediatePropagation();
        const p = G['van-chuyen'].partners[+arg];
        dialog(`<div class="modal-ic green">${icon('file-text')}</div><h2>${p.file}</h2><p class="modal-text">${esc(p.name)} · ${p.area} · ${p.cap} (bản xem trước minh họa)</p>
          <div class="table-wrap mt-16"><table class="table"><tbody>${G['van-chuyen'].rows.map(([k, v]) => `<tr><td>${k}</td><td><b>${v[+arg]}</b></td></tr>`).join('')}</tbody></table></div>`, 'lg');
      } else if (act === 'questions') {
        e.stopImmediatePropagation();
        dialog(`<div class="modal-ic green">${icon('list-checks')}</div><h2>Bộ câu hỏi chung</h2><p class="modal-text">Hỏi cùng một bộ câu hỏi cho mọi đối tác trong nhóm để so sánh công bằng.</p><ol class="stack mt-16" style="--gap:10px;list-style:decimal;padding-left:20px">
          <li>Cách tính giá chuyến, phụ phí tầng, phí chờ và ngoài giờ?</li><li>Năng lực tối đa mỗi ngày (số xe, số người)?</li><li>Quy trình bảo quản đồ dễ vỡ, đồ giá trị?</li><li>Cách xử lý khi đồ bị hư hỏng, thất lạc?</li><li>Thời gian phản hồi khi có đơn gấp?</li><li>Có xuất hóa đơn / chứng từ không?</li><li>Cam kết tuân thủ giá đã thống nhất và báo phát sinh trước?</li></ol>`, 'lg');
      } else if (act === 'save-review') {
        e.stopImmediatePropagation();
        store.set('reviewA', { scores: $$('.cv-opt.score[aria-checked="true"]').map(o => +o.dataset.value), note: $('#sc-note').value });
        toast(`Đã lưu đánh giá Đối tác A – An Phát Movers (${avg().toFixed(1).replace('.', ',')}/5).`);
      } else if (act === 'approve-file') {
        e.stopImmediatePropagation();
        dialog(`<div class="modal-ic green">${icon('file-check')}</div><h2>Hồ sơ phê duyệt · Đối tác A</h2><p class="modal-text">An Phát Movers · Nhóm Vận chuyển &amp; bốc xếp</p>
          <dl class="kv-rows mt-16"><div><dt>${icon('star')} Điểm tổng</dt><dd>${avg().toFixed(1).replace('.', ',')} / 5</dd></div><div><dt>${icon('clipboard-check')} Đơn thử hoàn thành</dt><dd>2 / 3</dd></div><div><dt>${icon('flag')} Giai đoạn</dt><dd>Thử nghiệm</dd></div></dl>
          <div class="note info mt-16">${icon('info')}<div>Đủ điều kiện khi điểm ≥ 4,0 và hoàn thành ít nhất 2 đơn thử. Sau đơn Thử 03 (18/01/2027), hồ sơ sẽ chuyển sang bước “Đủ điều kiện”.</div></div>`);
      }
    }, true);
  }

  /* ---------- 13: giao nhận QR & kiểm tra seal (3 bước) ---------- */
  if (cv && /^giao-nhan-/.test(cv.dataset.cv)) {
    const st = Object.assign({ scanned: false, photo: false, done: false, issue: false }, store.get('handoverCv', {}));
    const save = () => store.set('handoverCv', st);
    const step = cv.dataset.cv;
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'scan') {
        e.stopImmediatePropagation();
        toast('Đang quét mã QR…', 'info', 1200);
        setTimeout(() => { st.scanned = true; save(); toast('Đã nhận diện BX-000128 · Mã seal: SL-004281.'); }, 1200);
      } else if (act === 'resign') {
        e.stopImmediatePropagation();
        toast('Đã mở lại khung ký. Mời khách hàng ký xác nhận trên màn hình (bản demo giữ chữ ký mẫu).', 'info');
      } else if (act === 'handover') {
        e.stopImmediatePropagation();
        const unchecked = $$('.cv-chk').filter(c => c.getAttribute('aria-checked') !== 'true');
        if (unchecked.length) { toast(`Vui lòng kiểm tra đủ 4 mục cùng khách (còn ${unchecked.length} mục).`, 'warn'); unchecked[0].focus(); return; }
        BX.confirm({ title: 'Xác nhận bàn giao?', text: 'Khách Trần Anh đã kiểm tra mã hộp BX-000128, mã seal SL-004281 và ký nhận lúc 12/01/2027 10:42.', ok: 'Xác nhận bàn giao', ic: 'check-circle' })
          .then(ok => { if (!ok) return; st.done = true; save(); dialog(`<div class="modal-ic green">${icon('check-circle')}</div><h2>Bàn giao thành công!</h2><p class="modal-text">Đơn BX2027-0015 đã hoàn tất. Biên bản giao nhận kèm ảnh seal và chữ ký đã được gửi cho khách hàng.</p><div class="modal-actions"><a class="btn btn-primary" href="index.html">Về công việc hôm nay</a></div>`); });
      } else if (act === 'save-issue') {
        e.stopImmediatePropagation();
        store.set('issueDraft', $('#is-desc').value || 'Phát hiện seal có dấu hiệu rách ở mép.');
        toast('Đã lưu ghi nhận trên thiết bị.');
      }
    }, true);
    // step 1: once the box is scanned and the seal photographed, offer the next step
    document.addEventListener('change', e => {
      if (step !== 'giao-nhan-1' || !e.target.matches('.cv-file input') || !e.target.files.length) return;
      st.photo = true; save();
      const bad = $('.cv-tog[data-value="bad"]').getAttribute('aria-checked') === 'true';
      setTimeout(() => dialog(`<div class="modal-ic green">${icon('check-circle')}</div><h2>Đã lưu ảnh seal lúc nhận</h2><p class="modal-text">${bad ? 'Seal được đánh dấu bất thường – hãy ghi nhận và gửi CSKH trước khi tiếp tục.' : 'Hộp BX-000128 đã sẵn sàng vận chuyển. Khi đến nơi, mở bước Bàn giao tại điểm đến.'}</p><div class="modal-actions"><a class="btn btn-primary" href="${bad ? 'giao-nhan-3.html' : 'giao-nhan-2.html'}">${bad ? 'Ghi nhận bất thường' : 'Tiếp tục bàn giao'} ${icon('arrow-right')}</a></div>`), 400);
    });
    const issue = $('#issue-form');
    if (issue) issue.addEventListener('submit', e => {
      e.preventDefault();
      const inc = BX.db('incidents', D.incidents);
      if (!st.issue) {
        const code = BX.data.nextCode('YC-', inc);
        inc.unshift({ code, type: $('#is-type').value || 'Seal bất thường', customer: 'Nguyễn Tuấn Anh', order: 'BX2027-0015', box: 'BX-000128', created: `12/01/2027 ${fmt.time(new Date())}`, state: 'moi', step: 0, owner: 'Chưa phân công', from: 'Đối tác Nguyễn Minh', desc: $('#is-desc').value || 'Phát hiện seal có dấu hiệu rách ở mép.' });
        store.set('incidents', inc);
        st.issue = code; save();
      }
      toast(`Đã gửi CSKH (mã ${st.issue}). Không cắt seal cho đến khi có hướng dẫn.`);
    });
  }

  /* ---------- 14: điều phối vận hành ---------- */
  if (cv && cv.dataset.cv === 'dieu-phoi') {
    let selected = 'BX2027-0015';
    const dq = $('#dp-search');
    if (dq) dq.addEventListener('submit', e => {
      e.preventDefault();
      try { sessionStorage.setItem('bx_admin_q', $('#dp-q').value.trim()); } catch (er) { /* ignore */ }
      location.href = 'don-hang.html';
    });
    document.addEventListener('change', e => {
      const t = e.target.closest('.cv-tog[data-group="order"]');
      if (!t || t.getAttribute('aria-checked') !== 'true') return;
      selected = t.dataset.value;
      setVal('dp-title', `Phân công ${selected}`, 'Phân công BX2027-0015');
      if (selected !== 'BX2027-0015') toast(`Đang phân công đơn ${selected}. Chọn đối tác và nhóm bốc xếp bên phải.`, 'info');
    });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const [act, arg] = b.dataset.act.split(':');
      if (act === 'pick') {
        e.stopImmediatePropagation();
        const target = arg === 'Đội Bốc Xanh' ? $('#dp-group') : $('#dp-partner');
        target.value = arg === 'Đội Bốc Xanh' ? 'Nhóm 1 - Bốc Xanh' : arg;
        target.dispatchEvent(new Event('change', { bubbles: true }));
        toast(`Đã chọn ${arg}.`, 'info');
      } else if (act === 'assign') {
        e.stopImmediatePropagation();
        const p = $('#dp-partner').value, g = $('#dp-group').value, s = $('#dp-store').value || 'Kho Cầu Giấy';
        if (!p) { toast('Vui lòng chọn đối tác vận chuyển.', 'warn'); $('#dp-partner').focus(); return; }
        if (!g) { toast('Vui lòng chọn nhóm bốc xếp.', 'warn'); $('#dp-group').focus(); return; }
        BX.confirm({ title: `Gửi phân công ${selected}?`, text: `${p} + ${g} · Xuất hộp từ ${s}. Đối tác sẽ nhận thông báo để xác nhận nhận việc.`, ok: 'Gửi phân công', ic: 'send' })
          .then(ok => {
            if (!ok) return;
            const list = BX.db('aorders', D.adminOrders);
            const o = list.find(x => x.code === selected);
            if (o) { o.status = 'Đã phân công'; o.partner = p; o.group = g; o.store = s; store.set('aorders', list); }
            toast(`Đã gửi phân công ${selected}. Chờ ${p} xác nhận nhận việc.`);
          });
      }
    }, true);
  }

  /* ---------- 15: định giá ---------- */
  if (cv && cv.dataset.cv === 'dinh-gia') {
    const num = (id, d) => { const v = parseFloat(($('#' + id).value || '').replace(',', '.').replace(/[^\d.]/g, '')); return isNaN(v) ? d : v; };
    const sw = n => $(`.cv-sw[data-name="${n}"]`).getAttribute('aria-checked') === 'true';
    const vnd = n => Math.round(n).toLocaleString('vi-VN');
    let quote = 800000;
    const calc = () => {
      const km = num('pr-km', 5), cars = num('pr-cars', 1), people = num('pr-people', 2), boxes = num('pr-boxes', 10);
      const ot = /18:00/.test($('#pr-slot').value) ? 1.3 : 1;
      const move = sw('svcMove');
      const lift = ($('#pr-lift').value || 'Có') === 'Có';
      const fl = ($('#pr-floor').value || '2 → 3').match(/\d+/g) || [2, 3];
      const l = [
        move ? cars * (250000 + km * 30000) * ot : 0,
        move ? people * 75000 * ot : 0,
        move ? (lift ? 50000 : ((+fl[0] - 1) + (+(fl[1] || fl[0]) - 1)) * 30000) : 0,
        boxes * 5000,
      ];
      const extra = (sw('svcClean') ? 300000 : 0) + (sw('svcHand') ? 250000 : 0);
      const cost = l.reduce((s, v) => s + v, 0) + extra;
      quote = Math.ceil(cost * 1.23 / 50000) * 50000;
      ['400.000', '150.000', '50.000', '50.000'].forEach((d, i) => setVal(`pr-l${i}`, vnd(l[i]), d));
      setVal('pr-cost', `${vnd(cost)} đ`, '650.000 đ');
      setVal('pr-quote', `${vnd(quote)} đ`, '800.000 đ');
      setVal('pr-margin', `${vnd(quote - cost)} đ`, '150.000 đ');
    };
    cv.addEventListener('input', calc);
    cv.addEventListener('change', calc);
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'save-calc') { e.stopImmediatePropagation(); store.set('calc0015', { quote, at: Date.now() }); toast(`Đã lưu bản tính BX2027-0015 lúc ${fmt.time(new Date())}.`); }
      if (act === 'perf') {
        e.stopImmediatePropagation();
        dialog(`<div class="modal-ic green">${icon('bar-chart')}</div><h2>Hiệu suất đối tác (30 ngày)</h2>
          <div class="table-wrap mt-16"><table class="table"><thead><tr><th>Đối tác</th><th class="num">Đơn</th><th class="num">Đúng giờ</th><th class="num">Chênh dự toán</th><th class="num">Điểm</th></tr></thead><tbody>
          <tr><td>Đối tác A</td><td class="num">24</td><td class="num">96%</td><td class="num">-1,2%</td><td class="num">4,8</td></tr>
          <tr><td>Đối tác B</td><td class="num">31</td><td class="num">91%</td><td class="num">+0,8%</td><td class="num">4,6</td></tr>
          <tr><td>Đối tác C</td><td class="num">12</td><td class="num">88%</td><td class="num">+2,4%</td><td class="num">4,4</td></tr></tbody></table></div>`, 'lg');
      }
      if (act === 'send-quote') {
        e.stopImmediatePropagation();
        BX.confirm({ title: `Gửi báo giá ${vnd(quote)} đ cho khách?`, text: 'Đơn BX2027-0015. Khách hàng nhận thông báo và xác nhận báo giá trên tài khoản. Chi phí đối tác không hiển thị cho khách.', ok: 'Gửi báo giá', ic: 'send' })
          .then(ok => {
            if (!ok) return;
            const list = BX.data.orders();
            const o = list.find(x => x.code === 'BX2027-0015');
            if (o) {
              const a1 = Math.round(quote * 0.625 / 10000) * 10000, a2 = Math.round(quote * 0.25 / 10000) * 10000;
              o.quote.items = [['truck', 'Vận chuyển', a1], ['users', 'Bốc xếp', a2], ['stairs', 'Phụ phí tầng', quote - a1 - a2], ['clock', 'Phí chờ', 0], ['moon', 'Ngoài giờ', 0]];
              o.quote.confirmed = false; o.step = 2;
              o.quote.history.unshift([`12/01/2027 ${fmt.time(new Date())}`, `BOXANH gửi báo giá ${vnd(quote)} đ.`]);
              BX.data.saveOrders(list);
            }
            toast(`Đã gửi báo giá ${vnd(quote)} đ cho khách hàng (BX2027-0015).`);
          });
      }
    }, true);
  }

  /* ---------- 16: kho hộp ---------- */
  if (cv && cv.dataset.cv === 'kho-hop') {
    const boxes = BX.db('iboxes', D.internalBoxes);
    const ST = D.boxStatuses;
    const top = $('#kh-top');
    if (top) top.addEventListener('submit', e => {
      e.preventDefault();
      const q = $('#kh-q').value.trim().toUpperCase().replace(/^BX-?/, 'BX-');
      const b = boxes.find(x => x.code === q);
      if (b) showBox(b.code); else toast('Không tìm thấy hộp với mã này.', 'warn');
    });
    const showBox = code => {
      const b = boxes.find(x => x.code === code);
      if (!b) { toast(`Hộp ${code} chưa có dữ liệu chi tiết.`, 'info'); return; }
      dialog(`<div class="modal-ic green">${icon('qr-code')}</div><h2>${b.code}</h2><p class="modal-text"><span class="badge ${ST[b.status][1]}">${ST[b.status][0]}</span></p>
        <dl class="kv-rows mt-16"><div><dt>${icon('file-text')} Đơn hàng liên quan</dt><dd>${b.order || '—'}</dd></div><div><dt>${icon('map-pin')} Vị trí / bên giữ</dt><dd>${esc(b.where)}</dd></div><div><dt>${icon('shield-check')} Mã seal</dt><dd>${b.seal}</dd></div><div><dt>${icon('scan-qr')} Lần quét mới nhất</dt><dd>${b.scan}<br><span class="small muted">${esc(b.by)}</span></dd></div><div><dt>${icon('history')} Lần quét trước</dt><dd style="max-width:60%">${esc(b.prev)}</dd></div><div><dt>${icon('refresh')} Vòng sử dụng</dt><dd>${b.uses}</dd></div></dl>`, 'lg');
    };
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const [act, arg] = btn.dataset.act.split(':');
      const msgs = {
        'box-ready': 'Chưa thể chuyển BX-000128 sang “Sẵn sàng”: cần đạt đủ 5 mục kiểm tra (còn thiếu Nắp & khóa đã kiểm tra lại sau vệ sinh).',
        'box-fix': 'Đã chuyển BX-000128 sang Khu bảo trì.',
        'box-lost': 'Đã ghi nhận BX-000128 thất lạc. CSKH được thông báo để đối chiếu.',
        'box-recycle': 'Đã kết thúc vòng đời BX-000128 – chuyển cho đơn vị tái chế nhựa.',
      };
      if (act === 'box') { e.stopImmediatePropagation(); showBox(arg); }
      else if (act === 'stage') { e.stopImmediatePropagation(); const k = Object.keys(ST).find(x => ST[x][0] === arg); const n = k ? boxes.filter(b => b.status === k).length : 0; toast(`${arg}: ${n} hộp trong danh sách mẫu.`, 'info'); }
      else if (act === 'scan') { e.stopImmediatePropagation(); toast('Đang chờ máy quét… Nhập mã hộp vào ô tìm kiếm phía trên để mở nhanh.', 'info'); $('#kh-q').focus(); }
      else if (act === 'pickups') {
        e.stopImmediatePropagation();
        const p = store.get('pickup', null);
        const rows = [['13/01/2027', '08:00 – 10:00', 'BX2027-0014', 15], ['14/01/2027', '14:00 – 16:00', 'BX2027-0012', 8]];
        if (p) rows.unshift([fmt.date(fmt.fromIso(p.date)), p.slot, 'BX2027-0015', p.count || p.boxes.length]);
        dialog(`<div class="modal-ic green">${icon('calendar')}</div><h2>Lịch thu hồi sắp tới</h2><div class="table-wrap mt-16"><table class="table"><thead><tr><th>Ngày</th><th>Khung giờ</th><th>Đơn</th><th class="num">Số hộp</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td><td class="num">${r[3]}</td></tr>`).join('')}</tbody></table></div>`, 'lg');
      } else if (act === 'box-history') { e.stopImmediatePropagation(); showBox('BX-000128'); }
      else if (msgs[act]) {
        e.stopImmediatePropagation();
        if (act === 'box-ready') { toast(msgs[act], 'warn'); return; }
        BX.confirm({ title: btn.getAttribute('aria-label') + ' cho BX-000128?', text: 'Thao tác được ghi vào lịch sử hộp.', ok: 'Xác nhận', tone: act === 'box-fix' ? '' : 'red', ic: 'box' }).then(ok => { if (ok) toast(msgs[act]); });
      }
    }, true);
  }

  /* ---------- 17: hỗ trợ khách hàng & hồ sơ sự cố ---------- */
  if (cv && cv.dataset.cv === 'ho-tro') {
    const box = new URLSearchParams(location.search).get('hop');
    if (box && $(`#sp-box option[value="${box}"]`)) { $('#sp-box').value = box; $('#sp-box').dispatchEvent(new Event('change', { bubbles: true })); }
    document.addEventListener('click', e => {
      if (!e.target.closest('[data-act="ticket"]')) return;
      e.stopImmediatePropagation();
      dialog(`<div class="modal-ic">${icon('headset')}</div><h2>Yêu cầu YC-0028</h2><p class="modal-text">Không tìm thấy đồ · Đơn BX2027-0015 · Hộp BX-000128 · 12/01/2027</p>
        <div class="vtl mt-16"><div><time>12/01/2027 11:20</time><b>Tiếp nhận</b><p>CSKH đã nhận yêu cầu.</p></div><div class="warn"><time>Đang thực hiện</time><b>Thu thập dữ liệu</b><p>Đối chiếu dữ liệu quét QR, ảnh seal và ảnh bàn giao.</p></div><div class="gray"><b>Đối chiếu · Phản hồi · Hoàn tất</b><p>BOXANH phản hồi bạn trong 24 giờ.</p></div></div>`);
    }, true);
  }
  if (cv && cv.dataset.cv === 'su-co') {
    const top = $('#inc-top');
    if (top) top.addEventListener('submit', e => { e.preventDefault(); toast(`Không có kết quả khác cho “${esc($('#inc-q').value)}” trong dữ liệu minh họa. Đang mở YC-0028.`, 'info'); });
    const TPL = {
      'Yêu cầu bổ sung hình ảnh / trao đổi': 'BOXANH đã ghi nhận yêu cầu của bạn và đang đối chiếu thông tin. Chúng tôi sẽ sớm liên hệ lại khi có thêm kết quả. Bạn vui lòng gửi thêm hình ảnh khu vực đặt đồ để chúng tôi xác minh nhanh hơn.',
      'Đồ có trong hộp – hỗ trợ khách kiểm tra lại': 'BOXANH đã đối chiếu dữ liệu quét QR và ảnh giao nhận. Món đồ được ghi nhận nằm trong hộp tại thời điểm giao. Nhân viên sẽ liên hệ để hỗ trợ bạn kiểm tra lại.',
      'Xác nhận trách nhiệm – hỗ trợ bồi thường': 'BOXANH xin lỗi vì sự cố. Sau khi đối chiếu, chúng tôi xác nhận trách nhiệm và sẽ hỗ trợ bồi thường theo điều khoản dịch vụ.',
    };
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'qr') {
        e.stopImmediatePropagation();
        dialog(`<div class="modal-ic green">${icon('history')}</div><h2>Lịch sử quét QR – YC-0028</h2><div class="table-wrap mt-16"><table class="table"><thead><tr><th>Thời gian</th><th>Sự kiện</th><th>Mã</th></tr></thead><tbody>
          <tr><td>12/01/2027 08:15</td><td>Quét nhận hộp tại nhà khách</td><td>BX-000128</td></tr><tr><td>12/01/2027 08:18</td><td>Chụp seal thùng</td><td>SL-004281</td></tr><tr><td>12/01/2027 10:42</td><td>Quét giao hộp tại nhà mới</td><td>BX-000128</td></tr></tbody></table></div>`, 'lg');
      } else if (act === 'photos') {
        e.stopImmediatePropagation();
        dialog(`<h2>Seal &amp; ảnh – YC-0028</h2><p class="modal-text">Ảnh seal lúc 08:18 (SL-004281) và ảnh bàn giao tổng thể lúc 10:42.</p><div class="grid g-2 mt-16">${['evidence-seal', 'evidence-room', 'seal-recv', 'seal-deliver'].map(n => `<img src="${BX.img(n)}" alt="" style="border-radius:12px;width:100%">`).join('')}</div>`, 'lg');
      } else if (act === 'chat') {
        e.stopImmediatePropagation();
        dialog(`<div class="modal-ic green">${icon('message')}</div><h2>Trao đổi nội bộ</h2><div class="vtl mt-16"><div><time>12/01/2027 11:35 · CSKH Nguyễn Minh Anh</time><p>Đã gọi khách xác nhận mô tả đồ thất lạc: túi tote màu be, có sổ tay và tai nghe trắng.</p></div><div><time>12/01/2027 11:50 · Đối tác Nguyễn Minh</time><p>Đội giao nhận xác nhận túi tote để ngoài hộp, cạnh sofa lúc bàn giao.</p></div></div>`);
      } else if (act === 'inc-save') {
        e.stopImmediatePropagation();
        store.set('incNote0028', { note: $('#inc-note').value, plan: $('#inc-plan').value });
        toast('Đã lưu hồ sơ sự cố YC-0028.');
      } else if (act === 'inc-reply') {
        e.stopImmediatePropagation();
        const plan = $('#inc-plan').value || 'Yêu cầu bổ sung hình ảnh / trao đổi';
        const m = dialog(`<div class="modal-ic green">${icon('send')}</div><h2>Phản hồi khách hàng · YC-0028</h2><p class="modal-text">Gửi qua SMS và mục Hỗ trợ trên tài khoản khách.</p><form novalidate><div class="field mt-16"><label class="label" for="rep">Nội dung</label><textarea class="textarea" id="rep" required minlength="20" maxlength="600" style="min-height:140px">${TPL[plan]}</textarea></div><div class="modal-actions"><button class="btn btn-light" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit">${icon('send')} Gửi phản hồi</button></div></form>`, 'lg');
        m.querySelector('[data-x]').addEventListener('click', () => closeModal(m));
        m.querySelector('form').addEventListener('submit', ev => {
          ev.preventDefault();
          if (!validate(ev.target)) return;
          const t = BX.data.tickets(); const tk = t.find(x => x.code === 'YC-0028');
          if (tk) { tk.status = 'Đã phản hồi'; tk.text = m.querySelector('#rep').value.trim(); BX.data.saveTickets(t); }
          closeModal(m); toast('Đã gửi phản hồi cho khách hàng.');
        });
      }
    }, true);
  }

  /* ---------- 12: công việc của đối tác ---------- */
  if (cv && cv.dataset.cv === 'dt-cong-viec') {
    const jobs = D.jobs();
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const [act, arg] = b.dataset.act.split(':');
      if (act === 'job') {
        e.stopImmediatePropagation();
        const j = jobs.find(x => x.code === arg);
        dialog(`<div class="modal-ic green">${icon('clipboard-list')}</div><h2>${j.code} · ${j.service}</h2><p class="modal-text">${j.time} · Thứ Ba, 12/01/2027 · ${j.team}</p>
          <dl class="kv-rows mt-16"><div><dt>${icon('map-pin')} Địa chỉ</dt><dd style="max-width:60%">${esc(j.from)}</dd></div><div><dt>${icon('users')} Nguồn lực</dt><dd>${j.res.people} người</dd></div><div><dt>${icon('tag')} Giá thống nhất</dt><dd>${fmt.vnd(j.price)}</dd></div><div><dt>${icon('info')} Trạng thái</dt><dd>${j.status}</dd></div></dl>
          <div class="modal-actions"><a class="btn btn-primary" href="giao-nhan.html">${icon('scan-qr')} Mở công cụ giao nhận</a></div>`);
      } else if (act === 'doc') {
        e.stopImmediatePropagation();
        const j = jobs[0];
        const txt = `PHIẾU CÔNG VIỆC BOXANH (dữ liệu minh họa)\r\nMã đơn: ${j.code}\r\nDịch vụ: ${j.service}\r\nThời gian: ${j.time} 12/01/2027\r\nĐiểm lấy đồ: ${j.from}\r\nĐiểm đến: ${j.to}\r\nNguồn lực: 1 xe, 2 người, 10 hộp\r\nGiá thống nhất: ${fmt.vnd(j.price)}\r\nĐội thực hiện: ${j.team}\r\n\r\nChỉ thực hiện phạm vi và mức giá đã thống nhất. Mọi phát sinh cần BOXANH và khách xác nhận trước.`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/plain;charset=utf-8' }));
        a.download = 'BX2027-0015_KH_chuyen-tro.txt';
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        toast('Đã tải phiếu công việc BX2027-0015.');
      } else if (act === 'accept') {
        e.stopImmediatePropagation();
        BX.confirm({ title: 'Nhận việc BX2027-0015?', text: 'Chuyển trọ lúc 08:00 Thứ Ba, 12/01/2027 · 1 xe, 2 người, 10 hộp. Bạn cam kết đúng giờ và đúng phạm vi đã thống nhất.', ok: 'Nhận việc', ic: 'check-circle' })
          .then(ok => { if (ok) { store.set('jobAccepted', true); toast('Đã nhận việc BX2027-0015. BOXANH đã thông báo cho khách hàng.'); } });
      } else if (act === 'adjust') {
        e.stopImmediatePropagation();
        formDialog('Đề nghị điều chỉnh · BX2027-0015', 'Đề nghị thay đổi giờ, nguồn lực hoặc phạm vi công việc.', 'Nội dung điều chỉnh', 'Ví dụ: Đề nghị dời sang 08:30 do xe đang ở đơn trước.', 'Đã gửi đề nghị điều chỉnh cho điều phối viên.');
      } else if (act === 'extra') {
        e.stopImmediatePropagation();
        formDialog('Báo phát sinh · BX2027-0015', 'Mô tả hạng mục phát sinh và chi phí đề xuất. Chỉ làm khi BOXANH và khách đã xác nhận.', 'Hạng mục phát sinh', 'Ví dụ: Tủ quần áo lớn cần tháo rời để đưa qua cầu thang hẹp.', 'Đã gửi phát sinh. Chờ BOXANH và khách xác nhận trước khi thực hiện.');
      }
    }, true);
  }
});
