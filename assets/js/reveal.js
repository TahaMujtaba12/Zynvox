/* Shared scroll-reveal utility.
   initScrollReveal({ selector, staggerMs, once, threshold }) adds the
   `visible` class to matching elements as they enter the viewport. */
(function (global) {
  function initScrollReveal(options) {
    var opts = options || {};
    var selector = opts.selector || '.reveal';
    var visibleClass = opts.visibleClass || 'visible';
    var staggerMs = opts.staggerMs || 0;
    var threshold = opts.threshold == null ? 0.1 : opts.threshold;
    var once = opts.once !== false;

    var elements = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!elements.length) return null;

    if (!('IntersectionObserver' in global)) {
      elements.forEach(function (el) { el.classList.add(visibleClass); });
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var reveal = function () { entry.target.classList.add(visibleClass); };
        if (staggerMs) setTimeout(reveal, i * staggerMs);
        else reveal();
        if (once) observer.unobserve(entry.target);
      });
    }, { threshold: threshold });

    elements.forEach(function (el) { observer.observe(el); });
    return observer;
  }

  global.initScrollReveal = initScrollReveal;
})(window);
