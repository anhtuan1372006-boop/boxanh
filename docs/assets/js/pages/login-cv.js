/* Đăng nhập (trang theo đúng thiết kế): số điện thoại → mã OTP 6 số → vào tài khoản */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, store, toast, login, user, param } = BX;
  const nextRaw = param('next') || '';
  const next = /^[a-z0-9-]+\.html([?#][^\s]*)?$/i.test(nextRaw) ? nextRaw : 'tai-khoan.html';
  if (user()) { location.replace(next); return; }
  if (param('next')) setTimeout(() => toast('Vui lòng đăng nhập để tiếp tục.', 'info'), 300);

  const phone = $('#l-phone');
  const boxes = $$('.cv-in.otp');
  const agree = $('.cv-chk');
  let code = '', sentTo = '', left = 0, timer = null;
  const digits = v => v.replace(/\D/g, '').replace(/^84/, '0');

  const send = () => {
    const p = digits(phone.value);
    if (!/^0(3|5|7|8|9)\d{8}$/.test(p)) { toast('Số điện thoại chưa đúng (10 số, ví dụ 0987 654 321).', 'warn'); phone.focus(); return; }
    if (left > 0 && p === sentTo) { toast(`Vui lòng chờ ${left}s để gửi lại mã.`, 'info'); boxes[0].focus(); return; }
    code = String(Math.floor(100000 + Math.random() * 900000));
    sentTo = p;
    boxes.forEach(b => { b.value = ''; b.classList.remove('has-v'); });
    left = 60;
    clearInterval(timer);
    timer = setInterval(() => { left--; if (left <= 0) clearInterval(timer); }, 1000);
    toast(`Đã gửi mã OTP tới ${BX.prettyPhone(p)}. Bản demo không gửi SMS – mã của bạn: <b style="letter-spacing:.2em">${code}</b>`, 'success', 9000);
    boxes[0].focus();
  };
  $('#login-form').addEventListener('submit', e => { e.preventDefault(); send(); });
  $('#l-resend').addEventListener('click', e => {
    e.stopImmediatePropagation();
    if (!code) { send(); return; }
    if (left > 0) { toast(`Bạn có thể gửi lại mã sau ${left}s.`, 'info'); return; }
    send();
  }, true);
  phone.addEventListener('input', () => { if (sentTo && digits(phone.value) !== sentTo) { code = ''; sentTo = ''; } });

  const verify = () => {
    const entered = boxes.map(b => b.value).join('');
    if (entered.length < 6) return;
    if (!code) { toast('Vui lòng bấm “Nhận mã OTP” trước.', 'warn'); return; }
    if (agree.getAttribute('aria-checked') !== 'true') { toast('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.', 'warn'); return; }
    if (entered !== code) {
      toast('Mã OTP không đúng. Vui lòng kiểm tra lại.', 'error');
      boxes.forEach(b => { b.value = ''; b.classList.remove('has-v'); });
      boxes[0].focus();
      return;
    }
    const accounts = store.get('accounts', {});
    const name = (accounts[sentTo] && accounts[sentTo].name) || 'Tuấn Anh';
    const w = name.split(' ');
    login({ name, short: w.length > 2 ? w.slice(-2).join(' ') : w[w.length - 1], phone: sentTo, email: '' });
    store.set('flash', `Chào bạn, ${w[w.length - 1]}! Đăng nhập thành công.`);
    location.href = next;
  };
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      b.value = b.value.replace(/\D/g, '').slice(-1);
      b.classList.toggle('has-v', !!b.value);
      if (b.value && boxes[i + 1]) boxes[i + 1].focus();
      verify();
    });
    b.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !b.value && boxes[i - 1]) { boxes[i - 1].focus(); boxes[i - 1].value = ''; }
      if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
    });
    b.addEventListener('paste', e => {
      const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (!t) return;
      e.preventDefault();
      t.split('').forEach((c, j) => { if (boxes[j]) { boxes[j].value = c; boxes[j].classList.add('has-v'); } });
      (boxes[t.length] || boxes[5]).focus();
      verify();
    });
  });
  agree.addEventListener('change', verify);
});
