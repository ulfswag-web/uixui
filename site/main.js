(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (min-width:981px)').matches;

  /* Loader -> hero intro */
  var loader = $('#loader');
  function start() {
    document.documentElement.classList.add('is-ready');
    loader.classList.add('is-done');
    setTimeout(function () { loader.style.display = 'none'; }, 1100);
  }
  $$('.hero .reveal').forEach(function (el) { el.style.setProperty('--d', (el.dataset.delay || 0) - 1.1); });
  window.addEventListener('load', function () { setTimeout(start, reduce ? 0 : 1200); });
  setTimeout(function () { if (!document.documentElement.classList.contains('is-ready')) start(); }, 3500);

  /* Reveal on scroll (hero items appear after loader) */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(function (el) {
    if (el.closest('.hero')) {
      var t = setInterval(function () {
        if (document.documentElement.classList.contains('is-ready')) { el.classList.add('is-in'); clearInterval(t); }
      }, 100);
    } else io.observe(el);
  });

  /* Date inputs */
  var din = $('#in'), dout = $('#out');
  function iso(d) { return d.toISOString().slice(0, 10); }
  var now = new Date(); din.min = iso(now); dout.min = iso(new Date(now.getTime() + 864e5));
  din.addEventListener('change', function () {
    if (!din.value) return;
    var n = new Date(new Date(din.value).getTime() + 864e5);
    dout.min = iso(n); if (dout.value && dout.value < dout.min) dout.value = dout.min;
  });

  /* Nav: solid after hero start, hide on scroll down */
  var nav = $('#nav'), lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 60);
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !$('#menu').classList.contains('is-open'));
    lastY = y;
  }, { passive: true });
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(o) { menu.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* Parallax */
  var par = $$('[data-parallax]');
  function parallax() {
    var vh = window.innerHeight;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var k = parseFloat(el.dataset.parallax);
      var d = el.classList.contains('hero__scene') ? window.scrollY : (r.top + r.height / 2 - vh / 2);
      el.style.transform = 'translate3d(0,' + (d * k * (el.classList.contains('hero__scene') ? 1 : -1)).toFixed(1) + 'px,0)';
    });
  }
  if (!reduce) { window.addEventListener('scroll', parallax, { passive: true }); parallax(); }

  /* Manifest: words light up with scroll */
  var mt = $('[data-words]');
  var words = [];
  if (mt) {
    mt.innerHTML = mt.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    words = $$('.w', mt);
    var wUpdate = function () {
      var r = mt.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35)));
      var n = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    };
    window.addEventListener('scroll', wUpdate, { passive: true }); wUpdate();
  }

  /* Counters */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1600;
      if (reduce) { el.textContent = to + suf; return; }
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), v = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * v) + suf; if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ROOMS: динамическая смена двух категорий */
  var rooms = [
    { title: 'Дабл', price: '7 200', desc: 'Первая категория. Кровать Queen size 1800×2000, четыре дизайн-концепции.', tags: ['Queen size 1800×2000', '4 концепции'] },
    { title: 'Королевский люкс', price: '22 000', desc: 'Джуниор-сюит с кроватью King size 2000×2000 и открытой террасой 75 м².', tags: ['Джуниор-сюит', 'King size 2000×2000', 'Терраса 75 м²'] }
  ];
  var DUR = 7000, cur = 0, timer = null, paused = false;
  var stage = $('#stage'), slides = $$('.slide'), tabs = $$('.tab'), pauseBtn = $('#pause');
  stage.style.setProperty('--dur', DUR + 'ms');

  function show(i) {
    var prev = cur; cur = (i + rooms.length) % rooms.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-prev', k === prev && k !== cur); s.classList.remove('is-active'); });
    void stage.offsetWidth;
    slides[cur].classList.add('is-active');
    slides[prev] && slides[prev] !== slides[cur] && setTimeout(function () { slides[prev].classList.remove('is-prev'); }, 1500);
    var r = rooms[cur];
    var title = $('#rTitle'); title.innerHTML = '<span class="swap">' + r.title + '</span>';
    ['#rDesc', '#rTags', '#idx'].forEach(function (s) { var e = $(s); e.classList.remove('swap'); void e.offsetWidth; e.classList.add('swap'); });
    $('#rDesc').textContent = r.desc;
    $('#idx').textContent = '0' + (cur + 1);
    $('#rTags').innerHTML = r.tags.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    countPrice(r.price);
    tabs.forEach(function (t, k) {
      var on = k === cur; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on);
      var b = $('.bar', t); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    });
  }
  function countPrice(str) {
    var el = $('#rPrice'), to = parseInt(str.replace(/\s/g, ''), 10), from = parseInt(el.textContent.replace(/\s/g, ''), 10) || 0, t0 = performance.now();
    if (reduce) { el.textContent = str; return; }
    (function tick(t) {
      var p = Math.min(1, (t - t0) / 900), v = from + (to - from) * (1 - Math.pow(1 - p, 3));
      el.textContent = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function schedule() { clearTimeout(timer); if (!paused && !reduce) timer = setTimeout(function () { show(cur + 1); schedule(); }, DUR); }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(+t.dataset.i); schedule(); }); });
  pauseBtn.addEventListener('click', function () {
    paused = !paused; stage.classList.toggle('is-paused', paused);
    pauseBtn.textContent = paused ? '▶' : 'II'; pauseBtn.setAttribute('aria-label', paused ? 'Продолжить' : 'Пауза');
    paused ? clearTimeout(timer) : (show(cur), schedule());
  });
  /* start the autoplay only while the section is visible */
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(cur); schedule(); } else clearTimeout(timer); });
  }, { threshold: .4 }).observe(stage);
  /* swipe */
  var sx = null;
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) { show(cur + (dx < 0 ? 1 : -1)); schedule(); } sx = null;
  });

  /* Cursor + magnetic buttons (desktop only) */
  if (fine && !reduce) {
    var c = $('#cursor'), x = 0, y = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; c.classList.add('is-on'); });
    (function loop() { cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
    $$('a,button,.tab,input,select').forEach(function (el) {
      el.addEventListener('mouseenter', function () { c.classList.add('is-big'); });
      el.addEventListener('mouseleave', function () { c.classList.remove('is-big'); });
    });
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .25) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }
})();
