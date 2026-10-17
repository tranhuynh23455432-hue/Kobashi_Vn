/**
 * KOBASHI · Nhận thông tin khách từ công cụ tính lợi ích iERA vào Google Sheet
 *
 * Cách cài (5 phút):
 * 1. Tạo một Google Sheet mới, đặt tên ví dụ "Khách tính ROI iERA".
 * 2. Menu Tiện ích mở rộng → Apps Script. Xóa hết code mẫu, dán toàn bộ file này vào, bấm Lưu.
 * 3. (Tùy chọn) Điền email nhận thông báo vào NOTIFY_EMAIL bên dưới.
 * 4. Bấm Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web.
 *      Thực thi với tư cách: Tôi
 *      Người có quyền truy cập: Bất kỳ ai
 *    Bấm Triển khai, cấp quyền, rồi sao chép "URL ứng dụng web" (dạng https://script.google.com/macros/s/.../exec).
 * 5. Dán URL đó vào CONFIG.leadEndpoint trong file iera-roi-widget.html.
 */

const NOTIFY_EMAIL = ''; // ví dụ 'info-vn@kobashidenko.com' — để trống nếu không cần email báo

const COLUMNS = [
  ['time', 'Thời gian'], ['muc_do', 'Mức độ (Nóng/Ấm/Lạnh)'], ['name', 'Họ tên'], ['phone', 'SĐT / Zalo'], ['company', 'Công ty'],
  ['vai_tro', 'Vai trò'], ['tinh', 'Tỉnh / thành'], ['trial', 'Muốn cấp đông thử'], ['du_dinh_mua', 'Dự định mua'],
  ['product', 'Nhóm sản phẩm'], ['ten_san_pham', 'Tên sản phẩm'], ['thi_truong', 'Thị trường'], ['dang_cap_dong', 'Đang cấp đông bằng'], ['model', 'Máy quan tâm'],
  ['A_kg_thang', 'Sản lượng (kg/tháng)'], ['B_gia', 'Giá bán (đ/kg)'], ['V_gia_mua', 'Giá mua (đ/kg)'], ['cach_tinh', 'Cách tính hàng giữ lại'], ['C_hao_hut', 'Hao hụt hiện tại (%)'],
  ['D_hao_hut_iera', 'Hao hụt với iERA (%)'], ['S_ban_giam_gia', 'Hao hụt bán giảm giá (%)'], ['G_muc_giam', 'Mức giảm giá (%)'],
  ['E_chenh_gia', 'Chênh giá (đ/kg)'], ['kich_ban', 'Mức đạt được'], ['so_may', 'Số máy'], ['gia_dien', 'Giá điện (đ/kWh)'], ['dau_tu', 'Đầu tư (đ)'],
  ['chi_phi_van_hanh', 'Chi phí vận hành (đ/tháng)'], ['loi_thang', 'Lợi mỗi tháng (đ)'],
  ['loi_thang_thap', 'Lợi tháng, thận trọng (đ)'], ['loi_thang_cao', 'Lợi tháng, tối đa (đ)'],
  ['hoan_von_thang', 'Hoàn vốn (tháng)'], ['page', 'Trang web'],
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS.map(c => c[1]));
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    }
    // Thêm dấu ' trước SĐT để Google Sheet không xóa số 0 ở đầu
    const row = COLUMNS.map(([key]) => {
      if (key === 'time') return new Date();
      if (key === 'phone') return "'" + String(data.phone || '');
      return data[key] === undefined ? '' : data[key];
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        `[iERA · ${data.muc_do || '?'}] Khách mới: ${data.name || 'Chưa để tên'} · ${data.phone}`,
        `${data.summary || ''}\n\nMức độ: ${data.muc_do}\nHọ tên: ${data.name}\nSĐT: ${data.phone}\nCông ty: ${data.company}\nVai trò: ${data.vai_tro}\nTỉnh/thành: ${data.tinh}\nĐang cấp đông bằng: ${data.dang_cap_dong}\nThị trường: ${data.thi_truong}\nDự định mua: ${data.du_dinh_mua}\nMuốn cấp đông thử: ${data.trial}\nTrang: ${data.page}`);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
