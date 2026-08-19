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
```text

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
```text

Mọi trang HTML dùng đường dẫn tương đối theo độ sâu thư mục (`../../wp-content/...` cho trang sâu 2 cấp như `vi/Iera/iera.html`, `../wp-content/...` cho trang sâu 1 cấp như `vi/Home.html`) — thay đổi độ sâu thư mục của một trang bắt buộc phải rà soát lại toàn bộ path bên trong file đó.
