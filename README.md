# Kobashi_Vn
Trang WEB KOBASHIDENKO.COM dịch sang tiếng Việt

## Cấu trúc thư mục

Site tĩnh 3 ngôn ngữ, deploy qua GitHub Pages (xem `CNAME`):

```text
index.html      redirect gốc → vi/Home.html
vi/             Tiếng Việt (ngôn ngữ mặc định)
ja/             Tiếng Nhật
en/             Tiếng Anh
wp-content/     Theme, ảnh, PDF, upload (xuất từ WordPress)
```

Mỗi ngôn ngữ có cấu trúc thư mục con đối xứng nhau:

```text
<lang>/
  Home.html                 (trang chủ)
  Company/company.html
  Construction/construction.html
  Contact/contact.html
  Iera/iera.html
  News/news.html
  Other/other.html
  Recruit/recruit.html
```

Mọi trang HTML dùng đường dẫn tương đối theo độ sâu thư mục (`../../wp-content/...` cho trang sâu 2 cấp như `vi/Iera/iera.html`, `../wp-content/...` cho trang sâu 1 cấp như `vi/Home.html`) — thay đổi độ sâu thư mục của một trang bắt buộc phải rà soát lại toàn bộ path bên trong file đó.

## Cách thêm ngôn ngữ hoặc trang mới

`en/` hiện chỉ có trang `Iera/iera.html`; 6 thư mục còn lại (`Company/`, `Construction/`, `Contact/`, `News/`, `Other/`, `Recruit/`) đã được tạo sẵn rỗng (đánh dấu bằng `.gitkeep`) để giữ đúng cấu trúc đối xứng — chỉ cần thêm file `.html` tương ứng khi có bản dịch.

Khi thêm một trang mới cho ngôn ngữ đã có, hoặc thêm hẳn một ngôn ngữ thứ 4:

1. Tạo thư mục con đúng tên đã dùng ở `vi/`/`ja/`/`en/` (ví dụ `Company/company.html`).
2. Copy cấu trúc `<head>`, header, footer, slide-menu từ trang tương ứng ở ngôn ngữ khác, dịch nội dung, giữ nguyên các đường dẫn `../../wp-content/...` (độ sâu thư mục không đổi nếu đặt đúng vị trí đối xứng).
3. Cập nhật `canonical` và `og:url` trỏ đúng ngôn ngữ/đường dẫn mới.
4. Cập nhật nút chuyển ngôn ngữ (`.c-header-lang`) trên **tất cả** các trang tương ứng ở các ngôn ngữ khác để trỏ sang trang mới — đây là điểm dễ bỏ sót nhất vì switcher là link chéo hai chiều giữa mọi ngôn ngữ.
5. Nếu thêm ngôn ngữ thứ 4, cần mở rộng CSS `.c-header-lang` (hiện có biến thể `--tri` cho 3 ngôn ngữ trong `wp-content/themes/clearline-child/style.css`) sang bố cục 4 lựa chọn.
