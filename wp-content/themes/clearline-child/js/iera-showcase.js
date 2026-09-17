const SETTLE_DELAY = 120;
const WHEEL_SETTLE_DELAY = 160;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setupImageFallback(card) {
  const img = card.querySelector("img");
  if (!img) {
    return;
  }

  function showFallback() {
    if (card.classList.contains("is-broken")) {
      return;
    }
    card.classList.add("is-broken");
    const fallback = document.createElement("div");
    fallback.className = "p-iera-showcase__card-fallback";
    fallback.textContent = card.dataset.model || "";
    card.appendChild(fallback);
  }

  if (img.complete && img.naturalWidth === 0) {
    showFallback();
  } else {
    img.addEventListener("error", showFallback);
  }
}

function initShowcase(root) {
  const viewport = root.querySelector(".p-iera-showcase__viewport");
  const track = root.querySelector(".p-iera-showcase__track");
  const cards = Array.prototype.slice.call(
    root.querySelectorAll(".p-iera-showcase__card")
  );
  const panels = Array.prototype.slice.call(
    root.querySelectorAll(".p-iera-showcase__spec")
  );
  const dots = Array.prototype.slice.call(
    root.querySelectorAll(".js-iera-showcase-dot")
  );
  const prevButton = root.querySelector(".js-iera-showcase-prev");
  const nextButton = root.querySelector(".js-iera-showcase-next");

  if (!viewport || !track || !cards.length) {
    return;
  }

  cards.forEach(setupImageFallback);

  const count = cards.length;
  let activeIndex = clamp(parseInt(root.dataset.active, 10) || 0, 0, count - 1);
  let settleTimer = null;
  let interactionTimer = null;
  let isPointerDown = false;
  let pointerId = null;
  let dragStartX = 0;
  let dragStartScroll = 0;

  function centerFor(card) {
    return card.offsetLeft + card.offsetWidth / 2;
  }

  function nearestIndex() {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let closest = 0;
    let minDistance = Infinity;
    cards.forEach(function (card, i) {
      const distance = Math.abs(centerFor(card) - center);
      if (distance < minDistance) {
        minDistance = distance;
        closest = i;
      }
    });
    return closest;
  }

  function updateParallax() {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    cards.forEach(function (card) {
      const distance = Math.abs(centerFor(card) - center);
      const norm = clamp(distance / (card.offsetWidth + 22), 0, 1.6);
      const scale = 1 - norm * 0.16;
      const opacity = 1 - norm * 0.55;
      card.style.transform = "scale(" + scale.toFixed(3) + ")";
      card.style.opacity = opacity.toFixed(3);
    });
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
    const target = panels[index];
    if (!target) {
      return;
    }
    target.classList.remove("is-leaving", "is-active");
    void target.offsetWidth;
    target.classList.add("is-active");
  }

  function updateDots(index) {
    dots.forEach(function (dot, i) {
      const active = i === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function updateCards(index) {
    cards.forEach(function (card, i) {
      card.classList.toggle("is-active", i === index);
      card.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function applyActiveState(index) {
    activeIndex = clamp(index, 0, count - 1);
    activatePanel(activeIndex);
    updateDots(activeIndex);
    updateCards(activeIndex);
    root.dataset.active = String(activeIndex);
    if (prevButton) {
      prevButton.disabled = activeIndex === 0;
    }
    if (nextButton) {
      nextButton.disabled = activeIndex === count - 1;
    }
  }

  function scrollToIndex(index, smooth) {
    const target = clamp(index, 0, count - 1);
    const card = cards[target];
    const left = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
    viewport.scrollTo({
      left: left,
      behavior: smooth === false ? "auto" : "smooth",
    });
    applyActiveState(target);
  }

  function nudge(step) {
    scrollToIndex(activeIndex + step, true);
  }

  function onScroll() {
    updateParallax();
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(function () {
      const nearest = nearestIndex();
      if (nearest !== activeIndex) {
        applyActiveState(nearest);
      }
    }, SETTLE_DELAY);
  }

  viewport.addEventListener("scroll", onScroll, { passive: true });

  function beginInteraction() {
    window.clearTimeout(interactionTimer);
    viewport.classList.add("is-dragging");
  }

  function endInteractionSoon(delay) {
    window.clearTimeout(interactionTimer);
    interactionTimer = window.setTimeout(function () {
      viewport.classList.remove("is-dragging");
      scrollToIndex(nearestIndex(), true);
    }, delay);
  }

  viewport.addEventListener(
    "wheel",
    function (event) {
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (delta === 0) {
        return;
      }
      beginInteraction();
      viewport.scrollLeft += delta;
      endInteractionSoon(WHEEL_SETTLE_DELAY);
      event.preventDefault();
    },
    { passive: false }
  );

  function onPointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }
    isPointerDown = true;
    pointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartScroll = viewport.scrollLeft;
    beginInteraction();
    if (typeof viewport.setPointerCapture === "function") {
      try {
        viewport.setPointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture can fail if native scrolling already claimed it.
      }
    }
  }

  function onPointerMove(event) {
    if (!isPointerDown || event.pointerId !== pointerId) {
      return;
    }
    const dx = event.clientX - dragStartX;
    viewport.scrollLeft = dragStartScroll - dx;
  }

  function onPointerUp(event) {
    if (!isPointerDown || (event && event.pointerId !== pointerId)) {
      return;
    }
    isPointerDown = false;
    pointerId = null;
    endInteractionSoon(0);
  }

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", onPointerUp);
  viewport.addEventListener("pointercancel", onPointerUp);
  viewport.addEventListener("lostpointercapture", onPointerUp);

  viewport.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudge(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nudge(1);
    }
  });

  if (prevButton) {
    prevButton.addEventListener("click", function () {
      nudge(-1);
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", function () {
      nudge(1);
    });
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      scrollToIndex(i, true);
    });
  });

  function onResize() {
    scrollToIndex(activeIndex, false);
    updateParallax();
  }

  if (typeof ResizeObserver === "function") {
    let resizeTimer = null;
    const observer = new ResizeObserver(function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(onResize, 100);
    });
    observer.observe(viewport);
  } else {
    window.addEventListener("resize", onResize);
  }

  window.requestAnimationFrame(function () {
    scrollToIndex(activeIndex, false);
    updateParallax();
    root.classList.add("is-ready");
  });
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
