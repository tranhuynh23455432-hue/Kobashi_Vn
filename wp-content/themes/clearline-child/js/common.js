/*===============
共通の実行
================*/
$(function () {
  /*読んでから消してください
  ※※※※※※※※※※※※※※※※※※※※※※※※※※※
  JavaScriptで使用するクラス名（JS発火用クラス）は、他ハウツーサイトからのコピーであっても、
  可能な限り .js-○○ の形式に統一していただけるようお願いします。

  スタイル用のクラスとJS操作用のクラスを明確に分離でき、コードの可読性・保守性が向上します。
  他のメンバーがコードを把握しやすくなるため、ぜひご協力をお願いいたします

  初期に入ってていらないものは公開時削除お願いします
  ※※※※※※※※※※※※※※※※※※※※※※※※※※※
  */


  //======================
  //TOP＞メイン＞SLICK
  //======================

$(function () {
  $(".js-slick-main")
    // 初期表示時：最初のスライドに add-animation
    .on("init", function () {
      $(this)
        .find('.slick-slide[data-slick-index="0"]')
        .addClass("add-animation");
    })

    // slick 設定
    .slick({
      autoplay: true,
      fade: true,
      arrows: false,
      speed: 2000,
      autoplaySpeed: 4000,
      pauseOnFocus: false,
      pauseOnHover: false,
    })

    // スライド切り替え前
    .on("beforeChange", function (event, slick, currentSlide, nextSlide) {
      const $slides = $(this).find(".slick-slide");

      // 次に表示されるスライド
      $slides.eq(nextSlide).addClass("add-animation");

      // 現在のスライド（後で消す用）
      $slides.eq(currentSlide).addClass("remove-animation");
    })

    // スライド切り替え後
    .on("afterChange", function () {
      $(this)
        .find(".remove-animation")
        .removeClass("remove-animation add-animation");
    });
});



  //======================
  //ギャラリー（sub）＞SLICK
  //======================
$(function () {
  const $sub = $(".js-slick-sub");
  const slideCount = $sub.children().length;

  if (slideCount > 1) {
    $sub.slick({
      arrows: true,
      autoplay: false,
      slidesToShow: 1,
      infinite: true
    });
  }
});






//======================
// SP 横から出てくるメニュー
//======================
var scroll_top = 0;

// メニューを開く
$(".js-menu--open").on("click", function () {

  scroll_top = $(window).scrollTop();

  // body を固定（位置キープ）
  $("body").css({
    position: "fixed",
    top: -scroll_top + "px",
    width: "100%"
  });

  $("article.js-menu--list").addClass("js-menu--list--active");
  $("article.js-back_curtain").show();
});


// メニューを閉じる
$("article.js-menu--list .js-menu--close, article.js-back_curtain").on("click", function () {

  $("article.js-menu--list").removeClass("js-menu--list--active");
  $("article.js-back_curtain").hide();

  // fixed解除
  $("body").css({
    position: "",
    top: "",
    width: ""
  });

  // ★ 1フレーム後に scrollTop 復元
  requestAnimationFrame(function () {
    $(window).scrollTop(scroll_top);
  });
});


  //======================
  //SP 横から出てくるメニュー内トグルメニュー
  //======================
  //js-accordion__switch に rotate が振られていたら閉じる
  $('.js-slide-menu__ttl').click(function () {
    $(this).removeClass("c-open-serch-more");


  });


  //======================
  //基本インビュー【js-inview】表示領域に入ったらinview
  //======================

  //fadeInUp
  $('.js-inview-fadeInUp').on('inview', function (event, isInView) {
    if (isInView) {
      //表示領域に入った
      $(this).addClass('animate__animated');
      $(this).addClass('animate__fadeInUp');
    }
  });

  //fadeIn
  $('.js-inview-fadeIn').on('inview', function (event, isInView) {
    if (isInView) {
      //表示領域に入った
      $(this).addClass('animate__animated');
      $(this).addClass('animate__fadeIn');
    }
  });

  //fadeInLeft
  $('.js-inview-fadeInLeft').on('inview', function (event, isInView) {
    if (isInView) {
      //表示領域に入った
      $(this).addClass('animate__animated');
      $(this).addClass('animate__fadeInLeft');
    }
  });

  //fadeInRight
  $('.js-inview-fadeInRight').on('inview', function (event, isInView) {
    if (isInView) {
      //表示領域に入った
      $(this).addClass('animate__animated');
      $(this).addClass('animate__fadeInRight');
    }
  });


  //======================
  //フォームのアクション
  //======================


  $(function () {
    $('.c-txt-input, .c-txtarea').on('keydown keyup keypress change focus blur', function () {
      if ($(this).val() == '') {
        $(this).removeClass('is-entered');
      } else {
        $(this).addClass('is-entered');
      }
    }).change();
  });

  //======================
  //フォームエラーの際の色変更
  //======================

  jQuery(function ($) {
    $(function () {
      $(".c-form-item:has('.c-error-message')").addClass("is-error");
    });
  });


  //end
});

//======================
//Header固定
//======================
document.addEventListener("DOMContentLoaded", function () {
  const header = document.getElementById("switchHeader");

  // ▼ p-news または p-gallery--iera ページかどうか判定
  const isFixedHeaderPage =
    document.querySelector(".p-news") !== null ||
    document.querySelector(".p-gallery--iera") !== null;

  // ▼ 該当ページは初期から fixed を付与して終了
  if (isFixedHeaderPage) {
    header.classList.add("fixed");
    return; // スクロール固定処理は不要
  }

  // ▼ ここから従来のスクロール処理
  const headerOriginalTop = header.offsetTop;

  function onScroll() {
    if (window.innerWidth < 1024) return;

    const scrollY = window.scrollY;

    if (scrollY >= headerOriginalTop) {
      header.classList.add("fixed");
    } else {
      header.classList.remove("fixed");
    }
  }

  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onScroll);
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
