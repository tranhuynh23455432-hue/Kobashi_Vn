/*===============
共通の実行
================*/
var commonDesktopMediaQuery =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 992px)")
    : null;
var commonReducedMotionQuery =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

function addCommonMediaQueryListener(mediaQuery, listener) {
  if (!mediaQuery) return;
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(listener);
  }
}

$(function () {
  
  //======================
  //TOP＞メイン＞SLICK
  //======================

  const mainSliders = [];
  const subSliders = [];

  if ($.fn && typeof $.fn.slick === "function") {
    $(".js-slick-main").each(function () {
      const $slider = $(this);
      mainSliders.push($slider);

      if ($slider.hasClass("slick-initialized")) return;

      $slider
        .on("init.commonSlick", function () {
          if (commonReducedMotionQuery.matches) return;
          $(this)
            .find('.slick-slide[data-slick-index="0"]')
            .addClass("add-animation");
        })
        .on(
          "beforeChange.commonSlick",
          function (_event, _slick, currentSlide, nextSlide) {
            if (commonReducedMotionQuery.matches) return;
            const $slides = $(this).find(".slick-slide");
            $slides.eq(nextSlide).addClass("add-animation");
            $slides.eq(currentSlide).addClass("remove-animation");
          }
        )
        .on("afterChange.commonSlick", function () {
          $(this)
            .find(".remove-animation")
            .removeClass("remove-animation add-animation");
        })
        .slick({
          autoplay: !commonReducedMotionQuery.matches,
          fade: true,
          arrows: false,
          speed: commonReducedMotionQuery.matches ? 0 : 2000,
          autoplaySpeed: 4000,
          pauseOnFocus: true,
          pauseOnHover: true,
          pauseOnDotsHover: true
        });
    });

    function initSubSlider(slider) {
      const $slider = $(slider);
      if (
        $slider.hasClass("slick-initialized") ||
        $slider.children().length <= 1
      ) {
        return;
      }

      const sliderOptions = {
        arrows: true,
        autoplay: false,
        slidesToShow: 1,
        infinite: true,
        speed: commonReducedMotionQuery.matches ? 0 : 300
      };
      if (slider.hasAttribute("data-defer-slider")) {
        sliderOptions.lazyLoad = "ondemand";
      }
      $slider.slick(sliderOptions);
    }

    const subSliderObserver =
      typeof window.IntersectionObserver === "function"
        ? new IntersectionObserver(
            function (entries, observer) {
              entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                initSubSlider(entry.target);
              });
            },
            { rootMargin: "320px 0px", threshold: 0 }
          )
        : null;

    $(".js-slick-sub").each(function () {
      const $slider = $(this);
      subSliders.push($slider);

      if ($slider.children().length <= 1) return;
      if (this.hasAttribute("data-defer-slider") && subSliderObserver) {
        subSliderObserver.observe(this);
      } else {
        initSubSlider(this);
      }
    });

    addCommonMediaQueryListener(commonReducedMotionQuery, function (event) {
      const reduceMotion = event.matches;

      mainSliders.forEach(function ($slider) {
        if (!$slider.hasClass("slick-initialized")) return;

        $slider.slick(
          "slickSetOption",
          "speed",
          reduceMotion ? 0 : 2000,
          false
        );
        $slider.slick(
          "slickSetOption",
          "autoplay",
          !reduceMotion,
          false
        );

        if (reduceMotion) {
          $slider.slick("slickPause");
          $slider
            .find(".add-animation, .remove-animation")
            .removeClass("add-animation remove-animation");
        } else {
          $slider.slick("slickPlay");
          $slider.find(".slick-current").addClass("add-animation");
        }
      });

      subSliders.forEach(function ($slider) {
        if (!$slider.hasClass("slick-initialized")) return;
        $slider.slick(
          "slickSetOption",
          "speed",
          reduceMotion ? 0 : 300,
          false
        );
      });
    });
  }



  //======================
  //ギャラリー（sub）＞SLICK
  //======================
//======================
// SP 横から出てくるメニュー
//======================
  const menu = document.querySelector("article.js-menu--list");
  const curtain = document.querySelector("article.js-back_curtain");
  const menuOpeners = Array.from(document.querySelectorAll(".js-menu--open"));

  if (menu && curtain && menuOpeners.length) {
    const isJapanese =
      (document.documentElement.getAttribute("lang") || "")
        .toLowerCase()
        .indexOf("ja") === 0;
    const menuLabel = isJapanese
      ? "ナビゲーションメニュー"
      : "Menu điều hướng";
    const openLabel = isJapanese ? "メニューを開く" : "Mở menu";
    const closeLabel = isJapanese ? "メニューを閉じる" : "Đóng menu";
    const closeControls = Array.from(
      menu.querySelectorAll(".js-menu--close")
    );
    let menuId = menu.id;
    let isMenuOpen = false;
    let activeOpener = null;
    let lockedScrollX = 0;
    let lockedScrollY = 0;
    let bodyHadStyle = false;
    let bodyStyleBeforeOpen = null;
    let curtainHadStyle = false;
    let curtainStyleBeforeOpen = null;

    if (!menuId) {
      menuId = "mobile-site-menu";
      let suffix = 1;
      while (
        document.getElementById(menuId) &&
        document.getElementById(menuId) !== menu
      ) {
        menuId = "mobile-site-menu-" + suffix;
        suffix += 1;
      }
      menu.id = menuId;
    }

    function isDesktopMenuLayout() {
      return commonDesktopMediaQuery
        ? commonDesktopMediaQuery.matches
        : window.innerWidth >= 992;
    }

    function setElementInert(element, shouldBeInert) {
      if ("inert" in element) {
        element.inert = shouldBeInert;
      } else if (shouldBeInert) {
        element.setAttribute("inert", "");
      } else {
        element.removeAttribute("inert");
      }
    }

    function prepareButtonControl(control, label) {
      const isNativeButton = control.tagName === "BUTTON";

      if (!isNativeButton) {
        control.setAttribute("role", "button");
        control.setAttribute("tabindex", "0");
      }
      if (!control.hasAttribute("aria-label")) {
        control.setAttribute("aria-label", label);
      }
    }

    function getFocusableMenuItems() {
      return Array.from(
        menu.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (element) {
        return (
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0
        );
      });
    }

    function setMenuAccessibility(open) {
      menuOpeners.forEach(function (opener) {
        opener.setAttribute("aria-expanded", open ? "true" : "false");
      });

      if (open) {
        menu.removeAttribute("aria-hidden");
        curtain.setAttribute("aria-hidden", "false");
      } else {
        menu.setAttribute("aria-hidden", "true");
        curtain.setAttribute("aria-hidden", "true");
      }

      setElementInert(menu, !open);
      setElementInert(curtain, !open);
    }

    function restoreExactBodyStyle() {
      if (bodyHadStyle) {
        document.body.setAttribute("style", bodyStyleBeforeOpen || "");
      } else {
        document.body.removeAttribute("style");
      }
    }

    function restoreExactCurtainStyle() {
      if (curtainHadStyle) {
        curtain.setAttribute("style", curtainStyleBeforeOpen || "");
      } else {
        curtain.removeAttribute("style");
      }
    }

    function closeMenu(options) {
      const settings = options || {};
      const shouldRestoreFocus = settings.restoreFocus !== false;

      if (!isMenuOpen) {
        menu.classList.remove("js-menu--list--active");
        curtain.classList.remove("is-active");
        setMenuAccessibility(false);
        return;
      }

      isMenuOpen = false;
      menu.classList.remove("js-menu--list--active");
      curtain.classList.remove("is-active");
      setMenuAccessibility(false);
      restoreExactCurtainStyle();
      restoreExactBodyStyle();

      window.requestAnimationFrame(function () {
        window.scrollTo(lockedScrollX, lockedScrollY);
        if (
          shouldRestoreFocus &&
          activeOpener &&
          document.documentElement.contains(activeOpener)
        ) {
          activeOpener.focus();
        }
        activeOpener = null;
      });
    }

    function openMenu(opener) {
      if (isMenuOpen || isDesktopMenuLayout()) return;

      isMenuOpen = true;
      activeOpener = opener;
      lockedScrollX = window.pageXOffset || 0;
      lockedScrollY =
        window.pageYOffset || document.documentElement.scrollTop || 0;
      bodyHadStyle = document.body.hasAttribute("style");
      bodyStyleBeforeOpen = document.body.getAttribute("style");
      curtainHadStyle = curtain.hasAttribute("style");
      curtainStyleBeforeOpen = curtain.getAttribute("style");

      document.body.style.position = "fixed";
      document.body.style.top = -lockedScrollY + "px";
      document.body.style.left = -lockedScrollX + "px";
      document.body.style.width = "100%";

      menu.classList.add("js-menu--list--active");
      curtain.classList.add("is-active");
      curtain.style.display = "block";
      setMenuAccessibility(true);

      window.requestAnimationFrame(function () {
        const focusTarget = closeControls[0] || getFocusableMenuItems()[0];
        if (focusTarget) {
          try {
            focusTarget.focus({ preventScroll: true });
          } catch (_error) {
            focusTarget.focus();
          }
        } else {
          menu.focus();
        }
      });
    }

    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", menuLabel);
    menu.setAttribute("tabindex", "-1");

    menuOpeners.forEach(function (opener) {
      prepareButtonControl(opener, openLabel);
      opener.setAttribute("aria-controls", menuId);
      opener.setAttribute("aria-haspopup", "dialog");
      opener.setAttribute("aria-expanded", "false");
      opener.addEventListener("click", function () {
        openMenu(opener);
      });
      opener.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openMenu(opener);
      });
    });

    closeControls.forEach(function (control) {
      prepareButtonControl(control, closeLabel);
      control.addEventListener("click", function () {
        closeMenu();
      });
      control.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        closeMenu();
      });
    });

    curtain.addEventListener("click", function () {
      closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (!isMenuOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableItems = getFocusableMenuItems();
      if (!focusableItems.length) {
        event.preventDefault();
        menu.focus();
        return;
      }

      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];
      const currentItem = document.activeElement;

      if (event.shiftKey) {
        if (currentItem === firstItem || !menu.contains(currentItem)) {
          event.preventDefault();
          lastItem.focus();
        }
      } else if (currentItem === lastItem || !menu.contains(currentItem)) {
        event.preventDefault();
        firstItem.focus();
      }
    });

    addCommonMediaQueryListener(commonDesktopMediaQuery, function (event) {
      if (event.matches) {
        closeMenu({ restoreFocus: false });
      }
    });

    if (!commonDesktopMediaQuery) {
      window.addEventListener("resize", function () {
        if (window.innerWidth >= 992) {
          closeMenu({ restoreFocus: false });
        }
      });
    }

    menu.classList.remove("js-menu--list--active");
    curtain.classList.remove("is-active");
    setMenuAccessibility(false);
  }


  //======================
  //SP 横から出てくるメニュー内トグルメニュー
  //======================
  //js-accordion__switch に rotate が振られていたら閉じる
  $('.js-slide-menu__ttl').click(function () {
    $(this).removeClass("c-open-serch-more");


  });


  const animationTargets = new Map();
  [
    ['.js-inview-fadeInUp', 'animate__fadeInUp'],
    ['.js-inview-fadeIn', 'animate__fadeIn'],
    ['.js-inview-fadeInLeft', 'animate__fadeInLeft'],
    ['.js-inview-fadeInRight', 'animate__fadeInRight']
  ].forEach(function ([selector, animationClass]) {
    document.querySelectorAll(selector).forEach(function (element) {
      if (!animationTargets.has(element)) {
        animationTargets.set(element, []);
      }
      animationTargets.get(element).push(animationClass);
    });
  });

  function reveal(element) {
    element.classList.add("animate__animated");
    animationTargets.get(element).forEach(function (animationClass) {
      element.classList.add(animationClass);
    });
  }

  function revealWithoutMotion(element) {
    element.classList.remove("animate__animated");
    animationTargets.get(element).forEach(function (animationClass) {
      element.classList.remove(animationClass);
    });
    element.style.opacity = "1";
    element.style.transform = "none";
  }

  let inViewObserver = null;

  if (commonReducedMotionQuery.matches) {
    animationTargets.forEach(function (_animationClasses, element) {
      revealWithoutMotion(element);
    });
  } else if ("IntersectionObserver" in window) {
    inViewObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          inViewObserver.unobserve(entry.target);
        }
      });
    });

    animationTargets.forEach(function (_animationClasses, element) {
      inViewObserver.observe(element);
    });
  } else {
    animationTargets.forEach(function (_animationClasses, element) {
      reveal(element);
    });
  }

  addCommonMediaQueryListener(commonReducedMotionQuery, function (event) {
    if (!event.matches) return;
    if (inViewObserver) {
      inViewObserver.disconnect();
      inViewObserver = null;
    }
    animationTargets.forEach(function (_animationClasses, element) {
      revealWithoutMotion(element);
    });
  });


  //======================
  //フォームのアクション
  //======================


  $(".c-txt-input, .c-txtarea").each(function () {
    const $field = $(this);

    function updateEnteredState() {
      $field.toggleClass("is-entered", $field.val() !== "");
    }

    $field.on("input change", updateEnteredState);
    updateEnteredState();
  });

  //======================
  //フォームエラーの際の色変更
  //======================

  $(".c-form-item").each(function () {
    if (this.querySelector(".c-error-message")) {
      this.classList.add("is-error");
    }
  });


  //end
});

//======================
//Header固定
//======================
document.addEventListener("DOMContentLoaded", function () {
  const header = document.getElementById("switchHeader");
  if (!header) return;

  const isFixedHeaderPage =
    document.querySelector(".p-news") !== null ||
    document.querySelector(".p-gallery--iera") !== null;
  let headerThreshold = Number.POSITIVE_INFINITY;
  let scrollFrameId = 0;
  let recalculateFrameId = 0;
  let scrollListenerAttached = false;
  let desktopMode = null;

  function isDesktopHeaderLayout() {
    return commonDesktopMediaQuery
      ? commonDesktopMediaQuery.matches
      : window.innerWidth >= 992;
  }

  function updateHeaderPosition() {
    scrollFrameId = 0;

    if (!isDesktopHeaderLayout()) {
      header.classList.remove("fixed");
      return;
    }
    if (isFixedHeaderPage || window.scrollY >= headerThreshold) {
      header.classList.add("fixed");
    } else {
      header.classList.remove("fixed");
    }
  }

  function requestHeaderUpdate() {
    if (scrollFrameId) return;
    scrollFrameId = window.requestAnimationFrame(updateHeaderPosition);
  }

  function attachDesktopScrollListener() {
    if (scrollListenerAttached || isFixedHeaderPage) return;
    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
    scrollListenerAttached = true;
  }

  function detachDesktopScrollListener() {
    if (!scrollListenerAttached) return;
    window.removeEventListener("scroll", requestHeaderUpdate);
    scrollListenerAttached = false;
  }

  function recalculateHeaderThreshold() {
    recalculateFrameId = 0;

    if (!isDesktopHeaderLayout()) {
      header.classList.remove("fixed");
      return;
    }
    if (isFixedHeaderPage) {
      header.classList.add("fixed");
      return;
    }

    header.classList.remove("fixed");
    headerThreshold =
      header.getBoundingClientRect().top + (window.pageYOffset || 0);
    updateHeaderPosition();
  }

  function requestHeaderThresholdRecalculation() {
    if (recalculateFrameId) {
      window.cancelAnimationFrame(recalculateFrameId);
    }
    recalculateFrameId = window.requestAnimationFrame(
      recalculateHeaderThreshold
    );
  }

  function applyHeaderBreakpoint() {
    desktopMode = isDesktopHeaderLayout();

    if (!desktopMode) {
      detachDesktopScrollListener();
      if (scrollFrameId) {
        window.cancelAnimationFrame(scrollFrameId);
        scrollFrameId = 0;
      }
      header.classList.remove("fixed");
      return;
    }

    if (isFixedHeaderPage) {
      detachDesktopScrollListener();
      header.classList.add("fixed");
    } else {
      attachDesktopScrollListener();
      requestHeaderThresholdRecalculation();
    }
  }

  addCommonMediaQueryListener(commonDesktopMediaQuery, applyHeaderBreakpoint);

  window.addEventListener("resize", function () {
    const nextDesktopMode = isDesktopHeaderLayout();
    if (nextDesktopMode !== desktopMode) {
      applyHeaderBreakpoint();
    } else if (nextDesktopMode) {
      requestHeaderThresholdRecalculation();
    } else {
      header.classList.remove("fixed");
    }
  });

  if (document.readyState === "complete") {
    requestHeaderThresholdRecalculation();
  } else {
    window.addEventListener("load", requestHeaderThresholdRecalculation, {
      once: true
    });
  }

  applyHeaderBreakpoint();
});

//======================
//ヘッダーの文字色
//======================
document.addEventListener("DOMContentLoaded", function () {
  const pageNavMap = {
    "p-const": "c-gnav__item--const",
    "p-iera": "c-gnav__item--iera",
    "p-other": "c-gnav__item--other",
    "p-company": "c-gnav__item--company",
    "p-news": "c-gnav__item--news",
    "p-recruit": "c-gnav__item--recruit",
    "p-contact": "c-gnav__item--contact"
  };

  Object.entries(pageNavMap).forEach(([pageClass, navClass]) => {
    if (document.querySelector(`.${pageClass}`)) {
      document
        .querySelectorAll(`.${navClass} p`)
        .forEach(el => el.classList.add("is-active"));
    }
  });
});
