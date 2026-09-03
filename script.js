(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll state + mobile toggle ---------- */
  var nav = document.getElementById('mainNav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function onScrollNav() {
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Scroll reveal (fade up + un-blur), high-water mark ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target); // high-water mark: never un-reveal
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el, i) {
      var offset = Math.min(i % 6, 5) * 60;
      el.style.transitionDelay = (offset / 1000) + 's';
      io.observe(el);
    });
  }

  /* ---------- Parallax (background-image drift) ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var parallaxTextEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax-text]'));

  function updateParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var depth = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var rect = el.parentElement.getBoundingClientRect();
      var centerOffset = rect.top + rect.height / 2 - vh / 2;
      var shift = -centerOffset * depth;
      var maxShift = rect.height * 0.1;
      if (shift > maxShift) shift = maxShift;
      if (shift < -maxShift) shift = -maxShift;
      el.style.transform = 'translateY(' + shift.toFixed(1) + 'px)';
    });
    parallaxTextEls.forEach(function (el) {
      var depth = parseFloat(el.getAttribute('data-parallax-text')) || 0.1;
      var rect = el.closest('section').getBoundingClientRect();
      var centerOffset = rect.top + rect.height / 2 - vh / 2;
      var shift = -centerOffset * depth * 0.15;
      el.style.transform = 'translateY(' + shift.toFixed(1) + 'px)';
    });
  }

  var parallaxTicking = false;
  function onScrollParallax() {
    if (!parallaxTicking && !reducedMotion) {
      parallaxTicking = true;
      requestAnimationFrame(function () {
        updateParallax();
        parallaxTicking = false;
      });
    }
  }
  if (!reducedMotion) {
    window.addEventListener('scroll', onScrollParallax, { passive: true });
    window.addEventListener('resize', onScrollParallax);
    updateParallax();
  }

  /* ---------- CARE phase rail: highlight active phase on scroll ---------- */
  var phaseRows = Array.prototype.slice.call(document.querySelectorAll('.care-row'));
  var phaseChips = Array.prototype.slice.call(document.querySelectorAll('[data-phase-chip]'));

  function updatePhaseRail() {
    if (!phaseRows.length) return;
    var line = window.innerHeight * 0.42;
    var active = 0;
    phaseRows.forEach(function (row, i) {
      var r = row.getBoundingClientRect();
      if (!r.height) return;
      if (r.top <= line) active = i;
    });
    phaseChips.forEach(function (chip) {
      var idx = Number(chip.getAttribute('data-phase-chip'));
      chip.classList.toggle('active', idx === active);
    });
  }
  window.addEventListener('scroll', updatePhaseRail, { passive: true });
  updatePhaseRail();

  /* ---------- Timeline wipe reveal + legend highlight ---------- */
  var timelineWipe = document.getElementById('timelineWipe');
  var timelineLegend = Array.prototype.slice.call(document.querySelectorAll('[data-legend]'));
  var timelineDone = false;

  // proportional widths matching the flex ratios in the bar: dyn2 iso3 rest1.4 dyn2 iso3 rest1.4 dyn2 iso3 stretch2
  var segments = [
    { key: 'dyn', flex: 2 }, { key: 'iso', flex: 3 }, { key: 'rest', flex: 1.4 },
    { key: 'dyn', flex: 2 }, { key: 'iso', flex: 3 }, { key: 'rest', flex: 1.4 },
    { key: 'dyn', flex: 2 }, { key: 'iso', flex: 3 }, { key: 'stretch', flex: 2 }
  ];
  var totalFlex = segments.reduce(function (s, seg) { return s + seg.flex; }, 0);
  // cumulative end proportion per unique key (last occurrence wins, i.e. how far the wipe must travel to fully reveal that key at least once)
  var keyReveal = {};
  var acc = 0;
  segments.forEach(function (seg) {
    acc += seg.flex;
    keyReveal[seg.key] = acc / totalFlex;
  });

  function lightLegendInSequence() {
    timelineLegend.forEach(function (el) {
      var key = el.getAttribute('data-legend');
      var delay = (keyReveal[key] || 0) * 2200;
      setTimeout(function () {
        el.classList.add('lit');
        setTimeout(function () { el.classList.remove('lit'); }, 900);
      }, delay);
    });
  }

  function runTimelineWipe() {
    if (timelineDone || !timelineWipe) return;
    timelineDone = true;
    if (reducedMotion) {
      timelineWipe.classList.add('revealed');
      return;
    }
    requestAnimationFrame(function () {
      timelineWipe.classList.add('revealed');
      lightLegendInSequence();
    });
  }

  var timelineBar = document.getElementById('timelineBar');
  if (timelineBar) {
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runTimelineWipe();
            tio.disconnect();
          }
        });
      }, { threshold: 0.4 });
      tio.observe(timelineBar);
    } else {
      runTimelineWipe();
    }
  }

  /* ---------- Znanost: expand/collapse detail ---------- */
  var scienceToggle = document.getElementById('scienceToggle');
  var scienceDetail = document.getElementById('scienceDetail');
  if (scienceToggle && scienceDetail) {
    scienceToggle.addEventListener('click', function () {
      var open = scienceDetail.classList.toggle('open');
      scienceToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      scienceToggle.textContent = open ? 'Sakrijte znanstveno objašnjenje' : 'Pročitajte znanstveno objašnjenje';
    });
  }

  /* ---------- Contact form: fake local submit ---------- */
  var contactForm = document.getElementById('contactForm');
  var sentPanel = document.getElementById('sentPanel');
  if (contactForm && sentPanel) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactForm.classList.add('hidden');
      sentPanel.classList.add('visible');
    });
  }
})();
