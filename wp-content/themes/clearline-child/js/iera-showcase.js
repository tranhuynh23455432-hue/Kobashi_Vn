function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setupImageFallback(img, label) {
  if (!img) {
    return;
  }
  function showFallback() {
    if (img.dataset.fallbackApplied) {
      return;
    }
    img.dataset.fallbackApplied = "1";
    img.style.visibility = "hidden";
    var fallback = document.createElement("span");
    fallback.className = "p-iera-showcase__photo-fallback";
    fallback.textContent = label || "";
    if (img.parentNode) {
      img.parentNode.style.position = "relative";
      img.parentNode.appendChild(fallback);
    }
  }
  if (img.complete && img.naturalWidth === 0) {
    showFallback();
  } else {
    img.addEventListener("error", showFallback);
  }
}

function initShowcase(root) {
  var tabs = Array.prototype.slice.call(
    root.querySelectorAll(".js-iera-showcase-tab")
  );
  var panels = Array.prototype.slice.call(
    root.querySelectorAll(".p-iera-showcase__spec")
  );
  var status = root.querySelector(".p-iera-showcase__status");

  if (!tabs.length || !panels.length) {
    return;
  }

  panels.forEach(function (panel) {
    setupImageFallback(
      panel.querySelector(".p-iera-showcase__photo img"),
      panel.querySelector(".p-iera-showcase__spec-name")
        ? panel.querySelector(".p-iera-showcase__spec-name").textContent
        : ""
    );
  });

  var count = tabs.length;

  function hashOf(index) {
    return tabs[index] ? tabs[index].dataset.hash : "";
  }

  function indexFromHash() {
    var hash = window.location.hash.replace("#", "");
    if (!hash) {
      return -1;
    }
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].dataset.hash === hash) {
        return i;
      }
    }
    return -1;
  }

  function activatePanel(index) {
    panels.forEach(function (panel, i) {
      if (i === index) {
        return;
      }
      if (panel.classList.contains("is-active")) {
        panel.classList.remove("is-active");
        panel.classList.add("is-leaving");
        window.setTimeout(function () {
          panel.classList.remove("is-leaving");
        }, 340);
      }
    });
    var target = panels[index];
    if (!target) {
      return;
    }
    target.classList.remove("is-leaving", "is-active");
    void target.offsetWidth;
    target.classList.add("is-active");
  }

  function updateTabs(index) {
    tabs.forEach(function (tab, i) {
      var active = i === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.setAttribute("tabindex", active ? "0" : "-1");
    });
  }

  var announceTemplate = root.dataset.announceTemplate || "{model}";

  function updateStatus(index) {
    if (!status) {
      return;
    }
    var nameEl = tabs[index]
      ? tabs[index].querySelector(".p-iera-showcase__tab-name")
      : null;
    status.textContent = announceTemplate.replace(
      "{model}",
      nameEl ? nameEl.textContent : ""
    );
  }

  var activeIndex = -1;

  function setActive(index, opts) {
    opts = opts || {};
    index = clamp(index, 0, count - 1);
    activeIndex = index;
    activatePanel(index);
    updateTabs(index);
    updateStatus(index);
    root.dataset.active = String(index);
    if (opts.scroll !== false && tabs[index].scrollIntoView) {
      tabs[index].scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: opts.smooth === false ? "auto" : "smooth",
      });
    }
    if (opts.focus) {
      tabs[index].focus();
    }
    if (opts.hash !== false && window.history && window.history.replaceState) {
      var newHash = "#" + hashOf(index);
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      setActive(i, { focus: false });
    });
  });

  root.addEventListener("keydown", function (event) {
    var key = event.key;
    var current = activeIndex < 0 ? 0 : activeIndex;
    if (key === "ArrowRight" || key === "ArrowDown") {
      event.preventDefault();
      setActive((current + 1) % count, { focus: true });
    } else if (key === "ArrowLeft" || key === "ArrowUp") {
      event.preventDefault();
      setActive((current - 1 + count) % count, { focus: true });
    } else if (key === "Home") {
      event.preventDefault();
      setActive(0, { focus: true });
    } else if (key === "End") {
      event.preventDefault();
      setActive(count - 1, { focus: true });
    }
  });

  window.addEventListener("hashchange", function () {
    var idx = indexFromHash();
    if (idx >= 0 && idx !== activeIndex) {
      setActive(idx, { focus: false, hash: false });
    }
  });

  var initialIndex = indexFromHash();
  if (initialIndex < 0) {
    initialIndex = clamp(parseInt(root.dataset.active, 10) || 0, 0, count - 1);
  }
  setActive(initialIndex, { focus: false, scroll: false, hash: false });
  root.classList.add("is-ready");
}

function initAll() {
  Array.prototype.slice
    .call(document.querySelectorAll(".js-iera-showcase"))
    .forEach(initShowcase);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}
