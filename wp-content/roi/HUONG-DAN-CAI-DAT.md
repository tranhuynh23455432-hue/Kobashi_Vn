# Cài công cụ tính lợi ích iERA lên kobashivn.com

Bộ code gồm 2 file:

| File | Dùng để |
|---|---|
| `iera-roi-widget.html` | Toàn bộ công cụ tính (giao diện + công thức). Dán vào trang web. |
| `google-sheet-nhan-khach.gs` | Không bắt buộc. Lưu thông tin khách để lại vào Google Sheet, có thể kèm email báo. |

Code chạy độc lập, không cần cài thêm thư viện. Mọi CSS/JS đều nằm gọn trong khối `#iera-roi` nên không làm vỡ giao diện website.

---

## Đã nhúng sẵn vào trang iERA tiếng Việt

Khối "Tính nhanh lợi ích khi dùng iERA" đã nằm trong `vi/Iera/iera.html`, ngay dưới phần "ECO Series – Các model", mặc định thu gọn, bấm để mở ra hoặc đóng lại. Gửi link `.../vi/Iera/iera.html#iera-roi-calc` cho khách thì khối tự mở sẵn.

File gốc duy nhất là `iera-roi-widget.html`. Sau mỗi lần sửa file này, chạy lại để cập nhật vào trang:

```
python wp-content/roi/embed-into-page.py
```

Script thay phần nằm giữa hai dấu `<!-- IERA-ROI:START -->` và `<!-- IERA-ROI:END -->` trong trang. Đừng sửa tay trong khoảng đó vì sẽ bị ghi đè. Trang tiếng Anh và tiếng Nhật chưa có khối này vì công cụ đang là tiếng Việt và tính bằng đồng.

## Bước 1. Dán công cụ vào trang (chỉ cần nếu dùng WordPress hoặc nền tảng khác)

Mở `iera-roi-widget.html`, chọn tất cả (Ctrl+A), sao chép, rồi làm theo nền tảng của bạn:

**WordPress (trình soạn Gutenberg)**
Trang → Sửa → bấm `+` → chọn khối **HTML tùy chỉnh** (Custom HTML) → dán → Cập nhật.

**WordPress + Elementor**
Kéo widget **HTML** vào trang → dán vào ô HTML Code → Cập nhật.
Nên đặt trong một Section có chiều rộng "Full Width" hoặc ít nhất 1200px.

**WordPress + Flatsome (UX Builder)**
Thêm phần tử **HTML** → dán → Lưu.

**LadiPage**
Thêm phần tử **HTML/Javascript** → dán → kéo khung rộng hết section (khung tự giãn chiều cao). Nếu khung bị cắt, chỉnh chiều cao phần tử về Auto.

**Website tự code**
Dán vào vị trí muốn hiển thị trong file `.html` / template.

> Lưu ý: một số plugin bảo mật hoặc trình biên tập WordPress sẽ xóa thẻ `<script>` khi lưu. Nếu sau khi lưu công cụ chỉ hiện chữ mà bấm không có tác dụng, hãy dùng tài khoản Administrator, hoặc dùng plugin **WPCode** (tạo snippet loại HTML rồi chèn bằng shortcode).

Gợi ý vị trí đặt: trang sản phẩm iERA ngay dưới phần "Lợi ích chuyển thành lợi nhuận", và tạo thêm một trang riêng `kobashivn.com/tinh-loi-ich-iera` để chạy quảng cáo hoặc gửi link cho khách qua Zalo.

---

## Bước 2. Chỉnh thông tin liên hệ

Ở đầu phần `<script>` trong file widget:

```js
const CONFIG = {
  phone: '0385 050 911',
  zalo: 'https://zalo.me/0385050911',   // đổi thành link Zalo OA nếu công ty có
  email: 'info-vn@kobashidenko.com',
  hours: 'Thứ 2 – Thứ 6, 9:00–17:00',
  leadEndpoint: '',                      // dán URL Google Apps Script ở Bước 3
};
```

Khi `leadEndpoint` để trống, công cụ chỉ hiện số điện thoại và nút Gọi / Zalo. Khi điền URL, công cụ hiện thêm form "Nhận báo cáo chi tiết và lịch cấp đông thử miễn phí".

Nếu website có menu dính trên đầu cao hơn 90px, tìm `--sticky-top: 90px;` trong phần `<style>` và đổi cho khớp.

---

## Bước 3. Lưu khách vào Google Sheet (khuyên dùng)

1. Tạo Google Sheet mới.
2. **Tiện ích mở rộng → Apps Script**, xóa code mẫu, dán toàn bộ `google-sheet-nhan-khach.gs`, bấm Lưu.
3. Muốn có email báo khách mới thì điền `NOTIFY_EMAIL`.
4. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**. Thực thi với tư cách: *Tôi*. Quyền truy cập: *Bất kỳ ai*. Bấm Triển khai và cấp quyền.
5. Sao chép URL dạng `https://script.google.com/macros/s/…/exec` dán vào `leadEndpoint`.
6. Mở trang web, điền thử một số điện thoại và kiểm tra Sheet có dòng mới.

Mỗi khách gửi về có đủ: tên, SĐT, công ty, có muốn cấp đông thử không, loại sản phẩm, máy quan tâm, toàn bộ số liệu A–E, tiền đầu tư, lợi mỗi tháng và số tháng hoàn vốn. Sale gọi lại là có sẵn bối cảnh để tư vấn.

---

## Bước 4. Đo lường (nếu website đã gắn Google Analytics / Tag Manager / Facebook Pixel)

Công cụ tự gửi các sự kiện sau, không cần cấu hình thêm:

| Sự kiện | Khi nào |
|---|---|
| `iera_roi_start` | Khách bắt đầu sửa số liệu |
| `iera_roi_step` | Chuyển bước (kèm `step`) |
| `iera_roi_result` | Xem kết quả (kèm `monthly_gain`, `payback_months`, `product`, `model`) |
| `iera_roi_lead` | Gửi form thành công. Với Facebook Pixel là sự kiện chuẩn **Lead** |
| `iera_roi_call`, `iera_roi_zalo`, `iera_roi_copy` | Bấm Gọi, Zalo, Sao chép kết quả |

Trong GA4, đánh dấu `iera_roi_lead` là **Sự kiện chính (Key event)** để tối ưu quảng cáo Google theo khách để lại số.

---

## Chỉnh số liệu

- **Số ví dụ theo ngành**: tìm `const PRESETS` trong script. Nên thay bằng số thật từ các buổi cấp đông thử. Ô "bán giá cao hơn" (E) luôn tắt mặc định, vì đó là giả định chưa kiểm chứng.
- **Danh sách máy và công suất**: tìm `const MODELS`. Công suất cấp đông của một máy (kg/tháng) được tính theo hai cách, ưu tiên cách 1:
  1. `cap`: số cố định kg/tháng do phòng kỹ thuật cung cấp. Đang để `null`.
  2. `trays × kg mỗi khay × số mẻ mỗi ngày × ngày chạy mỗi tháng`. Số khay có sẵn từ catalogue (30, 30, 72; ECO 7000 là hầm liên tục nên không có khay). Kg mỗi khay và số mẻ mỗi ngày do khách nhập ở mục "Giả định tính toán", hoặc đặt sẵn bằng `kgPerTray`, `batchesPerDay` trong `CONFIG`.

  Có công suất thì công cụ cảnh báo "cần khoảng N máy" khi sản lượng khách vượt một máy, và tính điện theo mức sử dụng thật. Chưa có thì không kiểm tra công suất. Trường `kwh` trong `MODELS` thực chất là công suất điện kW ghi ở mục "Điện năng" của catalogue.
- **Giá điện mặc định và ngưỡng khách "Nóng"**: `kwhPrice` và `hotPaybackMonths` trong `CONFIG`. Đối chiếu `kwhPrice` với biểu giá điện sản xuất hiện hành.
- **Các giả định khách tự nhập** (mục "Giả định tính toán" ở bước 4, mặc định thu gọn): mức đạt được (K, mặc định 75%), số máy (M, trống = tự tính), giá điện (P), giờ chạy mỗi ngày (H, mặc định 8), ngày chạy mỗi tháng (N, mặc định 26), số năm tính lợi nhuận tích lũy (Y, mặc định 5). Giá trị mặc định nằm trong `const DEFAULT`, giới hạn nhập nằm trong `const LIMITS`. Ba nút Thận trọng / Kỳ vọng / Tối đa ở phần kết quả chỉ là lối tắt đặt K = 50 / 75 / 100.
- **Hao hụt hiện tại và khi dùng iERA** kéo được từ 0 đến 50%.
- **Công thức**: hàm `calc()`:

  `Lợi mỗi tháng = [A × g × (C − D) + A × (1 − D) × E] × k − chi phí vận hành`

  - `g` là giá trị mỗi kg hao hụt giữ lại được, tính bằng `(1 − S) × giá trị + S × G × B`:
    - Phần hao hụt mất hẳn (1 − S): nếu khách đã nhập **giá mua V** và chọn "Đỡ phải mua thêm" (mặc định) thì tính theo giá mua V, vì hàng giữ lại giúp đỡ phải mua thêm nguyên liệu. Chọn "Bán thêm được", hoặc chưa nhập V, thì tính theo giá bán B (phù hợp khi bán hết mọi lượng hàng có, vì tiền mua nguyên liệu đã bỏ ra rồi).
    - Phần hao hụt vẫn bán được (S%, giảm giá G%) chỉ mất phần chênh giá `G × B`.
  - E chỉ tính trên phần hàng bán được `A × (1 − D)`.
  - `k` là mức đạt được so với số khách nhập.
  - Hoàn vốn là hoàn vốn đơn giản, chưa tính thuế, khấu hao, lãi vay.
  - Giá mua trong `PRESETS` (V) chỉ là số ví dụ minh họa, nên thay bằng số thật từ khách hàng của bạn.

## Số liệu ví dụ theo sản phẩm và bảng giá máy

- **Tên sản phẩm** (không bắt buộc) ở bước 1 có sẵn một ví dụ để khách xóa đi và nhập sản phẩm của mình. Các nút "Ví dụ nhanh" điền sẵn số liệu thị trường tham khảo: Hàu, Tôm thẻ chân trắng, Mực ống; Thịt bò, Thịt heo, Thịt gà; Sầu riêng, Xoài, Mít, Thanh long; Chả giò, Bánh bao. Danh sách nằm trong `const PRODUCTS` (giữa hai dấu `PRODUCTS-START` và `PRODUCTS-END`), mỗi sản phẩm có giá bán, giá mua, hao hụt hiện tại, hao hụt khi dùng iERA và ghi chú nguồn.
- Số liệu được tìm và kiểm chứng chéo vào tháng 10/2026. Hầu hết có **độ tin cậy thấp**: giá lấy từ chào giá, bảng giá, báo chí; hao hụt lấy từ nghiên cứu khoa học (nhiều nghiên cứu làm trên loài hoặc sản phẩm gần giống). Mức giảm hao hụt khi dùng iERA đặt thấp và thận trọng vì chưa có nghiên cứu ở −60°C cho từng sản phẩm. Sản lượng 30 tấn/tháng chỉ là quy mô ví dụ. Chênh giá bán cao hơn (E) là giả định minh họa, luôn tắt mặc định. Khi có số đo thật từ các buổi cấp đông thử, hãy thay vào `PRODUCTS`.
- **Bảng giá máy tham khảo** (bán trực tiếp, ngày 10/08/2026, 1 JPY ≈ 170 VND) được nạp vào bước 4: giá từng model, cấu hình ECO 2000 một cửa hoặc 2 cửa, và phụ kiện xe đẩy, giá/kệ, ray. Tổng tiền đầu tư tự điền theo máy đã chọn nhân số máy cần dùng; khách vẫn gõ đè được. Bảng giá ghi hiệu lực 30 ngày, quá hạn thì công cụ tự cảnh báo. Khi có bảng giá mới, sửa `PRICE_LIST` và các trường `price`, `variants`, `accessories` trong `MODELS`. Giá chưa gồm khay nhôm lớn và bộ khay chống dính, lắp đặt, thi công điện, vận chuyển, thuế, phí nhập khẩu.
- Công cụ tính thêm **sản lượng cần để hoàn vốn trong 36 tháng** (`paybackMax`), hiện trong mục "Nói đơn giản" và bảng chi tiết khi hoàn vốn lâu hơn mức đó.

## Xuất bảng chi tiết (PDF, Excel)

Ở phần kết quả có nút **Xuất bảng chi tiết (PDF, Excel)**. Bấm vào mở bản xem trước dạng form A4, có logo KOBASHI và iERA, gồm:

1. Thông tin khách hàng (công ty, người liên hệ, SĐT/Zalo, người lập bảng). Các ô này gõ trực tiếp ở phía trên bản xem trước, bản xem trước tự cập nhật. Nếu khách đã điền form nhận tư vấn thì tên, SĐT, công ty được điền sẵn.
2. Bảng số liệu đầu vào đầy đủ (sản lượng, giá bán, giá mua, hao hụt, máy, đầu tư, chi phí, giả định).
3. Bảng kết quả, bảng so sánh ba mức đạt được (thận trọng, kỳ vọng, tối đa), bảng lời tích lũy theo mốc thời gian.
4. **Đánh giá sơ bộ "có nên đầu tư không"**: kết luận và danh sách tiêu chí đạt / lưu ý / chưa đạt (lời dương, vẫn lời ở mức thận trọng, hoàn vốn, giá mua thấp hơn giá bán, đã tính chi phí vận hành, mức giảm hao hụt có quá lạc quan không, lợi ích có phụ thuộc nhiều vào giá bán cao hơn không, công suất máy).
5. Công thức, giả định, phần chưa tính, chỗ ký tên, thông tin liên hệ KOBASHI.

Nút **In / Lưu PDF** mở hộp thoại in của trình duyệt; chọn "Lưu dưới dạng PDF" để có file PDF. Nút **Tải Excel (CSV)** tải file `KOBASHI-iERA-bang-danh-gia.csv` mở được bằng Excel và Google Sheets (có dòng `sep=;` để Excel tự tách cột; Google Sheets có thể hiện dòng này ở đầu file, xóa đi là được).

Ngưỡng đánh giá chỉnh trong `CONFIG`: `paybackGood` (mặc định 24 tháng, hoàn vốn trong mức này là tốt) và `paybackMax` (mặc định 36 tháng, quá mức này là chưa hấp dẫn). Logo được nhúng sẵn trong file (hằng `LOGOS`), không cần đường dẫn ảnh. Muốn đổi logo, thay hai chuỗi data URI trong `LOGOS`.

Sự kiện đo lường thêm: `iera_roi_report` (mở bảng), `iera_roi_report_print`, `iera_roi_report_csv`.

## Phân loại khách (cột "Mức độ" trong Google Sheet)

| Mức | Điều kiện |
|---|---|
| Nóng | Tự tick "muốn cấp đông thử" (ô này không tick sẵn), dự định mua trong 6 tháng, đã nhập tiền đầu tư, lợi mỗi tháng dương và hoàn vốn không quá `hotPaybackMonths` (mặc định 18 tháng) |
| Ấm | Muốn cấp đông thử, hoặc dự định mua trong 6 tháng |
| Lạnh | Còn lại |

Các câu hỏi thêm (tỉnh/thành, đang cấp đông bằng gì, thị trường, dự định mua, vai trò) nằm trong mục "Thêm thông tin để tư vấn đúng máy", không bắt buộc. Nếu đã cài Google Apps Script từ bản cũ, hãy dán lại toàn bộ `google-sheet-nhan-khach.gs` và triển khai phiên bản mới; Sheet cũ nên đổi tên hoặc tạo Sheet mới vì thứ tự cột đã thay đổi.
