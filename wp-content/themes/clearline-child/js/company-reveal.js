/* =========================================================
Company page — cinematic scroll reveal
Vanilla JS, no dependencies. Progressive enhancement: every
element this touches is fully visible by default in CSS and
is only hidden by the "is-inview" class this file adds, so a
JS failure never leaves content permanently invisible.
========================================================= */
(function () {
  "use strict";

  var page = document.querySelector(".p-company");
  if (!page) return;

  var reduceMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  var reducedMotion = Boolean(reduceMotionQuery && reduceMotionQuery.matches);

  function revealNow(el) {
    el.classList.add("is-inview");
  }

  function observeReveal(elements, options) {
    var list = elements && elements.length ? Array.prototype.slice.call(elements) : [];
    if (!list.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      list.forEach(revealNow);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealNow(entry.target);
        observer.unobserve(entry.target);
      });
    }, options || { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    list.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- Section titles ----
  observeReveal(page.querySelectorAll(".p-company-section-ttl"));

  // ---- Photos, history images, CEO signature ----
  observeReveal(
    page.querySelectorAll(
      ".p-company-section-photo__in, .p-company-section-item-img__in, .p-company-section-name"
    )
  );

  // ---- Access map cards ----
  (function () {
    var mapItems = page.querySelectorAll(".p-company-section-map-item");
    Array.prototype.forEach.call(mapItems, function (item, index) {
      item.style.transitionDelay = (index % 3) * 90 + "ms";
    });
    observeReveal(mapItems, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  })();

  // ---- Info / History list items: staggered cascade ----
  (function () {
    var lists = page.querySelectorAll(".p-company-section-list");
    Array.prototype.forEach.call(lists, function (list) {
      var items = Array.prototype.filter.call(list.children, function (child) {
        return child.classList.contains("p-company-section-item");
      });
      items.forEach(function (item, index) {
        item.style.transitionDelay = (index % 4) * 70 + "ms";
      });
      observeReveal(items, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    });
  })();

  // ---- Quote headline: split into per-line masks ----
  (function () {
    if (reducedMotion) return;

    var quotes = page.querySelectorAll(".p-company-section-read");
    if (!quotes.length) return;

    function splitIntoLines(paragraph) {
      var flatItems = [];

      Array.prototype.forEach.call(paragraph.childNodes, function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          var chunks = node.textContent.split(/(\s+)/).filter(function (chunk) {
            return chunk.length > 0;
          });
          chunks.forEach(function (chunk) {
            if (/^\s+$/.test(chunk)) {
              flatItems.push({ type: "space", text: chunk });
            } else {
              var span = document.createElement("span");
              span.className = "c-reveal-word";
              span.textContent = chunk;
              flatItems.push({ type: "word", el: span });
            }
          });
        } else if (node.nodeName === "BR") {
          flatItems.push({ type: "break", className: node.className });
        }
      });

      if (!flatItems.some(function (item) { return item.type === "word"; })) {
        return false;
      }

      // Lay the words out first so we can read back which visual line
      // each one landed on (respects responsive <br> and viewport width).
      var measureFragment = document.createDocumentFragment();
      flatItems.forEach(function (item) {
        if (item.type === "word") {
          measureFragment.appendChild(item.el);
        } else if (item.type === "space") {
          measureFragment.appendChild(document.createTextNode(item.text));
        } else if (item.type === "break") {
          var br = document.createElement("br");
          br.className = item.className || "";
          measureFragment.appendChild(br);
        }
      });
      paragraph.textContent = "";
      paragraph.appendChild(measureFragment);

      var lines = [];
      var lastTop = null;
      flatItems.forEach(function (item) {
        if (item.type !== "word") return;
        var top = item.el.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > 4) {
          lines.push([]);
          lastTop = top;
        }
        lines[lines.length - 1].push(item.el);
      });

      if (!lines.length) return false;

      paragraph.textContent = "";
      lines.forEach(function (words, lineIndex) {
        var lineWrap = document.createElement("span");
        lineWrap.className = "c-reveal-line";
        var lineInner = document.createElement("span");
        lineInner.className = "c-reveal-line__inner";
        lineInner.style.transitionDelay = lineIndex * 90 + "ms";
        words.forEach(function (wordEl, wordIndex) {
          lineInner.appendChild(wordEl);
          if (wordIndex < words.length - 1) {
            lineInner.appendChild(document.createTextNode(" "));
          }
        });
        lineWrap.appendChild(lineInner);
        paragraph.appendChild(lineWrap);
      });

      return true;
    }

    var ready = [];
    quotes.forEach(function (quote) {
      try {
        if (splitIntoLines(quote)) ready.push(quote);
      } catch (error) {
        /* leave the paragraph as plain, fully visible text */
      }
    });

    observeReveal(ready, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });
  })();

  // ---- History timeline progress line (desktop only) ----
  (function () {
    var historyList = page.querySelector(".p-company-section-list--his");
    if (!historyList || reducedMotion) return;
    if (
      typeof window.matchMedia !== "function" ||
      !window.matchMedia("(min-width: 992px)").matches
    ) {
      return;
    }

    var ticking = false;
    function updateProgress() {
      ticking = false;
      var rect = historyList.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      var total = rect.height + viewportHeight * 0.5;
      var covered = viewportHeight * 0.75 - rect.top;
      var percent = total > 0 ? (covered / total) * 100 : 0;
      percent = Math.max(0, Math.min(100, percent));
      historyList.style.setProperty("--history-progress", String(percent));
    }

    function queueUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgress);
    }

    updateProgress();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
  })();

  // ---- Number counters ----
  (function () {
    var counters = page.querySelectorAll(".js-count");
    if (!counters.length) return;

    function animateCounter(el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      if (!isFinite(target)) return;
      var suffix = el.getAttribute("data-count-suffix") || "";

      if (reducedMotion) {
        el.textContent = target.toLocaleString("en-US") + suffix;
        return;
      }

      var duration = 1200;
      var start = null;
      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(target * eased);
        el.textContent = value.toLocaleString("en-US") + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString("en-US") + suffix;
        }
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }

    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          counterObserver.unobserve(entry.target);
          animateCounter(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  })();
})();
