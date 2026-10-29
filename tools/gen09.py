"""Generate the three specs cut from mockup 09 (box info, my boxes, pickup schedule)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = 'design/mockups/09-QR-hop-va-lich-thu-hoi.png'


def header(o, logo, links, bell, avatar):
    items = [{"k": "a", "box": logo, "href": "index.html", "label": "BOXANH – Trang chủ"}]
    for (href, label), b in zip([("chuyen-tro.html", "Chuyển trọ"), ("don-phong.html", "Dọn phòng"), ("ban-giao-phong.html", "Bàn giao phòng")], links):
        items.append({"k": "a", "box": b, "href": href, "label": label})
    items.append({"k": "a", "box": bell, "href": "thong-bao.html", "label": "Thông báo"})
    items.append({"k": "dd", "box": avatar, "w": 140, "pl": avatar[2] - 140, "label": "Tài khoản", "menu": [["tai-khoan.html", "Tổng quan"], ["don-hang.html", "Đơn hàng"], ["hop-cua-toi.html", "Hộp của tôi"], ["ho-so.html", "Thông tin cá nhân"], ["#dang-xuat", "Đăng xuất"]]})
    return items


def tabs(xs, y=(950, 1004)):
    out = []
    for (href, label), (x0, x1) in zip([("index.html", "Trang chủ"), ("don-hang.html", "Đơn hàng"), ("hop-cua-toi.html", "Hộp của tôi"), ("tai-khoan.html", "Tài khoản")], xs):
        out.append({"k": "a", "box": [x0, y[0], x1, y[1]], "href": href, "rad": 8, "label": label})
    return out


specs = []

# ---------- 1. Thông tin hộp ----------
items = header(0, [33, 25, 162, 60], [[180, 30, 239, 56], [252, 30, 310, 56], [321, 30, 402, 56]], [418, 28, 442, 58], [450, 26, 506, 62])
items += [
    {"k": "a", "box": [33, 83, 140, 101], "href": "hop-cua-toi.html", "label": "Hộp của tôi"},
    {"k": "in", "r": [48, 496, 410, 525], "box": [46, 492, 470, 529], "s": "BOXANH – BX-000128 (1)", "wt": 800, "name": "title", "id": "bi-title", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Mã hộp"},
    {"k": "a", "box": [256, 581, 370, 608], "href": "don-hang-chi-tiet.html?ma=BX2027-0015", "rad": 6, "label": "Thuộc đơn hàng BX2027-0015", "attrs": {"id": "bi-order"}},
    {"k": "in", "r": [258, 726, 345, 745], "box": [256, 722, 420, 749], "s": "SL-004281", "wt": 700, "name": "seal", "id": "bi-seal", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Số seal"},
    {"k": "a", "box": [46, 840, 262, 890], "act": "box-history", "rad": 10, "label": "Xem lịch sử hộp"},
    {"k": "a", "box": [273, 840, 483, 890], "href": "ho-tro.html?hop=BX-000128#gui-yeu-cau", "rad": 10, "label": "Báo sự cố", "attrs": {"id": "bi-report"}},
]
items += tabs([(48, 114), (156, 223), (263, 375), (410, 481)])
specs.append({"name": "thong-tin-hop", "src": SRC, "crop": [0, 0, 519, 1024], "items": items})

# ---------- 2. Hộp của tôi + đặt lịch ----------
O = 519
items = header(O, [542, 25, 671, 60], [[690, 30, 750, 56], [763, 30, 823, 56], [836, 30, 919, 56]], [930, 28, 953, 58], [960, 26, 1012, 62])
items += [
    {"k": "a", "box": [544, 208, 992, 268], "href": "don-hang-chi-tiet.html?ma=BX2027-0015", "card": 10, "label": "Đơn hàng BX2027-0015"},
    {"k": "chk", "box": [871, 285, 892, 305], "name": "all", "label": "Chọn tất cả 10 hộp", "rad": 3, "attrs": {}},
    {"k": "in", "r": [898, 287, 992, 305], "box": [896, 284, 996, 307], "s": "Đã chọn 10 hộp", "wt": 500, "name": "selected", "id": "bx-selected", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Số hộp đã chọn"},
]
rows = [(327, 348, "BX-000128", 1), (387, 408, "BX-000129", 1), (446, 467, "BX-000130", 1), (507, 528, "7 hộp còn lại", 7)]
for i, (y0, y1, code, n) in enumerate(rows):
    items.append({"k": "chk", "box": [559, y0, 580, y1], "name": f"row{i}", "label": f"Chọn {code}", "rad": 3})
    if n == 1:
        items.append({"k": "a", "box": [594, y0 - 10, 811, y1 + 10], "href": f"thong-tin-hop.html?ma={code}", "rad": 6, "label": f"Thông tin hộp {code}"})
        items.append({"k": "a", "box": [958, y0 - 2, 982, y1 + 2], "href": f"thong-tin-hop.html?ma={code}", "rad": 6, "label": f"Tùy chọn hộp {code}"})
items.append({"k": "a", "box": [594, 497, 811, 537], "act": "info:7 hộp còn lại: BX-000131 → BX-000137 (Seal SL-004284 → SL-004290), đều đang sử dụng.", "rad": 6, "label": "7 hộp còn lại"})
items.append({"k": "a", "box": [958, 505, 984, 531], "act": "info:7 hộp còn lại: BX-000131 → BX-000137 (Seal SL-004284 → SL-004290), đều đang sử dụng.", "rad": 6, "label": "Xem 7 hộp còn lại"})
items.append({"k": "anchor", "id": "dat-lich", "y": 570})
items.append({"k": "a", "box": [563, 619, 590, 649], "act": "info:Lịch thu hồi hiện mở trong tháng 1/2027.", "pill": 1, "label": "Tháng trước"})
items.append({"k": "a", "box": [756, 619, 782, 649], "act": "info:Lịch thu hồi hiện mở trong tháng 1/2027.", "pill": 1, "label": "Tháng sau"})
cols = [574, 606, 637, 672, 707, 739, 773]
rowsy = [695, 725, 754, 786, 817]
day = 1
first_col = 4  # 1/1/2027 is a Friday
for r, cy in enumerate(rowsy):
    for c, cx in enumerate(cols):
        if r == 0 and c < first_col:
            continue
        if day > 31:
            break
        s = 20 if day == 15 else 17
        el = {"k": "opt", "cls": "day", "box": [cx - s, cy - s, cx + s, cy + s], "group": "day", "label": str(day), "value": f"2027-01-{day:02d}", "aria": f"Ngày {day}/01/2027", "rad": 999, "fs": 12.5, "wt": 700}
        if day == 15:
            el["on"] = True
        if day < 12:
            el["disabled"] = True
        items.append(el)
        day += 1
for i, (y0, y1, label) in enumerate([(643, 675, "08:00 – 10:00"), (680, 710, "10:00 – 12:00"), (715, 746, "14:00 – 16:00")]):
    el = {"k": "opt", "dot": True, "box": [817, y0, 979, y1], "group": "slot", "label": label, "rad": 9, "fs": 12.5, "wt": 500}
    if i == 0:
        el["on"] = True
    items.append(el)
items += [
    {"k": "a", "box": [811, 782, 986, 825], "href": "ho-so.html#dia-chi", "rad": 8, "label": "Địa điểm thu hồi: 123 Nguyễn Văn Cừ, P. An Lạc, Q. Bình Thạnh, TP. Hồ Chí Minh"},
    {"k": "form", "id": "pickup-form", "label": "Đặt lịch thu hồi hộp"},
    {"k": "in", "r": [842, 862, 958, 877], "box": [838, 856, 984, 882], "s": "Ví dụ: Gọi trước 30 phút...", "name": "note", "id": "pk-note", "form": "pickup-form", "max": 120, "label": "Ghi chú"},
    {"k": "btn", "box": [548, 896, 988, 938], "form": "pickup-form", "label": "Gửi lịch thu hồi", "rad": 10},
]
items += tabs([(553, 609), (668, 727), (769, 877), (920, 977)])
specs.append({"name": "hop-cua-toi", "src": SRC, "crop": [519, 0, 1018, 1024], "items": items})

# ---------- 3. Lịch thu hồi ----------
items = header(1018, [1041, 25, 1170, 60], [[1193, 30, 1249, 56], [1266, 30, 1322, 56], [1337, 30, 1420, 56]], [1432, 28, 1455, 58], [1462, 26, 1516, 62])
items += [
    {"k": "a", "box": [1040, 83, 1162, 101], "href": "hop-cua-toi.html", "label": "Hộp của tôi"},
    {"k": "in", "r": [1089, 325, 1256, 341], "box": [1087, 321, 1300, 345], "s": "15/01/2027 • 08:00 – 10:00", "wt": 700, "name": "when", "id": "pk-when", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Thời gian thu hồi"},
    {"k": "in", "r": [1089, 378, 1130, 393], "box": [1087, 375, 1200, 396], "s": "10 hộp", "wt": 700, "name": "count", "id": "pk-count", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Số lượng hộp"},
    {"k": "in", "r": [1089, 429, 1252, 446], "box": [1087, 426, 1300, 448], "s": "123 Nguyễn Văn Cừ, P. An Lạc,", "wt": 500, "name": "addr1", "id": "pk-addr1", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Địa điểm"},
    {"k": "in", "r": [1089, 450, 1256, 467], "box": [1087, 448, 1300, 470], "s": "Q. Bình Thạnh, TP. Hồ Chí Minh", "wt": 500, "name": "addr2", "id": "pk-addr2", "cls": "val", "attrs": {"readonly": "", "tabindex": "-1"}, "label": "Địa điểm (tiếp)"},
    {"k": "a", "box": [1039, 683, 1249, 729], "href": "hop-cua-toi.html#dat-lich", "rad": 10, "label": "Đổi lịch"},
    {"k": "a", "box": [1262, 683, 1505, 729], "href": "ho-tro.html#gui-yeu-cau", "rad": 10, "label": "Liên hệ hỗ trợ"},
]
items += tabs([(1053, 1116), (1166, 1224), (1268, 1376), (1424, 1487)])
specs.append({"name": "lich-thu-hoi", "src": SRC, "crop": [1018, 0, 1536, 1024], "items": items})

for sp in specs:
    json.dump(sp, open(os.path.join(ROOT, f"design/{sp['name']}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('wrote', sp['name'], len(sp['items']))
