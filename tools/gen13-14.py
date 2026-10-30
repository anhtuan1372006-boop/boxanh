"""Specs for mockup 13 (giao nhận QR – 3 bước) and 14 (điều phối vận hành)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC13 = 'design/mockups/13-Giao-nhan-QR-va-kiem-tra-seal.png'


def a(box, href=None, label='', **kw):
    el = {"k": "a", "box": box, "label": label}
    if href:
        el["href"] = href
    el.update(kw)
    return el


PARTNER_MENU = [["index.html", "Công việc hôm nay"], ["ho-so.html", "Hồ sơ đối tác"], ["doi-soat.html", "Đối soát"], ["../index.html", "Về trang khách hàng"]]


def phone_frame(dx):
    """Header + side rail shared by the three phone screens; dx = left edge of the panel."""
    return [
        a([dx + 22, 14, dx + 190, 56], "index.html", "BOXANH – Cổng đối tác"),
        a([dx + 272, 16, dx + 306, 56], "don-duoc-giao.html", "Thông báo"),
        {"k": "dd", "box": [dx + 320, 12, dx + 498, 60], "w": 160, "pl": dx + 336, "label": "Tài khoản Nguyễn Minh", "menu": PARTNER_MENU},
        a([dx + 14, 70, dx + 86, 140], "don-duoc-giao.html", "Đơn hàng", rad=10),
        a([dx + 10, 150, dx + 92, 210], "lich-cong-viec.html", "Lịch làm việc", rad=8),
        a([dx + 10, 222, dx + 92, 276], "../ho-tro.html#gui-yeu-cau", "Hỗ trợ", rad=8),
    ] + ([a([dx + 10, 296, dx + 92, 350], "ho-so.html", "Tài khoản", rad=8)] if dx < 1000 else []) + [
        a([dx + 386, 90, dx + 484, 118], "index.html", "Xem chi tiết đơn BX2027-0015", pill=1),
    ]


def steps(dx):
    """the three progress dots next to "Bước x / 3" link to the three steps"""
    pages = ["giao-nhan.html", "giao-nhan-2.html", "giao-nhan-3.html"]
    xs = [(398, 420), (430, 452), (462, 486)] if dx == 0 else [(dx + 396, dx + 418), (dx + 428, dx + 450), (dx + 460, dx + 484)]
    return [a([x0, 172, x1, 198], pages[i], f"Bước {i + 1} / 3", pill=1) for i, (x0, x1) in enumerate(xs)]


specs = []
# step 1 – nhận hộp
items = phone_frame(0) + [
    a([100, 215, 490, 545], None, "Quét mã QR trên hộp", act="scan", rad=14),
    {"k": "tog", "box": [121, 628, 145, 652], "hit": [106, 615, 292, 698], "onAt": [121, 628], "offAt": [312, 628], "on": True, "group": "seal", "value": "ok", "label": "Seal nguyên vẹn", "rad": 12, "ring": True, "hr": 10},
    {"k": "tog", "box": [312, 628, 336, 652], "hit": [300, 615, 486, 698], "onAt": [121, 628], "offAt": [312, 628], "group": "seal", "value": "bad", "label": "Seal bất thường", "rad": 12, "ring": True, "hr": 10},
    {"k": "file", "box": [104, 715, 487, 765], "label": "Chụp ảnh seal", "multi": False, "rad": 12, "done": "Đã lưu ảnh seal lúc nhận."},
    a([440, 898, 462, 922], None, "Xóa ảnh đã chụp", act="info:Bấm “Chụp ảnh seal” để chụp lại ảnh khác.", rad=4),
] + steps(0)
specs.append({"name": "giao-nhan-1", "src": SRC13, "crop": [0, 0, 507, 1024], "items": items})

# step 2 – bàn giao tại điểm đến
dx = 512
items = phone_frame(dx) + [
    a([dx + 375, 535, dx + 486, 552], None, "Đã kiểm tra xong 4/4", act="info:Đã kiểm tra đủ 4 mục cùng khách hàng.", rad=4),
]
for i, y in enumerate([584, 637, 694, 752]):
    items.append({"k": "chk", "box": [dx + 116, y - 12, dx + 140, y + 12], "hit": [dx + 108, y - 26, dx + 486, y + 26], "name": f"c{i}", "label": ["Đúng mã hộp BX-000128", "Đúng mã seal SL-004281", "Seal nguyên vẹn", "Khách đã kiểm tra"][i], "rad": 4})
items += [
    a([dx + 122, 826, dx + 330, 900], None, "Khách ký lại", act="resign", rad=8),
    a([dx + 102, 928, dx + 488, 984], None, "Xác nhận bàn giao", act="handover", rad=12),
] + steps(dx)
specs.append({"name": "giao-nhan-2", "src": SRC13, "crop": [512, 0, 1023, 1024], "items": items})

# step 3 – ghi nhận bất thường
dx = 1024
items = phone_frame(dx) + [
    {"k": "form", "id": "issue-form", "label": "Ghi nhận bất thường"},
    {"k": "sel", "r": [1164, 552, 1252, 568], "box": [1126, 545, 1512, 576], "s": "Seal bất thường", "name": "type", "id": "is-type", "form": "issue-form", "label": "Loại sự cố", "options": ["Seal bất thường", "Hộp bị nứt / vỡ", "Thiếu hộp", "Đồ bên ngoài bị hư hỏng", "Khác"]},
    {"k": "in", "multi": True, "box": [1126, 668, 1512, 732], "name": "desc", "id": "is-desc", "form": "issue-form", "max": 500, "label": "Mô tả chi tiết",
     "lines": [{"r": [1137, 676, 1477, 693], "s": "Phát hiện seal có dấu hiệu rách ở mép, không còn nguyên vẹn"}, {"r": [1137, 694, 1474, 711], "s": "như lúc nhận. Đã chụp ảnh hiện trạng và báo cáo để kiểm tra."}]},
    {"k": "file", "box": [1126, 763, 1218, 858], "label": "Thêm ảnh hiện trạng", "rad": 8, "done": "Đã thêm {n} ảnh hiện trạng."},
    a([1290, 765, 1314, 789], None, "Xóa ảnh 1", act="info:Ảnh hiện trạng được giữ lại làm bằng chứng cho CSKH.", pill=1),
    a([1388, 765, 1412, 789], None, "Xóa ảnh 2", act="info:Ảnh hiện trạng được giữ lại làm bằng chứng cho CSKH.", pill=1),
    a([1486, 765, 1510, 789], None, "Xóa ảnh 3", act="info:Ảnh hiện trạng được giữ lại làm bằng chứng cho CSKH.", pill=1),
    {"k": "btn", "box": [1124, 869, 1312, 910], "form": "issue-form", "label": "Gửi CSKH", "rad": 10},
    a([1324, 869, 1513, 910], None, "Lưu ghi nhận", act="save-issue", rad=10),
] + steps(1022)
specs.append({"name": "giao-nhan-3", "src": SRC13, "crop": [1024, 0, 1536, 1024], "items": items})

# ---------------- 14 ----------------
items = [
    a([18, 20, 172, 64], "index.html", "BOXANH – Nội bộ"),
    a([8, 98, 176, 142], "index.html", "Tổng quan", rad=10),
    a([8, 150, 176, 192], "don-hang.html", "Đơn hàng", rad=10),
    a([8, 200, 176, 248], "dieu-phoi.html", "Điều phối", rad=10),
    a([8, 256, 176, 300], "doi-tac.html", "Đối tác", rad=10),
    a([8, 308, 176, 352], "dinh-gia.html", "Định giá", rad=10),
    a([8, 360, 176, 402], "kho-hop.html", "Kho hộp", rad=10),
    a([8, 412, 176, 454], "su-co.html", "Sự cố", rad=10),
    a([8, 462, 176, 506], "bao-cao.html", "Báo cáo", rad=10),
    a([1160, 26, 1300, 56], None, "Chọn ngày 12/01/2027", act="info:Lịch điều phối đang hiển thị ngày 12/01/2027 (dữ liệu minh họa).", rad=8),
    a([1324, 22, 1356, 58], "index.html", "Thông báo"),
    {"k": "dd", "box": [1368, 16, 1522, 64], "w": 170, "pl": 1350, "label": "Tài khoản Nguyễn Minh", "menu": [["index.html", "Tổng quan vận hành"], ["../he-thong.html", "Sơ đồ hệ thống"], ["../index.html", "Về trang khách hàng"]]},
    a([200, 188, 480, 264], "don-hang.html", "Chờ báo giá: 6", card=12),
    a([492, 188, 770, 264], "don-hang.html", "Chờ điều phối: 4", card=12),
    a([780, 188, 1050, 264], "don-hang.html", "Đang thực hiện: 8", card=12),
    a([1062, 188, 1524, 264], "kho-hop.html", "Cần thu hồi: 3", card=12),
    {"k": "form", "id": "dp-search", "label": "Tìm đơn"},
    {"k": "in", "r": [540, 294, 725, 307], "box": [512, 287, 760, 314], "s": "Tìm theo mã đơn, khách hàng, địa chỉ...", "name": "q", "id": "dp-q", "form": "dp-search", "type": "search", "label": "Tìm đơn"},
    {"k": "sel", "r": [782, 294, 852, 307], "box": [774, 287, 906, 314], "s": "Tất cả dịch vụ", "name": "svc", "id": "dp-svc", "label": "Lọc dịch vụ", "options": ["Tất cả dịch vụ", "Chuyển trọ", "Dọn phòng", "Bàn giao phòng"]},
    a([914, 287, 1036, 314], None, "Ngày 12/01/2027", act="info:Đang lọc đơn ngày 12/01/2027.", rad=6),
]
rows = [(383, "BX2027-0015"), (431, "BX2027-0016"), (480, "BX2027-0017"), (532, "BX2027-0018"), (584, "BX2027-0019")]
for i, (y, code) in enumerate(rows):
    el = {"k": "tog", "box": [221, y - 9, 240, y + 10], "hit": [204, y - 22, 990, y + 22], "onAt": [221, 374], "offAt": [221, 422], "group": "order", "value": code, "label": f"Chọn đơn {code}", "rad": 3}
    if i == 0:
        el["on"] = True
    items.append(el)
    items.append(a([1000, y - 14, 1026, y + 14], None, f"Tùy chọn đơn {code}", act=f"info:Đơn {code}: xem chi tiết ở mục Đơn hàng hoặc định giá ở mục Định giá.", rad=6))
items.append({"k": "in", "r": [1076, 287, 1275, 307], "box": [1074, 284, 1370, 310], "s": "Phân công BX2027-0015", "wt": 800, "name": "dp-title", "id": "dp-title", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Đơn đang phân công"})
items += [
    a([420, 638, 440, 660], None, "Ngày trước", act="info:Lịch nguồn lực đang hiển thị 12/01/2027.", pill=1),
    a([546, 638, 566, 660], None, "Ngày sau", act="info:Lịch nguồn lực đang hiển thị 12/01/2027.", pill=1),
    a([580, 636, 626, 662], None, "Xem theo ngày", act="info:Đang xem theo ngày.", rad=6),
    a([628, 636, 666, 662], None, "Xem theo tuần", act="info:Chế độ xem tuần sẽ sớm có trong bản tiếp theo.", rad=6),
    a([975, 896, 1040, 912], "don-hang.html", "Xem tất cả hoạt động"),
    a([1433, 320, 1510, 337], "don-hang.html", "Xem chi tiết đơn"),
    {"k": "sel", "r": [1119, 547, 1183, 560], "box": [1076, 540, 1282, 567], "s": "Chọn đối tác", "name": "partner", "id": "dp-partner", "label": "Đối tác vận chuyển", "options": ["Anh Minh Transport", "Đội Bốc Xanh", "Trường Phát Logistics"]},
    {"k": "sel", "r": [1335, 547, 1392, 560], "box": [1297, 540, 1510, 567], "s": "Chọn nhóm", "name": "group", "id": "dp-group", "label": "Nhóm bốc xếp", "options": ["Nhóm 1 - Bốc Xanh", "Nhóm 2 - An Phát"]},
    {"k": "sel", "r": [1335, 607, 1403, 621], "box": [1297, 600, 1510, 628], "s": "Kho Cầu Giấy", "name": "store", "id": "dp-store", "label": "Kho xuất hộp", "options": ["Kho Cầu Giấy", "Kho A – Đống Đa", "Kho B – Hà Đông"]},
    a([1404, 708, 1500, 730], None, "Chọn Anh Minh Transport", act="pick:Anh Minh Transport", rad=6),
    a([1404, 782, 1500, 804], None, "Chọn Đội Bốc Xanh", act="pick:Đội Bốc Xanh", rad=6),
    a([1404, 862, 1500, 884], None, "Xem thêm Trường Phát Logistics", act="pick:Trường Phát Logistics", rad=6),
    a([1404, 644, 1512, 660], "doi-tac.html", "Xem so sánh đối tác"),
    a([1404, 902, 1512, 918], "dinh-gia.html", "Xem dự toán nội bộ"),
    a([1074, 926, 1512, 966], None, "Gửi phân công", act="assign", rad=10),
]
specs.append({"name": "dieu-phoi", "src": "design/mockups/14-Dieu-phoi-van-hanh.png", "items": items})

for sp in specs:
    json.dump(sp, open(os.path.join(ROOT, f"design/{sp['name']}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('wrote', sp['name'], len(sp['items']))
