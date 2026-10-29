/* Đăng nhập / đăng ký bằng số điện thoại + OTP (demo: mã hiển thị trên màn hình) */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, store, validate, setError, clearError, toast, login, user, param } = BX;

  // only allow redirects to our own pages
  const nextRaw = param('next') || '';
  const next = /^[a-z0-9-]+\.html([?#][^\s]*)?$/i.test(nextRaw) ? nextRaw : 'tai-khoan.html';
  if (user()) { location.replace(next); return; }
  if (param('next')) setTimeout(() => toast('Vui lòng đăng nhập để tiếp tục.', 'info'), 300);
  if (location.hash === '#dang-ky') { const t = $('[data-tabs]'); t.activate && t.activate('tab-register'); }

  const shortName = n => { const w = n.trim().split(/\s+/); return w.length > 2 ? w.slice(-2).join(' ') : w[w.length - 1]; };
  const digits = p => p.replace(/\D/g, '').replace(/^84/, '0');

  $$('form[data-mode]').forEach(form => {
    const wrap = $('.otp-wrap', form);
    const boxes = $$('.otp input', form);
    const resend = $('[data-resend]', form);
    const sendBtn = $('[data-send-otp]', form);
    let code = '';
    let timer = null;

    const startTimer = () => {
      let s = 60;
      resend.disabled = true;
      resend.innerHTML = 'Gửi lại mã (<span data-sec>60</span>s)';
      clearInterval(timer);
      timer = setInterval(() => {
        s--;
        const sec = $('[data-sec]', resend);
        if (sec) sec.textContent = s;
        if (s <= 0) { clearInterval(timer); resend.disabled = false; resend.textContent = 'Gửi lại mã'; }
      }, 1000);
    };
    const send = () => {
      code = String(Math.floor(100000 + Math.random() * 900000));
      $('[data-demo-code]', form).textContent = code;
      boxes.forEach(b => { b.value = ''; });
      startTimer();
    };

    sendBtn.addEventListener('click', () => {
      const needed = $$('input[name=phone], input[name=name]', form);
      let ok = true;
      needed.forEach(i => {
        clearError(i);
        const v = i.value.trim();
        if (!v) { setError(i, i.name === 'name' ? 'Vui lòng nhập họ tên.' : 'Vui lòng nhập số điện thoại.'); ok = false; }
        else if (i.name === 'phone' && !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(v.replace(/[\s.]/g, ''))) { setError(i, 'Số điện thoại chưa đúng (10 số, ví dụ 0987 654 321).'); ok = false; }
      });
      const email = $('input[name=email]', form);
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { setError(email, 'Email chưa đúng định dạng.'); ok = false; }
      if (!ok) { const bad = $('[aria-invalid=true]', form); if (bad) bad.focus(); return; }
      sendBtn.classList.add('is-loading');
      sendBtn.disabled = true;
      setTimeout(() => {
        sendBtn.classList.remove('is-loading');
        sendBtn.disabled = false;
        sendBtn.hidden = true;
        wrap.hidden = false;
        send();
        boxes[0].focus();
        toast('Đã gửi mã OTP. Mã có hiệu lực trong 5 phút.');
      }, 600);
    });
    resend.addEventListener('click', () => { send(); boxes[0].focus(); toast('Đã gửi lại mã OTP mới.'); });

    // editing the phone after requesting a code means starting over
    $('input[name=phone]', form).addEventListener('input', () => {
      if (!wrap.hidden) { wrap.hidden = true; sendBtn.hidden = false; clearInterval(timer); code = ''; }
    });

    boxes.forEach((b, i) => {
      b.addEventListener('input', () => {
        b.value = b.value.replace(/\D/g, '').slice(-1);
        clearError(boxes[0]);
        if (b.value && boxes[i + 1]) boxes[i + 1].focus();
        if (boxes.every(x => x.value)) form.requestSubmit();
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
        t.split('').forEach((c, j) => { if (boxes[j]) boxes[j].value = c; });
        (boxes[t.length] || boxes[5]).focus();
        if (t.length === 6) form.requestSubmit();
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (wrap.hidden) { sendBtn.click(); return; }
      const entered = boxes.map(b => b.value).join('');
      if (entered.length < 6) { setError(boxes[0], 'Vui lòng nhập đủ 6 số OTP.'); boxes.find(b => !b.value).focus(); return; }
      if (!validate(form)) return;
      if (entered !== code) {
        setError(boxes[0], 'Mã OTP không đúng. Vui lòng kiểm tra lại.');
        boxes.forEach(b => { b.value = ''; });
        boxes[0].focus();
        return;
      }
      const phone = digits($('input[name=phone]', form).value);
      const accounts = store.get('accounts', {});
      let name;
      if (form.dataset.mode === 'register') {
        name = $('input[name=name]', form).value.trim().replace(/\s+/g, ' ');
        accounts[phone] = { name, email: ($('input[name=email]', form).value || '').trim() };
        store.set('accounts', accounts);
      } else {
        name = (accounts[phone] && accounts[phone].name) || 'Nguyễn Tuấn Anh';
      }
      login({ name, short: shortName(name), phone, email: (accounts[phone] || {}).email || '' });
      store.set('flash', form.dataset.mode === 'register' ? `Chào mừng ${shortName(name)} đến với BOXANH!` : `Chào bạn, ${shortName(name)}! Đăng nhập thành công.`);
      location.href = next;
    });
  });
});
