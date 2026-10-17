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
      .p-iera-roi__sum { list-style: none; cursor: pointer; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 18px; background: #fff; border: 1px solid rgba(119,108,102,.14); border-radius: 18px; padding: 18px 20px 18px 18px; box-shadow: 0 1px 2px rgba(71,63,59,.04), 0 14px 36px rgba(71,63,59,.07); transition: border-color .2s, box-shadow .2s; }
      .p-iera-roi__sum::-webkit-details-marker { display: none; }
      .p-iera-roi__sum:focus-visible { outline: 3px solid rgba(86,185,201,.55); outline-offset: 3px; }
      .p-iera-roi__ico { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(145deg, #EEF7FB, #DCEEF4); color: #005BAC; display: grid; place-items: center; box-shadow: inset 0 0 0 1px rgba(0,91,172,.08); }
      .p-iera-roi__txt { min-width: 0; display: grid; gap: 3px; }
      .p-iera-roi__eyebrow { display: flex; align-items: center; gap: 10px; font: 700 11px/1.4 "Be Vietnam Pro", "Noto Sans", sans-serif; letter-spacing: .18em; text-transform: uppercase; color: #8c817b; }
      .p-iera-roi__eyebrow::before { content: ""; flex: none; width: 28px; height: 3px; border-radius: 2px; background: linear-gradient(90deg, #5DB443 0 14.28%%, #E3262B 0 28.57%%, #F5D400 0 42.85%%, #5CC3DA 0 57.14%%, #9A5BB5 0 71.42%%, #F08A24 0 85.71%%, #005BAC 0); }
      .p-iera-roi__ttl { margin: 0; font-family: "Be Vietnam Pro", "Noto Sans", sans-serif; font-size: 18px; font-weight: 800; line-height: 1.35; color: #231815; letter-spacing: 0; }
      .p-iera-roi__sub { margin: 0; font-size: 13.5px; line-height: 1.55; color: #776c66; letter-spacing: 0; }
      .p-iera-roi__state { display: inline-flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 6px 0 18px; border: 1px solid rgba(119,108,102,.22); border-radius: 999px; font: 700 14px/1 "Be Vietnam Pro", "Noto Sans", sans-serif; color: #005BAC; letter-spacing: .01em; white-space: nowrap; transition: border-color .2s, background-color .2s; }
      .p-iera-roi__state::before { content: "Mở công cụ"; }
      .p-iera-roi__state::after { content: ""; flex: none; width: 30px; height: 30px; border-radius: 50%%; background: #005BAC url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%%3E%%3Cpath d='m7 10 5 5 5-5'/%%3E%%3C/svg%%3E") center / 16px no-repeat; transition: transform .25s; }
      .p-iera-roi__details[open] .p-iera-roi__state::before { content: "Thu gọn"; }
      .p-iera-roi__details[open] .p-iera-roi__state::after { transform: rotate(180deg); }
      .p-iera-roi__details[open] .p-iera-roi__sum { margin-bottom: 16px; }
      @media (hover: hover) {
        .p-iera-roi__sum:hover { border-color: rgba(0,91,172,.26); box-shadow: 0 1px 2px rgba(71,63,59,.04), 0 18px 40px rgba(0,67,127,.10); }
        .p-iera-roi__sum:hover .p-iera-roi__state { border-color: #005BAC; background: #F2F8FD; }
      }
      .p-iera-roi #iera-roi .title { display: none; }
      @media (max-width: 560px) {
        .p-iera-roi__sub { display: none; }
        .p-iera-roi__sum { gap: 14px; padding: 14px; }
        .p-iera-roi__ico { width: 42px; height: 42px; border-radius: 12px; }
        .p-iera-roi__ttl { font-size: 16px; }
        .p-iera-roi__eyebrow { font-size: 10px; letter-spacing: .14em; }
        .p-iera-roi__state { padding: 0; border: 0; min-height: 0; }
        .p-iera-roi__state::before { content: none !important; }
      }
      @media (prefers-reduced-motion: reduce) { .p-iera-roi__sum, .p-iera-roi__state, .p-iera-roi__state::after { transition: none; } }
    </style>
    <div class="l-container l-container--wide">
      <div class="p-iera-roi__box">
        <details class="p-iera-roi__details">
          <summary class="p-iera-roi__sum">
            <span class="p-iera-roi__ico" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7.5h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg></span>
            <span class="p-iera-roi__txt">
              <span class="p-iera-roi__eyebrow">Công cụ miễn phí · 4 bước</span>
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
