// MOTORRAD77 — motion layer: scroll reveals, parallax, tilt cards, magnetic CTA.
(function () {
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- scroll progress --- */
  var bar = document.querySelector('.progress i');
  function progress() {
    if (!bar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
  }

  /* --- topbar state --- */
  var topbar = document.querySelector('.topbar');
  function topState() { if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 24); }

  /* --- reveals --- */
  var revealEls = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduced) {
    document.querySelectorAll('[data-rv-group]').forEach(function (group) {
      var kids = group.querySelectorAll('.rv');
      kids.forEach(function (el, i) { el.style.setProperty('--rvd', Math.min(i * 55, 550) + 'ms'); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* --- parallax --- */
  var pxEls = [];
  document.querySelectorAll('[data-parallax]').forEach(function (el) {
    pxEls.push({ el: el, k: parseFloat(el.getAttribute('data-parallax')) || 0.1 });
  });
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < pxEls.length; i++) {
      var item = pxEls[i];
      var box = item.el.getBoundingClientRect();
      if (box.bottom < -120 || box.top > vh + 120) continue;
      var center = box.top + box.height / 2 - vh / 2;
      item.el.style.transform = 'translate3d(0,' + (-center * item.k).toFixed(1) + 'px,0)';
    }
    progress(); topState();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (!reduced && pxEls.length) window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('scroll', topState, { passive: true });
  progress(); topState();

  /* --- tilt + glare --- */
  function bindTilt(card) {
    if (card.dataset.tiltReady || !fine || reduced) return;
    card.dataset.tiltReady = '1';
    var glare = document.createElement('span');
    glare.className = 'glare';
    card.appendChild(glare);
    card.addEventListener('pointermove', function (e) {
      var box = card.getBoundingClientRect();
      var x = (e.clientX - box.left) / box.width;
      var y = (e.clientY - box.top) / box.height;
      var rx = (0.5 - y) * 7, ry = (x - 0.5) * 9;
      card.style.transform = 'perspective(720px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-2px)';
      glare.style.opacity = '1';
      glare.style.background = 'radial-gradient(320px circle at ' + (x * 100).toFixed(1) + '% ' + (y * 100).toFixed(1) + '%, rgba(255,73,88,.16), transparent 65%)';
    });
    card.addEventListener('pointerleave', function () {
      card.style.transform = '';
      glare.style.opacity = '0';
    });
  }
  if (fine && !reduced) {
    document.querySelectorAll('[data-tilt]').forEach(bindTilt);
  }

  /* --- catalog: enhance dynamically rendered product cards --- */
  var grid = document.querySelector('.product-grid');
  if (grid && 'MutationObserver' in window) {
    var revealIO = 'IntersectionObserver' in window && !reduced ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); revealIO.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }) : null;
    function enhanceCard(card, index) {
      if (card.dataset.enhanced) return;
      card.dataset.enhanced = '1';
      card.classList.add('rv');
      card.style.setProperty('--rvd', Math.min((index || 0) * 50, 450) + 'ms');
      card.addEventListener('transitionend', function clear() {
        card.style.setProperty('--rvd', '0ms');
        card.removeEventListener('transitionend', clear);
      });
      card.setAttribute('data-tilt', '');
      bindTilt(card);
      if (revealIO) revealIO.observe(card); else card.classList.add('in');
    }
    new MutationObserver(function () {
      grid.querySelectorAll('.product-card:not([data-enhanced])').forEach(function (card, i) { enhanceCard(card, i); });
    }).observe(grid, { childList: true });
  }

  /* --- magnetic buttons --- */
  if (fine && !reduced) {
    document.querySelectorAll('.magnet').forEach(function (btn) {
      if (btn.dataset.magnetReady) return;
      btn.dataset.magnetReady = '1';
      btn.addEventListener('pointermove', function (e) {
        var box = btn.getBoundingClientRect();
        var x = (e.clientX - box.left - box.width / 2) / box.width;
        var y = (e.clientY - box.top - box.height / 2) / box.height;
        btn.style.transform = 'translate(' + (x * 10).toFixed(1) + 'px,' + (y * 8).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* --- hero video: play only while visible --- */
  document.querySelectorAll('.hero-media video').forEach(function (v) {
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.25 });
      vio.observe(v);
    }
  });

  /* --- hero entrance on load --- */
  window.addEventListener('load', function () {
    document.documentElement.classList.add('loaded');
  });
  if (document.readyState === 'complete') document.documentElement.classList.add('loaded');
})();
