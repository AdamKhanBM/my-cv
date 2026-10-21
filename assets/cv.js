(function () {
  'use strict';
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* Every string the demos write, in both languages. The page's lang
     attribute decides which set is used. */
  var T = {
    en: {
      clickToStart: 'click to start', notRun: 'not run yet', skipped: 'you skipped it',
      inTime: function (n, s) { return n + ' in ' + s + ' s'; },
      samePlate: 'every plate, the same way', redCircles: 'red circles',
      cpd: 'Cpd ', lowDose: 'low dose →', highDose: '→ high dose', doseAxis: 'dose (µM)',
      inactive: 'never reaches 50 %: inactive',
      dnaAxis: 'DNA content per nucleus', nuclei: 'nuclei', control: 'control',
      ccKill: 'Mostly killing: a big sub-G1 population means apoptosis.',
      ccG2: 'Mostly stopping: cells pile up at 4N, stuck before dividing.',
      ccG1: 'Mostly stopping: cells are held at 2N and never copy their DNA.',
      ccNone: 'Close to untreated: no clear effect yet.',
      fcAxis: 'log2 fold change  (← down · up →)', up: 'Up', down: 'Down', genes: ' genes',
      voLoose: 'Too loose: noise is being called significant.',
      voStrict: 'Too strict: real changes are being thrown away.',
      voOk: 'A list you can actually take to pathway analysis.',
      of: ' of '
    },
    es: {
      clickToStart: 'haz clic para empezar', notRun: 'aún sin ejecutar', skipped: 'te lo has saltado',
      inTime: function (n, s) { return n + ' en ' + s + ' s'; },
      samePlate: 'cada placa, igual', redCircles: 'círculos rojos',
      cpd: 'Comp. ', lowDose: 'dosis baja →', highDose: '→ dosis alta', doseAxis: 'dosis (µM)',
      inactive: 'nunca llega al 50 %: inactivo',
      dnaAxis: 'contenido de ADN por núcleo', nuclei: 'núcleos', control: 'control',
      ccKill: 'Sobre todo las mata: una gran población sub-G1 indica apoptosis.',
      ccG2: 'Sobre todo las frena: se acumulan en 4N, atascadas antes de dividirse.',
      ccG1: 'Sobre todo las frena: se quedan en 2N y nunca copian su ADN.',
      ccNone: 'Casi como sin tratar: todavía no hay un efecto claro.',
      fcAxis: 'log2 fold change  (← baja · sube →)', up: 'Suben', down: 'Bajan', genes: ' genes',
      voLoose: 'Demasiado laxo: se está llamando significativo al ruido.',
      voStrict: 'Demasiado estricto: se están tirando cambios reales.',
      voOk: 'Una lista que sí puedes llevar a un análisis de rutas.',
      of: ' de '
    }
  }[document.documentElement.lang === 'es' ? 'es' : 'en'];

  /* Seeded random numbers, so each figure looks the same on every visit
     until someone asks for a new one. */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r()); }

  function svgEl(parent, name, attrs, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    parent.appendChild(e);
    return e;
  }
  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  /* A canvas sized to its box at the device's pixel ratio. */
  function fitCanvas(cv) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: c, w: r.width, h: r.height, dpr: dpr };
  }

  function onWidthChange(el, fn) {
    var last = el.getBoundingClientRect().width;
    window.addEventListener('resize', function () {
      var w = el.getBoundingClientRect().width;
      if (Math.abs(w - last) > 4) { last = w; fn(); }
    });
  }

  /* ════════ Fig. 1 · simulated DAPI field ════════
     The pointer acts as a segmentation brush: nuclei under it get
     outlined and counted. */
  (function () {
    var box = document.getElementById('scope');
    var cv = document.getElementById('scope-canvas');
    var countEl = document.getElementById('seg-count');
    var totalEl = document.getElementById('seg-total');
    var allBtn = document.getElementById('seg-all');
    var nuclei = [], view, base, ptr = null, showAll = false, seed = 7;

    function makeField() {
      view = fitCanvas(cv);
      var W = view.w, H = view.h, r = rng(seed);
      nuclei = [];
      var target = Math.round((W * H) / 2600), tries = 0;
      while (nuclei.length < target && tries < target * 40) {
        tries++;
        var rad = 9 + r() * 8, n = {
          x: rad + r() * (W - 2 * rad), y: rad + r() * (H - 2 * rad),
          rx: rad * (.85 + r() * .3), ry: rad * (.7 + r() * .3),
          rot: r() * Math.PI, b: .55 + r() * .45, seen: false, dots: []
        };
        for (var i = 0; i < 5; i++) n.dots.push([(r() - .5) * n.rx, (r() - .5) * n.rx, 1 + r() * 1.6]);
        var ok = nuclei.every(function (m) {
          var dx = m.x - n.x, dy = m.y - n.y;
          return dx * dx + dy * dy > Math.pow((m.rx + n.rx) * .95, 2);
        });
        if (ok) nuclei.push(n);
      }
      totalEl.textContent = nuclei.length;
      renderBase();
      draw();
    }

    /* The fluorescence never changes, so it is painted once offscreen;
       each frame only adds outlines on top. */
    function renderBase() {
      base = document.createElement('canvas');
      base.width = cv.width; base.height = cv.height;
      var b = base.getContext('2d');
      b.scale(view.dpr, view.dpr);
      b.fillStyle = '#07080d';
      b.fillRect(0, 0, view.w, view.h);
      b.globalCompositeOperation = 'lighter';
      nuclei.forEach(function (n) {
        b.save();
        b.translate(n.x, n.y); b.rotate(n.rot); b.scale(1, n.ry / n.rx);
        var g = b.createRadialGradient(0, 0, 0, 0, 0, n.rx * 1.35);
        g.addColorStop(0, 'rgba(120,150,255,' + (.95 * n.b) + ')');
        g.addColorStop(.55, 'rgba(60,90,235,' + (.75 * n.b) + ')');
        g.addColorStop(1, 'rgba(30,50,200,0)');
        b.fillStyle = g;
        b.beginPath(); b.arc(0, 0, n.rx * 1.35, 0, Math.PI * 2); b.fill();
        b.fillStyle = 'rgba(190,205,255,' + (.18 * n.b) + ')';
        n.dots.forEach(function (d) { b.beginPath(); b.arc(d[0], d[1], d[2], 0, Math.PI * 2); b.fill(); });
        b.restore();
      });
    }

    function draw() {
      var ctx = view.ctx, W = view.w;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0); ctx.restore();
      var R = Math.max(70, W * .16), seen = 0;
      nuclei.forEach(function (n, i) {
        var near = ptr && Math.hypot(n.x - ptr.x, n.y - ptr.y) < R;
        if (near) n.seen = true;
        if (n.seen) seen++;
        if (!(near || n.seen || showAll)) return;
        ctx.save();
        ctx.translate(n.x, n.y); ctx.rotate(n.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, n.rx + 1.5, n.ry + 1.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = near ? 'rgba(255,236,150,.95)' : 'rgba(255,255,255,.45)';
        ctx.lineWidth = near ? 1.4 : 1;
        ctx.stroke();
        ctx.restore();
        if (near && W > 380) {
          ctx.fillStyle = 'rgba(255,236,150,.9)';
          ctx.font = '9px "IBM Plex Mono", monospace';
          ctx.fillText(i + 1, n.x + n.rx + 3, n.y - n.ry);
        }
      });
      if (ptr) {
        ctx.beginPath(); ctx.arc(ptr.x, ptr.y, R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
      countEl.textContent = showAll ? nuclei.length : seen;
    }

    var queued = false;
    function queueDraw() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; draw(); });
    }
    cv.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
      queueDraw();
    });
    cv.addEventListener('pointerleave', function () { ptr = null; queueDraw(); });
    allBtn.addEventListener('click', function () {
      showAll = !showAll; allBtn.setAttribute('aria-pressed', showAll); draw();
    });
    document.getElementById('seg-new').addEventListener('click', function () {
      showAll = false; allBtn.setAttribute('aria-pressed', 'false'); seed++; makeField();
    });
    onWidthChange(box, makeField);
    makeField();
  })();

  /* ════════ Fig. 2 · colony counting ════════
     Clicking marks a colony by hand; the button reveals every colony
     the "algorithm" finds, and which ones the visitor missed. */
  (function () {
    var cv = document.getElementById('col-canvas');
    var youEl = document.getElementById('col-you'), timeEl = document.getElementById('col-time');
    var algoEl = document.getElementById('col-algo'), algoNote = document.getElementById('col-algo-note');
    var missEl = document.getElementById('col-miss'), missNote = document.getElementById('col-miss-note');
    var view, cols = [], started = 0, autoShown = 0, seed = 21, tick = null;

    function make() {
      view = fitCanvas(cv);
      var S = view.w, c = S / 2, R = S / 2 - 6, r = rng(seed);
      cols = [];
      var target = 55 + Math.floor(r() * 45), tries = 0;
      while (cols.length < target && tries < 4000) {
        tries++;
        var a = r() * Math.PI * 2, d = Math.sqrt(r()) * (R - 14);
        var rad = S * (.008 + r() * .013);
        var p = { x: c + Math.cos(a) * d, y: c + Math.sin(a) * d, r: rad, mine: false };
        /* allow some touching pairs: that is what makes it hard */
        var ok = cols.every(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) > (q.r + p.r) * .9; });
        if (ok) cols.push(p);
      }
      started = 0; autoShown = 0;
      clearInterval(tick);
      youEl.textContent = '0'; timeEl.textContent = T.clickToStart;
      algoEl.textContent = '?'; algoNote.textContent = T.notRun;
      missEl.textContent = '?'; missNote.innerHTML = '&nbsp;';
      draw();
    }

    function draw() {
      var ctx = view.ctx, S = view.w, c = S / 2, R = S / 2 - 6;
      ctx.clearRect(0, 0, S, S);
      /* dish */
      ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.fillStyle = '#efe3bf'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#d8ccab'; ctx.stroke();
      ctx.beginPath(); ctx.arc(c, c, R - 6, 0, Math.PI * 2);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.stroke();
      cols.forEach(function (p, i) {
        var g = ctx.createRadialGradient(p.x - p.r * .3, p.y - p.r * .3, 0, p.x, p.y, p.r);
        g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#d9c9a2');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(120,100,60,.45)'; ctx.stroke();
        var shown = i < autoShown;
        if (shown) {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
          ctx.lineWidth = 1.4; ctx.strokeStyle = p.mine ? '#2f4bd8' : '#c0392b'; ctx.stroke();
        }
        if (p.mine) {
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, p.r * .45), 0, Math.PI * 2);
          ctx.fillStyle = '#191917'; ctx.fill();
        }
      });
    }

    function mineCount() { return cols.filter(function (p) { return p.mine; }).length; }

    cv.addEventListener('pointerdown', function (e) {
      var rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
      var best = null, bd = 1e9;
      cols.forEach(function (p) {
        var d = Math.hypot(p.x - x, p.y - y);
        if (!p.mine && d < p.r + 7 && d < bd) { bd = d; best = p; }
      });
      if (!best) return;
      best.mine = true;
      if (!started) {
        started = performance.now();
        tick = setInterval(function () { timeEl.textContent = ((performance.now() - started) / 1000).toFixed(1) + ' s'; }, 100);
      }
      youEl.textContent = mineCount();
      draw();
    });

    document.getElementById('col-auto').addEventListener('click', function () {
      clearInterval(tick);
      var n = mineCount();
      if (started) timeEl.textContent = T.inTime(n, ((performance.now() - started) / 1000).toFixed(1));
      else timeEl.textContent = T.skipped;
      function finish() {
        autoShown = cols.length; draw();
        algoEl.textContent = cols.length;
        algoNote.textContent = T.samePlate;
        missEl.textContent = cols.length - n;
        missNote.textContent = T.redCircles;
      }
      if (still) return finish();
      autoShown = 0;
      var step = Math.max(1, Math.ceil(cols.length / 30));
      (function run() {
        autoShown = Math.min(cols.length, autoShown + step);
        draw();
        algoEl.textContent = autoShown;
        if (autoShown < cols.length) requestAnimationFrame(run); else finish();
      })();
    });
    document.getElementById('col-new').addEventListener('click', function () { seed++; make(); });
    onWidthChange(cv.parentElement, make);
    make();
  })();

  /* ════════ Fig. 3 · 96-well plate → dose–response ════════
     growth = bottom + (100 − bottom) / (1 + (dose / mid)^hill)        */
  (function () {
    var wells = document.getElementById('wells'), dr = document.getElementById('dr'), rank = document.getElementById('rank');
    var r = rng(5);
    var doses = []; for (var i = 0; i < 10; i++) doses.push(-2 + i * .5);   /* log10 µM, 0.01 → 316 µM */
    var names = 'ABCDEFGH'.split('');
    var cpds = names.map(function (n, i) {
      var c = { name: T.cpd + n, row: n, mid: -1.6 + r() * 3.4, hill: .9 + r() * 2.2, bottom: -45 + r() * 70 };
      if (i === 6) c.bottom = 62;   /* one compound never halves growth */
      c.vals = doses.map(function (x) { return growth(x, c) + gauss(r) * 5; });
      c.gi = gi50(c);
      return c;
    });
    var sel = 0;

    function growth(x, c) { return c.bottom + (100 - c.bottom) / (1 + Math.pow(10, (x - c.mid) * c.hill)); }
    /* GI50 is where growth crosses 50 %, which equals the midpoint only
       when the bottom plateau sits at 0, so it is solved for directly. */
    function gi50(c) { return c.bottom < 50 ? c.mid + Math.log10((100 - c.bottom) / (50 - c.bottom) - 1) / c.hill : null; }
    function fmt(lg) {
      if (lg === null) return '> 300 µM';
      var v = Math.pow(10, lg);
      return v < 1 ? (v * 1000).toFixed(0) + ' nM' : v.toFixed(v < 10 ? 1 : 0) + ' µM';
    }

    /* plate */
    var X0 = 34, Y0 = 28, D = 38;
    for (var col = 0; col < 12; col++) {
      svgEl(wells, 'text', { x: X0 + col * D + D / 2, y: 16, 'text-anchor': 'middle' }, col < 10 ? col + 1 : 'ctl');
    }
    var rowBg = [], wellEls = [];
    cpds.forEach(function (c, ri) {
      var y = Y0 + ri * 27;
      rowBg.push(svgEl(wells, 'rect', { x: 4, y: y - 1, width: 512, height: 27, rx: 2, class: 'row-on', opacity: 0 }));
      svgEl(wells, 'text', { x: 14, y: y + 17, class: 'row-label' }, c.row);
      var row = [];
      for (var k = 0; k < 12; k++) {
        var v = k < 10 ? c.vals[k] : 100 + gauss(r) * 3;
        var a = Math.max(.05, Math.min(1, (v + 20) / 125));
        row.push(svgEl(wells, 'circle', { cx: X0 + k * D + D / 2, cy: y + 12, r: 11, class: 'well', fill: 'rgba(47,75,216,' + a.toFixed(2) + ')' }));
      }
      wellEls.push(row);
      var hit = svgEl(wells, 'rect', { x: 4, y: y - 1, width: 512, height: 27, class: 'row-hit', tabindex: 0, role: 'button', 'aria-label': c.name + ', GI50 ' + fmt(c.gi) });
      hit.addEventListener('click', function () { select(ri); });
      hit.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(ri); } });
    });
    svgEl(wells, 'text', { x: X0, y: 262 }, T.lowDose);
    svgEl(wells, 'text', { x: X0 + 10 * D - 4, y: 262, 'text-anchor': 'end' }, T.highDose);

    /* curve frame */
    var P = { l: 46, r: 12, t: 12, b: 38 }, W = 400, H = 260, xmin = -2.5, xmax = 3, ymin = -60, ymax = 120;
    function sx(x) { return P.l + (x - xmin) / (xmax - xmin) * (W - P.l - P.r); }
    function sy(y) { return H - P.b - (y - ymin) / (ymax - ymin) * (H - P.t - P.b); }
    [-50, 0, 50, 100].forEach(function (y) {
      svgEl(dr, 'line', { class: 'grid', x1: P.l, x2: W - P.r, y1: sy(y), y2: sy(y) });
      svgEl(dr, 'text', { x: P.l - 6, y: sy(y) + 4, 'text-anchor': 'end' }, y + '%');
    });
    [-2, -1, 0, 1, 2, 3].forEach(function (x) {
      svgEl(dr, 'line', { class: 'tick', x1: sx(x), x2: sx(x), y1: H - P.b, y2: H - P.b + 4 });
      svgEl(dr, 'text', { x: sx(x), y: H - P.b + 16, 'text-anchor': 'middle' }, String(Math.pow(10, x)).replace('0.', '.'));
    });
    svgEl(dr, 'line', { class: 'axis', x1: P.l, x2: W - P.r, y1: H - P.b, y2: H - P.b });
    svgEl(dr, 'line', { class: 'axis', x1: P.l, x2: P.l, y1: P.t, y2: H - P.b });
    svgEl(dr, 'text', { x: (P.l + W - P.r) / 2, y: H - 4, 'text-anchor': 'middle' }, T.doseAxis);
    var title = svgEl(dr, 'text', { x: W - P.r, y: P.t + 10, 'text-anchor': 'end', fill: 'var(--ink)' });
    var giLine = svgEl(dr, 'line', { class: 'gi-line' });
    var giText = svgEl(dr, 'text', { fill: 'var(--dapi)' });
    var path = svgEl(dr, 'path', { class: 'curve' });
    var pts = doses.map(function () { return svgEl(dr, 'circle', { class: 'pt', r: 3.4 }); });

    /* ranking */
    var order = cpds.map(function (c, i) { return i; }).sort(function (a, b) {
      var ga = cpds[a].gi, gb = cpds[b].gi;
      return (ga === null ? 99 : ga) - (gb === null ? 99 : gb);
    });
    var rankBtns = [];
    order.forEach(function (ci, pos) {
      var c = cpds[ci], li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      var w = c.gi === null ? 0 : Math.max(4, (2.6 - c.gi) / 4.6 * 100);
      b.innerHTML = '<span>' + (pos + 1) + '</span><span>' + c.row + '</span><span class="bar"><i style="width:' + w.toFixed(0) + '%"></i></span><span class="v">' + fmt(c.gi) + '</span>';
      b.addEventListener('click', function () { select(ci); });
      li.appendChild(b); rank.appendChild(li);
      rankBtns[ci] = b;
    });

    function select(i) {
      sel = i;
      var c = cpds[i], d = '';
      for (var s = 0; s <= 100; s++) {
        var x = xmin + (xmax - xmin) * s / 100;
        d += (s ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(growth(x, c)).toFixed(1);
      }
      path.setAttribute('d', d);
      pts.forEach(function (p, k) { p.setAttribute('cx', sx(doses[k])); p.setAttribute('cy', sy(c.vals[k])); });
      if (c.gi !== null) {
        giLine.setAttribute('x1', sx(c.gi)); giLine.setAttribute('x2', sx(c.gi));
        giLine.setAttribute('y1', sy(50)); giLine.setAttribute('y2', H - P.b);
        giText.setAttribute('x', sx(c.gi) + 5); giText.setAttribute('y', sy(50) - 6);
        giText.textContent = 'GI50 ' + fmt(c.gi);
        giLine.style.display = giText.style.display = '';
      } else {
        giLine.style.display = 'none';
        giText.style.display = '';
        giText.setAttribute('x', P.l + 8); giText.setAttribute('y', sy(50) - 6);
        giText.textContent = T.inactive;
      }
      title.textContent = c.name;
      rowBg.forEach(function (rb, k) { rb.setAttribute('opacity', k === i ? 1 : 0); });
      rankBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i); });
    }
    select(order[0]);
  })();

  /* ════════ Fig. 4 · cell cycle from DNA content ════════
     Phase fractions shift with dose; the histogram is the sum of a
     sub-G1 smear, a G1 peak at 2N, an S plateau and a G2/M peak at 4N. */
  (function () {
    var svg = document.getElementById('cc'), dose = document.getElementById('cc-dose');
    var out = document.getElementById('cc-dose-out'), read = document.getElementById('cc-read');
    var mech = 'g2';
    var P = { l: 36, r: 10, t: 14, b: 38 }, W = 400, H = 260, BINS = 64, XMAX = 5;
    var COL = { sub: '#c0392b', g1: '#2f4bd8', s: '#9aa6e8', g2: '#191917' };

    function fractions(d) {
      var f = { sub: .03, g1: .58, s: .22, g2: .17 }, k = d / 100;
      if (mech === 'g2') { f.g2 += .48 * k; f.g1 -= .40 * k; f.s -= .08 * k; }
      else { f.g1 += .25 * k; f.s -= .14 * k; f.g2 -= .11 * k; }
      f.sub += .32 * k * k;                       /* death only kicks in at high dose */
      var t = f.sub + f.g1 + f.s + f.g2;
      for (var p in f) f[p] = Math.max(0, f[p] / t);
      return f;
    }
    function dens(x, f) {
      function g(m, s) { return Math.exp(-.5 * Math.pow((x - m) / s, 2)) / (s * 2.5066); }
      var sPlateau = x > 2.15 && x < 3.85 ? 1 / 1.7 : 0;
      var sub = x > .3 && x < 1.8 ? Math.exp(-(1.8 - x) * 1.2) * .9 : 0;
      return { sub: f.sub * sub, g1: f.g1 * g(2, .13), s: f.s * sPlateau, g2: f.g2 * g(4, .2) };
    }

    var bw = (W - P.l - P.r) / BINS, bars = [];
    for (var i = 0; i < BINS; i++) {
      var stack = {};
      ['sub', 's', 'g1', 'g2'].forEach(function (k) { stack[k] = svgEl(svg, 'rect', { x: P.l + i * bw + .5, width: Math.max(.5, bw - 1), fill: COL[k] }); });
      bars.push(stack);
    }
    svgEl(svg, 'line', { class: 'axis', x1: P.l, x2: W - P.r, y1: H - P.b, y2: H - P.b });
    function bx(x) { return P.l + x / XMAX * (W - P.l - P.r); }
    [[2, '2N'], [4, '4N']].forEach(function (t) {
      svgEl(svg, 'line', { class: 'tick', x1: bx(t[0]), x2: bx(t[0]), y1: H - P.b, y2: H - P.b + 4 });
      svgEl(svg, 'text', { x: bx(t[0]), y: H - P.b + 16, 'text-anchor': 'middle' }, t[1]);
    });
    svgEl(svg, 'text', { x: (P.l + W - P.r) / 2, y: H - 4, 'text-anchor': 'middle' }, T.dnaAxis);
    svgEl(svg, 'text', { x: 12, y: (P.t + H - P.b) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (P.t + H - P.b) / 2 + ')' }, T.nuclei);

    function update() {
      var d = +dose.value, f = fractions(d), peak = 0, cols = [];
      for (var i = 0; i < BINS; i++) {
        var x = (i + .5) / BINS * XMAX, v = dens(x, f);
        cols.push(v);
        peak = Math.max(peak, v.sub + v.g1 + v.s + v.g2);
      }
      var scale = (H - P.t - P.b) / Math.max(peak, 1.2);
      cols.forEach(function (v, i) {
        var y = H - P.b;
        ['sub', 's', 'g1', 'g2'].forEach(function (k) {
          var h = v[k] * scale;
          y -= h;
          bars[i][k].setAttribute('y', y.toFixed(1));
          bars[i][k].setAttribute('height', Math.max(0, h).toFixed(1));
        });
      });
      out.textContent = d === 0 ? T.control : d + ' %';
      function pc(v) { return (v * 100).toFixed(0) + ' %'; }
      function key(k) { return '<span class="phase-key" style="background:' + COL[k] + '"></span>'; }
      var verdict = f.sub > .25 ? T.ccKill
        : (mech === 'g2' && f.g2 > .35) ? T.ccG2
        : (mech === 'g1' && f.g1 > .70) ? T.ccG1
        : T.ccNone;
      read.innerHTML =
        '<span>' + key('sub') + 'sub-G1</span><b>' + pc(f.sub) + '</b>' +
        '<span>' + key('g1') + 'G1</span><b>' + pc(f.g1) + '</b>' +
        '<span>' + key('s') + 'S</span><b>' + pc(f.s) + '</b>' +
        '<span>' + key('g2') + 'G2/M</span><b>' + pc(f.g2) + '</b>' +
        '<p class="verdict">' + verdict + '</p>';
    }
    document.querySelectorAll('[data-mech]').forEach(function (b) {
      b.addEventListener('click', function () {
        mech = b.dataset.mech;
        document.querySelectorAll('[data-mech]').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
        update();
      });
    });
    dose.addEventListener('input', update);
    update();
  })();

  /* ════════ Fig. 5 · volcano plot ════════ */
  (function () {
    var svg = document.getElementById('vo'), box = document.getElementById('vo-box');
    var fc = document.getElementById('vo-fc'), pv = document.getElementById('vo-p'), read = document.getElementById('vo-read');
    var r = rng(11), genes = [];
    for (var i = 0; i < 900; i++) {
      var de = r() < .08, lfc, lp;
      if (de) {
        var sign = r() < .62 ? 1 : -1;   /* treatment switches on more than it switches off */
        lfc = sign * (.8 + r() * 3);
        lp = 2 + Math.abs(lfc) * (1 + r() * 1.6);
      } else {
        lfc = gauss(r) * .45;
        lp = -Math.log10(r() || 1e-6) * (.6 + Math.abs(lfc));
      }
      genes.push({ id: 'gene_' + String(i + 1).padStart(4, '0'), lfc: lfc, lp: Math.min(lp, 11.5) });
    }

    var P = { l: 40, r: 12, t: 12, b: 36 }, W = 440, H = 300, XM = 4.5, YM = 12;
    function sx(x) { return P.l + (x + XM) / (2 * XM) * (W - P.l - P.r); }
    function sy(y) { return H - P.b - y / YM * (H - P.t - P.b); }
    [-4, -2, 0, 2, 4].forEach(function (x) {
      svgEl(svg, 'line', { class: 'tick', x1: sx(x), x2: sx(x), y1: H - P.b, y2: H - P.b + 4 });
      svgEl(svg, 'text', { x: sx(x), y: H - P.b + 16, 'text-anchor': 'middle' }, x);
    });
    [0, 4, 8, 12].forEach(function (y) { svgEl(svg, 'text', { x: P.l - 6, y: sy(y) + 4, 'text-anchor': 'end' }, y); });
    svgEl(svg, 'line', { class: 'axis', x1: P.l, x2: W - P.r, y1: H - P.b, y2: H - P.b });
    svgEl(svg, 'line', { class: 'axis', x1: P.l, x2: P.l, y1: P.t, y2: H - P.b });
    svgEl(svg, 'text', { x: (P.l + W - P.r) / 2, y: H - 4, 'text-anchor': 'middle' }, T.fcAxis);
    svgEl(svg, 'text', { x: 12, y: (P.t + H - P.b) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (P.t + H - P.b) / 2 + ')' }, '−log10 p');
    var hl = svgEl(svg, 'line', { class: 'gi-line' }), vl1 = svgEl(svg, 'line', { class: 'gi-line' }), vl2 = svgEl(svg, 'line', { class: 'gi-line' });
    var dots = genes.map(function (g) { return svgEl(svg, 'circle', { cx: sx(g.lfc).toFixed(1), cy: sy(g.lp).toFixed(1), r: 2.6 }); });

    var tip = document.createElement('div');
    tip.className = 'tip'; tip.hidden = true; box.appendChild(tip);
    svg.addEventListener('pointermove', function (e) {
      var rc = svg.getBoundingClientRect(), k = W / rc.width;
      var x = (e.clientX - rc.left) * k, y = (e.clientY - rc.top) * k, best = -1, bd = 64;
      genes.forEach(function (g, i) {
        var dx = sx(g.lfc) - x, dy = sy(g.lp) - y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      });
      if (best < 0) { tip.hidden = true; return; }
      var g = genes[best];
      tip.hidden = false;
      tip.textContent = g.id + ' · ' + (g.lfc > 0 ? '+' : '') + g.lfc.toFixed(2) + ' · p=' + Math.pow(10, -g.lp).toExponential(1);
      var br = box.getBoundingClientRect();
      tip.style.left = (rc.left - br.left + sx(g.lfc) / k) + 'px';
      tip.style.top = (rc.top - br.top + sy(g.lp) / k) + 'px';
    });
    svg.addEventListener('pointerleave', function () { tip.hidden = true; });

    function update() {
      var t = +fc.value, p = +pv.value, up = 0, down = 0;
      genes.forEach(function (g, i) {
        var hit = g.lp >= p && Math.abs(g.lfc) >= t;
        if (hit) { if (g.lfc > 0) up++; else down++; }
        dots[i].setAttribute('fill', hit ? (g.lfc > 0 ? '#2f4bd8' : '#191917') : '#d6d0c2');
      });
      var yy = sy(Math.min(p, YM));
      hl.setAttribute('x1', P.l); hl.setAttribute('x2', W - P.r); hl.setAttribute('y1', yy); hl.setAttribute('y2', yy);
      [[vl1, -t], [vl2, t]].forEach(function (v) {
        v[0].setAttribute('x1', sx(v[1])); v[0].setAttribute('x2', sx(v[1]));
        v[0].setAttribute('y1', P.t); v[0].setAttribute('y2', H - P.b);
      });
      document.getElementById('vo-fc-out').textContent = Math.pow(2, t).toFixed(t < 1 ? 1 : 0) + '×';
      document.getElementById('vo-p-out').textContent = p < 3 ? Math.pow(10, -p).toPrecision(1) : '1e-' + p.toFixed(1);
      var n = up + down, verdict = n > 180 ? T.voLoose
        : n < 15 ? T.voStrict
        : T.voOk;
      read.innerHTML = '<span>' + T.up + '</span><b>' + up + T.genes + '</b><span>' + T.down + '</span><b>' + down + T.genes + '</b><p class="verdict">' + verdict + '</p>';
    }
    [fc, pv].forEach(function (el) { el.addEventListener('input', update); });
    update();
  })();

  /* ════════ Publications filter ════════ */
  (function () {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.pubs tbody tr'));
    var shown = document.getElementById('pub-shown');
    function filter(year) {
      var n = 0;
      rows.forEach(function (row) {
        var on = year === 'all' || row.dataset.year === year;
        row.hidden = !on;
        if (on) n++;
      });
      shown.textContent = n + T.of + rows.length;
    }
    document.querySelectorAll('.filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.filters button').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
        filter(b.dataset.year);
      });
    });
    filter('all');
  })();

  /* ════════ Current section in the top bar ════════ */
  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.top-nav a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || !links[e.target.id]) return;
        Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
        links[e.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('section.entry').forEach(function (s) { io.observe(s); });
  }
})();
