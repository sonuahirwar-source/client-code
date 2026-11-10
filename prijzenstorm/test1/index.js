(() => {
    'use strict';
    const testInfo = {
        className: 'gmd-24',
        debug: 0,
        testName: 'T24 | Staffelkeuze op PDP vereenvoudigen',
        testVersion: 'v1'
    };
 
    let debounceTimeout;
 
    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }
 
    waitForElement("body:has(.product-layout  .buy-card)", ([pdp]) => {
        document.body.classList.add(testInfo.className);
        
(function () {

  if (window.__psVolTable) return;
  window.__psVolTable = true;

  var CFG = {
    blockSel: 'kaching-bundles-block',
    barsSel: '.kaching-bundles__bars',
    barSel: '.kaching-bundles__bar[data-deal-bar-id]',
    selectedClass: 'kaching-bundles__bar--selected',
    qtyInputSel: 'input[name="quantity"].qty-input, .\\#product-qty-selector-input',
    qtyDrivesTier: true,
    title: 'Kies je aantal en bespaar',
    badgeFromTier: 3,
    stockBox: true,
    stockBoxTitle: 'Op voorraad',
    stockBoxText: 'Op werkdagen voor 15:00 besteld, vandaag verzonden',
    labels: { qty: 'Aantal', save: 'Besparing', unit: 'Prijs per stuk', one: 'stuk', many: 'stuks' },
    maxWaitMs: 15000
  };

  function euro(s) {
    var m = String(s || '').replace(/\s/g, '').match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/);
    return m ? parseFloat(m[1].replace(/\./g, '') + '.' + (m[2] || '0')) : NaN;
  }
  function fmt(n) { return '€' + n.toFixed(2).replace('.', ','); }
  function txt(el, sel) { var n = el.querySelector(sel); return n ? n.textContent : ''; }
function slug(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents (é → e)
    .replace(/[^a-z0-9]+/g, '-')                      // anything else → hyphen
    .replace(/^-+|-+$/g, '');                         // trim leading/trailing hyphens
}
  function qtyMap(block) {
    var map = {};
    try { JSON.parse(block.getAttribute('deal-block')).dealBars.forEach(function (d) { map[d.id] = +d.quantity; }); } catch (e) {}
    return map;
  }

  function readTiers(block) {
    var map = qtyMap(block);
    return Array.prototype.map.call(block.querySelectorAll(CFG.barSel), function (bar) {
      var id = bar.getAttribute('data-deal-bar-id');
      var qty = map[id];
      if (!qty) { var m = txt(bar, '.kaching-bundles__bar-subtitle').match(/(\d+)\s*stuk/i); qty = m ? +m[1] : 1; }
      var total = euro(txt(bar, '.kaching-bundles__bar-price'));
      var unit = euro(txt(bar, '.kaching-bundles__bar-label'));
      if (isNaN(unit) && !isNaN(total)) unit = total / qty;
      if (isNaN(total) && !isNaN(unit)) total = unit * qty;
      var badge = txt(bar, '.kaching-bundles__bar-most-popular__content').trim();
      return { id: id, bar: bar, qty: qty, unit: unit, total: total, badge: badge, selected: bar.classList.contains(CFG.selectedClass) };
    }).filter(function (t) { return t.qty > 0 && !isNaN(t.unit); }).sort(function (a, b) { return a.qty - b.qty; });
  }

  function init(block) {
    var wrap = document.createElement('div');
    wrap.className = 'ps-vt';
    var tiers = [], lastSig = '', own = { at: 0, qty: 0 };

    function render() {
      var bars = block.querySelector(CFG.barsSel);
      tiers = readTiers(block);
      if (!bars || tiers.length < 2) { document.documentElement.classList.remove('ps-vt-on'); return; }

      var regular = tiers[0].total / tiers[0].qty; // savings base = 1-unit price
      var sig = tiers.map(function (t) { return t.id + t.qty + t.total + t.badge + t.selected; }).join('|');
      var selIdx = -1; tiers.forEach(function (t, i) { if (t.selected) selIdx = i; });

      if (sig !== lastSig) {
        lastSig = sig;
        var h = '<p class="ps-vt-title">' + CFG.title + '</p><table class="ps-vt-table"><thead><tr><th scope="col">' + CFG.labels.qty + '</th><th scope="col">' +
          CFG.labels.save + '</th><th scope="col">' + CFG.labels.unit + '</th></tr></thead><tbody role="radiogroup" aria-label="' + CFG.labels.qty + '">';
        tiers.forEach(function (t, i) {
          var save = Math.round((regular * t.qty - t.total) * 100) / 100;
          h += '<tr class="ps-vt-row' + (t.selected ? ' is-selected' : '') + (i === selIdx - 1 ? ' is-prev' : '') + '" data-id="' + t.id + '" role="radio" tabindex="' +
            (t.selected ? 0 : -1) + '" aria-checked="' + t.selected + '">' +
            '<td><span class="ps-vt-qty"><span class="ps-vt-radio" aria-hidden="true"></span>' + t.qty + ' ' +
            (t.qty === 1 ? CFG.labels.one : CFG.labels.many) + '</span></td>' +
            '<td>' + (i === 0 || save < 0.01 ? '<span class="ps-vt-dash">–</span>' : '<span class="ps-vt-save">-' + fmt(save) + '</span>') + '</td>' +
'<td>' + (t.badge && i >= CFG.badgeFromTier - 1 ? '<span class="ps-vt-badge ' + slug(t.badge) + '">' + t.badge + '</span>' : '') +
            '<span class="ps-vt-unit">' + fmt(t.unit) + '</span></td></tr>';
        });
        wrap.innerHTML = h + '</tbody></table>';
      }
      if (wrap.nextElementSibling !== bars) bars.parentNode.insertBefore(wrap, bars);
      document.documentElement.classList.add('ps-vt-on');
    }

    function selectTier(id, focus) {
      var t = tiers.filter(function (x) { return x.id === id; })[0];
      if (!t) return;
      own = { at: Date.now(), qty: t.qty };
      if (!t.selected) (t.bar.querySelector('.kaching-bundles__bar-main') || t.bar.querySelector('label') || t.bar).click();
      setTimeout(function () {
        render();
        if (focus) { var r = wrap.querySelector('[data-id="' + id + '"]'); r && r.focus(); }
      }, 0);
    }

    wrap.addEventListener('click', function (e) {
      var row = e.target.closest('.ps-vt-row');
      if (row) selectTier(row.getAttribute('data-id'));
    });
    wrap.addEventListener('keydown', function (e) {
      var row = e.target.closest('.ps-vt-row');
      if (!row) return;
      var k = e.key, sib = null;
      if (k === ' ' || k === 'Enter') { e.preventDefault(); return selectTier(row.getAttribute('data-id'), true); }
      if (k === 'ArrowDown' || k === 'ArrowRight') sib = row.nextElementSibling;
      if (k === 'ArrowUp' || k === 'ArrowLeft') sib = row.previousElementSibling;
      if (sib) { e.preventDefault(); selectTier(sib.getAttribute('data-id'), true); }
    });

    var timer;
    function schedule() { clearTimeout(timer); timer = setTimeout(render, 20); }
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var n = muts[i].target;
        if (!(n.closest && n.closest('.ps-vt'))) return schedule();
      }
    }).observe(block, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });

    function onQty(e) {
      if (!e.target.matches || !e.target.matches(CFG.qtyInputSel)) return;
      if (Date.now() - own.at < 400 && parseInt(e.target.value, 10) === own.qty) return;
      setTimeout(function () {
        render();
        if (!CFG.qtyDrivesTier) return;
        var q = parseInt(e.target.value, 10) || 1, best = null, cur = null;
        tiers.forEach(function (t) { if (t.qty <= q) best = t; if (t.selected) cur = t; });
        if (best && best !== cur) {
          own = { at: Date.now(), qty: best.qty };
          (best.bar.querySelector('.kaching-bundles__bar-main') || best.bar.querySelector('label')).click();
          if (e.target.value != q) e.target.value = q;
          setTimeout(render, 0);
        }
      }, 60);
    }
    document.addEventListener('change', onQty, true);
    document.addEventListener('input', onQty, true);

    render();
    layout(block);
    new MutationObserver(function () { layout(block); }).observe(block.closest('aside') || document.body, { childList: true });
  }

  // Tag buy-box blocks so CSS can reorder them (no DOM moves)
  function layout(block) {
    var aside = block.closest('aside');
    if (!aside) return;
    Array.prototype.forEach.call(aside.children, function (b) {
      if (b.querySelector('[data-bundle-price-line], .price-line')) b.classList.add('ps-vt-b-price');
      else if (b.querySelector('.pzs-stock-indicator')) b.classList.add('ps-vt-b-stock');
      else if (b.querySelector('input[name="quantity"]') && !b.querySelector('kaching-bundle')) b.classList.add('ps-vt-b-qty');
      else if (b.querySelector('kaching-bundle')) b.classList.add('ps-vt-b-form');
    });
    var form = aside.querySelector('.ps-vt-b-form');
    if (!form) return;
    var kb = form.querySelector('kaching-bundle'), pf = form.querySelector('product-form');
    if (kb) kb.classList.add('ps-vt-i-kaching');
    if (pf) pf.classList.add('ps-vt-i-atc');
    if (CFG.stockBox && !aside.querySelector('.ps-vt-stockbox')) {
      var box = document.createElement('div');
      box.className = 'ps-vt-stockbox';
      box.innerHTML = '<div class="ps-vt-stockbox-ico"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.55694 12.1897C3.36422 11.7668 3.24644 11.5018 3.20361 11.3947L2.71377 10.2624C2.56387 9.91447 2.43539 9.63074 2.32832 9.41124L2.0312 8.80898C1.45838 7.67404 0.781166 6.8737 -0.000441194 6.40795C0.915003 5.63705 1.73141 5.2516 2.44877 5.2516C2.92523 5.2516 3.29997 5.43629 3.573 5.80568C3.84603 6.16972 4.0789 6.8041 4.27163 7.70884C5.66353 5.06958 6.74761 3.24672 7.52386 2.24027C8.21982 1.33553 8.81405 0.735943 9.30657 0.441502C9.80444 0.147061 10.4629 -0.00015974 11.282 -0.00015974C11.7959 -0.00015974 12.3527 0.0988793 12.9523 0.296958C11.555 1.2124 10.0293 2.71673 8.37507 4.80993C6.7262 6.90314 5.12015 9.36306 3.55694 12.1897Z" fill="white"/></svg></div>' +
      
 
      '<div><strong>' + CFG.stockBoxTitle + '</strong><span>' + CFG.stockBoxText + '</span></div>';
      aside.appendChild(box);
    }
    aside.classList.add('ps-vt-layout');
  }

  var start = Date.now();
  (function wait() {
    var block = document.querySelector(CFG.blockSel);
    if (block && block.querySelector(CFG.barSel + ' .kaching-bundles__bar-label')) return init(block);
    if (Date.now() - start < CFG.maxWaitMs) setTimeout(wait, 100);
  })();
})();
        
    });

    (function () {
  if (window.__psQty) return;
  window.__psQty = true;

  var t = Date.now();
  (function wait() {
    var realWrap = document.querySelector('.qty-wrapper');            // .#product-qty-selector-input-wrapper
    var atc = document.querySelector('product-to-cart');
    if (realWrap && atc) return init(realWrap, atc);
    if (Date.now() - t < 15000) setTimeout(wait, 100);
  })();

  function init(realWrap, atc) {
    var realMinus = realWrap.querySelector('.qty-btn.minus');
    var realPlus  = realWrap.querySelector('.qty-btn.plus');
    var realInput = realWrap.querySelector('.qty-input');

    // hide the real quantity block (keeps working in the background)
    (realWrap.closest('[data-meta-block]') || realWrap).classList.add('ps-qty-orig-hidden');

    // custom stepper
    var box = document.createElement('div');
    box.className = 'ps-qty';
    box.innerHTML =
      '<button type="button" class="ps-qty-btn ps-qty-minus" aria-label="Minder">−</button>' +
      '<input type="number" class="ps-qty-input" inputmode="numeric" value="' + realInput.value + '" aria-label="Hoeveelheid">' +
      '<button type="button" class="ps-qty-btn ps-qty-plus" aria-label="Meer">+</button>';
    atc.insertBefore(box, atc.firstChild);
    atc.classList.add('ps-qty-row');

    var myInput = box.querySelector('.ps-qty-input');

    // custom button click -> click the REAL button
    box.querySelector('.ps-qty-minus').addEventListener('click', function () { realMinus.click(); });
    box.querySelector('.ps-qty-plus').addEventListener('click', function () { realPlus.click(); });

    // typing in custom input -> real input + same events
    myInput.addEventListener('change', function () {
      var min = +realInput.min || 1, max = +realInput.max || 999;
      var v = Math.max(min, Math.min(max, parseInt(myInput.value, 10) || min));
      realInput.value = v;
      realInput.dispatchEvent(new Event('input', { bubbles: true }));
      realInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // keep custom input showing the real value (buttons, tier clicks, Kaching)
    setInterval(function () {
      if (document.activeElement !== myInput && myInput.value !== realInput.value) myInput.value = realInput.value;
    }, 100);
  }
})();
})();

