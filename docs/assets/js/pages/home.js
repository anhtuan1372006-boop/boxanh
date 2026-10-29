/* Home: quick quote forms hand their values to the estimate page */
document.addEventListener('DOMContentLoaded', () => {
  const go = form => {
    const f = new FormData(form);
    const prefill = { from: (f.get('from') || '').trim(), to: (f.get('to') || '').trim(), date: f.get('date') || '' };
    try { sessionStorage.setItem('bx_prefill', JSON.stringify(prefill)); } catch (e) { /* ignore */ }
    location.href = 'uoc-tinh-chi-phi.html';
  };
  ['#quick-form', '#est-mini'].forEach(sel => {
    const form = BX.$(sel);
    if (form) form.addEventListener('submit', e => { e.preventDefault(); go(form); });
  });
});
