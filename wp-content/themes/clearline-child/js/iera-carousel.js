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
    var compactMotion = window.matchMedia(
      "(max-width: 767px), (pointer: coarse)"
    );
    var supportsIntersectionObserver = "IntersectionObserver" in window;

    var rotation = 0;
    var ringRadius = 0;
    var pointerId = null;
    var pointerType = "";
    var pointerIntent = null;
    var pointerStartX = 0;
    var pointerStartY = 0;
    var pointerStartTime = 0;
    var lastPointerX = 0;
    var lastPointerTime = 0;
    var angularVelocity = 0;
    var isDragging = false;
    var isVisible = !supportsIntersectionObserver;
    var userPaused = false;
    var prefersReducedMotion = reducedMotion.matches;
    var animationFrameId = null;
    var previousFrameTime = 0;
    var resizeTimer = null;
    var horizontalIntentThreshold = 8;
    var minimumAngularVelocity = 0.001;
    var animationFrameInterval = 1000 / (compactMotion.matches ? 30 : 60);

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

    function markInteracted() {
      carousel.classList.add("has-interacted");
    }

    function snapToNearestCard() {
      rotation = Math.round(rotation / step) * step;
      angularVelocity = 0;
      render();
    }

    function updateToggleState() {
      if (!toggleButton) {
        return;
      }

      var effectivelyPaused = userPaused || prefersReducedMotion;
      toggleButton.textContent = effectivelyPaused ? "Tiếp tục quay" : "Tạm dừng";
      toggleButton.setAttribute("aria-pressed", effectivelyPaused ? "true" : "false");
      toggleButton.disabled = prefersReducedMotion;
      toggleButton.setAttribute("aria-disabled", prefersReducedMotion ? "true" : "false");
    }

    function canAnimate() {
      return (
        isVisible &&
        !document.hidden &&
        !isDragging &&
        !userPaused &&
        !prefersReducedMotion
      );
    }

    function stopAnimation(clearInertia) {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (clearInertia) {
        angularVelocity = 0;
      }
      carousel.classList.remove("is-animating");
    }

    function requestAnimation() {
      if (!canAnimate() || animationFrameId !== null) {
        return;
      }

      previousFrameTime = performance.now();
      carousel.classList.add("is-animating");
      animationFrameId = window.requestAnimationFrame(animate);
    }

    function updateAnimationState() {
      if (canAnimate()) {
        requestAnimation();
      } else {
        stopAnimation(false);
      }
    }

    function setUserPaused(paused) {
      userPaused = paused;
      if (userPaused) {
        stopAnimation(true);
      }
      updateToggleState();
      updateAnimationState();
    }

    function nudge(amount) {
      markInteracted();

      if (prefersReducedMotion || userPaused) {
        rotation = Math.round(rotation / step) * step + step * amount;
        angularVelocity = 0;
        render();
        stopAnimation(false);
        return;
      }

      rotation += step * amount;
      angularVelocity = amount * 0.06;
      render();
      updateAnimationState();
    }

    function beginDrag(event) {
      pointerIntent = "horizontal";
      isDragging = true;
      angularVelocity = 0;
      stopAnimation(false);
      viewport.classList.add("is-dragging");
      markInteracted();

      if (typeof viewport.setPointerCapture === "function") {
        try {
          viewport.setPointerCapture(event.pointerId);
        } catch (error) {
          // The pointer may already have been cancelled by native scrolling.
        }
      }
    }

    function startDrag(event) {
      if (pointerId !== null || event.isPrimary === false) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      pointerId = event.pointerId;
      pointerType = event.pointerType || "mouse";
      pointerIntent = pointerType === "mouse" ? "horizontal" : null;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerStartTime = performance.now();
      lastPointerX = event.clientX;
      lastPointerTime = pointerStartTime;

      if (pointerIntent === "horizontal") {
        beginDrag(event);
      }
    }

    function drag(event) {
      if (event.pointerId !== pointerId) {
        return;
      }

      if (!isDragging) {
        if (pointerIntent === "vertical") {
          return;
        }

        var totalX = event.clientX - pointerStartX;
        var totalY = event.clientY - pointerStartY;
        var absoluteX = Math.abs(totalX);
        var absoluteY = Math.abs(totalY);

        if (absoluteY >= horizontalIntentThreshold && absoluteY > absoluteX) {
          pointerIntent = "vertical";
          return;
        }
        if (
          absoluteX < horizontalIntentThreshold ||
          absoluteX <= absoluteY * 1.1
        ) {
          return;
        }

        lastPointerX = pointerStartX;
        lastPointerTime = pointerStartTime;
        beginDrag(event);
      }

      if (event.cancelable && pointerType !== "mouse") {
        event.preventDefault();
      }

      var now = performance.now();
      var deltaX = event.clientX - lastPointerX;
      var elapsed = Math.max(8, now - lastPointerTime);
      var deltaRotation = deltaX * sensitivity;

      rotation += deltaRotation;
      if (prefersReducedMotion || userPaused) {
        angularVelocity = 0;
      } else {
        angularVelocity = angularVelocity * 0.35 + (deltaRotation / elapsed) * 0.65;
      }
      lastPointerX = event.clientX;
      lastPointerTime = now;
      render();
    }

    function endDrag(event, captureAlreadyLost) {
      if (pointerId === null || event.pointerId !== pointerId) {
        return;
      }

      var finishedPointerId = pointerId;
      var wasDragging = isDragging;

      pointerId = null;
      pointerType = "";
      pointerIntent = null;
      isDragging = false;
      viewport.classList.remove("is-dragging");

      if (
        !captureAlreadyLost &&
        typeof viewport.hasPointerCapture === "function" &&
        typeof viewport.releasePointerCapture === "function" &&
        viewport.hasPointerCapture(finishedPointerId)
      ) {
        try {
          viewport.releasePointerCapture(finishedPointerId);
        } catch (error) {
          // lostpointercapture will perform the same state recovery.
        }
      }

      if (!wasDragging) {
        return;
      }

      if (prefersReducedMotion || userPaused) {
        snapToNearestCard();
      }
      updateAnimationState();
    }

    function animate(now) {
      animationFrameId = null;

      if (!canAnimate()) {
        carousel.classList.remove("is-animating");
        return;
      }

      var timeSincePreviousFrame = now - previousFrameTime;
      if (timeSincePreviousFrame < animationFrameInterval - 0.5) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      var elapsed = Math.min(48, timeSincePreviousFrame);
      previousFrameTime = now;

      if (Math.abs(angularVelocity) > minimumAngularVelocity) {
        rotation += angularVelocity * elapsed;
        angularVelocity *= Math.pow(0.94, elapsed / 16.67);
        if (Math.abs(angularVelocity) <= minimumAngularVelocity) {
          angularVelocity = 0;
        }
      } else {
        angularVelocity = 0;
        rotation += direction * speed * (elapsed / 1000);
      }
      render();

      if (canAnimate()) {
        animationFrameId = window.requestAnimationFrame(animate);
      } else {
        carousel.classList.remove("is-animating");
      }
    }

    viewport.addEventListener("pointerdown", startDrag);
    viewport.addEventListener("pointermove", drag);
    viewport.addEventListener("lostpointercapture", function (event) {
      endDrag(event, true);
    });
    window.addEventListener("pointerup", function (event) {
      endDrag(event, false);
    });
    window.addEventListener("pointercancel", function (event) {
      endDrag(event, true);
    });
    viewport.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudge(1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudge(-1);
      }
    });

    if (previousButton) {
      previousButton.addEventListener("click", function () {
        nudge(1);
      });
    }
    if (nextButton) {
      nextButton.addEventListener("click", function () {
        nudge(-1);
      });
    }
    if (toggleButton) {
      toggleButton.addEventListener("click", function () {
        markInteracted();
        setUserPaused(!userPaused);
      });
    }

    if (supportsIntersectionObserver) {
      var observer = new IntersectionObserver(
        function (entries) {
          var entry = entries[entries.length - 1];
          isVisible = Boolean(entry && entry.isIntersecting);
          if (!isVisible) {
            stopAnimation(true);
          } else {
            updateAnimationState();
          }
        },
        {
          threshold: 0.01,
          rootMargin: "96px 0px"
        }
      );
      observer.observe(carousel);
    }

    function scheduleCardPositions() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setCardPositions, 120);
    }

    if (typeof ResizeObserver === "function") {
      var resizeObserver = new ResizeObserver(scheduleCardPositions);
      resizeObserver.observe(viewport);
      resizeObserver.observe(cards[0]);
    } else {
      window.addEventListener("resize", scheduleCardPositions);
    }

    function handleMotionPreference(event) {
      prefersReducedMotion = event.matches;
      if (prefersReducedMotion) {
        stopAnimation(true);
        if (!isDragging) {
          snapToNearestCard();
        }
      }
      updateToggleState();
      updateAnimationState();
    }
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", handleMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(handleMotionPreference);
    }

    function handleCompactMotion(event) {
      animationFrameInterval = 1000 / (event.matches ? 30 : 60);
    }
    if (typeof compactMotion.addEventListener === "function") {
      compactMotion.addEventListener("change", handleCompactMotion);
    } else if (typeof compactMotion.addListener === "function") {
      compactMotion.addListener(handleCompactMotion);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAnimation(true);
      } else {
        updateAnimationState();
      }
    });

    updateToggleState();
    setCardPositions();
    carousel.classList.add("is-ready");
    updateAnimationState();
  });
})();
