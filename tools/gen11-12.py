"""Specs for mockup 11 (đánh giá đối tác – nội bộ) and 12 (công việc của đối tác)."""
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


ADMIN_MENU = [["index.html", "Tổng quan vận hành"], ["../he-thong.html", "Sơ đồ hệ thống"], ["../index.html", "Về trang khách hàng"]]

# ---------------- 11 ----------------
items = [
    a([30, 22, 212, 68], "index.html", "BOXANH – Nội bộ"),
    a([12, 140, 217, 177], "index.html", "Tổng quan", rad=10),
    a([12, 192, 217, 228], "don-hang.html", "Đơn hàng", rad=10),
    a([12, 242, 217, 293], "doi-tac.html", "Đối tác", rad=10),
    a([12, 304, 217, 341], "dinh-gia.html", "Định giá", rad=10),
    a([12, 359, 217, 396], "kho-hop.html", "Kho hộp", rad=10),
    a([12, 414, 217, 451], "su-co.html", "Sự cố", rad=10),
    a([12, 471, 217, 508], "bao-cao.html", "Báo cáo", rad=10),
    {"k": "form", "id": "adm-search", "label": "Tìm kiếm"},
    {"k": "in", "r": [292, 23, 505, 43], "box": [286, 16, 640, 50], "s": "Tìm đơn hàng, đối tác, mã box...", "name": "q", "id": "adm-q", "form": "adm-search", "type": "search", "label": "Tìm kiếm"},
    a([1246, 12, 1280, 50], "index.html", "Thông báo (8)"),
    {"k": "dd", "box": [1310, 10, 1522, 54], "w": 170, "pl": 1350, "label": "Tài khoản Nguyễn Minh Anh", "menu": ADMIN_MENU},
    a([252, 237, 493, 286], None, "Nhóm Vận chuyển & bốc xếp", act="info:Đang hiển thị nhóm Vận chuyển & bốc xếp.", rad=10),
    a([520, 240, 690, 286], None, "Nhóm Vệ sinh", act="group:ve-sinh", rad=10),
    a([710, 240, 903, 286], None, "Nhóm Sửa chữa · FIX", act="group:sua-chua", rad=10),
    a([805, 306, 982, 341], None, "Bộ câu hỏi chung", act="questions", rad=8),
    a([446, 600, 552, 624], None, "Bảng giá A.pdf", act="file:0", rad=4),
    a([646, 600, 754, 624], None, "Bảng giá B.pdf", act="file:1", rad=4),
    a([843, 600, 949, 624], None, "Bảng giá C.pdf", act="file:2", rad=4),
    a([736, 818, 868, 864], None, "Hồ sơ minh chứng Thử 01", act="info:Thử 01 – 12/01/2027: 2 ảnh bốc xếp, vận chuyển và 2 ảnh khác. Hoàn thành, chênh lệch +10.000 đ (+1,8%).", rad=6),
    a([736, 869, 868, 914], None, "Hồ sơ minh chứng Thử 02", act="info:Thử 02 – 15/01/2027: 2 ảnh bốc xếp, vận chuyển và 3 ảnh khác. Hoàn thành đúng giá thỏa thuận.", rad=6),
]
rows = [(392, "4,5 / 5", 5), (433, "4,0 / 5", 4), (475, "4,5 / 5", 5), (517, "5,0 / 5", 5), (560, "4,0 / 5", 4), (604, "4,5 / 5", 5)]
names = ["Đúng giờ", "Mức giá", "Bảo quản đồ", "Thái độ", "Giao tiếp", "Đúng giá đã thống nhất"]
xs = [(1356, 1381), (1387, 1412), (1418, 1443), (1449, 1475), (1480, 1507)]
for i, (cy, txt, sel) in enumerate(rows):
    items.append(val([1286, cy - 9, 1331, cy + 9], [1283, cy - 12, 1342, cy + 12], txt, f"sc-v{i}"))
    for v, (x0, x1) in enumerate(xs, 1):
        el = {"k": "opt", "cls": "score", "box": [x0, cy - 11, x1, cy + 11], "group": f"s{i}", "label": str(v), "value": str(v), "aria": f"{names[i]}: {v} điểm", "rad": 4, "fs": 9.5, "wt": 700}
        if v == sel:
            el["on"] = True
        items.append(el)
items += [
    val([1282, 652, 1362, 688], [1279, 648, 1368, 692], "4,5 / 5", "sc-total", 800),
    {"k": "in", "multi": True, "box": [1028, 724, 1505, 778], "name": "note", "id": "sc-note", "max": 500, "label": "Nhận xét nội bộ",
     "lines": [{"r": [1036, 727, 1347, 745], "s": "Đội ngũ chuyên nghiệp, đúng giờ, đồ đạc được bảo quản tốt."}, {"r": [1036, 747, 1314, 765], "s": "Cần thương lượng thêm về phụ phí tầng cao."}]},
    a([1027, 792, 1507, 830], None, "Lưu đánh giá", act="save-review", rad=10),
    a([1020, 927, 1256, 968], None, "Xem hồ sơ phê duyệt", act="approve-file", rad=10),
    a([1263, 927, 1512, 968], None, "Đàm phán giá theo sản lượng (chưa khả dụng)", act="info:Chỉ khả dụng sau khi đối tác đủ điều kiện (điểm ≥ 4,0 và ít nhất 2 đơn thử hoàn thành, được phê duyệt).", rad=10),
]
spec11 = {"name": "nb-doi-tac", "src": "design/mockups/11-Danh-gia-va-phe-duyet-doi-tac.png", "items": items}

# ---------------- 12 ----------------
items = [
    a([25, 15, 222, 58], "index.html", "BOXANH – Cổng đối tác"),
    a([12, 238, 234, 284], "index.html", "Tổng quan", rad=10),
    a([12, 295, 234, 330], "lich-cong-viec.html", "Lịch công việc", rad=10),
    a([12, 345, 234, 380], "don-duoc-giao.html", "Đơn được giao", rad=10),
    a([12, 395, 234, 430], "giao-nhan.html", "Quét QR", rad=10),
    a([12, 445, 234, 480], "ho-so.html", "Hồ sơ", rad=10),
    a([12, 497, 234, 532], "doi-soat.html", "Đối soát", rad=10),
    a([12, 548, 234, 584], "../ho-tro.html#gui-yeu-cau", "Hỗ trợ", rad=10),
    a([1256, 16, 1290, 54], "don-duoc-giao.html", "Thông báo (1)"),
    {"k": "dd", "box": [1314, 10, 1522, 60], "w": 170, "pl": 1350, "label": "Tài khoản Nguyễn Văn Minh", "menu": [["ho-so.html", "Hồ sơ đối tác"], ["doi-soat.html", "Đối soát"], ["../he-thong.html", "Sơ đồ hệ thống"], ["../index.html", "Về trang khách hàng"]]},
    a([266, 282, 545, 360], "lich-cong-viec.html", "Hôm nay: 3 việc", card=12),
    a([553, 282, 826, 360], "don-duoc-giao.html", "Đang thực hiện: 1 việc", card=12),
    a([834, 282, 1130, 360], "don-duoc-giao.html", "Chờ xác nhận: 2 việc", card=12),
    a([1422, 327, 1450, 355], None, "Ngày trước", act="info:Lịch theo tuần có ở mục Lịch công việc.", pill=1),
    a([1468, 327, 1496, 355], None, "Ngày sau", act="info:Lịch theo tuần có ở mục Lịch công việc.", pill=1),
    a([634, 404, 716, 438], "lich-cong-viec.html", "Xem tuần", rad=8),
    a([808, 404, 870, 438], "lich-cong-viec.html", "Tuần", rad=8),
    a([275, 462, 880, 630], None, "Chuyển trọ · BX2027-0015 lúc 08:00", act="info:Đang xem chi tiết đơn BX2027-0015 ở cột bên phải.", card=12),
    a([275, 645, 880, 785], None, "Dọn phòng · BX2027-0021 lúc 13:00", act="job:BX2027-0021", card=12),
    a([275, 800, 880, 955], None, "Bàn giao phòng · BX2027-0022 lúc 16:00", act="job:BX2027-0022", card=12),
    a([1238, 555, 1452, 592], None, "Phiếu công việc BX2027-0015_KH_chuyen-tro.pdf", act="doc", rad=6),
    a([1464, 562, 1494, 588], None, "Tải phiếu công việc", act="doc", rad=6),
    a([916, 665, 1206, 709], None, "Nhận việc", act="accept", rad=10),
    a([1218, 665, 1500, 709], None, "Đề nghị điều chỉnh", act="adjust", rad=10),
    a([916, 832, 1206, 879], "giao-nhan.html", "Mở công cụ giao nhận", rad=10),
    a([1251, 831, 1500, 867], None, "Báo phát sinh", act="extra", rad=8),
    a([902, 905, 1182, 1012], None, "Dọn phòng: checklist + ảnh trước / sau", act="job:BX2027-0021", card=10),
    a([1190, 905, 1514, 1012], None, "Bàn giao phòng / FIX: hiện trạng + hạng mục được duyệt", act="job:BX2027-0022", card=10),
]
spec12 = {"name": "dt-cong-viec", "src": "design/mockups/12-Cong-viec-cua-doi-tac.png", "items": items}

for sp in (spec11, spec12):
    json.dump(sp, open(os.path.join(ROOT, f"design/{sp['name']}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('wrote', sp['name'], len(sp['items']))
