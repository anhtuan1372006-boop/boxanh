/* Ước tính chi phí: live price range + request submission */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, fmt, icon, validate, createOrder, user, toast, param } = BX;
  const form = $('#est-form');
  const r10 = n => Math.round(n / 10000) * 10000;

  // pseudo distance from the two addresses, so the same pair always gives the same km
  const guessKm = (a, b) => {
    let h = 0;
    for (const c of (a + '|' + b).toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return 3 + (h % 25) / 2; // 3 – 15 km
  };
  let kmTouched = false;

  function lines() {
    const f = new FormData(form);
    const svc = f.getAll('svc');
    const out = [];
    const km = Math.max(1, +f.get('km') || 5);
    const people = +f.get('people') || 1;
    const bulky = +f.get('bulky') || 0;
    const boxes = +f.get('boxes') || 0;
    if (svc.includes('chuyen-tro')) {
      const v = 180000 + km * 14000;
      out.push(['truck', 'Vận chuyển', v, v * 1.6]);
      const b = people * 85000 + bulky * 10000;
      out.push(['users', 'Bốc xếp', b, b * 1.5]);
      const floors = (f.get('fromLift') === '1' ? 0 : (+f.get('fromFloor') - 1)) + (f.get('toLift') === '1' ? 0 : (+f.get('toFloor') - 1));
      if (floors > 0) out.push(['stairs', 'Phụ phí tầng', floors * 30000, floors * 45000]);
    }
    if (boxes > 0 && (svc.includes('chuyen-tro') || svc.length === 0)) out.push(['box', `Hộp tái sử dụng (${boxes} hộp)`, boxes * 10000, boxes * 15000]);
    if (svc.includes('don-phong')) out.push(['sparkles', 'Dọn phòng', 300000, 500000]);
    if (svc.includes('ban-giao')) out.push(['key', 'Bàn giao phòng', 250000, 450000]);
    let extraLow = 0, extraHigh = 0;
    if (f.get('pack')) { extraLow += 50000; extraHigh += 80000; }
    if (f.get('assembly')) { extraLow += 60000; extraHigh += 100000; }
    if (extraLow) out.push(['settings', 'Dịch vụ thêm', extraLow, extraHigh]);
    if (f.get('time') === '18:00 – 21:00' && out.length) {
      const base = out.reduce((s, l) => s + l[2], 0);
      out.push(['moon', 'Phụ phí ngoài giờ (+15%)', base * 0.15, base * 0.2]);
    }
    return out.map(([ic, name, a, b]) => [ic, name, r10(a), r10(b)]);
  }

  function update() {
    const f = new FormData(form);
    const svc = f.getAll('svc');
    const moving = svc.includes('chuyen-tro');
    $$('[data-dest]').forEach(el => { el.hidden = !moving; });
    $('#from-label').textContent = moving ? 'Nơi đi' : 'Địa chỉ phòng';
    if (!kmTouched && f.get('from') && f.get('to')) $('#e-km').value = guessKm(f.get('from'), f.get('to'));
    $('#km-out').textContent = String(+$('#e-km').value || 0).replace('.', ',');

    const ls = lines();
    const low = ls.reduce((s, l) => s + l[2], 0);
    const high = ls.reduce((s, l) => s + l[3], 0);
    $('#est-total').textContent = svc.length ? fmt.range(low, high) : '—';
    $('#est-lines').innerHTML = svc.length
      ? ls.map(([ic, name, a, b]) => `<div><dt>${icon(ic)} ${name}</dt><dd>${fmt.range(a, b)}</dd></div>`).join('')
      : '<div><dt class="muted">Chọn dịch vụ để xem chi tiết</dt></div>';
    form.estimate = [low, high];

    // progress dots
    const addrOk = !!f.get('from') && (!moving || !!f.get('to'));
    const done = [svc.length > 0, addrOk && !!f.get('date'), svc.length > 0 && addrOk, !!form.done];
    const current = done.indexOf(false);
    $$('[data-st]').forEach((d, i) => {
      d.className = 'num-dot' + (done[i] ? '' : i === current ? ' yellow' : ' light');
    });
  }

  // prefill: service from ?dv=, addresses from the home page
  const dv = param('dv');
  const svcBox = $$('input[name=svc]').find(i => i.value === dv);
  (svcBox || $$('input[name=svc]')[0]).checked = true;
  try {
    const p = JSON.parse(sessionStorage.getItem('bx_prefill') || 'null');
    if (p) {
      if (p.from) form.elements.from.value = p.from;
      if (p.to) form.elements.to.value = p.to;
      if (p.date && p.date >= fmt.iso(new Date())) form.elements.date.value = p.date;
      sessionStorage.removeItem('bx_prefill');
    }
  } catch (e) { /* ignore */ }
  const u = user();
  if (u) { form.elements['name'].value = u.name; form.elements['phone'].value = u.phone || ''; }

  form.addEventListener('input', e => { if (e.target.id === 'e-km') kmTouched = true; update(); });
  form.addEventListener('change', update);

  $('#swap').addEventListener('click', () => {
    const el = form.elements;
    [el.from.value, el.to.value] = [el.to.value, el.from.value];
    [el.fromFloor.value, el.toFloor.value] = [el.toFloor.value, el.fromFloor.value];
    [el.fromLift.value, el.toLift.value] = [el.toLift.value, el.fromLift.value];
    update();
  });

  $('#sample').addEventListener('click', () => {
    const el = form.elements;
    $$('input[name=svc]').forEach(i => { i.checked = i.value === 'chuyen-tro'; });
    el.from.value = 'Số 12, ngõ 68 Phú Diễn, Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội';
    el.to.value = 'Số 210, đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội';
    el.fromFloor.value = '4'; el.fromLift.value = '0'; el.toFloor.value = '2'; el.toLift.value = '1';
    el.km.value = 5.2; kmTouched = true;
    el.boxes.value = 12; el.bulky.value = 3; el.people.value = 2;
    const d = new Date(); d.setDate(d.getDate() + 7);
    el.date.value = fmt.iso(d);
    el.pack.checked = true; el.assembly.checked = true;
    if (!el['name'].value) el['name'].value = 'Nguyễn Minh Anh';
    if (!el['phone'].value) el['phone'].value = '0987 654 321';
    $$('[aria-invalid]', form).forEach(BX.clearError);
    update();
    toast('Đã điền dữ liệu mẫu. Bạn có thể chỉnh sửa trước khi gửi.', 'info');
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(form)) return;
    const f = new FormData(form);
    const btn = $('button[type=submit]', form);
    btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      const svc = f.getAll('svc');
      const extras = [f.get('pack') && 'Hỗ trợ đóng gói', f.get('assembly') && 'Tháo lắp cơ bản', `${f.get('bulky')} đồ cồng kềnh`, `${f.get('people')} người hỗ trợ`].filter(Boolean);
      const order = createOrder({
        services: svc, from: f.get('from'), to: svc.includes('chuyen-tro') ? f.get('to') : '', date: f.get('date'), time: f.get('time'),
        floor: $('#e-from-floor').selectedOptions[0].textContent, note: extras.join(' · '), estimate: form.estimate,
        boxes: svc.includes('chuyen-tro') ? +f.get('boxes') : 0, name: f.get('name'), phone: f.get('phone'),
      });
      btn.classList.remove('is-loading'); btn.disabled = false;
      form.done = true;
      $('#contact-card').hidden = true;
      $('#done-card').hidden = false;
      $('#done-code').textContent = order.code;
      const track = `don-hang-chi-tiet.html?ma=${order.code}`;
      $('#done-track').href = user() ? track : 'dang-nhap.html?next=' + encodeURIComponent(track);
      $('#done-track').innerHTML = (user() ? 'Theo dõi yêu cầu ' : 'Đăng nhập để theo dõi ') + icon('arrow-right');
      update();
      $('#done-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(`Đã gửi yêu cầu ${order.code}. BOXANH sẽ liên hệ trong 2 giờ làm việc.`);
    }, 700);
  });

  $('#done-new').addEventListener('click', () => {
    form.done = false;
    form.reset();
    $$('[data-upload]', form).forEach(x => x.reset && x.reset());
    kmTouched = false;
    $$('input[name=svc]')[0].checked = true;
    if (u) { form.elements['name'].value = u.name; form.elements['phone'].value = u.phone || ''; }
    $('#contact-card').hidden = false;
    $('#done-card').hidden = true;
    update();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  update();
});
