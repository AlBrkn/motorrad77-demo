// Text Loop — HorizonX (horizonx.so/tools) adaptation for MOTORRAD77.
// Builds a wavy SVG textPath per .ticker-loop[data-unit], spanning the full
// container width edge-to-edge, and scrolls text along it.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function build(host) {
    var unit = host.getAttribute('data-unit') || 'MOTORRAD77 \u2726 ';
    var speed = parseFloat(host.getAttribute('data-speed') || '90');
    var H = 200, CY = 100, AMP = 64, PERIOD = 450;
    var W = Math.max(320, host.clientWidth || 1600);
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-hidden', 'true');
    var clipId = 'tl-' + Math.random().toString(36).slice(2, 8);
    var defs = document.createElementNS(ns, 'defs');
    var clip = document.createElementNS(ns, 'clipPath');
    clip.setAttribute('id', clipId);
    var rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
    rect.setAttribute('width', String(W)); rect.setAttribute('height', String(H));
    clip.appendChild(rect); defs.appendChild(clip); svg.appendChild(defs);
    var pathId = clipId + '-p';
    var path = document.createElementNS(ns, 'path');
    var d = 'M';
    for (var x = -PERIOD; x <= W + PERIOD; x += 7.5) {
      var y = CY - AMP * Math.sin(2 * Math.PI * (x + PERIOD) / PERIOD);
      d += ' ' + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('class', 'tl-path'); path.setAttribute('id', pathId);
    svg.appendChild(path);
    var measure = document.createElementNS(ns, 'text');
    measure.setAttribute('class', 'tl-text tl-measure'); measure.setAttribute('aria-hidden', 'true');
    measure.textContent = unit; svg.appendChild(measure);
    var g = document.createElementNS(ns, 'g');
    g.setAttribute('clip-path', 'url(#' + clipId + ')');
    var head = document.createElementNS(ns, 'text');
    var tail = document.createElementNS(ns, 'text');
    head.setAttribute('class', 'tl-text'); tail.setAttribute('class', 'tl-text');
    head.setAttribute('dominant-baseline', 'central'); tail.setAttribute('dominant-baseline', 'central');
    head.setAttribute('aria-hidden', 'true'); tail.setAttribute('aria-hidden', 'true');
    var hp = document.createElementNS(ns, 'textPath');
    var tp = document.createElementNS(ns, 'textPath');
    hp.setAttribute('href', '#' + pathId); tp.setAttribute('href', '#' + pathId);
    hp.setAttribute('class', 'tl-head'); tp.setAttribute('class', 'tl-tail');
    head.appendChild(hp); tail.appendChild(tp); g.appendChild(head); g.appendChild(tail);
    svg.appendChild(g);
    host.textContent = '';
    host.appendChild(svg);
    var length = 0, total = 0, offset = parseFloat(host.getAttribute('data-offset') || '0'), raf = 0, last = 0;
    function place() {
      if (!length) return;
      hp.setAttribute('startOffset', String(offset));
      // The tail copy trails by its own natural width, so it never spills into
      // the head's region even when the repeated text is longer than the path.
      tp.setAttribute('startOffset', String(offset - (total || length)));
    }
    function remeasure() {
      var next = 0, unitWidth = 0;
      try { next = path.getTotalLength(); unitWidth = measure.getComputedTextLength(); } catch (e) {}
      if (!next) return;
      if (!unitWidth) unitWidth = unit.length * 19; // fallback estimate: some engines report 0 for hidden text
      offset = length > 0 ? offset * next / length : 0;
      length = next;
      var reps = Math.max(2, Math.ceil(length / unitWidth) + 1);
      var filled = '';
      for (var i = 0; i < reps; i++) filled += unit;
      hp.textContent = filled; tp.textContent = filled;
      try { total = head.getComputedTextLength() || reps * unitWidth; } catch (e) { total = reps * unitWidth; }
      place();
    }
    function tick(now) {
      raf = 0;
      if (!length) return;
      var delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      offset = (offset + speed * delta) % length;
      if (offset < 0) offset += length;
      place();
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; last = 0;
      if (speed > 0 && !reduced.matches) raf = requestAnimationFrame(tick);
      else place();
    }
    remeasure(); sync();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure).catch(function () {});
    return function cleanup() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
  }

  var hosts = [];
  function mountAll() {
    hosts.forEach(function (h) { h.cleanup(); });
    hosts = [];
    document.querySelectorAll('.ticker-loop').forEach(function (host) {
      hosts.push({ el: host, cleanup: build(host) });
    });
  }
  mountAll();
  // Rebuild once everything (CSS, fonts) has settled: some engines execute
  // modules before layout is final, and the wave must span edge-to-edge.
  window.addEventListener('load', function () { setTimeout(mountAll, 60); });
  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(mountAll, 220);
  });
  if (reduced.addEventListener) reduced.addEventListener('change', function () {
    hosts.forEach(function (h) { h.cleanup(); });
    hosts = [];
    document.querySelectorAll('.ticker-loop').forEach(function (host) { hosts.push({ el: host, cleanup: build(host) }); });
  });
})();
