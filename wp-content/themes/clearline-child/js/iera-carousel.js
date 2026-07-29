(function () {
  "use strict";

  var carousels = document.querySelectorAll(".js-iera-carousel");
  if (!carousels.length) {
    return;
  }

  carousels.forEach(function (carousel) {
    var viewport = carousel.querySelector(".p-iera-carousel__viewport");
    var ring = carousel.querySelector(".p-iera-carousel__ring");
    var cards = Array.prototype.slice.call(carousel.querySelectorAll(".p-iera-carousel__card"));
    var previousButton = carousel.querySelector(".js-iera-carousel-prev");
    var nextButton = carousel.querySelector(".js-iera-carousel-next");
    var toggleButton = carousel.querySelector(".js-iera-carousel-toggle");

    if (!viewport || !ring || !cards.length) {
      return;
    }

    var cardCount = cards.length;
    var step = 360 / cardCount;
    var speed = Math.abs(parseFloat(carousel.dataset.speed)) || 4;
    var direction = parseFloat(carousel.dataset.direction) < 0 ? -1 : 1;
    var sensitivity = Math.abs(parseFloat(carousel.dataset.sensitivity)) || 0.22;
    var tilt = parseFloat(carousel.dataset.tilt);
    var configuredGap = parseFloat(carousel.dataset.gap);
    var backBrightness = parseFloat(carousel.dataset.backBrightness);
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    var rotation = 0;
    var ringRadius = 0;
    var pointerId = null;
    var lastPointerX = 0;
    var lastPointerTime = 0;
    var angularVelocity = 0;
    var isDragging = false;
    var isVisible = true;
    var manualPaused = reducedMotion.matches;
    var previousFrameTime = performance.now();

    viewport.setAttribute(
      "aria-label",
      "Bộ sưu tập " + cardCount + " hình ảnh sản phẩm iERA. Kéo ngang hoặc dùng phím mũi tên để xoay."
    );

    if (!Number.isFinite(tilt)) {
      tilt = -6;
    }
    if (!Number.isFinite(configuredGap)) {
      configuredGap = 22;
    }
    if (Number.isFinite(backBrightness)) {
      carousel.style.setProperty("--carousel-back-brightness", Math.max(0.1, Math.min(1, backBrightness)));
    }

    function setCardPositions() {
      var cardWidth = cards[0].getBoundingClientRect().width;
      var computedGap = parseFloat(window.getComputedStyle(carousel).getPropertyValue("--carousel-card-gap"));
      var gap = Number.isFinite(configuredGap) ? configuredGap : computedGap;

      if (window.matchMedia("(max-width: 767px)").matches && carousel.dataset.gap === "22") {
        gap = Number.isFinite(computedGap) ? computedGap : 14;
      }

      if (cardCount > 2) {
        ringRadius = Math.round((cardWidth + gap) / (2 * Math.tan(Math.PI / cardCount)));
      } else {
        ringRadius = Math.round(cardWidth * 0.72);
      }

      carousel.style.setProperty("--ring-radius", ringRadius + "px");
      cards.forEach(function (card, index) {
        card.style.setProperty("--item-angle", index * step + "deg");
      });
      render();
    }

    function render() {
      ring.style.transform =
        "translateZ(" + -ringRadius + "px) rotateX(" + tilt + "deg) rotateY(" + rotation + "deg)";
    }

    function setPausedState(paused) {
      manualPaused = paused;
      toggleButton.textContent = paused ? "Tiếp tục quay" : "Tạm dừng";
      toggleButton.setAttribute("aria-pressed", paused ? "true" : "false");
    }

    function nudge(amount) {
      rotation += step * amount;
      angularVelocity = amount * 0.06;
      render();
    }

    function startDrag(event) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      pointerId = event.pointerId;
      lastPointerX = event.clientX;
      lastPointerTime = performance.now();
      angularVelocity = 0;
      isDragging = true;
      viewport.setPointerCapture(pointerId);
      viewport.classList.add("is-dragging");
    }

    function drag(event) {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }

      var now = performance.now();
      var deltaX = event.clientX - lastPointerX;
      var elapsed = Math.max(8, now - lastPointerTime);
      var deltaRotation = deltaX * sensitivity;

      rotation += deltaRotation;
      angularVelocity = angularVelocity * 0.35 + (deltaRotation / elapsed) * 0.65;
      lastPointerX = event.clientX;
      lastPointerTime = now;
      render();
    }

    function endDrag(event) {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }
      isDragging = false;
      viewport.classList.remove("is-dragging");
      if (viewport.hasPointerCapture(pointerId)) {
        viewport.releasePointerCapture(pointerId);
      }
      pointerId = null;
    }

    function animate(now) {
      var elapsed = Math.min(48, now - previousFrameTime);
      previousFrameTime = now;

      if (isVisible && !document.hidden && !isDragging) {
        if (Math.abs(angularVelocity) > 0.001) {
          rotation += angularVelocity * elapsed;
          angularVelocity *= Math.pow(0.94, elapsed / 16.67);
        } else if (!manualPaused) {
          angularVelocity = 0;
          rotation += direction * speed * (elapsed / 1000);
        }
        render();
      }

      window.requestAnimationFrame(animate);
    }

    viewport.addEventListener("pointerdown", startDrag);
    viewport.addEventListener("pointermove", drag);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudge(1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudge(-1);
      }
    });

    previousButton.addEventListener("click", function () {
      nudge(1);
    });
    nextButton.addEventListener("click", function () {
      nudge(-1);
    });
    toggleButton.addEventListener("click", function () {
      setPausedState(!manualPaused);
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          isVisible = entries[0].isIntersecting;
        },
        { threshold: 0.05 }
      );
      observer.observe(carousel);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setCardPositions, 120);
    });

    function handleMotionPreference(event) {
      setPausedState(event.matches);
    }
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", handleMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(handleMotionPreference);
    }

    setPausedState(manualPaused);
    setCardPositions();
    window.requestAnimationFrame(animate);
  });
})();
