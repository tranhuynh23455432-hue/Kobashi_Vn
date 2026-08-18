const DEFAULTS = {
  mode: "followCursor",
  restX: 50,
  restY: 50,
  focusY: 37,
  veilColor: "#000000",
  size: 400,
  visibility: 45,
  duration: 0.4,
  ease: [0.42, 0, 0.58, 1]
};

const FOLLOW = 40;

function numberFrom(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampFocus(value) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 50));
}

function supportsHoverPointer() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

function cubicBezierEase(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = function (t) {
    return ((ax * t + bx) * t + cx) * t;
  };
  const sampleY = function (t) {
    return ((ay * t + by) * t + cy) * t;
  };
  const dX = function (t) {
    return (3 * ax * t + 2 * bx) * t + cx;
  };
  return function (p) {
    let t = p;
    for (let i = 0; i < 8; i++) {
      const x = sampleX(t) - p;
      const d = dX(t);
      if (Math.abs(x) < 1e-4 || Math.abs(d) < 1e-6) break;
      t -= x / d;
    }
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return sampleY(t);
  };
}

function maskFor(x, y, size) {
  return "radial-gradient(circle " + size + "px at " + x + " " + y + ", transparent 0px, rgba(0,0,0,1) " + size + "px)";
}

function initSpotlightHero(root) {
  const src = root.dataset.spotlightHero;
  if (!src) return null;

  const mode = root.dataset.mode === "onImage" ? "onImage" : DEFAULTS.mode;
  const restX = numberFrom(root.dataset.restX, DEFAULTS.restX);
  const restY = numberFrom(root.dataset.restY, DEFAULTS.restY);
  const focusY = clampFocus(numberFrom(root.dataset.focusY, DEFAULTS.focusY));
  const veilColor = root.dataset.veilColor || DEFAULTS.veilColor;
  const size = numberFrom(root.dataset.size, DEFAULTS.size);
  const visibility = numberFrom(root.dataset.visibility, DEFAULTS.visibility);
  const duration = numberFrom(root.dataset.duration, DEFAULTS.duration);

  const img = document.createElement("img");
  img.className = "spotlight-hero__img";
  img.src = src;
  img.alt = "";
  img.draggable = false;
  img.style.objectPosition = "center " + focusY + "%";
  root.prepend(img);

  const veil = document.createElement("div");
  veil.className = "spotlight-hero__veil";
  veil.style.background = veilColor;
  veil.style.opacity = String(1 - visibility / 100);
  root.appendChild(veil);

  const interactive = supportsHoverPointer();
  root.classList.toggle("spotlight-hero--interactive", interactive);

  if (!interactive) {
    veil.style.display = "none";
    root.classList.add("spotlight-hero--ready");
    return null;
  }

  const ease = cubicBezierEase(DEFAULTS.ease[0], DEFAULTS.ease[1], DEFAULTS.ease[2], DEFAULTS.ease[3]);
  const durMs = Math.max(0.001, duration) * 1000;

  function restingPoint() {
    return {
      x: (root.clientWidth * restX) / 100,
      y: (root.clientHeight * restY) / 100
    };
  }

  function toLocal(event) {
    const bounds = root.getBoundingClientRect();
    const sx = bounds.width > 0 ? root.clientWidth / bounds.width : 1;
    const sy = bounds.height > 0 ? root.clientHeight / bounds.height : 1;
    return {
      x: (event.clientX - bounds.left) * sx,
      y: (event.clientY - bounds.top) * sy
    };
  }

  const current = restingPoint();
  const target = { x: current.x, y: current.y };
  let presence = mode === "onImage" ? 1 : 0;
  let animFrom = presence;
  let animTo = presence;
  let animStart = 0;
  let hovering = false;
  let raf = 0;
  let last = 0;
  let alive = true;

  function onMove(event) {
    const p = toLocal(event);
    if (!hovering && presence < 0.01) {
      current.x = p.x;
      current.y = p.y;
    }
    hovering = true;
    target.x = p.x;
    target.y = p.y;
  }

  function onLeave(event) {
    hovering = false;
    if (mode === "onImage") {
      const rest = restingPoint();
      target.x = rest.x;
      target.y = rest.y;
    } else {
      const p = toLocal(event);
      current.x = p.x;
      current.y = p.y;
      target.x = p.x;
      target.y = p.y;
    }
  }

  function frame(time) {
    if (!alive) return;
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 1 / 60;
    last = time;
    const follow = 1 - Math.pow(1 - FOLLOW / 100, dt * 60);
    current.x += (target.x - current.x) * follow;
    current.y += (target.y - current.y) * follow;

    const want = mode === "onImage" || hovering ? 1 : 0;
    if (want !== animTo) {
      animFrom = presence;
      animTo = want;
      animStart = time;
    }
    const p = Math.min(1, (time - animStart) / durMs);
    presence = animFrom + (animTo - animFrom) * ease(p);

    const radius = size * presence;
    if (radius < 0.5) {
      veil.style.maskImage = "none";
      veil.style.webkitMaskImage = "none";
    } else {
      const mask = maskFor(current.x + "px", current.y + "px", radius);
      veil.style.maskImage = mask;
      veil.style.webkitMaskImage = mask;
    }
    raf = requestAnimationFrame(frame);
  }

  let ro = null;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(function () {
      if (hovering) return;
      const rest = restingPoint();
      target.x = rest.x;
      target.y = rest.y;
    });
    ro.observe(root);
  }

  if (mode === "onImage") {
    veil.style.maskImage = maskFor(restX + "%", restY + "%", size);
    veil.style.webkitMaskImage = maskFor(restX + "%", restY + "%", size);
  }

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  raf = requestAnimationFrame(frame);
  root.classList.add("spotlight-hero--ready");

  return {
    destroy: function () {
      alive = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      img.remove();
      veil.remove();
    }
  };
}

function initAll() {
  const roots = Array.from(document.querySelectorAll("[data-spotlight-hero]"));
  roots.forEach(initSpotlightHero);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}
