(function ($) {
  "use strict";

  //Hide Loading Box (Preloader)
  function preloader() {
    if ($(".preloader").length) {
      $(".preloader").delay(200).fadeOut(500);
    }
  }

  //Update Header Style and Scroll to Top
  function headerStyle() {
    if ($(".boxcar-header").length) {
      var windowpos = $(window).scrollTop();
      var siteHeader = $(".header-style-v1");
      var scrollLink = $(".scroll-to-top");
      var sticky_header = $(".boxcar-header .sticky-header");
      if (windowpos > 100) {
        sticky_header.addClass("fixed-header animated slideInDown");
        scrollLink.fadeIn(300);
      } else {
        sticky_header.removeClass("fixed-header animated slideInDown");
        scrollLink.fadeOut(300);
      }
      if (windowpos > 1) {
        siteHeader.addClass("fixed-header");
      } else {
        siteHeader.removeClass("fixed-header");
      }
    }
  }
  headerStyle();

  //Submenu Dropdown Toggle
  if ($(".boxcar-header li.dropdown ul").length) {
    $(".boxcar-header .navigation li.dropdown").append(
      '<div class="dropdown-btn"><i class="fa fa-angle-down"></i></div>'
    );
  }

  //Header Search
  if ($(".search-btn").length) {
    $(".search-btn").on("click", function () {
      $(".boxcar-header").addClass("moblie-search-active");
    });
    $(".close-search, .search-back-drop").on("click", function () {
      $(".boxcar-header").removeClass("moblie-search-active");
    });
  }

  //Accordion Box
  if ($(".widget-accordion").length) {
    $(".widget-accordion").on("click", ".acc-btn", function () {
      var outerBox = $(this).parents(".widget-accordion");
      var target = $(this).parents(".accordion");

      if ($(this).hasClass("active") !== true) {
        $(outerBox).find(".accordion .acc-btn").removeClass("active ");
      }

      if ($(this).next(".acc-content").is(":visible")) {
        return false;
      } else {
        $(this).addClass("active");
        $(outerBox).children(".accordion").removeClass("active-block");
        $(outerBox).find(".accordion").children(".acc-content").slideUp(300);
        target.addClass("active-block");
        $(this).next(".acc-content").slideDown(300);
      }
    });
  }

  //Fact Counter + Text Count
  if ($(".widget-counter").length) {
    $(".widget-counter").appear(
      function () {
        var $t = $(this),
          n = $t.find(".count-text").attr("data-stop"),
          r = parseInt($t.find(".count-text").attr("data-speed"), 10);

        if (!$t.hasClass("counted")) {
          $t.addClass("counted");
          $({
            countNum: $t.find(".count-text").text(),
          }).animate(
            {
              countNum: n,
            },
            {
              duration: r,
              easing: "linear",
              step: function () {
                $t.find(".count-text").text(Math.floor(this.countNum));
              },
              complete: function () {
                $t.find(".count-text").text(this.countNum);
              },
            }
          );
        }
      },
      { accY: 0 }
    );
  }

  var goTop = function () {
    if ($(".scroll-to-target").length) {
      $(".scroll-to-target").on("click", function () {
        var target = $(this).attr("data-target");
        // animate
        $("html, body").animate(
          {
            scrollTop: $(target).offset().top,
          },
          1500
        );
      });
    }
  };

  // Elements Animation
  if ($(".wow").length) {
    var wow = new WOW({
      boxClass: "wow", // animated element css class (default is wow)
      animateClass: "animated", // animation css class (default is animated)
      offset: 0, // distance to the element when triggering the animation (default is 0)
      mobile: false, // trigger animations on mobile devices (default is true)
      live: true, // act on asynchronously loaded content (default is true)
    });
    wow.init();
  }

  var boxSearch = function () {
    $(document).on("click", function (e) {
      var clickID = e.target.id;
      if (clickID !== "s") {
        $(".box-content-search").removeClass("active");
        $(".layout-search").removeClass("active");
        $(".show-search").val("");
      }
    });
    $(document).on("click", function (e) {
      var clickID = e.target.class;
      if (clickID !== "a111") {
        $(".show-search").removeClass("active");
      }
    });

    $(".show-search").on("click", function (event) {
      event.stopPropagation();
    });
    var input = $(".layout-search").find("input");
    input.on("input", function () {
      if ($(this).val().trim() !== "") {
        $(".box-content-search").addClass("active");
        $(".layout-search").addClass("active");
      } else {
        $(".box-content-search").removeClass("active");
        $(".layout-search").removeClass("active");
      }
    });
  };

  var cusSelect = function () {
    $(document).on("click", ".drop-menu", function (a) {
      var args = { duration: 300 };
      if ($(this).hasClass("active")) {
        $(this).children(".dropdown").slideToggle(args);
        $(this).removeClass("active");
      } else {
        $(".dropdown").slideUp(args);
        $(this).children(".dropdown").slideDown(args);
        $(".drop-menu").removeClass("active");
        $(this).addClass("active");
      }
    });

    $(".drop-menu .dropdown li").on("click", function () {
      $(this).parents(".drop-menu").find("span").text($(this).text());
      $(this).parents(".drop-menu").find("span").addClass("selected");
      $(this)
        .parents(".drop-menu")
        .find("input")
        .attr("value", $(this).attr("id"));
    });
  };


  var activeSuggest = function () {
    $(".search-result-item").click(function () {
      $(".search-result-item.active").removeClass("active");
      $(this).toggleClass("active");
      $(".field-select-el").text($(this).text());
    });

    $(".search-result-item2").click(function () {
      $(".search-result-item2.active").removeClass("active");
      $(this).toggleClass("active");
      $(".field-select-el2").text($(this).text());
    });
    $(".field-radio-item").click(function () {
      $(".search-result-item2.active").removeClass("active");
      $(this).toggleClass("active");
      $(".field-select-el3").text($(this).find(".check-val-item").text());
    });
  };

  $(window).on("scroll", function () {
    headerStyle();
  });

  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  var formTab = function () {
    $(".form-tabs-list li").on("click", function () {
      var tab_id = $(this).attr("data-tab");
      $(".form-tabs-list li").removeClass("current");
      $(".form-tab-pane").removeClass("current");
      $(this).addClass("current animated fadeIn");
      $("#" + tab_id).addClass("current animated fadeIn");
      return false;
    });
  };

  var handleStepper = function () {
    $(".minus").click(function () {
      var $input = $(this).parent().find("input");
      var count = parseInt($input.val()) - 1;
      count = count < 1 ? 1 : count;
      $input.val(count);
      $input.change();
      return false;
    });
    $(".plus").click(function () {
      var $input = $(this).parent().find("input");
      $input.val(parseInt($input.val()) + 1);
      $input.change();
      return false;
    });
  };

  var handleToggleModal = function () {
    $(".mobile-navigation").on("click", function () {
      $(this).toggleClass("active");
    });

    $(".filter-popup").on("click", function () {
      $(".wrap-fixed-sidebar").addClass("active");
      return false;
    });

    $(".close-filters, .sidebar-backdrop").on("click", function () {
      $(".wrap-fixed-sidebar").removeClass("active");
    });
  };

  /* ==========================================================================
   When document is loading, do
   ========================================================================== */

  $(window).on("load", function () {

    cusSelect();

    activeSuggest();
    formTab();
    handleStepper();
    handleToggleModal();
    goTop();
    preloader();
  });
})(window.jQuery);
