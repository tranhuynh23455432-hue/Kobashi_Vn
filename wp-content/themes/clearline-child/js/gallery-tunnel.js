import * as THREE from "./vendor/three.module.min.js";

const DEFAULT_IMAGE_NAMES = [
  "LINE_20260729_161507.jpg",
  "LINE_20260729_161603.jpg",
  "LINE_20260729_161636.jpg",
  "LINE_20260729_161704.jpg",
  "LINE_20260729_161733.jpg",
  "LINE_20260729_161801.jpg",
  "LINE_20260729_161843.jpg",
  "LINE_20260729_161918.jpg"
];

const DEFAULT_IMAGES = DEFAULT_IMAGE_NAMES.map(function (name) {
  return new URL("../images/const/GALLERY/" + name, import.meta.url).href;
});

const DEFAULTS = {
  background: "#000000",
  lineColor: "#b0b0b0",
  lineOpacity: 50,
  colors: ["#e71e19", "#17499d", "#71c7d5", "#efea3a", "#6ab82d", "#ed8f26"],
  grid: 4,
  speed: 33,
  boost: 100,
  fade: 93,
  label: true,
  labelText: "NHẤN GIỮ ĐỂ TĂNG TỐC",
  labelFill: "#ffffff",
  labelColor: "#050505",
  labelFontFamily: '"Be Vietnam Pro", sans-serif',
  labelFontSize: 13,
  labelFontWeight: 700
};

const TUNNEL_WIDTH = 4.4;
const TUNNEL_HEIGHT = 2.8;
const SEGMENT_DEPTH = 1.1;
const SEGMENT_COUNT = 22;
const TEXTURE_FADE_SECONDS = 0.8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numberFrom(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

function booleanFrom(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return value !== "false" && value !== "0";
}

function shuffle(items) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    const held = result[index];
    result[index] = result[next];
    result[next] = held;
  }
  return result;
}

function getConfig(root) {
  const globalConfig = window.GALLERY_TUNNEL_CONFIG || {};
  const data = root.dataset;
  return {
    background: data.background || globalConfig.background || DEFAULTS.background,
    lineColor: data.lineColor || globalConfig.lineColor || DEFAULTS.lineColor,
    lineOpacity: numberFrom(
      data.lineOpacity ?? globalConfig.lineOpacity,
      DEFAULTS.lineOpacity,
      0,
      100
    ),
    colors:
      Array.isArray(globalConfig.colors) && globalConfig.colors.length
        ? globalConfig.colors
        : DEFAULTS.colors,
    images:
      Array.isArray(globalConfig.images) && globalConfig.images.length
        ? globalConfig.images
        : DEFAULT_IMAGES,
    grid: Math.round(numberFrom(data.grid ?? globalConfig.grid, DEFAULTS.grid, 1, 8)),
    speed: numberFrom(data.speed ?? globalConfig.speed, DEFAULTS.speed, 0, 100),
    boost: numberFrom(data.boost ?? globalConfig.boost, DEFAULTS.boost, 0, 200),
    fade: numberFrom(data.fade ?? globalConfig.fade, DEFAULTS.fade, 0, 100),
    label: booleanFrom(data.label ?? globalConfig.label, DEFAULTS.label),
    labelText: data.labelText || globalConfig.labelText || DEFAULTS.labelText,
    labelFill: data.labelFill || globalConfig.labelFill || DEFAULTS.labelFill,
    labelColor: data.labelColor || globalConfig.labelColor || DEFAULTS.labelColor,
    labelFontFamily:
      data.labelFontFamily || globalConfig.labelFontFamily || DEFAULTS.labelFontFamily,
    labelFontSize: numberFrom(
      data.labelFontSize ?? globalConfig.labelFontSize,
      DEFAULTS.labelFontSize,
      9,
      32
    ),
    labelFontWeight: numberFrom(
      data.labelFontWeight ?? globalConfig.labelFontWeight,
      DEFAULTS.labelFontWeight,
      100,
      900
    )
  };
}

function createLineGeometry(columns, rows) {
  const points = [];
  const halfWidth = TUNNEL_WIDTH / 2;
  const halfHeight = TUNNEL_HEIGHT / 2;
  const addLine = function (ax, ay, az, bx, by, bz) {
    points.push(ax, ay, az, bx, by, bz);
  };

  for (let column = 0; column <= columns; column += 1) {
    const x = -halfWidth + (TUNNEL_WIDTH * column) / columns;
    addLine(x, -halfHeight, 0, x, -halfHeight, -SEGMENT_DEPTH);
    addLine(x, halfHeight, 0, x, halfHeight, -SEGMENT_DEPTH);
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = -halfHeight + (TUNNEL_HEIGHT * row) / rows;
    addLine(-halfWidth, y, 0, -halfWidth, y, -SEGMENT_DEPTH);
    addLine(halfWidth, y, 0, halfWidth, y, -SEGMENT_DEPTH);
  }

  addLine(-halfWidth, -halfHeight, -SEGMENT_DEPTH, halfWidth, -halfHeight, -SEGMENT_DEPTH);
  addLine(-halfWidth, halfHeight, -SEGMENT_DEPTH, halfWidth, halfHeight, -SEGMENT_DEPTH);
  addLine(-halfWidth, -halfHeight, -SEGMENT_DEPTH, -halfWidth, halfHeight, -SEGMENT_DEPTH);
  addLine(halfWidth, -halfHeight, -SEGMENT_DEPTH, halfWidth, halfHeight, -SEGMENT_DEPTH);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

function buildTunnel(root) {
  const config = getConfig(root);
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  const veil = document.createElement("div");
  const cursor = document.createElement("span");

  canvas.className = "gallery-tunnel__canvas";
  canvas.setAttribute("aria-hidden", "true");
  veil.className = "gallery-tunnel__veil";
  veil.setAttribute("aria-hidden", "true");
  cursor.className = "gallery-tunnel__cursor";
  cursor.textContent = config.labelText;
  cursor.setAttribute("aria-hidden", "true");
  cursor.style.backgroundColor = config.labelFill;
  cursor.style.color = config.labelColor;
  cursor.style.fontFamily = config.labelFontFamily;
  cursor.style.fontSize = config.labelFontSize + "px";
  cursor.style.fontWeight = String(config.labelFontWeight);

  root.prepend(veil);
  root.prepend(canvas);
  if (config.label) root.append(cursor);

  root.classList.add("gallery-tunnel--active");
  root.classList.toggle("gallery-tunnel--with-label", config.label);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (error) {
    root.classList.remove("gallery-tunnel--active");
    canvas.remove();
    veil.remove();
    cursor.remove();
    return null;
  }

  root.tabIndex = 0;
  root.setAttribute(
    "aria-label",
    root.dataset.tunnelAriaLabel ||
      "Gallery Tunnel. Nhấn giữ chuột hoặc phím cách để tăng tốc."
  );

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const backgroundColor = new THREE.Color(config.background);
  scene.background = backgroundColor;

  const fogFar = SEGMENT_COUNT * SEGMENT_DEPTH * 0.94;
  const fogNear = Math.min(
    fogFar - 0.1,
    fogFar * (1 - clamp(config.fade, 0, 100) / 100)
  );
  scene.fog = new THREE.Fog(backgroundColor, fogNear, fogFar);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.06, fogFar + 4);
  camera.position.set(0, 0, 0);

  const columns = config.grid;
  const rows = config.grid;
  const halfWidth = TUNNEL_WIDTH / 2;
  const halfHeight = TUNNEL_HEIGHT / 2;
  const columnWidth = TUNNEL_WIDTH / columns;
  const rowHeight = TUNNEL_HEIGHT / rows;

  const floorGeometry = new THREE.PlaneGeometry(columnWidth, SEGMENT_DEPTH);
  const wallGeometry = new THREE.PlaneGeometry(SEGMENT_DEPTH, rowHeight);
  const lineGeometry = createLineGeometry(columns, rows);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(config.lineColor),
    transparent: true,
    opacity: config.lineOpacity / 100
  });

  const colorMaterials = config.colors.map(function (color) {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide
    });
  });

  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin("anonymous");
  const fadingMaterials = new Set();
  let alive = true;
  let firstTextureShown = false;

  const imageMaterials = config.images.map(function (source, index) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    textureLoader.load(
      source,
      function (texture) {
        if (!alive) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        material.map = texture;
        material.needsUpdate = true;
        fadingMaterials.add(material);
        if (!firstTextureShown) {
          firstTextureShown = true;
          root.classList.add("gallery-tunnel--textures-ready");
        }
      },
      undefined,
      function () {
        material.color.set(config.colors[index % config.colors.length]);
        material.transparent = false;
        material.opacity = 1;
        material.needsUpdate = true;
      }
    );
    return material;
  });

  const allMaterials = colorMaterials.concat(imageMaterials);
  let materialBag = [];
  let previousMaterial = null;

  function takeMaterial() {
    if (!materialBag.length) materialBag = shuffle(allMaterials);
    let material = materialBag.pop();
    if (material === previousMaterial && materialBag.length) {
      const alternate = materialBag.pop();
      materialBag.unshift(material);
      material = alternate;
    }
    previousMaterial = material;
    return material;
  }

  const slots = [];
  const centerZ = -SEGMENT_DEPTH / 2;
  for (let column = 0; column < columns; column += 1) {
    const x = -halfWidth + column * columnWidth + columnWidth / 2;
    slots.push({
      geometry: floorGeometry,
      position: new THREE.Vector3(x, -halfHeight, centerZ),
      rotation: new THREE.Euler(-Math.PI / 2, 0, 0)
    });
    slots.push({
      geometry: floorGeometry,
      position: new THREE.Vector3(x, halfHeight, centerZ),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0)
    });
  }
  for (let row = 0; row < rows; row += 1) {
    const y = -halfHeight + row * rowHeight + rowHeight / 2;
    slots.push({
      geometry: wallGeometry,
      position: new THREE.Vector3(-halfWidth, y, centerZ),
      rotation: new THREE.Euler(0, Math.PI / 2, 0)
    });
    slots.push({
      geometry: wallGeometry,
      position: new THREE.Vector3(halfWidth, y, centerZ),
      rotation: new THREE.Euler(0, -Math.PI / 2, 0)
    });
  }

  let previousPattern = "";
  function populate(group) {
    const slabs = group.userData.slabs;
    let signature = "";
    let visibleCount = 0;
    const targetVisibility = 0.5 + Math.random() * 0.25;

    slabs.forEach(function (slab) {
      const visible = Math.random() < targetVisibility;
      slab.visible = visible;
      signature += visible ? "1" : "0";
      if (visible) {
        visibleCount += 1;
        slab.material = takeMaterial();
      }
    });

    if (!visibleCount) {
      const forced = slabs[Math.floor(Math.random() * slabs.length)];
      forced.visible = true;
      forced.material = takeMaterial();
    }

    if (signature === previousPattern) {
      const changed = slabs[Math.floor(Math.random() * slabs.length)];
      changed.visible = !changed.visible;
      if (changed.visible) changed.material = takeMaterial();
      signature += changed.visible ? "1" : "0";
    }
    previousPattern = signature;
  }

  function createSegment(index) {
    const group = new THREE.Group();
    group.position.z = -index * SEGMENT_DEPTH;
    group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    const slabs = slots.map(function (slot) {
      const mesh = new THREE.Mesh(slot.geometry, colorMaterials[0]);
      mesh.position.copy(slot.position);
      mesh.rotation.copy(slot.rotation);
      group.add(mesh);
      return mesh;
    });
    group.userData.slabs = slabs;
    populate(group);
    scene.add(group);
    return group;
  }

  const segments = [];
  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    segments.push(createSegment(index));
  }

  function resize() {
    const width = Math.max(1, root.clientWidth);
    const height = Math.max(1, root.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  const resizeObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  if (resizeObserver) {
    resizeObserver.observe(root);
  } else {
    window.addEventListener("resize", resize);
  }
  resize();

  let pressed = false;
  let visible = true;
  let frameId = 0;
  let lastTime = 0;
  let currentVelocity = reducedMotion ? 0 : (config.speed / 33) * 0.82;
  let baseSpeed = config.speed;
  let boost = config.boost;

  function setPressed(nextPressed) {
    pressed = nextPressed && !reducedMotion;
    root.classList.toggle("gallery-tunnel--pressed", pressed);
  }

  function animate(now) {
    if (!alive) return;
    frameId = requestAnimationFrame(animate);
    if (!visible || document.hidden) {
      lastTime = now;
      return;
    }

    const delta = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
    lastTime = now;

    const normalVelocity = reducedMotion ? 0 : (baseSpeed / 33) * 0.82;
    const boostedVelocity = normalVelocity + (boost / 100) * 5.8;
    const targetVelocity = pressed ? boostedVelocity : normalVelocity;
    const easing = 1 - Math.pow(pressed ? 0.02 : 0.08, delta);
    currentVelocity += (targetVelocity - currentVelocity) * easing;

    segments.forEach(function (segment) {
      segment.position.z += currentVelocity * delta;
    });

    segments.forEach(function (segment) {
      if (segment.position.z > SEGMENT_DEPTH * 0.75) {
        let farthest = 0;
        segments.forEach(function (candidate) {
          farthest = Math.min(farthest, candidate.position.z);
        });
        segment.position.z = farthest - SEGMENT_DEPTH;
        populate(segment);
      }
    });

    fadingMaterials.forEach(function (material) {
      material.opacity = Math.min(1, material.opacity + delta / TEXTURE_FADE_SECONDS);
      if (material.opacity >= 1) fadingMaterials.delete(material);
    });

    renderer.render(scene, camera);
    if (!root.classList.contains("gallery-tunnel--ready")) {
      root.classList.add("gallery-tunnel--ready");
    }
  }

  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          function (entries) {
            visible = Boolean(entries[0] && entries[0].isIntersecting);
          },
          { threshold: 0 }
        )
      : null;
  if (intersectionObserver) intersectionObserver.observe(root);

  function moveCursor(event) {
    if (!config.label) return;
    const rect = root.getBoundingClientRect();
    cursor.style.left = event.clientX - rect.left + "px";
    cursor.style.top = event.clientY - rect.top + "px";
  }

  function onPointerEnter(event) {
    moveCursor(event);
    root.classList.add("gallery-tunnel--hovered");
  }

  function onPointerLeave() {
    setPressed(false);
    root.classList.remove("gallery-tunnel--hovered");
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    moveCursor(event);
    setPressed(true);
  }

  function onKeyDown(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    setPressed(true);
  }

  function onKeyUp(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    setPressed(false);
  }

  function onPointerUp() {
    setPressed(false);
  }

  function onWindowBlur() {
    setPressed(false);
  }

  root.addEventListener("pointermove", moveCursor);
  root.addEventListener("pointerenter", onPointerEnter);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("blur", onWindowBlur);

  frameId = requestAnimationFrame(animate);

  return {
    element: root,
    setSpeed: function (value) {
      baseSpeed = numberFrom(value, baseSpeed, 0, 100);
    },
    setBoost: function (value) {
      boost = numberFrom(value, boost, 0, 200);
    },
    destroy: function () {
      alive = false;
      cancelAnimationFrame(frameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }
      if (intersectionObserver) intersectionObserver.disconnect();
      root.removeEventListener("pointermove", moveCursor);
      root.removeEventListener("pointerenter", onPointerEnter);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", onWindowBlur);
      floorGeometry.dispose();
      wallGeometry.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      colorMaterials.forEach(function (material) {
        material.dispose();
      });
      imageMaterials.forEach(function (material) {
        if (material.map) material.map.dispose();
        material.dispose();
      });
      renderer.dispose();
    }
  };
}

function initGalleryTunnels() {
  const roots = document.querySelectorAll("[data-gallery-tunnel]");
  window.KobashiGalleryTunnels = Array.from(roots)
    .map(buildTunnel)
    .filter(Boolean);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGalleryTunnels, { once: true });
} else {
  initGalleryTunnels();
}
