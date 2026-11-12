/* クリック計測: 電話・LINE・Instagram・TikTok・地図・メールのリンクが押されたらGA4にイベントを送る */
(function () {
  var rules = [
    ['tel_click', function (h) { return h.indexOf('tel:') === 0; }],
    ['line_click', function (h) { return /lin\.ee|line\.me/.test(h); }],
    ['instagram_click', function (h) { return /instagram\.com/.test(h); }],
    ['tiktok_click', function (h) { return /tiktok\.com/.test(h); }],
    ['map_click', function (h) { return /maps\.google|google\.com\/maps|maps\.app\.goo/.test(h); }],
    ['mail_click', function (h) { return h.indexOf('mailto:') === 0; }]
  ];
  // どの店のリンクか: 電話番号・アカウント名・地図の検索語から判断（ページの場所ではなくリンク先で決める）
  var stores = [
    ['senbero', /0980870799|senberofudo|senbero12345|せんべろ|%E3%81%9B%E3%82%93%E3%81%B9%E3%82%8D/],
    ['garage', /0980876261|san_drip_garage|san\.drip\.garage|GARAGE/i],
    ['leje', /0980876259|leje\.ishigaki|leje\.isg|Leje/i],
    ['chucky', /09074534007|snack_chucky|ちゃっきー|%E3%81%A1%E3%82%83%E3%81%A3%E3%81%8D%E3%83%BC/],
    ['ryugu', /0980874374|ryugu|琉宮|RYUGU/i],
    ['paw', /0980876777|PAW/]
  ];
  function storeOf(a, h) {
    var key = decodeURI(h).replace(/-/g, '');
    for (var i = 0; i < stores.length; i++) if (stores[i][1].test(key) || stores[i][1].test(h)) return stores[i][0];
    var card = a.closest('[data-store]');
    if (card) return card.getAttribute('data-store');
    return 'group';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || typeof gtag !== 'function') return;
    var h = a.getAttribute('href');
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][1](h)) {
        gtag('event', rules[i][0], { store: storeOf(a, h), link_url: h, transport_type: 'beacon' });
        return;
      }
    }
  }, true);
})();
