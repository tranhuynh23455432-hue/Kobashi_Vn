#!/usr/bin/env python3
"""
Nhúng (hoặc cập nhật) công cụ tính lợi ích iERA vào trang iERA tiếng Việt, ngay dưới phần "ECO Series – Các model".

Nguồn gốc duy nhất của công cụ là wp-content/roi/iera-roi-widget.html. Sau khi sửa file đó, chạy lại:

    python wp-content/roi/embed-into-page.py

Script thay nội dung giữa hai dấu <!-- IERA-ROI:START --> và <!-- IERA-ROI:END --> trong vi/Iera/iera.html.
Lần chạy đầu tiên (chưa có dấu) nó chèn khối mới ngay sau thẻ </section> của phần p-iera-showcase.
Có thể truyền đường dẫn trang khác: python embed-into-page.py đường/dẫn/iera.html
"""
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIDGET = ROOT / "wp-content" / "roi" / "iera-roi-widget.html"
PAGE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "vi" / "Iera" / "iera.html"
START, END = "<!-- IERA-ROI:START -->", "<!-- IERA-ROI:END -->"

WRAPPER = """%(start)s
  <section class="p-iera-roi" id="iera-roi-calc" aria-labelledby="iera-roi-title">
    <style>
      .p-iera-roi { background: #f7f8f7; padding: 0 0 44px; color: #776c66; }
      .p-iera-roi__box { max-width: 1180px; margin: 0 auto; }
      .p-iera-roi__sum { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid rgba(119,108,102,.18); border-radius: 18px; padding: 16px 18px; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(16,24,40,.05); transition: box-shadow .2s, border-color .2s; }
      .p-iera-roi__sum::-webkit-details-marker { display: none; }
      .p-iera-roi__sum:hover { border-color: #56b9c9; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 10px 28px rgba(86,185,201,.18); }
      .p-iera-roi__sum:focus-visible { outline: 3px solid #005BAC; outline-offset: 3px; }
      .p-iera-roi__ico { flex: none; width: 44px; height: 44px; border-radius: 12px; background: rgba(86,185,201,.16); color: #005BAC; display: grid; place-items: center; }
      .p-iera-roi__txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
      .p-iera-roi__ttl { margin: 0; font-family: var(--font-heading); font-size: 18px; font-weight: 700; line-height: 1.3; color: #231815; letter-spacing: 0; }
      .p-iera-roi__sub { margin: 0; font-size: 13px; line-height: 1.5; color: #8c817b; letter-spacing: 0; }
      .p-iera-roi__state { flex: none; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #005BAC; letter-spacing: 0; white-space: nowrap; }
      .p-iera-roi__state::before { content: "Mở ra"; }
      .p-iera-roi__state::after { content: ""; width: 9px; height: 9px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg); margin-top: -4px; transition: transform .2s; }
      .p-iera-roi__details[open] .p-iera-roi__state::before { content: "Thu gọn"; }
      .p-iera-roi__details[open] .p-iera-roi__state::after { transform: rotate(-135deg); margin-top: 4px; }
      .p-iera-roi__details[open] .p-iera-roi__sum { margin-bottom: 16px; }
      .p-iera-roi #iera-roi .title { display: none; }
      @media (max-width: 560px) {
        .p-iera-roi__sub { display: none; }
        .p-iera-roi__sum { padding: 14px; gap: 12px; }
        .p-iera-roi__state::before { content: none !important; }
      }
      @media (prefers-reduced-motion: reduce) { .p-iera-roi__sum, .p-iera-roi__state::after { transition: none; } }
    </style>
    <div class="l-container l-container--wide">
      <div class="p-iera-roi__box">
        <details class="p-iera-roi__details">
          <summary class="p-iera-roi__sum">
            <span class="p-iera-roi__ico" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7.5h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg></span>
            <span class="p-iera-roi__txt">
              <h2 class="p-iera-roi__ttl" id="iera-roi-title">Tính nhanh lợi ích khi dùng iERA</h2>
              <span class="p-iera-roi__sub">Trả lời 4 câu hỏi để xem mỗi tháng lời thêm bao nhiêu và bao lâu thì hoàn vốn.</span>
            </span>
            <span class="p-iera-roi__state" aria-hidden="true"></span>
          </summary>
%(widget)s
        </details>
      </div>
    </div>
    <script>
      (function () {
        var d = document.querySelector('.p-iera-roi__details');
        if (!d) return;
        // Mở sẵn khi có đường dẫn trực tiếp tới công cụ (ví dụ gửi link cho khách qua Zalo)
        function openIfHash() { if (location.hash === '#iera-roi-calc') d.open = true; }
        openIfHash();
        addEventListener('hashchange', openIfHash);
        d.addEventListener('toggle', function () {
          if (d.open && window.dataLayer) window.dataLayer.push({ event: 'iera_roi_open' });
        });
      })();
    </script>
  </section>
%(end)s"""


def main():
    widget = io.open(WIDGET, encoding="utf-8").read()
    widget = re.sub(r"^\s*<!--.*?-->\s*", "", widget, count=1, flags=re.S)  # bỏ chú thích hướng dẫn dán ở đầu file
    block = WRAPPER % {"start": START, "end": END, "widget": widget.strip()}

    html = io.open(PAGE, encoding="utf-8").read()
    if START in html and END in html:
        a, b = html.index(START), html.index(END) + len(END)
        html = html[:a] + block + html[b:]
        action = "Đã cập nhật"
    else:
        i = html.find('class="p-iera-showcase"')
        if i < 0:
            sys.exit("Không tìm thấy phần p-iera-showcase trong " + str(PAGE))
        j = html.index("</section>", i) + len("</section>")
        html = html[:j] + "\n\n\n  " + block + html[j:]
        action = "Đã chèn"
    io.open(PAGE, "w", encoding="utf-8", newline="").write(html)
    print(f"{action} khối ROI vào {PAGE}")


if __name__ == "__main__":
    main()
