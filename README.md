# BOXANH – Chuyển trọ nhẹ tênh

Website hoàn chỉnh cho hệ thống **BOXANH**: một đầu mối cho chuyển trọ, dọn phòng và bàn giao phòng, dùng hộp tái sử dụng có mã QR và seal riêng.
Thiết kế giao diện BOXANH gồm 38 trang dành cho máy tính và điện thoại, với các khu vực khách hàng, đối tác và vận hành nội bộ.

**Xem trực tiếp:** https://anhtuan1372006-boop.github.io/boxanh/
**Sơ đồ toàn bộ hệ thống:** https://anhtuan1372006-boop.github.io/boxanh/he-thong.html

## Bốn khu vực

| Khu vực | Trang chính |
| --- | --- |
| Website khách hàng | Trang chủ, Chuyển trọ, Dọn phòng, Bàn giao phòng, Ước tính chi phí, Đăng ký đối tác, Hỗ trợ, Giới thiệu, Điều khoản, Bảo mật |
| Tài khoản khách hàng | Đăng nhập OTP, Tổng quan, Đơn hàng, Chi tiết đơn & xác nhận báo giá, Hộp của tôi, Thông tin hộp (QR), Lịch thu hồi, Thông báo, Hồ sơ & địa chỉ |
| Cổng đối tác (`cong-doi-tac/`) | Công việc hôm nay, Giao nhận QR & kiểm tra seal, Lịch tuần, Đơn được giao, Hồ sơ, Đối soát |
| Nội bộ vận hành (`noi-bo/`) | Tổng quan, Đơn hàng, Điều phối, Đánh giá & phê duyệt đối tác, Định giá, Kho hộp & vòng đời, Hồ sơ sự cố & CSKH, Báo cáo |

## Dùng thử

- **Đăng nhập khách hàng:** nhập số điện thoại bất kỳ (ví dụ `0987 654 321`), mã OTP demo hiện ngay trên màn hình.
- Các thao tác (gửi yêu cầu, xác nhận báo giá, đặt lịch thu hồi, nhận việc, phân công, chấm điểm đối tác, xử lý sự cố…) được lưu trên trình duyệt của bạn và **liên thông giữa các khu vực**: yêu cầu gửi từ website hiện trong Cổng nội bộ, báo giá gửi từ nội bộ hiện trong tài khoản khách.
- Muốn làm lại từ đầu: bấm **Khôi phục dữ liệu demo** ở trang Sơ đồ hệ thống hoặc trang Tài khoản.
- Toàn bộ số liệu là **dữ liệu minh họa**; bản demo không gửi SMS, email hay dữ liệu đi đâu.

## Cấu trúc mã nguồn

```
design/
  mockups/      17 ảnh thiết kế gốc
  *.json        vị trí từng liên kết / ô nhập / nút trên mỗi ảnh
tools/canvas.py tạo ảnh nền (và bản không chữ để hiện khi gõ) + đo chữ
src/
  pages/        nội dung từng trang (HTML + front matter JSON)
  layouts.mjs   header, footer, menu tài khoản, khung cổng đối tác / nội bộ
  icons.mjs     bộ icon SVG
  assets/       CSS, JavaScript, hình minh họa (WebP)
  artwork.json  vị trí ảnh minh họa riêng trên các trang giao diện
build.mjs       ghép trang, chèn icon, kiểm tra toàn bộ liên kết
docs/           bản đã build – GitHub Pages phục vụ thư mục này
```

Sau khi sửa vị trí trong `design/*.json`, chạy `python tools/canvas.py design/<tên>.json` (cần Pillow + OpenCV). Build lại (cần Node.js 18+):

```bash
node build.mjs
```

Lệnh build báo lỗi nếu có liên kết hỏng, ảnh thiếu, icon sai tên hoặc trùng `id`.

Hình minh họa dùng ảnh WebP riêng có độ phân giải cao, tải dần theo vị trí hiển thị. Danh mục ảnh nằm ở `design/artwork-sources.json`. Mỗi lần thay nội dung ảnh, bản build tự cập nhật phiên bản đường dẫn để trình duyệt tải ảnh mới.
