(function () {
  "use strict";

  var galleries = document.querySelectorAll(".js-news-coverflow");
  if (!galleries.length) {
    return;
  }

  var SCALE_STEP = 0.16;
  var SPACING_RATIO = 0.42;
  var TILT = 36;
  var DEPTH_RATIO = 0.3;

  galleries.forEach(function (gallery) {
    var stage = gallery.querySelector(".p-news-coverflow__stage");
    var slides = Array.prototype.slice.call(
      gallery.querySelectorAll(".p-news-coverflow__slide")
    );
    var dots = Array.prototype.slice.call(
      gallery.querySelectorAll(".p-news-coverflow__dot")
    );
    if (!stage || slides.length < 2) {
      return;
    }

    var count = slides.length;
    var active = 0;

    function render() {
      var stageWidth = stage.clientWidth || 1;
      var spacing = stageWidth * SPACING_RATIO;
      var depth = stageWidth * DEPTH_RATIO;

      var maxVisible = Math.floor((count - 1) / 2) + 1;

      slides.forEach(function (slide, index) {
        var offset = index - active;
        if (offset > count / 2) offset -= count;
        if (offset < -count / 2) offset += count;
        var abs = Math.abs(offset);
        var isActive = offset === 0;
        var visible = abs <= maxVisible;
        var scale = Math.max(0.62, 1 - abs * SCALE_STEP);
        var tx = offset * spacing;
        var tz = -abs * depth;
        var ry = -offset * TILT;

        slide.style.transform =
          "translate(-50%, -50%) translateX(" + tx + "px) translateZ(" + tz + "px) rotateY(" + ry + "deg) scale(" + scale + ")";
        slide.style.zIndex = String(count - abs);
        slide.style.opacity = visible ? "1" : "0";
        slide.style.pointerEvents = visible ? "auto" : "none";
        slide.classList.toggle("p-news-coverflow__slide--active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      dots.forEach(function (dot, index) {
        dot.classList.toggle("p-news-coverflow__dot--active", index === active);
        dot.setAttribute("aria-current", index === active ? "true" : "false");
      });
    }

    function goTo(index) {
      active = ((index % count) + count) % count;
      render();
    }

    var lightbox = gallery.querySelector(".js-news-coverflow-lightbox");
    var lightboxImg = lightbox ? lightbox.querySelector("img") : null;
    var lastFocused = null;

    function openLightbox(slide) {
      if (!lightbox || !lightboxImg) return;
      var img = slide.querySelector("img");
      if (!img) return;
      lastFocused = document.activeElement;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("has-news-coverflow-lightbox");
      var closeButton = lightbox.querySelector(".p-news-coverflow-lightbox__close");
      if (closeButton) closeButton.focus();
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("has-news-coverflow-lightbox");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    var lastTapTime = 0;
    var lastTapIndex = -1;

    slides.forEach(function (slide, index) {
      slide.addEventListener("click", function () {
        if (index === active) return;
        goTo(index);
      });

      slide.addEventListener("dblclick", function (event) {
        event.preventDefault();
        openLightbox(slide);
      });

      // Touch devices don't fire dblclick reliably on non-form elements;
      // detect a fast double-tap manually as a fallback.
      slide.addEventListener("touchend", function () {
        var now = Date.now();
        if (lastTapIndex === index && now - lastTapTime < 350) {
          openLightbox(slide);
          lastTapTime = 0;
          lastTapIndex = -1;
        } else {
          lastTapTime = now;
          lastTapIndex = index;
        }
      });
    });

    if (lightbox) {
      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox || event.target.classList.contains("p-news-coverflow-lightbox__backdrop")) {
          closeLightbox();
        }
      });
      var closeButton = lightbox.querySelector(".p-news-coverflow-lightbox__close");
      if (closeButton) {
        closeButton.addEventListener("click", closeLightbox);
      }
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
          closeLightbox();
        }
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        goTo(index);
      });
    });

    gallery.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(active + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(active - 1);
      } else if (event.key === "Enter" || event.key === " ") {
        var activeSlide = slides[active];
        if (activeSlide) {
          event.preventDefault();
          openLightbox(activeSlide);
        }
      }
    });

    render();

    if (typeof ResizeObserver === "function") {
      var resizeTimer = null;
      var resizeObserver = new ResizeObserver(function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(render, 100);
      });
      resizeObserver.observe(stage);
    } else {
      window.addEventListener("resize", render);
    }
  });
})();
