"""Specs for mockups 15 (định giá), 16 (kho hộp) and 17 (hỗ trợ khách + hồ sơ sự cố)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def a(box, href=None, label='', **kw):
    el = {"k": "a", "box": box, "label": label}
    if href:
        el["href"] = href
    el.update(kw)
    return el


def val(r, box, s, name, wt=600):
    return {"k": "in", "r": r, "box": box, "s": s, "wt": wt, "name": name, "id": name, "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": s}


def inp(r, box, s, name, **kw):
    el = {"k": "in", "r": r, "box": box, "s": s, "name": name, "id": name, "label": kw.pop('label', s)}
    el.update(kw)
    return el


ADMIN_DD = [["index.html", "Tổng quan vận hành"], ["../he-thong.html", "Sơ đồ hệ thống"], ["../index.html", "Về trang khách hàng"]]
specs = []

# ---------------- 15: định giá ----------------
items = [
    a([18, 20, 196, 62], "index.html", "BOXANH – Nội bộ"),
    a([12, 104, 200, 138], "index.html", "Tổng quan", rad=10),
    a([12, 150, 200, 195], "dinh-gia.html", "Định giá", rad=10),
    a([12, 210, 200, 246], "don-hang.html", "Đơn hàng", rad=10),
    a([12, 263, 200, 300], "dieu-phoi.html", "Điều phối", rad=10),
    a([12, 321, 200, 358], "doi-tac.html", "Đối tác", rad=10),
    a([12, 378, 200, 414], "kho-hop.html", "Kho hộp", rad=10),
    a([12, 432, 200, 468], "su-co.html", "Sự cố", rad=10),
    a([12, 487, 200, 523], "bao-cao.html", "Báo cáo", rad=10),
    {"k": "dd", "box": [8, 932, 205, 1000], "w": 180, "pl": 12, "label": "Tài khoản Nguyễn Minh Anh", "menu": ADMIN_DD},
    inp([286, 305, 320, 322], [278, 297, 382, 331], "5 km", "pr-km", label="Tuyến đường (km)", mode="decimal"),
    inp([446, 306, 490, 322], [438, 297, 540, 331], "2 → 3", "pr-floor", label="Số tầng (đi → đến)"),
    {"k": "sel", "r": [597, 305, 616, 322], "box": [556, 296, 696, 332], "s": "Có", "name": "lift", "id": "pr-lift", "label": "Có thang máy?", "options": ["Có", "Không"]},
    inp([286, 386, 328, 404], [280, 379, 382, 413], "10 hộp", "pr-boxes", label="Số lượng hộp", mode="numeric"),
    inp([450, 387, 474, 403], [444, 379, 540, 413], "1 xe", "pr-cars", label="Số xe", mode="numeric"),
    inp([606, 387, 655, 404], [598, 379, 696, 413], "2 người", "pr-people", label="Số nhân công", mode="numeric"),
    inp([293, 466, 363, 482], [244, 457, 462, 493], "12/01/2027", "pr-date", label="Ngày thực hiện", type="date"),
    {"k": "sel", "r": [531, 466, 612, 482], "box": [478, 457, 694, 493], "s": "08:00 - 12:00", "name": "slot", "id": "pr-slot", "label": "Khung giờ", "options": ["08:00 - 12:00", "13:00 - 17:00", "18:00 - 21:00 (ngoài giờ)"]},
    {"k": "sw", "box": [332, 546, 369, 570], "name": "svcMove", "label": "Chuyển trọ"},
    {"k": "sw", "inv": True, "box": [488, 546, 525, 570], "name": "svcClean", "label": "Dọn phòng"},
    {"k": "sw", "inv": True, "box": [645, 546, 682, 570], "name": "svcHand", "label": "Bàn giao phòng"},
    {"k": "file", "box": [560, 682, 646, 766], "label": "Thêm ảnh hiện trạng", "rad": 8, "done": "Đã thêm {n} ảnh hiện trạng."},
    a([658, 708, 690, 740], None, "Xem thêm ảnh", act="info:Đơn BX2027-0015 có 4 ảnh hiện trạng do nhân viên khảo sát chụp.", pill=1),
]
for i, y in enumerate([320, 360, 401, 443]):
    items.append(val([1046, y - 8, 1100, y + 8], [1040, y - 11, 1105, y + 11], ["400.000", "150.000", "50.000", "50.000"][i], f"pr-l{i}", 700))
items += [
    val([1021, 481, 1095, 499], [1015, 476, 1104, 503], "650.000 đ", "pr-cost", 700),
    val([792, 561, 910, 586], [788, 556, 1004, 591], "800.000 đ", "pr-quote", 800),
    val([1025, 616, 1095, 633], [1018, 611, 1104, 638], "150.000 đ", "pr-margin", 700),
    a([736, 729, 888, 771], None, "Lưu bản tính", act="save-calc", rad=10),
    a([894, 729, 1110, 771], None, "Tạo báo giá khách hàng", act="send-quote", rad=10),
    a([1380, 229, 1510, 246], "doi-tac.html", "Bảng giá đã xác nhận"),
]
for i, (y, hit) in enumerate([(281, [1140, 265, 1517, 447]), (475, [1140, 460, 1517, 598]), (624, [1140, 610, 1517, 748])]):
    el = {"k": "tog", "box": [1153, y, 1177, y + 23], "hit": hit, "onAt": [1153, 281], "offAt": [1153, 475], "group": "opt", "value": "ABC"[i], "label": f"Phương án Đối tác {'ABC'[i]}", "rad": 12, "ring": True, "hr": 12}
    if i == 0:
        el["on"] = True
    items.append(el)
items += [
    a([987, 810, 1157, 846], None, "Xem hiệu suất đối tác", act="perf", rad=8),
    a([1165, 810, 1330, 846], None, "Cập nhật quy tắc giá", act="info:Quy tắc giá v1.2 do Nguyễn Minh Anh cập nhật 10/01/2027 14:30. Thay đổi quy tắc cần quyền Quản lý vận hành.", rad=8),
]
specs.append({"name": "dinh-gia", "src": "design/mockups/15-Dinh-gia-va-du-lieu-noi-bo.png", "items": items})

# ---------------- 16: kho hộp ----------------
items = [
    a([20, 16, 196, 60], "index.html", "BOXANH – Nội bộ"),
    a([8, 98, 210, 134], "index.html", "Tổng quan", rad=10),
    a([8, 146, 210, 184], "kho-hop.html", "Quản lý hộp & vòng đời", rad=10),
    a([8, 198, 210, 234], "don-hang.html", "Đơn hàng", rad=10),
    a([8, 248, 210, 284], "don-hang.html", "Khách hàng", rad=10),
    a([8, 300, 210, 336], "doi-tac.html", "Đối tác vận hành", rad=10),
    a([8, 350, 210, 386], None, "Lịch thu hồi", act="pickups", rad=10),
    a([8, 402, 210, 438], "bao-cao.html", "Báo cáo", rad=10),
    a([8, 454, 210, 490], None, "Cài đặt", act="info:Cài đặt kho (vị trí, quy tắc kiểm tra) chỉ dành cho Quản lý kho.", rad=10),
    {"k": "form", "id": "kh-top", "label": "Tìm hộp"},
    inp([278, 22, 430, 38], [244, 14, 640, 46], "Tìm mã hộp, mã đơn...", "kh-q", form="kh-top", type="search", label="Tìm mã hộp, mã đơn"),
    a([1290, 12, 1322, 46], "index.html", "Thông báo"),
    {"k": "dd", "box": [1350, 8, 1530, 52], "w": 170, "pl": 1356, "label": "Tài khoản Nguyễn Minh Anh", "menu": ADMIN_DD},
]
for label, b in [("Sẵn sàng tái sử dụng", [250, 340, 396, 390]), ("Đã giao", [424, 340, 528, 390]), ("Đang sử dụng", [566, 340, 712, 390]), ("Đã thu hồi", [738, 340, 864, 390]), ("Kiểm tra / Vệ sinh", [890, 340, 1040, 390]), ("Bảo trì", [1078, 340, 1196, 386]), ("Thất lạc", [1205, 340, 1340, 386]), ("Đã chuyển tái chế", [1352, 340, 1520, 386])]:
    items.append(a(b, None, f"Lọc: {label}", act=f"stage:{label}", rad=10))
items += [
    a([468, 457, 568, 492], None, "Quét QR", act="scan", rad=8),
    a([578, 457, 676, 492], None, "Nhập hộp", act="info:Nhập hộp: quét QR từng hộp thu hồi để ghi nhận về kho (Kho A / Kho B).", rad=8),
    a([686, 457, 780, 492], None, "Xuất hộp", act="info:Chỉ xuất hộp đã kiểm tra và vệ sinh đạt yêu cầu. Hiện có 2 hộp sẵn sàng: BX-000126, BX-000132.", rad=8),
    a([790, 457, 898, 492], None, "Lịch thu hồi", act="pickups", rad=8),
    inp([288, 515, 404, 530], [248, 507, 452, 538], "Tìm mã hộp, mã đơn...", "kh-q2", type="search", label="Lọc danh sách hộp"),
    {"k": "sel", "r": [474, 515, 556, 530], "box": [462, 507, 598, 538], "s": "Tất cả trạng thái", "name": "st", "id": "kh-st", "label": "Lọc trạng thái", "options": ["Tất cả trạng thái", "Sẵn sàng tái sử dụng", "Đang sử dụng", "Đã thu hồi", "Kiểm tra / Vệ sinh", "Bảo trì", "Thất lạc"]},
    {"k": "sel", "r": [624, 515, 670, 530], "box": [610, 507, 746, 538], "s": "Tất cả kho", "name": "wh", "id": "kh-wh", "label": "Lọc kho", "options": ["Tất cả kho", "Kho A", "Kho B", "Khu vệ sinh", "Khu bảo trì"]},
    {"k": "sel", "r": [770, 515, 858, 530], "box": [756, 507, 898, 538], "s": "Tất cả đối tác giữ", "name": "holder", "id": "kh-holder", "label": "Lọc bên giữ", "options": ["Tất cả đối tác giữ", "Khách hàng", "Đối tác vận chuyển"]},
]
codes = ["BX-000126", "BX-000127", "BX-000128", "BX-000129", "BX-000130", "BX-000131", "BX-000132", "BX-000133", "BX-000134"]
for code, y in zip(codes, [608, 652, 696, 740, 784, 828, 872, 917, 962]):
    el = {"k": "tog", "box": [252, y - 9, 271, y + 10], "hit": [246, y - 21, 282, y + 21], "onAt": [252, 687], "offAt": [252, 599], "label": f"Chọn {code}", "rad": 3, "value": code}
    if code == "BX-000128":
        el["on"] = True
    items.append(el)
    items.append(a([284, y - 21, 900, y + 21], None, f"Chi tiết hộp {code}", act=f"box:{code}", rad=4))
items += [
    a([1480, 460, 1512, 488], None, "Tùy chọn hộp", act="info:BX-000128 – vòng sử dụng thứ 5. Lịch sử đầy đủ ở dòng “Lưu lịch sử” phía dưới.", rad=6),
    a([1070, 862, 1096, 890], None, "Phóng to ảnh trước vệ sinh", act="info:Ảnh trước vệ sinh – BX-000128, chụp 12/01/2027 09:35 tại Kho A.", rad=6),
    a([1244, 862, 1270, 890], None, "Phóng to ảnh sau vệ sinh", act="info:Ảnh sau vệ sinh – BX-000128, chụp 12/01/2027 10:05 tại Khu vệ sinh.", rad=6),
    inp([1301, 850, 1368, 861], [1290, 842, 1512, 892], "Nhập ghi chú...", "kh-note", label="Ghi chú bảo trì", multi=True, max=200),
    a([930, 920, 1084, 962], None, "Đạt • Sẵn sàng", act="box-ready", rad=10),
    a([1090, 920, 1232, 962], None, "Chuyển bảo trì", act="box-fix", rad=10),
    a([1244, 920, 1354, 962], None, "Ghi nhận thất lạc", act="box-lost", rad=8),
    a([1362, 920, 1512, 962], None, "Kết thúc vòng đời / Tái chế", act="box-recycle", rad=8),
    a([930, 976, 1518, 1000], None, "Lưu lịch sử hộp BX-000128", act="box-history", rad=6),
]
specs.append({"name": "kho-hop", "src": "design/mockups/16-Quan-ly-vong-doi-hop.png", "items": items})

# ---------------- 17a: gửi yêu cầu hỗ trợ (khách) ----------------
items = [
    a([30, 22, 180, 68], "index.html", "BOXANH – Trang chủ"),
    a([190, 34, 254, 60], "chuyen-tro.html", "Chuyển trọ"),
    a([262, 34, 324, 60], "don-phong.html", "Dọn phòng"),
    a([334, 34, 418, 60], "ban-giao-phong.html", "Bàn giao phòng"),
    {"k": "dd", "box": [426, 28, 460, 64], "w": 170, "pl": 290, "label": "Mở menu", "menu": [["index.html", "Trang chủ"], ["uoc-tinh-chi-phi.html", "Ước tính chi phí"], ["tai-khoan.html", "Tài khoản"], ["don-hang.html", "Đơn hàng"], ["hop-cua-toi.html", "Hộp của tôi"], ["doi-tac.html", "Đối tác"]]},
    {"k": "anchor", "id": "faq", "y": 0},
    {"k": "anchor", "id": "gui-yeu-cau", "y": 280},
    {"k": "form", "id": "sp-form", "label": "Gửi yêu cầu hỗ trợ", "attrs": {"data-done": "Đã gửi yêu cầu hỗ trợ|CSKH BOXANH đã nhận yêu cầu (mã YC-0029) và sẽ đối chiếu thông tin, phản hồi bạn trong 24 giờ."}},
    {"k": "sel", "r": [50, 357, 166, 374], "box": [38, 347, 244, 384], "s": "Không tìm thấy đồ", "name": "issue", "id": "sp-issue", "form": "sp-form", "label": "Vấn đề", "options": ["Không tìm thấy đồ", "Seal bất thường", "Đồ bị hư hỏng", "Hộp bị hư hỏng", "Trễ giờ hẹn", "Thắc mắc báo giá", "Khác"]},
    {"k": "sel", "r": [266, 357, 333, 373], "box": [255, 347, 447, 384], "s": "BX-000128", "name": "box", "id": "sp-box", "form": "sp-form", "label": "Hộp liên quan", "options": ["BX-000128", "BX-000129", "BX-000130", "BX-000131", "BX-000132", "BX-000133", "BX-000134", "BX-000135", "BX-000136", "BX-000137", "Không chọn"]},
    {"k": "tog", "box": [38, 424, 62, 448], "hit": [34, 418, 172, 454], "onAt": [177, 424], "offAt": [38, 424], "group": "where", "value": "Đồ trong hộp", "label": "Đồ trong hộp", "rad": 12},
    {"k": "tog", "box": [177, 424, 201, 448], "hit": [174, 418, 304, 454], "onAt": [177, 424], "offAt": [38, 424], "group": "where", "value": "Đồ ngoài hộp", "label": "Đồ ngoài hộp", "rad": 12, "on": True},
    {"k": "tog", "box": [314, 424, 338, 448], "hit": [310, 418, 446, 454], "onAt": [177, 424], "offAt": [38, 424], "group": "where", "value": "Chưa xác định", "label": "Chưa xác định", "rad": 12},
    {"k": "in", "multi": True, "box": [40, 488, 446, 558], "name": "desc", "id": "sp-desc", "form": "sp-form", "max": 500, "req": True, "label": "Mô tả đồ cần tìm",
     "lines": [{"r": [52, 497, 360, 515], "s": "Túi tote màu be, bên trong có sổ tay và tai nghe"}, {"r": [52, 516, 118, 533], "s": "màu trắng."}]},
    inp([76, 615, 141, 631], [40, 604, 148, 640], "12/01/2027", "sp-d1", form="sp-form", type="date", label="Lần cuối nhìn thấy – ngày"),
    inp([166, 615, 198, 631], [154, 604, 236, 640], "08:00", "sp-t1", form="sp-form", label="Lần cuối nhìn thấy – giờ"),
    inp([290, 615, 355, 631], [255, 604, 363, 640], "12/01/2027", "sp-d2", form="sp-form", type="date", label="Thời điểm phát hiện – ngày"),
    inp([379, 615, 411, 631], [369, 604, 447, 640], "11:30", "sp-t2", form="sp-form", label="Thời điểm phát hiện – giờ"),
    a([135, 692, 157, 714], None, "Xóa ảnh 1", act="info:Ảnh liên quan được giữ để CSKH đối chiếu. Bạn có thể thêm ảnh mới bên cạnh.", pill=1),
    a([267, 692, 289, 714], None, "Xóa ảnh 2", act="info:Ảnh liên quan được giữ để CSKH đối chiếu. Bạn có thể thêm ảnh mới bên cạnh.", pill=1),
    {"k": "file", "box": [304, 686, 446, 800], "label": "Thêm ảnh liên quan", "rad": 8, "done": "Đã thêm {n} ảnh liên quan."},
    {"k": "btn", "box": [36, 815, 446, 858], "form": "sp-form", "label": "Gửi CSKH", "rad": 10},
    a([36, 908, 446, 996], None, "Yêu cầu YC-0028 – Đang kiểm tra · Xem tiến độ", act="ticket", rad=10),
]
specs.append({"name": "ho-tro", "src": "design/mockups/17-Bao-su-co-va-CSKH.png", "crop": [0, 0, 470, 1024], "items": items})

# ---------------- 17b: hồ sơ sự cố (nội bộ) ----------------
items = [
    a([496, 24, 638, 70], "index.html", "BOXANH – Nội bộ"),
    a([650, 32, 720, 62], "index.html", "Tổng quan"),
    a([742, 32, 810, 62], "don-hang.html", "Đơn hàng"),
    a([824, 32, 900, 62], "don-hang.html", "Khách hàng"),
    a([912, 30, 970, 64], "su-co.html", "Sự cố", rad=8),
    a([982, 32, 1042, 62], "bao-cao.html", "Báo cáo"),
    {"k": "form", "id": "inc-top", "label": "Tìm kiếm"},
    inp([1152, 40, 1306, 54], [1122, 30, 1350, 64], "Tìm đơn hàng, khách hàng, YC...", "inc-q", form="inc-top", type="search", label="Tìm đơn hàng, khách hàng, YC"),
    a([1364, 30, 1392, 62], "index.html", "Thông báo"),
    {"k": "dd", "box": [1406, 24, 1516, 68], "w": 170, "pl": 1346, "label": "Tài khoản CSKH", "menu": ADMIN_DD},
    a([604, 92, 628, 114], None, "Thu gọn menu", act="info:Menu CSKH luôn hiển thị trên màn hình lớn.", pill=1),
]
for label, y, msg in [("Danh sách sự cố", 140, "Tất cả 21 sự cố: 3 yêu cầu mới, 12 đang xử lý, 5 chờ thông tin, 1 vừa hoàn tất."),
                      ("Yêu cầu mới", 181, "3 yêu cầu mới: YC-0028, YC-0026, YC-0024 (dữ liệu minh họa)."),
                      ("Đang xử lý", 222, "12 sự cố đang xử lý. Đang mở: YC-0028."),
                      ("Chờ thông tin", 263, "5 sự cố đang chờ khách hoặc đối tác bổ sung thông tin."),
                      ("Đã hoàn tất", 304, "Sự cố đã hoàn tất được lưu 12 tháng để đối chiếu."),
                      ("Hỗ trợ khách hàng", 366, "Mở trang hỗ trợ khách hàng để xem yêu cầu từ phía khách."),
                      ("Mẫu phản hồi", 406, "Mẫu phản hồi chuẩn: Yêu cầu bổ sung · Đồ có trong hộp · Xác nhận trách nhiệm & bồi thường."),
                      ("Quy trình xử lý", 447, "Quy trình: Tiếp nhận → Thu thập dữ liệu → Đối chiếu → Phản hồi → Hoàn tất (phản hồi trong 24 giờ)."),
                      ("Tài liệu nội bộ", 490, "Tài liệu nội bộ CSKH chỉ hiển thị cho nhân sự được phân quyền.")]:
    if label == "Hỗ trợ khách hàng":
        items.append(a([484, y - 16, 632, y + 16], "../ho-tro.html", label, rad=8))
    else:
        items.append(a([484, y - 16, 632, y + 16], None, label, act=f"info:{msg}", rad=8))
for label, b, act in [("Đơn hàng", [662, 362, 782, 402], "info:Đang xem bằng chứng từ đơn hàng BX2027-0015."),
                      ("Lịch sử QR", [792, 366, 904, 400], "qr"), ("Seal & ảnh", [914, 366, 1030, 400], "photos"),
                      ("Trao đổi", [1046, 366, 1150, 400], "chat"), ("Kết quả", [1166, 366, 1270, 400], "info:Chưa có kết luận. Chỉ có thể kết luận sau khi hoàn tất đối chiếu dữ liệu và phản hồi khách hàng.")]:
    items.append(a(b, None, label, act=act, rad=8))
items += [
    a([1168, 456, 1238, 472], None, "Xem tất cả ảnh bằng chứng", act="photos"),
    a([1024, 616, 1050, 644], None, "Phóng to ảnh seal", act="photos", rad=6),
    a([1208, 616, 1234, 644], None, "Phóng to ảnh bàn giao", act="photos", rad=6),
    {"k": "in", "multi": True, "box": [680, 810, 958, 900], "name": "note", "id": "inc-note", "max": 1000, "label": "Ghi nhận nội bộ",
     "lines": [{"r": [690, 818, 850, 831], "s": "Đã kiểm tra ảnh seal và ảnh bàn giao."}, {"r": [690, 832, 950, 845], "s": "Tiếp tục liên hệ khách hàng để thu thập thêm hình ảnh khu vực"}, {"r": [690, 846, 872, 859], "s": "đặt đồ ngoài hộp và làm rõ thông tin."}]},
    {"k": "sel", "r": [992, 816, 1158, 830], "box": [982, 806, 1222, 840], "s": "Yêu cầu bổ sung hình ảnh / trao đổi", "name": "plan", "id": "inc-plan", "label": "Hướng xử lý đề xuất", "options": ["Yêu cầu bổ sung hình ảnh / trao đổi", "Đồ có trong hộp – hỗ trợ khách kiểm tra lại", "Xác nhận trách nhiệm – hỗ trợ bồi thường"]},
    a([674, 928, 820, 966], None, "Lưu hồ sơ", act="inc-save", rad=10),
    a([830, 928, 1032, 966], None, "Soạn phản hồi", act="inc-reply", rad=10),
    a([1060, 928, 1238, 966], None, "Kết luận sự cố (chưa khả dụng)", act="info:Chỉ có thể kết luận sau khi hoàn tất đối chiếu dữ liệu và đã phản hồi khách hàng.", rad=10),
]
specs.append({"name": "su-co", "src": "design/mockups/17-Bao-su-co-va-CSKH.png", "crop": [478, 0, 1536, 1024], "items": items})

for sp in specs:
    json.dump(sp, open(os.path.join(ROOT, f"design/{sp['name']}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('wrote', sp['name'], len(sp['items']))
