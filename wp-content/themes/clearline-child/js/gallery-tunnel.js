const DEFAULT_IMAGE_NAMES = [
  "LINE_20260729_161507-tunnel.webp",
  "LINE_20260729_161603-tunnel.webp",
  "LINE_20260729_161636-tunnel.webp",
  "LINE_20260729_161704-tunnel.webp",
  "LINE_20260729_161733-tunnel.webp",
  "LINE_20260729_161801-tunnel.webp",
  "LINE_20260729_161843-tunnel.webp",
  "LINE_20260729_161918-tunnel.webp"
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
const DESKTOP_SEGMENT_COUNT = 18;
const TEXTURE_FADE_SECONDS = 0.8;
const LAZY_ROOT_MARGIN = "160px 0px";

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

function mediaMatches(query) {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

function getDeviceProfile(config) {
  const narrow = mediaMatches("(max-width: 767px)");
  const coarse = mediaMatches("(pointer: coarse)");
  const memory = Number(navigator.deviceMemory) || 0;
  const cores = Number(navigator.hardwareConcurrency) || 0;
  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lowResource =
    Boolean(connection && connection.saveData) ||
    (memory > 0 && memory <= 4) ||
    (cores > 0 && cores <= 4);

  if (lowResource) {
    return {
      constrained: true,
      grid: Math.min(config.grid, 3),
      segmentCount: 10,
      pixelRatio: 1,
      antialias: false,
      maxFps: 30,
      textureLimit: Math.min(config.images.length, 3)
    };
  }

  if (narrow && coarse) {
    return {
      constrained: true,
      grid: Math.min(config.grid, 3),
      segmentCount: 12,
      pixelRatio: 1,
      antialias: false,
      maxFps: 30,
      textureLimit: Math.min(config.images.length, 4)
    };
  }

  if (narrow || coarse) {
    return {
      constrained: true,
      grid: Math.min(config.grid, 3),
      segmentCount: 14,
      pixelRatio: 1.2,
      antialias: false,
      maxFps: 30,
      textureLimit: Math.min(config.images.length, 4)
    };
  }

  return {
    constrained: false,
    grid: config.grid,
    segmentCount: DESKTOP_SEGMENT_COUNT,
    pixelRatio: 1.5,
    antialias: true,
    maxFps: 45,
    textureLimit: Math.min(config.images.length, 6)
  };
}

function listenToMediaQuery(query, handler) {
  if (!query) return function () {};
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", handler);
    return function () {
      query.removeEventListener("change", handler);
    };
  }
  if (typeof query.addListener === "function") {
    query.addListener(handler);
    return function () {
      query.removeListener(handler);
    };
  }
  return function () {};
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
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

function createLineGeometry(THREE, columns, rows) {
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

function buildTunnel(root, THREE) {
  const config = getConfig(root);
  const profile = getDeviceProfile(config);
  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const finePointerQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(hover: hover) and (pointer: fine)")
      : null;
  let reducedMotion = Boolean(motionQuery && motionQuery.matches);

  const managedClassNames = [
    "gallery-tunnel--active",
    "gallery-tunnel--with-label",
    "gallery-tunnel--ready",
    "gallery-tunnel--textures-ready",
    "gallery-tunnel--hovered",
    "gallery-tunnel--pressed",
    "gallery-tunnel--interacted",
    "gallery-tunnel--in-view"
  ];
  const originalClassState = new Map();
  managedClassNames.forEach(function (className) {
    originalClassState.set(className, root.classList.contains(className));
  });

  const managedAttributes = [
    "tabindex",
    "role",
    "aria-label",
    "aria-pressed",
    "aria-disabled"
  ];
  const originalAttributes = new Map();
  managedAttributes.forEach(function (name) {
    originalAttributes.set(name, root.getAttribute(name));
  });

  const canvas = document.createElement("canvas");
  const veil = document.createElement("div");
  const cursor = document.createElement("span");
  const hasTouchHint = typeof root.dataset.touchHint === "string";
  const touchHint = hasTouchHint ? document.createElement("span") : null;

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
  if (touchHint) {
    touchHint.className = "gallery-tunnel__touch-hint";
    touchHint.textContent = root.dataset.touchHint;
    touchHint.setAttribute("aria-hidden", "true");
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: profile.antialias,
      alpha: false,
      powerPreference: profile.constrained ? "default" : "high-performance"
    });
  } catch (error) {
    return null;
  }

  root.prepend(veil);
  root.prepend(canvas);
  if (config.label) root.append(cursor);
  if (touchHint) root.append(touchHint);

  root.classList.add("gallery-tunnel--active");
  root.classList.toggle("gallery-tunnel--with-label", config.label);
  root.tabIndex = reducedMotion ? -1 : 0;
  root.setAttribute("role", "button");
  root.setAttribute(
    "aria-label",
    root.dataset.tunnelAriaLabel ||
      "Gallery Tunnel. Nhấn giữ chuột hoặc phím cách để tăng tốc."
  );
  root.setAttribute("aria-pressed", "false");
  root.setAttribute("aria-disabled", reducedMotion ? "true" : "false");

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const backgroundColor = new THREE.Color(config.background);
  scene.background = backgroundColor;

  const fogFar = profile.segmentCount * SEGMENT_DEPTH * 0.94;
  const fogNear = Math.min(
    fogFar - 0.1,
    fogFar * (1 - clamp(config.fade, 0, 100) / 100)
  );
  scene.fog = new THREE.Fog(backgroundColor, fogNear, fogFar);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.06, fogFar + 4);
  camera.position.set(0, 0, 0);

  const columns = profile.grid;
  const rows = profile.grid;
  const halfWidth = TUNNEL_WIDTH / 2;
  const halfHeight = TUNNEL_HEIGHT / 2;
  const columnWidth = TUNNEL_WIDTH / columns;
  const rowHeight = TUNNEL_HEIGHT / rows;

  const floorGeometry = new THREE.PlaneGeometry(columnWidth, SEGMENT_DEPTH);
  const wallGeometry = new THREE.PlaneGeometry(SEGMENT_DEPTH, rowHeight);
  const lineGeometry = createLineGeometry(THREE, columns, rows);
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

  let alive = true;
  let visible = isInViewport(root);
  root.classList.toggle("gallery-tunnel--in-view", visible);
  let contextLost = false;
  let firstTextureShown = false;
  const fadingMaterials = new Set();
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin("anonymous");

  const imageSources = config.images.slice(0, profile.textureLimit);
  const imageMaterials = imageSources.map(function (source, index) {
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
        if (reducedMotion) {
          material.opacity = 1;
        } else {
          fadingMaterials.add(material);
        }
        if (!firstTextureShown) {
          firstTextureShown = true;
          root.classList.add("gallery-tunnel--textures-ready");
        }
        requestRender();
      },
      undefined,
      function () {
        if (!alive) return;
        material.color.set(config.colors[index % config.colors.length]);
        material.transparent = false;
        material.opacity = 1;
        material.needsUpdate = true;
        requestRender();
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
      const slabVisible = Math.random() < targetVisibility;
      slab.visible = slabVisible;
      signature += slabVisible ? "1" : "0";
      if (slabVisible) {
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
    }
    previousPattern = slabs
      .map(function (slab) {
        return slab.visible ? "1" : "0";
      })
      .join("");
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
  for (let index = 0; index < profile.segmentCount; index += 1) {
    segments.push(createSegment(index));
  }

  let baseSpeed = config.speed;
  let boost = config.boost;
  let pressed = false;
  let activePointerId = null;
  let keyboardPressed = false;
  let currentVelocity = reducedMotion ? 0 : (baseSpeed / 33) * 0.82;
  let animationFrameId = 0;
  let staticFrameId = 0;
  let resizeFrameId = 0;
  let cursorFrameId = 0;
  let visibilityCheckFrameId = 0;
  let lastFrameTime = 0;
  let renderedWidth = 0;
  let renderedHeight = 0;
  let renderedPixelRatio = 0;
  let resizePending = false;
  let cursorClientX = 0;
  let cursorClientY = 0;
  let cursorTrackingAttached = false;
  const frameInterval = 1000 / profile.maxFps;

  function canRender() {
    return alive && visible && !document.hidden && !contextLost;
  }

  function normalVelocity() {
    return (baseSpeed / 33) * 0.82;
  }

  function renderScene() {
    if (!canRender()) return;
    renderer.render(scene, camera);
    root.classList.add("gallery-tunnel--ready");
  }

  function cancelStaticFrame() {
    if (!staticFrameId) return;
    cancelAnimationFrame(staticFrameId);
    staticFrameId = 0;
  }

  function queueStaticRender() {
    if (!canRender() || staticFrameId || animationFrameId) return;
    staticFrameId = requestAnimationFrame(function () {
      staticFrameId = 0;
      renderScene();
    });
  }

  function shouldRunLoop() {
    return (
      canRender() &&
      !reducedMotion &&
      (baseSpeed > 0 ||
        pressed ||
        Math.abs(currentVelocity) > 0.001 ||
        fadingMaterials.size > 0)
    );
  }

  function stopLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
    lastFrameTime = 0;
  }

  function animate(now) {
    animationFrameId = 0;
    if (!shouldRunLoop()) return;

    if (lastFrameTime && now - lastFrameTime < frameInterval - 0.5) {
      animationFrameId = requestAnimationFrame(animate);
      return;
    }

    const delta = lastFrameTime
      ? Math.min((now - lastFrameTime) / 1000, 1 / 30)
      : Math.min(frameInterval / 1000, 1 / 30);
    lastFrameTime = now;

    const regularVelocity = normalVelocity();
    const boostedVelocity = regularVelocity + (boost / 100) * 5.8;
    const targetVelocity = pressed ? boostedVelocity : regularVelocity;
    const easing = 1 - Math.pow(pressed ? 0.02 : 0.08, delta);
    currentVelocity += (targetVelocity - currentVelocity) * easing;
    if (Math.abs(targetVelocity - currentVelocity) < 0.001) {
      currentVelocity = targetVelocity;
    }

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

    renderScene();
    if (shouldRunLoop()) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  function startLoop() {
    if (animationFrameId || !shouldRunLoop()) return;
    cancelStaticFrame();
    lastFrameTime = 0;
    animationFrameId = requestAnimationFrame(animate);
  }

  function requestRender() {
    if (!canRender()) return;
    if (shouldRunLoop()) {
      startLoop();
    } else {
      queueStaticRender();
    }
  }

  function applyResize(force) {
    if (!alive || contextLost) return false;
    const width = Math.max(1, Math.round(root.clientWidth));
    const height = Math.max(1, Math.round(root.clientHeight));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, profile.pixelRatio);
    if (
      !force &&
      width === renderedWidth &&
      height === renderedHeight &&
      pixelRatio === renderedPixelRatio
    ) {
      resizePending = false;
      return false;
    }

    renderedWidth = width;
    renderedHeight = height;
    renderedPixelRatio = pixelRatio;
    resizePending = false;
    renderer.setPixelRatio(pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    return true;
  }

  function queueResize() {
    resizePending = true;
    if (!canRender() || resizeFrameId) return;
    resizeFrameId = requestAnimationFrame(function () {
      resizeFrameId = 0;
      if (applyResize(false)) requestRender();
    });
  }

  function syncMotionAccessibility() {
    root.tabIndex = reducedMotion ? -1 : 0;
    root.setAttribute("aria-disabled", reducedMotion ? "true" : "false");
  }

  function setPressed(nextPressed) {
    const next = Boolean(nextPressed) && !reducedMotion;
    if (pressed === next) return;
    pressed = next;
    root.classList.toggle("gallery-tunnel--pressed", pressed);
    root.setAttribute("aria-pressed", pressed ? "true" : "false");
    requestRender();
  }

  function syncPressedSources() {
    setPressed(activePointerId !== null || keyboardPressed);
  }

  function clearPressSources() {
    activePointerId = null;
    keyboardPressed = false;
    setPressed(false);
  }

  function cancelCursorFrame() {
    if (!cursorFrameId) return;
    cancelAnimationFrame(cursorFrameId);
    cursorFrameId = 0;
  }

  function queueCursorUpdate(event) {
    if (
      !config.label ||
      !finePointerQuery ||
      !finePointerQuery.matches ||
      !canRender()
    ) {
      return;
    }
    cursorClientX = event.clientX;
    cursorClientY = event.clientY;
    if (cursorFrameId) return;
    cursorFrameId = requestAnimationFrame(function () {
      cursorFrameId = 0;
      if (!canRender() || !finePointerQuery.matches) return;
      const rect = root.getBoundingClientRect();
      cursor.style.left = cursorClientX - rect.left + "px";
      cursor.style.top = cursorClientY - rect.top + "px";
    });
  }

  function onPointerEnter(event) {
    queueCursorUpdate(event);
    root.classList.add("gallery-tunnel--hovered");
  }

  function onPointerMove(event) {
    queueCursorUpdate(event);
  }

  function detachCursorTracking() {
    if (!cursorTrackingAttached) return;
    cursorTrackingAttached = false;
    root.removeEventListener("pointerenter", onPointerEnter);
    root.removeEventListener("pointermove", onPointerMove);
    cancelCursorFrame();
    root.classList.remove("gallery-tunnel--hovered");
  }

  function syncCursorTracking() {
    const shouldTrack =
      config.label && finePointerQuery && finePointerQuery.matches && alive;
    if (shouldTrack && !cursorTrackingAttached) {
      cursorTrackingAttached = true;
      root.addEventListener("pointerenter", onPointerEnter);
      root.addEventListener("pointermove", onPointerMove);
    } else if (!shouldTrack) {
      detachCursorTracking();
    }
  }

  function onFinePointerChange() {
    syncCursorTracking();
  }

  function markInteracted() {
    root.classList.add("gallery-tunnel--interacted");
  }

  function onPointerDown(event) {
    if (event.isPrimary === false || activePointerId !== null) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    markInteracted();
    queueCursorUpdate(event);
    activePointerId = event.pointerId;
    syncPressedSources();
  }

  function onPointerLeave(event) {
    if (activePointerId === event.pointerId) {
      activePointerId = null;
      syncPressedSources();
    }
    root.classList.remove("gallery-tunnel--hovered");
    cancelCursorFrame();
  }

  function onPointerUp(event) {
    if (event.isPrimary === false || activePointerId === null) return;
    if (event.pointerId !== activePointerId) return;
    activePointerId = null;
    syncPressedSources();
  }

  function onKeyDown(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    markInteracted();
    keyboardPressed = true;
    syncPressedSources();
  }

  function onKeyUp(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    keyboardPressed = false;
    syncPressedSources();
  }

  function onWindowBlur() {
    clearPressSources();
  }

  function suspendRendering() {
    stopLoop();
    cancelStaticFrame();
    if (resizeFrameId) {
      cancelAnimationFrame(resizeFrameId);
      resizeFrameId = 0;
      resizePending = true;
    }
    cancelCursorFrame();
    if (visibilityCheckFrameId) {
      cancelAnimationFrame(visibilityCheckFrameId);
      visibilityCheckFrameId = 0;
    }
    clearPressSources();
  }

  function resumeRendering() {
    if (!canRender()) return;
    if (resizePending) applyResize(false);
    if (!reducedMotion && baseSpeed > 0 && Math.abs(currentVelocity) < 0.001) {
      currentVelocity = normalVelocity();
    }
    requestRender();
  }

  function updateVisibility(nextVisible) {
    root.classList.toggle("gallery-tunnel--in-view", nextVisible);
    if (visible === nextVisible) {
      if (visible) resumeRendering();
      return;
    }
    visible = nextVisible;
    if (visible) {
      resumeRendering();
    } else {
      suspendRendering();
    }
  }

  function onDocumentVisibilityChange() {
    if (document.hidden) {
      suspendRendering();
    } else {
      updateVisibility(isInViewport(root));
    }
  }

  function handleMotionPreference(event) {
    reducedMotion = Boolean(event.matches);
    clearPressSources();
    if (reducedMotion) {
      currentVelocity = 0;
      fadingMaterials.forEach(function (material) {
        material.opacity = 1;
      });
      fadingMaterials.clear();
      stopLoop();
    } else {
      currentVelocity = normalVelocity();
    }
    syncMotionAccessibility();
    requestRender();
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    root.classList.remove("gallery-tunnel--ready");
    suspendRendering();
  }

  function onContextRestored() {
    if (!alive) return;
    contextLost = false;
    renderedWidth = 0;
    renderedHeight = 0;
    renderedPixelRatio = 0;
    visible = isInViewport(root);
    applyResize(true);
    requestRender();
  }

  function queueFallbackVisibilityCheck() {
    if (visibilityCheckFrameId || document.hidden || !alive) return;
    visibilityCheckFrameId = requestAnimationFrame(function () {
      visibilityCheckFrameId = 0;
      updateVisibility(isInViewport(root));
    });
  }

  const resizeObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(queueResize) : null;
  if (resizeObserver) {
    resizeObserver.observe(root);
  } else {
    window.addEventListener("resize", queueResize);
  }

  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          function (entries) {
            const entry = entries[0];
            updateVisibility(Boolean(entry && entry.isIntersecting));
          },
          { threshold: 0 }
        )
      : null;
  if (intersectionObserver) {
    intersectionObserver.observe(root);
  }
  window.addEventListener("scroll", queueFallbackVisibilityCheck, {
    passive: true
  });
  window.addEventListener("resize", queueFallbackVisibilityCheck);
  window.addEventListener("orientationchange", queueFallbackVisibilityCheck);
  window.addEventListener("pageshow", queueFallbackVisibilityCheck);
  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      queueFallbackVisibilityCheck
    );
    window.visualViewport.addEventListener(
      "scroll",
      queueFallbackVisibilityCheck
    );
  }

  const removeMotionListener = listenToMediaQuery(
    motionQuery,
    handleMotionPreference
  );
  const removeFinePointerListener = config.label
    ? listenToMediaQuery(finePointerQuery, onFinePointerChange)
    : function () {};

  syncCursorTracking();
  syncMotionAccessibility();
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("blur", onWindowBlur);
  document.addEventListener("visibilitychange", onDocumentVisibilityChange);
  canvas.addEventListener("webglcontextlost", onContextLost, false);
  canvas.addEventListener("webglcontextrestored", onContextRestored, false);

  applyResize(true);
  requestRender();

  const api = {
    element: root,
    setSpeed: function (value) {
      if (!alive) return;
      baseSpeed = numberFrom(value, baseSpeed, 0, 100);
      requestRender();
    },
    setBoost: function (value) {
      if (!alive) return;
      boost = numberFrom(value, boost, 0, 200);
      requestRender();
    },
    destroy: function () {
      if (!alive) return;
      alive = false;

      stopLoop();
      cancelStaticFrame();
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      if (cursorFrameId) cancelAnimationFrame(cursorFrameId);
      if (visibilityCheckFrameId) cancelAnimationFrame(visibilityCheckFrameId);

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", queueResize);
      }
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      window.removeEventListener("scroll", queueFallbackVisibilityCheck);
      window.removeEventListener("resize", queueFallbackVisibilityCheck);
      window.removeEventListener(
        "orientationchange",
        queueFallbackVisibilityCheck
      );
      window.removeEventListener("pageshow", queueFallbackVisibilityCheck);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          queueFallbackVisibilityCheck
        );
        window.visualViewport.removeEventListener(
          "scroll",
          queueFallbackVisibilityCheck
        );
      }

      removeMotionListener();
      removeFinePointerListener();
      detachCursorTracking();
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener(
        "visibilitychange",
        onDocumentVisibilityChange
      );
      canvas.removeEventListener("webglcontextlost", onContextLost, false);
      canvas.removeEventListener(
        "webglcontextrestored",
        onContextRestored,
        false
      );

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
      fadingMaterials.clear();
      renderer.dispose();
      if (typeof renderer.forceContextLoss === "function") {
        renderer.forceContextLoss();
      }

      canvas.remove();
      veil.remove();
      cursor.remove();
      if (touchHint) touchHint.remove();

      managedClassNames.forEach(function (className) {
        root.classList.toggle(className, originalClassState.get(className));
      });
      managedAttributes.forEach(function (name) {
        const value = originalAttributes.get(name);
        if (value === null) {
          root.removeAttribute(name);
        } else {
          root.setAttribute(name, value);
        }
      });
      if (document.activeElement === root) root.blur();
    }
  };

  return api;
}

let threeModulePromise = null;

function loadThreeModule() {
  if (!threeModulePromise) {
    threeModulePromise = import("./vendor/three.module.min.js").catch(function (
      error
    ) {
      threeModulePromise = null;
      throw error;
    });
  }
  return threeModulePromise;
}

function initGalleryTunnels() {
  const roots = Array.from(document.querySelectorAll("[data-gallery-tunnel]"));
  const controllers = [];
  const startByRoot = new WeakMap();
  let lazyObserver = null;

  window.KobashiGalleryTunnels = controllers;

  function removeController(controller) {
    const index = controllers.indexOf(controller);
    if (index >= 0) controllers.splice(index, 1);
    if (!controllers.length && lazyObserver) lazyObserver.disconnect();
  }

  roots.forEach(function (root) {
    let instance = null;
    let status = "idle";
    let destroyed = false;
    let hasPendingSpeed = false;
    let pendingSpeed;
    let hasPendingBoost = false;
    let pendingBoost;

    const controller = {
      element: root,
      setSpeed: function (value) {
        if (destroyed) return;
        if (instance) {
          instance.setSpeed(value);
        } else {
          hasPendingSpeed = true;
          pendingSpeed = value;
        }
      },
      setBoost: function (value) {
        if (destroyed) return;
        if (instance) {
          instance.setBoost(value);
        } else {
          hasPendingBoost = true;
          pendingBoost = value;
        }
      },
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        status = "destroyed";
        if (lazyObserver) lazyObserver.unobserve(root);
        if (instance) {
          instance.destroy();
          instance = null;
        }
        removeController(controller);
      }
    };

    function fail() {
      if (destroyed) return;
      destroyed = true;
      status = "failed";
      removeController(controller);
    }

    function start() {
      if (destroyed || status !== "idle") return;
      status = "loading";
      loadThreeModule()
        .then(function (THREE) {
          if (destroyed) return;
          if (!root.isConnected) {
            fail();
            return;
          }
          instance = buildTunnel(root, THREE);
          if (!instance) {
            fail();
            return;
          }
          status = "ready";
          if (hasPendingSpeed) instance.setSpeed(pendingSpeed);
          if (hasPendingBoost) instance.setBoost(pendingBoost);
        })
        .catch(fail);
    }

    controllers.push(controller);
    startByRoot.set(root, start);
  });

  if (typeof IntersectionObserver === "function") {
    lazyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          lazyObserver.unobserve(entry.target);
          const start = startByRoot.get(entry.target);
          if (start) start();
        });
      },
      {
        rootMargin: LAZY_ROOT_MARGIN,
        threshold: 0
      }
    );
    roots.forEach(function (root) {
      lazyObserver.observe(root);
    });
  } else {
    roots.forEach(function (root) {
      const start = startByRoot.get(root);
      if (start) start();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGalleryTunnels, { once: true });
} else {
  initGalleryTunnels();
}
