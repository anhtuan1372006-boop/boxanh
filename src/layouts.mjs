// Page shells. Every page body is wrapped by one of these layouts at build time.
// Placeholders {{root}} and {{icon:name}} are resolved by build.mjs afterwards.
import { renderCanvas, canvasMeta } from './canvas.mjs';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const LOGO_MARK = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.6 4.4 9.3v13.4L16 29.4l11.6-6.7V9.3z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M16 10.3 10.4 13.5v6.4L16 23.1l5.6-3.2v-6.4z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="m10.4 13.5 5.6 3.2 5.6-3.2M16 16.7v6.4" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/></svg>`;

const logo = (href, extra = '') =>
  `<a class="logo ${extra}" href="${href}" aria-label="BOXANH – về trang chủ">${LOGO_MARK}<span>BOXANH</span></a>`;

function head(m) {
  const title = m.title ? `${m.title} | BOXANH` : 'BOXANH – Chuyển trọ nhẹ tênh';
  const desc = m.description || 'BOXANH – một đầu mối cho chuyển trọ, dọn phòng và bàn giao phòng. Hộp tái sử dụng có QR và seal riêng, báo giá minh bạch.';
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">${m.notFound ? `
<script>/* 404 is served at any path: anchor relative URLs at the site root (project pages live under /repo/) */
(function(){var p=location.pathname.split('/'),b=/\\.github\\.io$/.test(location.hostname)&&p.length>2?'/'+p[1]+'/':'/';document.write('<base href="'+b+'">');})();</script>` : ''}
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0e4a37">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="{{root}}assets/img/hero-home.webp">
<link rel="icon" href="{{root}}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&amp;family=Patrick+Hand&amp;display=swap">
<link rel="stylesheet" href="{{root}}assets/css/style.css">${m.layout === 'canvas' ? `
<link rel="stylesheet" href="{{root}}assets/css/canvas.css">
<link rel="preload" as="image" href="{{root}}assets/canvas/${m.canvas[0]}.webp" media="(min-width: 900px)">${m.canvas[1] ? `
<link rel="preload" as="image" href="{{root}}assets/canvas/${m.canvas[1]}.webp" media="(max-width: 899px)">` : ''}` : ''}
<script>try{if(localStorage.getItem('bx_user'))document.documentElement.setAttribute('data-auth','in')}catch(e){}${m.auth ? `
if(!document.documentElement.hasAttribute('data-auth'))location.replace('{{root}}dang-nhap.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search+location.hash));` : ''}</script>
</head>`;
}

function scripts(m) {
  const page = (m.scripts || []).map(s => `<script src="{{root}}assets/js/pages/${s}.js"></script>`).join('\n');
  return `<div class="toasts" id="toasts" role="status" aria-live="polite"></div>${m.layout === 'canvas' ? `
<script src="{{root}}assets/js/canvas.js"></script>` : ''}
<script src="{{root}}assets/js/icons.js"></script>
<script src="{{root}}assets/js/data.js"></script>
<script src="{{root}}assets/js/app.js"></script>
${page}`;
}

/* ---------------- public site ---------------- */
const SERVICES = [
  ['chuyen-tro', 'chuyen-tro.html', 'truck', 'Chuyển trọ', 'Đóng gói · Vận chuyển · Bốc xếp'],
  ['don-phong', 'don-phong.html', 'sparkles', 'Dọn phòng', 'Vệ sinh phòng cũ và phòng mới'],
  ['ban-giao', 'ban-giao-phong.html', 'key', 'Bàn giao phòng', 'Kiểm tra · Sửa chữa · Biên bản'],
  ['uoc-tinh', 'uoc-tinh-chi-phi.html', 'receipt', 'Ước tính chi phí', 'Biết khoảng giá trong 1 phút'],
];

function siteHeader(m) {
  const a = m.active || '';
  const svcActive = ['chuyen-tro', 'don-phong', 'ban-giao'].includes(a);
  const link = (key, href, label) =>
    `<a class="hd-link${a === key ? ' is-active' : ''}" href="{{root}}${href}"${a === key ? ' aria-current="page"' : ''}>${label}</a>`;
  const ddItems = SERVICES.map(([k, href, ic, t, d]) =>
    `<a class="dd-item${a === k ? ' is-active' : ''}" href="{{root}}${href}"><span class="dd-ic">{{icon:${ic}}}</span><span><b>${t}</b><small>${d}</small></span></a>`).join('');
  return `<a class="skip" href="#main">Bỏ qua điều hướng</a>
<header class="site-hd">
  <div class="container hd-in">
    ${logo('{{root}}index.html')}
    <nav class="hd-nav" aria-label="Điều hướng chính">
      <div class="dd" data-dd>
        <button class="hd-link${svcActive ? ' is-active' : ''}" type="button" aria-expanded="false" aria-haspopup="true">Dịch vụ {{icon:chevron-down dd-chev}}</button>
        <div class="dd-menu">${ddItems}</div>
      </div>
      ${link('quy-trinh', 'index.html#quy-trinh', 'Quy trình')}
      ${link('hop', 'index.html#hop-tai-su-dung', 'Hộp tái sử dụng')}
      ${link('uoc-tinh', 'uoc-tinh-chi-phi.html', 'Bảng giá')}
      ${link('doi-tac', 'doi-tac.html', 'Đối tác')}
      ${link('ho-tro', 'ho-tro.html', 'Hỗ trợ')}
    </nav>
    <div class="hd-actions">
      <a class="hd-login when-out" href="{{root}}dang-nhap.html">{{icon:user}}<span>Đăng nhập</span></a>
      <a class="hd-icon when-in" href="{{root}}thong-bao.html" aria-label="Thông báo">{{icon:bell}}<span class="hd-dot" data-unread hidden></span></a>
      <div class="dd when-in" data-dd>
        <button class="hd-user" type="button" aria-expanded="false" aria-haspopup="true">
          <img class="avatar avatar-sm" src="{{root}}assets/img/avatar-tuan-anh.webp" alt="">
          <span data-user-short>Tài khoản</span>{{icon:chevron-down dd-chev}}
        </button>
        <div class="dd-menu dd-right">
          <div class="dd-head"><b data-user-name>Khách hàng</b><small data-user-phone></small></div>
          <a class="dd-item" href="{{root}}tai-khoan.html"><span class="dd-ic">{{icon:home}}</span><span><b>Tổng quan tài khoản</b></span></a>
          <a class="dd-item" href="{{root}}don-hang.html"><span class="dd-ic">{{icon:clipboard-list}}</span><span><b>Đơn hàng của tôi</b></span></a>
          <a class="dd-item" href="{{root}}hop-cua-toi.html"><span class="dd-ic">{{icon:box}}</span><span><b>Hộp của tôi</b></span></a>
          <a class="dd-item" href="{{root}}ho-so.html"><span class="dd-ic">{{icon:user}}</span><span><b>Thông tin cá nhân</b></span></a>
          <button class="dd-item" type="button" data-logout><span class="dd-ic">{{icon:logout}}</span><span><b>Đăng xuất</b></span></button>
        </div>
      </div>
      <a class="btn btn-yellow btn-sm hd-cta" href="{{root}}uoc-tinh-chi-phi.html">{{icon:file-text}}<span>Nhận báo giá</span>{{icon:arrow-right}}</a>
      <button class="hd-burger" type="button" data-drawer="site-drawer" aria-controls="site-drawer" aria-expanded="false" aria-label="Mở menu">{{icon:menu}}</button>
    </div>
  </div>
</header>
<div class="drawer" id="site-drawer" aria-hidden="true">
  <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="drawer-hd">${logo('{{root}}index.html')}<button class="icon-btn" type="button" data-drawer-close aria-label="Đóng menu">{{icon:x}}</button></div>
    <div class="drawer-user when-in"><img class="avatar" src="{{root}}assets/img/avatar-tuan-anh.webp" alt=""><div><b data-user-name>Khách hàng</b><small data-user-phone></small></div></div>
    <p class="drawer-label">Dịch vụ</p>
    ${SERVICES.map(([k, href, ic, t, d]) => `<a class="drawer-link${a === k ? ' is-active' : ''}" href="{{root}}${href}">{{icon:${ic}}}<span><b>${t}</b><small>${d}</small></span></a>`).join('')}
    <p class="drawer-label">Khám phá</p>
    <a class="drawer-link" href="{{root}}index.html#quy-trinh">{{icon:route}}<span><b>Quy trình</b></span></a>
    <a class="drawer-link" href="{{root}}index.html#hop-tai-su-dung">{{icon:recycle}}<span><b>Hộp tái sử dụng</b></span></a>
    <a class="drawer-link${a === 'doi-tac' ? ' is-active' : ''}" href="{{root}}doi-tac.html">{{icon:users}}<span><b>Trở thành đối tác</b></span></a>
    <a class="drawer-link${a === 'ho-tro' ? ' is-active' : ''}" href="{{root}}ho-tro.html">{{icon:headset}}<span><b>Hỗ trợ &amp; câu hỏi</b></span></a>
    <a class="drawer-link${a === 'gioi-thieu' ? ' is-active' : ''}" href="{{root}}gioi-thieu.html">{{icon:leaf}}<span><b>Về BOXANH</b></span></a>
    <div class="drawer-ft">
      <a class="btn btn-primary btn-block" href="{{root}}uoc-tinh-chi-phi.html">{{icon:file-text}} Nhận báo giá</a>
      <a class="btn btn-outline btn-block when-out" href="{{root}}dang-nhap.html">{{icon:user}} Đăng nhập / Đăng ký</a>
      <a class="btn btn-outline btn-block when-in" href="{{root}}tai-khoan.html">{{icon:user}} Tài khoản của tôi</a>
      <button class="btn btn-ghost btn-block when-in" type="button" data-logout>{{icon:logout}} Đăng xuất</button>
    </div>
  </div>
</div>`;
}

function siteFooter() {
  return `<footer class="site-ft">
  <div class="container ft-grid">
    <div class="ft-brand">
      ${logo('{{root}}index.html', 'logo-lg')}
      <p>Chuyển trọ nhẹ tênh.<br>Một đầu mối. Gọn việc chuyển trọ.</p>
      <ul class="ft-contact">
        <li>{{icon:phone}} Hotline 1900 2228 <small>(8:00 – 20:00)</small></li>
        <li>{{icon:mail}} hotro@boxanh.vn</li>
        <li>{{icon:map-pin}} Hà Nội · TP. Hồ Chí Minh</li>
      </ul>
      <div class="ft-social">
        <button type="button" data-soon="Fanpage Facebook" aria-label="Facebook">{{icon:facebook}}</button>
        <button type="button" data-soon="Kênh TikTok" aria-label="TikTok">{{icon:tiktok}}</button>
        <button type="button" data-soon="Kênh YouTube" aria-label="YouTube">{{icon:youtube}}</button>
        <button type="button" data-soon="Trang Instagram" aria-label="Instagram">{{icon:instagram}}</button>
      </div>
    </div>
    <div class="ft-col">
      <h3>Dịch vụ</h3>
      <a href="{{root}}chuyen-tro.html">Chuyển trọ</a>
      <a href="{{root}}don-phong.html">Dọn phòng</a>
      <a href="{{root}}ban-giao-phong.html">Bàn giao phòng</a>
      <a href="{{root}}uoc-tinh-chi-phi.html">Ước tính chi phí</a>
    </div>
    <div class="ft-col">
      <h3>Hỗ trợ</h3>
      <a href="{{root}}ho-tro.html">Trung tâm trợ giúp</a>
      <a href="{{root}}ho-tro.html#faq">Câu hỏi thường gặp</a>
      <a href="{{root}}ho-tro.html#gui-yeu-cau">Gửi yêu cầu hỗ trợ</a>
      <a href="{{root}}don-hang.html">Theo dõi đơn hàng</a>
    </div>
    <div class="ft-col">
      <h3>Về BOXANH</h3>
      <a href="{{root}}gioi-thieu.html">Giới thiệu</a>
      <a href="{{root}}index.html#hop-tai-su-dung">Hộp tái sử dụng</a>
      <a href="{{root}}doi-tac.html">Trở thành đối tác</a>
      <a href="{{root}}he-thong.html">Sơ đồ hệ thống</a>
    </div>
    <div class="ft-news">
      <h3>Nhận tin hữu ích từ BOXANH</h3>
      <p>Mẹo chuyển trọ, ưu đãi theo mùa và cập nhật dịch vụ mới.</p>
      <form class="ft-form" data-newsletter novalidate>
        <label class="sr-only" for="ft-email">Email của bạn</label>
        <input id="ft-email" class="input" type="email" name="email" placeholder="Nhập email của bạn" autocomplete="email" required>
        <button class="btn btn-yellow" type="submit" aria-label="Đăng ký nhận tin">{{icon:arrow-right}}</button>
      </form>
    </div>
  </div>
  <div class="container ft-bottom">
    <span>© <span data-year>2026</span> BOXANH. Tất cả quyền được bảo lưu.</span>
    <nav aria-label="Liên kết pháp lý">
      <a href="{{root}}dieu-khoan.html">Điều khoản sử dụng</a>
      <a href="{{root}}chinh-sach-bao-mat.html">Chính sách bảo mật</a>
      <a href="{{root}}cong-doi-tac/index.html">Cổng đối tác</a>
      <a href="{{root}}noi-bo/index.html">Cổng nội bộ</a>
    </nav>
    <span class="ft-love">Cùng tạo nên những khởi đầu mới {{icon:heart}}</span>
  </div>
</footer>`;
}

function bottomNav(tab) {
  const items = [
    ['home', 'index.html', 'home', 'Trang chủ'],
    ['dich-vu', 'index.html#dich-vu', 'grid', 'Dịch vụ'],
    ['don-hang', 'don-hang.html', 'clipboard-list', 'Đơn hàng'],
    ['hop', 'hop-cua-toi.html', 'box', 'Hộp của tôi'],
    ['tai-khoan', 'tai-khoan.html', 'user', 'Tài khoản'],
  ];
  return `<nav class="bottom-nav" aria-label="Điều hướng nhanh">${items.map(([k, href, ic, t]) =>
    `<a href="{{root}}${href}"${tab === k ? ' class="is-active" aria-current="page"' : ''}>{{icon:${ic}}}<span>${t}</span></a>`).join('')}</nav>`;
}

/* ---------------- customer account ---------------- */
function accountSide(active) {
  const items = [
    ['tong-quan', 'tai-khoan.html', 'home', 'Tổng quan'],
    ['don-hang', 'don-hang.html', 'clipboard-list', 'Đơn hàng'],
    ['hop', 'hop-cua-toi.html', 'box', 'Hộp của tôi'],
    ['dia-chi', 'ho-so.html#dia-chi', 'map-pin', 'Địa chỉ'],
    ['thong-bao', 'thong-bao.html', 'bell', 'Thông báo'],
    ['ho-tro', 'ho-tro.html#gui-yeu-cau', 'headset', 'Hỗ trợ'],
    ['ho-so', 'ho-so.html', 'user', 'Tài khoản'],
  ];
  return `<aside class="acc-side" aria-label="Menu tài khoản">
  <nav class="acc-nav">${items.map(([k, href, ic, t]) =>
    `<a href="{{root}}${href}"${active === k ? ' class="is-active" aria-current="page"' : ''}>{{icon:${ic}}}<span>${t}</span>${k === 'thong-bao' ? '<em class="count" data-unread hidden></em>' : ''}</a>`).join('')}
    <button type="button" data-logout>{{icon:logout}}<span>Đăng xuất</span></button>
  </nav>
  <div class="acc-deco"><img src="{{root}}assets/img/side-deco-acc.webp" alt="" loading="lazy"></div>
</aside>`;
}

/* ---------------- portals (partner + internal) ---------------- */
const PARTNER_NAV = [
  ['tong-quan', 'index.html', 'home', 'Tổng quan'],
  ['lich', 'lich-cong-viec.html', 'calendar-days', 'Lịch công việc'],
  ['don', 'don-duoc-giao.html', 'clipboard-list', 'Đơn được giao'],
  ['qr', 'giao-nhan.html', 'scan-qr', 'Quét QR & giao nhận'],
  ['ho-so', 'ho-so.html', 'id-card', 'Hồ sơ'],
  ['doi-soat', 'doi-soat.html', 'wallet', 'Đối soát'],
  ['ho-tro', '../ho-tro.html#gui-yeu-cau', 'help', 'Hỗ trợ'],
];
const ADMIN_NAV = [
  ['tong-quan', 'index.html', 'home', 'Tổng quan'],
  ['don-hang', 'don-hang.html', 'clipboard-list', 'Đơn hàng'],
  ['dieu-phoi', 'dieu-phoi.html', 'truck', 'Điều phối'],
  ['doi-tac', 'doi-tac.html', 'users', 'Đối tác'],
  ['dinh-gia', 'dinh-gia.html', 'tag', 'Định giá'],
  ['kho-hop', 'kho-hop.html', 'box', 'Kho hộp'],
  ['su-co', 'su-co.html', 'alert-triangle', 'Sự cố', '<em class="count" data-incident-count>3</em>'],
  ['bao-cao', 'bao-cao.html', 'bar-chart', 'Báo cáo'],
];

function portal(m, body, kind) {
  const isPartner = kind === 'partner';
  const nav = (isPartner ? PARTNER_NAV : ADMIN_NAV).map(([k, href, ic, t, extra = '']) =>
    `<a href="${href.startsWith('../') ? '{{root}}' + href.slice(3) : href}"${m.active === k ? ' class="is-active" aria-current="page"' : ''}>{{icon:${ic}}}<span>${t}</span>${extra}</a>`).join('');
  const profile = isPartner ? `
    <div class="side-profile">
      <img class="avatar avatar-lg" src="{{root}}assets/img/avatar-minh.webp" alt="">
      <div><b>Nguyễn Văn Minh</b><small>Đội BOXANH Express</small><span class="badge b-green-solid">{{icon:check}} Đối tác đã được duyệt</span></div>
      <p class="side-meta"><span>Mã đối tác: DT-0827</span><span>Dữ liệu minh họa</span></p>
    </div>` : `<p class="side-sub">Nội bộ vận hành</p>`;
  const deco = isPartner ? 'side-deco-pt' : 'side-deco-ad';
  const user = isPartner
    ? ['avatar-minh', 'Nguyễn Văn Minh', 'Đối tác vận chuyển']
    : ['avatar-manager', 'Nguyễn Minh Anh', 'Quản lý vận hành'];
  const search = isPartner ? `<div class="tb-title">${esc(m.heading || m.title)}</div>` : `
    <form class="tb-search" role="search" data-admin-search>
      {{icon:search}}<label class="sr-only" for="tb-q">Tìm kiếm</label>
      <input id="tb-q" type="search" name="q" placeholder="Tìm đơn hàng, đối tác, mã hộp…" autocomplete="off">
    </form>`;
  return `<a class="skip" href="#main">Bỏ qua điều hướng</a>
<div class="app app-${kind}">
  <aside class="side" id="app-side" aria-label="Menu ${isPartner ? 'đối tác' : 'nội bộ'}">
    <div class="side-top">${logo(isPartner ? 'index.html' : 'index.html', 'logo-side')}<button class="icon-btn side-close" type="button" data-side-close aria-label="Đóng menu">{{icon:x}}</button></div>
    ${profile}
    <nav class="side-nav">${nav}</nav>
    <a class="side-back" href="{{root}}index.html">{{icon:arrow-left}} Về trang khách hàng</a>
    <div class="side-deco"><img src="{{root}}assets/img/${deco}.webp" alt="" loading="lazy"></div>
  </aside>
  <div class="side-scrim" data-side-close></div>
  <div class="app-main">
    <header class="topbar">
      <button class="icon-btn tb-burger" type="button" data-side-open aria-label="Mở menu">{{icon:menu}}</button>
      ${search}
      <div class="tb-right">
        <span class="badge b-yellow tb-env">{{icon:lock}} ${isPartner ? 'Cổng đối tác' : 'Nội bộ'}</span>
        <div class="dd" data-dd>
          <button class="hd-icon tb-bell" type="button" aria-expanded="false" aria-haspopup="true" aria-label="Thông báo">{{icon:bell}}<span class="tb-count">${isPartner ? 1 : 8}</span></button>
          <div class="dd-menu dd-right dd-wide" data-portal-notifs></div>
        </div>
        <div class="dd" data-dd>
          <button class="tb-user" type="button" aria-expanded="false" aria-haspopup="true">
            <img class="avatar" src="{{root}}assets/img/${user[0]}.webp" alt="">
            <span><b>${user[1]}</b><small>${user[2]}</small></span>{{icon:chevron-down dd-chev}}
          </button>
          <div class="dd-menu dd-right">
            <a class="dd-item" href="${isPartner ? 'ho-so.html' : 'doi-tac.html'}"><span class="dd-ic">{{icon:user}}</span><span><b>${isPartner ? 'Hồ sơ đối tác' : 'Quản lý đối tác'}</b></span></a>
            <a class="dd-item" href="{{root}}he-thong.html"><span class="dd-ic">{{icon:grid}}</span><span><b>Sơ đồ hệ thống</b></span></a>
            <a class="dd-item" href="{{root}}index.html"><span class="dd-ic">{{icon:logout}}</span><span><b>Thoát cổng</b></span></a>
          </div>
        </div>
      </div>
    </header>
    <main id="main" class="app-content">
${body}
    </main>
  </div>
</div>`;
}

export function layout(m, body) {
  if (m.layout === 'canvas' && !m.bg) m.bg = canvasMeta(m.canvas[0]).bg;
  const bodyClass = [`l-${m.layout || 'site'}`, m.bodyClass].filter(Boolean).join(' ');
  const auth = m.auth ? ' data-require-auth' : '';
  let inner;
  switch (m.layout) {
    case 'bare':
      inner = body;
      break;
    case 'canvas': {
      const [d, mob] = m.canvas;
      inner = `<main id="main" class="cv-wrap${mob ? ' has-m' : ''}${m.narrow ? ' narrow' : ''}">
${renderCanvas(d, 'cv-d', '{{root}}')}
${mob ? renderCanvas(mob, 'cv-m', '{{root}}') : ''}
</main>
${body}`;
      break;
    }
    case 'account':
      inner = `${siteHeader(m)}
<div class="container acc-shell">
  ${accountSide(m.side)}
  <main id="main" class="acc-main">
${body}
  </main>
</div>
${siteFooter()}
${bottomNav(m.tab)}`;
      break;
    case 'partner':
    case 'admin':
      inner = portal(m, body, m.layout);
      break;
    default:
      inner = `${siteHeader(m)}
<main id="main">
${body}
</main>
${siteFooter()}
${bottomNav(m.tab || '')}`;
  }
  return `${head(m)}
<body class="${bodyClass}"${auth}${m.bg || m.max ? ` style="${m.bg ? `--cv-bg:${m.bg};` : ''}${m.max ? `--cv-max:${m.max}px` : ''}"` : ''}>
${inner}
${scripts(m)}
</body>
</html>
`;
}
