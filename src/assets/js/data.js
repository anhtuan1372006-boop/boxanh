/* BOXANH – demo data ("Dữ liệu minh họa"). Seeds localStorage on first use. */
window.BX_DATA = (function () {
  const SERVICES = {
    'chuyen-tro': { name: 'Chuyển trọ', icon: 'truck', img: 'sel-chuyen-tro' },
    'don-phong': { name: 'Dọn phòng', icon: 'sparkles', img: 'sel-don-phong' },
    'ban-giao': { name: 'Bàn giao phòng', icon: 'key', img: 'sel-ban-giao' },
  };

  const ORDER_STEPS = ['Đã tiếp nhận', 'Đang khảo sát', 'Chờ bạn xác nhận', 'Đã chốt lịch', 'Đang thực hiện', 'Hoàn tất'];
  const ORDER_BADGE = [
    ['Đã tiếp nhận', 'b-blue'], ['Đang khảo sát', 'b-blue'], ['Chờ xác nhận báo giá', 'b-yellow'],
    ['Đã chốt lịch', 'b-green'], ['Đang thực hiện', 'b-purple'], ['Hoàn tất', 'b-green'],
  ];

  const orders = () => [
    {
      code: 'BX2027-0015', created: '08/01/2027', title: 'Chuyển trọ + Dọn phòng', services: ['chuyen-tro', 'don-phong'],
      step: 2, stepTimes: ['08/01/2027 08:30', '09/01/2027 10:15', '10/01/2027 09:20', '', '', ''],
      from: { line: 'Ngõ 254 Lạc Long Quân', area: 'Phường Bưởi, Quận Tây Hồ', city: 'Hà Nội', floor: 'Tầng 4', lift: 'Không có thang máy' },
      to: { line: 'Ngõ 68 Cầu Giấy', area: 'Phường Quan Hoa, Quận Cầu Giấy', city: 'Hà Nội', floor: 'Tầng 2', lift: 'Có thang máy' },
      date: '12/01/2027', weekday: 'Thứ Ba', time: '08:00 – 11:00', distance: 5.2,
      extra: 'Vệ sinh phòng cũ sau khi chuyển',
      resources: 'Xe tải 1.5 tấn • 2 nhân viên',
      quote: {
        items: [['truck', 'Vận chuyển', 500000], ['users', 'Bốc xếp', 200000], ['stairs', 'Phụ phí tầng', 100000], ['clock', 'Phí chờ', 0], ['moon', 'Ngoài giờ', 0]],
        confirmed: false,
        history: [
          ['10/01/2027 09:20', 'BOXANH gửi báo giá chính thức 800.000 đ sau khảo sát thực tế.'],
          ['09/01/2027 16:40', 'Khảo sát xong: 4 tầng không thang máy ở điểm đi, thêm 1 nhân viên bốc xếp.'],
          ['08/01/2027 08:30', 'Ước tính ban đầu từ website: 650.000 – 950.000 đ.'],
        ],
      },
      boxes: 10, thumb: 'order-thumb', contact: 'Nguyễn Tuấn Anh',
    },
    {
      code: 'BX2026-0284', created: '18/12/2026', title: 'Bàn giao phòng', services: ['ban-giao'], step: 5,
      stepTimes: ['18/12/2026 09:00', '19/12/2026 10:00', '19/12/2026 15:30', '19/12/2026 16:10', '20/12/2026 09:00', '20/12/2026 11:30'],
      from: { line: 'Số 15 ngõ 102 Trần Duy Hưng', area: 'Phường Trung Hòa, Quận Cầu Giấy', city: 'Hà Nội', floor: 'Tầng 3', lift: 'Có thang máy' },
      to: null, date: '20/12/2026', weekday: 'Chủ Nhật', time: '09:00 – 11:00', extra: 'Sửa bản lề tủ bếp',
      resources: 'Kỹ thuật viên FIX • 1 nhân viên vệ sinh',
      quote: { items: [['clipboard-check', 'Kiểm tra hiện trạng', 100000], ['sparkles', 'Vệ sinh bàn giao', 200000], ['wrench', 'Sửa bản lề tủ bếp', 150000]], confirmed: true, history: [] },
      boxes: 0, thumb: 'hand-bien-ban', contact: 'Nguyễn Tuấn Anh',
    },
    {
      code: 'BX2026-0177', created: '03/12/2026', title: 'Dọn phòng', services: ['don-phong'], step: 5,
      stepTimes: ['03/12/2026 20:10', '04/12/2026 09:00', '04/12/2026 11:00', '04/12/2026 11:20', '05/12/2026 08:30', '05/12/2026 11:45'],
      from: { line: 'Ngõ 254 Lạc Long Quân', area: 'Phường Bưởi, Quận Tây Hồ', city: 'Hà Nội', floor: 'Tầng 4', lift: 'Không có thang máy' },
      to: null, date: '05/12/2026', weekday: 'Thứ Bảy', time: '08:30 – 11:30', extra: 'Dọn định kỳ 25 m²',
      resources: '2 nhân viên vệ sinh',
      quote: { items: [['sparkles', 'Dọn định kỳ 25 m²', 450000], ['droplet', 'Vệ sinh nhà tắm chuyên sâu', 70000]], confirmed: true, history: [] },
      boxes: 0, thumb: 'area-san', contact: 'Nguyễn Tuấn Anh',
    },
  ];

  const boxes = () => Array.from({ length: 10 }, (_, i) => ({
    code: 'BX-' + String(128 + i).padStart(6, '0'),
    seal: 'SL-' + String(4281 + i).padStart(6, '0'),
    idx: i + 1, order: 'BX2027-0015', received: '11/01/2027', status: 'Đang sử dụng', uses: 6 - (i % 3),
  }));

  const notifs = () => [
    { id: 'n1', icon: 'file-text', tone: '', title: 'Báo giá đã được cập nhật', time: '10/01/2027 · 09:20', text: 'Đơn BX2027-0015 đã có báo giá mới 800.000 đ. Vui lòng xem chi tiết để xác nhận.', href: 'don-hang-chi-tiet.html?ma=BX2027-0015#bao-gia', read: false },
    { id: 'n2', icon: 'bell', tone: 'yellow', title: 'Chuẩn bị đồ trước giờ chuyển', time: '11/01/2027 · 18:30', text: 'Hãy đóng gói các vật dụng cá nhân và dán nhãn (nếu có) để buổi chuyển diễn ra thuận lợi hơn nhé!', href: 'don-hang-chi-tiet.html?ma=BX2027-0015', read: false },
    { id: 'n3', icon: 'box', tone: '', title: 'Đã giao 10 hộp BOXANH', time: '11/01/2027 · 08:10', text: 'Hộp BX-000128 → BX-000137 đã được giao. Mỗi hộp có mã QR và seal riêng để bạn theo dõi.', href: 'hop-cua-toi.html', read: false },
    { id: 'n4', icon: 'clipboard-check', tone: '', title: 'Khảo sát đã hoàn tất', time: '09/01/2027 · 10:15', text: 'Nhân viên BOXANH đã khảo sát và ghi nhận khối lượng đồ đạc cho đơn BX2027-0015.', href: 'don-hang-chi-tiet.html?ma=BX2027-0015', read: true },
    { id: 'n5', icon: 'heart', tone: 'peach', title: 'Chào mừng bạn đến BOXANH', time: '08/01/2027 · 08:30', text: 'Cảm ơn bạn đã tin tưởng BOXANH. Cùng nhau, việc chuyển trọ luôn nhẹ tênh.', href: 'tai-khoan.html', read: true },
  ];

  const tickets = () => [
    { code: 'YC-0028', issue: 'Không tìm thấy đồ', order: 'BX2027-0015', box: 'BX-000128', date: '12/01/2027', status: 'Đang kiểm tra', text: 'BOXANH sẽ đối chiếu thông tin và phản hồi.' },
  ];

  const addresses = () => [
    { id: 'a1', label: 'Nhà mới', line: 'Ngõ 68 Cầu Giấy, Phường Quan Hoa', city: 'Quận Cầu Giấy, Hà Nội', isDefault: true },
    { id: 'a2', label: 'Phòng trọ cũ', line: 'Ngõ 254 Lạc Long Quân, Phường Bưởi', city: 'Quận Tây Hồ, Hà Nội', isDefault: false },
  ];

  /* ---------- partner portal ---------- */
  const jobs = () => [
    {
      code: 'BX2027-0015', time: '08:00', service: 'Chuyển trọ', tone: '', status: 'Chờ xác nhận', img: 'job-chuyen-tro',
      from: 'Ngõ 254 Đường Lạc Long Quân, Quận Tây Hồ, Hà Nội', to: 'Ngõ 68 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
      team: 'Đội Minh – Hằng', res: { car: 1, people: 2, boxes: 10 }, doc: 'BX2027-0015_KH_chuyen-tro.pdf', price: 650000,
    },
    {
      code: 'BX2027-0021', time: '13:00', service: 'Dọn phòng', tone: 'green', status: 'Đang thực hiện', img: 'job-don-phong',
      from: 'Ngõ 12 Phố Trần Bình, Quận Nam Từ Liêm, Hà Nội', to: '',
      team: 'Đội Kiên – Phương', res: { car: 0, people: 2, boxes: 0 }, doc: 'BX2027-0021_KH_don-phong.pdf', price: 420000,
    },
    {
      code: 'BX2027-0022', time: '16:00', service: 'Bàn giao / FIX', tone: 'orange', status: 'Chờ xác nhận', img: 'job-ban-giao',
      from: 'Ngõ 99 Đường Nguyễn Trãi, Quận Thanh Xuân, Hà Nội', to: '',
      team: 'Đội Long – Mai', res: { car: 0, people: 2, boxes: 0 }, doc: 'BX2027-0022_KH_ban-giao.pdf', price: 380000,
    },
  ];

  /* ---------- internal ---------- */
  const adminOrders = () => [
    { code: 'BX2027-0015', svc: 'chuyen-tro', date: '12/01/2027', time: '08:00 – 11:00', area: 'Quận Tây Hồ', customer: 'Nguyễn Tuấn Anh', status: 'Chờ điều phối', value: 800000, need: '1 xe • 2 người • 10 hộp', img: 'dp-order' },
    { code: 'BX2027-0016', svc: 'don-phong', date: '12/01/2027', time: '09:00 – 12:00', area: 'Quận Cầu Giấy', customer: 'Lê Thu Hà', status: 'Chờ báo giá', value: 450000, need: '0 xe • 2 người • 0 hộp', img: 'area-san' },
    { code: 'BX2027-0017', svc: 'ban-giao', date: '12/01/2027', time: '10:00 – 12:00', area: 'Quận Thanh Xuân', customer: 'Phạm Quốc Bảo', status: 'Chờ điều phối', value: 380000, need: '0 xe • 2 người • 0 hộp', img: 'hand-kiem-tra' },
    { code: 'BX2027-0018', svc: 'chuyen-tro', date: '12/01/2027', time: '13:00 – 16:00', area: 'Quận Hai Bà Trưng', customer: 'Trần Mai Linh', status: 'Chờ báo giá', value: 950000, need: '1 xe • 3 người • 14 hộp', img: 'step-van-chuyen' },
    { code: 'BX2027-0019', svc: 'don-phong', date: '12/01/2027', time: '14:00 – 17:00', area: 'Quận Hoàn Kiếm', customer: 'Đỗ Minh Khang', status: 'Chờ điều phối', value: 520000, need: '0 xe • 2 người • 0 hộp', img: 'area-bep' },
    { code: 'BX2027-0020', svc: 'chuyen-tro', date: '12/01/2027', time: '07:30 – 10:00', area: 'Quận Đống Đa', customer: 'Vũ Hải Yến', status: 'Đang thực hiện', value: 700000, need: '1 xe • 2 người • 8 hộp', img: 'feat-van-chuyen' },
    { code: 'BX2027-0021', svc: 'don-phong', date: '12/01/2027', time: '13:00 – 15:00', area: 'Quận Nam Từ Liêm', customer: 'Hoàng Gia Huy', status: 'Đã phân công', value: 420000, need: '0 xe • 2 người • 0 hộp', img: 'job-don-phong' },
    { code: 'BX2027-0022', svc: 'ban-giao', date: '12/01/2027', time: '16:00 – 18:00', area: 'Quận Thanh Xuân', customer: 'Ngô Thanh Tâm', status: 'Đã phân công', value: 380000, need: '0 xe • 2 người • 0 hộp', img: 'job-ban-giao' },
    { code: 'BX2027-0014', svc: 'chuyen-tro', date: '11/01/2027', time: '08:00 – 12:00', area: 'Quận Ba Đình', customer: 'Bùi Anh Thư', status: 'Hoàn tất', value: 920000, need: '1 xe • 3 người • 15 hộp', img: 'step-giao-nhan' },
    { code: 'BX2027-0013', svc: 'don-phong', date: '10/01/2027', time: '09:00 – 11:00', area: 'Quận Cầu Giấy', customer: 'Đặng Quỳnh Như', status: 'Hoàn tất', value: 380000, need: '0 xe • 2 người • 0 hộp', img: 'area-ve-sinh' },
    { code: 'BX2027-0012', svc: 'chuyen-tro', date: '09/01/2027', time: '14:00 – 17:00', area: 'Quận Long Biên', customer: 'Trịnh Văn Nam', status: 'Hoàn tất', value: 610000, need: '1 xe • 2 người • 8 hộp', img: 'step-boc-xep' },
    { code: 'BX2027-0011', svc: 'chuyen-tro', date: '08/01/2027', time: '08:00 – 10:00', area: 'Quận Hà Đông', customer: 'Lý Thảo Vy', status: 'Có sự cố', value: 680000, need: '1 xe • 2 người • 9 hộp', img: 'step-thu-hoi' },
  ];

  const partnerGroups = () => ({
    'van-chuyen': {
      label: 'Vận chuyển & bốc xếp',
      partners: [
        { key: 'A', name: 'An Phát Movers', area: 'Nội thành HN', cap: '3 xe tải, 8 nhân sự', file: 'Bảng giá A.pdf' },
        { key: 'B', name: 'Nhanh Gọn 247', area: 'HN & lân cận', cap: '5 xe tải, 12 nhân sự', file: 'Bảng giá B.pdf' },
        { key: 'C', name: 'Thành Đạt Pro', area: 'Nội thành HN', cap: '2 xe tải, 6 nhân sự', file: 'Bảng giá C.pdf' },
      ],
      rows: [
        ['Giá chuyến', ['550.000 đ / chuyến', '620.000 đ / chuyến', '480.000 đ / chuyến']],
        ['Phụ phí tầng', ['50.000 đ / tầng', '40.000 đ / tầng', '60.000 đ / tầng']],
        ['Phí chờ', ['70.000 đ / giờ', '60.000 đ / giờ', '80.000 đ / giờ']],
        ['Thêm người', ['150.000 đ / người', '120.000 đ / người', '150.000 đ / người']],
        ['Ngoài giờ', ['+30% (sau 20:00)', '+30% (sau 21:00)', '+40% (sau 20:00)']],
        ['Phát sinh khác', ['Tháo lắp cơ bản: 100.000 đ', '—', 'Xe nhỏ vào hẻm: 50.000 đ']],
      ],
      scores: { A: [4.5, 4.0, 4.5, 5.0, 4.0, 4.5], B: [4.0, 4.5, 4.0, 4.5, 4.5, 4.0], C: [4.0, 5.0, 3.5, 4.0, 4.0, 4.5] },
      trials: [
        ['Thử 01', '12/01/2027', 560000, 550000, 'Hoàn thành'],
        ['Thử 02', '15/01/2027', 580000, 580000, 'Hoàn thành'],
        ['Thử 03', '18/01/2027', null, 560000, 'Đang thực hiện'],
      ],
      trialImgs: [['step-boc-xep', 'step-van-chuyen'], ['feat-boc-xep', 'feat-hop']],
    },
    've-sinh': {
      label: 'Vệ sinh',
      partners: [
        { key: 'A', name: 'Sạch Xanh Home', area: 'Nội thành HN', cap: '10 nhân sự, 2 ca/ngày', file: 'Bảng giá SXH.pdf' },
        { key: 'B', name: 'Ong Vàng Clean', area: 'HN & lân cận', cap: '14 nhân sự, 3 ca/ngày', file: 'Bảng giá OVC.pdf' },
        { key: 'C', name: 'Nhà Gọn', area: 'Cầu Giấy, Đống Đa', cap: '6 nhân sự, 2 ca/ngày', file: 'Bảng giá NG.pdf' },
      ],
      rows: [
        ['Giá theo phòng', ['350.000 đ / phòng ≤ 25 m²', '320.000 đ / phòng ≤ 25 m²', '300.000 đ / phòng ≤ 25 m²']],
        ['Phụ phí diện tích', ['12.000 đ / m² vượt', '10.000 đ / m² vượt', '15.000 đ / m² vượt']],
        ['Phí chờ', ['50.000 đ / giờ', '50.000 đ / giờ', '60.000 đ / giờ']],
        ['Thêm người', ['120.000 đ / người', '100.000 đ / người', '120.000 đ / người']],
        ['Ngoài giờ', ['+25% (sau 19:00)', '+30% (sau 20:00)', '+30% (sau 19:00)']],
        ['Phát sinh khác', ['Tẩy mốc: 80.000 đ', 'Giặt rèm: 60.000 đ / bộ', '—']],
      ],
      scores: { A: [4.5, 4.0, 4.5, 4.5, 4.5, 4.5], B: [4.0, 4.5, 4.0, 4.0, 4.0, 4.0], C: [5.0, 4.5, 4.0, 4.5, 4.0, 5.0] },
      trials: [
        ['Thử 01', '11/01/2027', 380000, 350000, 'Hoàn thành'],
        ['Thử 02', '14/01/2027', 350000, 350000, 'Hoàn thành'],
        ['Thử 03', '17/01/2027', null, 350000, 'Đang thực hiện'],
      ],
      trialImgs: [['area-san', 'area-bep'], ['area-ve-sinh', 'check-1']],
    },
    'sua-chua': {
      label: 'Sửa chữa · FIX',
      partners: [
        { key: 'A', name: 'Thợ Tốt 24h', area: 'Nội thành HN', cap: '6 thợ, phản hồi 2 giờ', file: 'Bảng giá TT24.pdf' },
        { key: 'B', name: 'FIX Nhanh', area: 'HN & lân cận', cap: '9 thợ, phản hồi 4 giờ', file: 'Bảng giá FN.pdf' },
        { key: 'C', name: 'An Tâm Home', area: 'Thanh Xuân, Hà Đông', cap: '4 thợ, phản hồi 3 giờ', file: 'Bảng giá ATH.pdf' },
      ],
      rows: [
        ['Phí kiểm tra', ['80.000 đ / lần', '60.000 đ / lần', '50.000 đ / lần']],
        ['Sửa bản lề, ổ khóa', ['120.000 đ / hạng mục', '100.000 đ / hạng mục', '110.000 đ / hạng mục']],
        ['Thay bóng, công tắc', ['60.000 đ / điểm', '50.000 đ / điểm', '70.000 đ / điểm']],
        ['Thêm người', ['150.000 đ / người', '130.000 đ / người', '140.000 đ / người']],
        ['Ngoài giờ', ['+30% (sau 20:00)', '+20% (sau 20:00)', '+30% (sau 19:00)']],
        ['Phát sinh khác', ['Vật tư tính theo hóa đơn', 'Vật tư tính theo hóa đơn', 'Bảo hành 30 ngày']],
      ],
      scores: { A: [5.0, 4.0, 4.5, 4.5, 4.5, 4.5], B: [4.0, 4.5, 4.0, 4.0, 4.5, 4.0], C: [4.5, 4.5, 4.5, 4.5, 4.0, 4.0] },
      trials: [
        ['Thử 01', '13/01/2027', 160000, 150000, 'Hoàn thành'],
        ['Thử 02', '16/01/2027', 120000, 120000, 'Hoàn thành'],
        ['Thử 03', '19/01/2027', null, 140000, 'Đang thực hiện'],
      ],
      trialImgs: [['hand-fix', 'fix-thumb'], ['hand-kiem-tra', 'check-4']],
    },
  });

  const boxStatuses = {
    'san-sang': ['Sẵn sàng tái sử dụng', 'b-green'],
    'dang-dung': ['Đang sử dụng', 'b-blue'],
    'da-thu-hoi': ['Đã thu hồi', 'b-orange'],
    'kiem-tra': ['Kiểm tra / Vệ sinh', 'b-purple'],
    'bao-tri': ['Bảo trì', 'b-yellow'],
    'that-lac': ['Thất lạc', 'b-red'],
    'tai-che': ['Đã chuyển tái chế', 'b-gray'],
  };
  const internalBoxes = () => [
    { code: 'BX-000121', status: 'da-thu-hoi', where: 'Kho A', order: 'BX2027-0009', seal: 'SL-004190', scan: '12/01/2027 09:30', by: 'Nguyễn Minh Anh', prev: '11/01/2027 18:20 – Trần Thảo Linh (Đối tác vận chuyển)', uses: 5 },
    { code: 'BX-000126', status: 'san-sang', where: 'Kho A', order: '', seal: '—', scan: '12/01/2027 08:12', by: 'Nguyễn Minh Anh', prev: '11/01/2027 16:00 – Khu vệ sinh', uses: 7 },
    { code: 'BX-000127', status: 'dang-dung', where: 'SV Trần Minh Khoa', order: 'BX2027-0014', seal: 'SL-004270', scan: '11/01/2027 16:45', by: 'Lê Quang Huy', prev: '11/01/2027 07:50 – Kho A', uses: 4 },
    { code: 'BX-000128', status: 'dang-dung', where: 'KH Nguyễn Tuấn Anh', order: 'BX2027-0015', seal: 'SL-004281', scan: '11/01/2027 08:10', by: 'Nguyễn Văn Minh', prev: '10/01/2027 17:30 – Kho Cầu Giấy', uses: 6 },
    { code: 'BX-000129', status: 'kiem-tra', where: 'Khu vệ sinh', order: 'BX2027-0013', seal: 'SL-004262', scan: '12/01/2027 10:15', by: 'Trần Thảo Linh', prev: '11/01/2027 19:00 – Kho A', uses: 8 },
    { code: 'BX-000130', status: 'bao-tri', where: 'Khu bảo trì', order: '', seal: '—', scan: '10/01/2027 14:20', by: 'Phạm Đức Tài', prev: '09/01/2027 10:00 – Kho B', uses: 11 },
    { code: 'BX-000131', status: 'that-lac', where: '—', order: 'BX2027-0011', seal: 'SL-004201', scan: '08/01/2027 11:05', by: 'Lê Quang Huy', prev: '08/01/2027 07:40 – Kho B', uses: 3 },
    { code: 'BX-000132', status: 'san-sang', where: 'Kho B', order: '', seal: '—', scan: '12/01/2027 08:00', by: 'Nguyễn Minh Anh', prev: '11/01/2027 15:10 – Khu vệ sinh', uses: 2 },
    { code: 'BX-000133', status: 'dang-dung', where: 'SV Phạm Ngọc Hà', order: 'BX2027-0016', seal: 'SL-004275', scan: '11/01/2027 19:10', by: 'Trần Thảo Linh', prev: '11/01/2027 13:00 – Kho B', uses: 5 },
    { code: 'BX-000134', status: 'kiem-tra', where: 'Khu vệ sinh', order: 'BX2027-0012', seal: 'SL-004255', scan: '12/01/2027 09:45', by: 'Vũ Hoàng Nam', prev: '11/01/2027 20:30 – Kho A', uses: 9 },
    { code: 'BX-000135', status: 'tai-che', where: 'Đơn vị tái chế', order: '', seal: '—', scan: '05/01/2027 15:00', by: 'Phạm Đức Tài', prev: '04/01/2027 09:00 – Khu bảo trì', uses: 24 },
  ];

  const incidents = () => [
    { code: 'YC-0028', type: 'Không tìm thấy đồ', customer: 'Nguyễn Tuấn Anh', order: 'BX2027-0015', box: 'BX-000128', created: '12/01/2027 11:20', state: 'dang-xu-ly', step: 1, owner: 'Nguyễn Minh Anh' },
    { code: 'YC-0027', type: 'Seal bất thường', customer: 'Lý Thảo Vy', order: 'BX2027-0011', box: 'BX-000131', created: '08/01/2027 10:42', state: 'cho-thong-tin', step: 2, owner: 'Trần Thảo Linh' },
    { code: 'YC-0026', type: 'Hộp bị nứt', customer: 'Trịnh Văn Nam', order: 'BX2027-0012', box: 'BX-000134', created: '09/01/2027 17:05', state: 'moi', step: 0, owner: 'Chưa phân công' },
    { code: 'YC-0025', type: 'Trễ giờ hẹn', customer: 'Bùi Anh Thư', order: 'BX2027-0014', box: '—', created: '11/01/2027 08:35', state: 'hoan-tat', step: 4, owner: 'Nguyễn Minh Anh' },
  ];

  return { SERVICES, ORDER_STEPS, ORDER_BADGE, orders, boxes, notifs, tickets, addresses, jobs, adminOrders, partnerGroups, boxStatuses, internalBoxes, incidents };
})();
