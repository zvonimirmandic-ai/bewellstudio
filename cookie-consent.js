(function () {
  'use strict';

  var STORAGE_KEY = 'bewell-cookie-consent'; // 'all' | 'necessary'

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function loadMap() {
    var embed = document.getElementById('mapEmbed');
    if (!embed || embed.querySelector('iframe')) return;
    var src = embed.getAttribute('data-map-src');
    if (!src) return;
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.title = 'Lokacija BeWell studija';
    embed.innerHTML = '';
    embed.appendChild(iframe);
  }

  function applyConsent(value) {
    if (value === 'all') loadMap();
  }

  function hideBanner(banner) {
    banner.classList.remove('visible');
    setTimeout(function () { banner.remove(); }, 500);
  }

  function buildBanner() {
    if (document.querySelector('.cookie-banner')) return;
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Postavke kolačića');
    var path = (window.__bewellAssetPath || '');
    banner.innerHTML =
      '<p>Koristimo kolačiće nužne za rad stranice te, uz vašu privolu, kolačiće treće strane (Google Maps) za prikaz lokacije studija. Više u <a href="' + path + 'kolacici.html">Politici kolačića</a>.</p>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="cookie-accept" id="cookieAcceptAll">Prihvati sve</button>' +
        '<button type="button" class="cookie-reject" id="cookieRejectAll">Samo nužni</button>' +
      '</div>';
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add('visible'); });

    document.getElementById('cookieAcceptAll').addEventListener('click', function () {
      setConsent('all');
      applyConsent('all');
      hideBanner(banner);
    });
    document.getElementById('cookieRejectAll').addEventListener('click', function () {
      setConsent('necessary');
      hideBanner(banner);
    });
  }

  window.reopenCookieSettings = function () {
    buildBanner();
  };

  document.addEventListener('DOMContentLoaded', function () {
    var consent = getConsent();
    if (consent) {
      applyConsent(consent);
    } else {
      buildBanner();
    }

    var mapBtn = document.getElementById('mapLoadBtn');
    if (mapBtn) {
      mapBtn.addEventListener('click', function () { loadMap(); });
    }
  });
})();
