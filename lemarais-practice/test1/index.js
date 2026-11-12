(() => {
    'use strict';
    const testInfo = {
        className: 'gmd-7',
        debug: 0,
        testName: 'Test Name',
        testVersion: 'v1'
    };
    const excludedUrls = [
        '/nl/collections/schoenen',
        '/nl/collections/sneakers',
        '/nl/collections/loafers',
        '/nl/collections/laarzen',
        '/nl/collections/bruine-loafers'
    ];

    if (excludedUrls.includes(window.location.pathname)) {
        return;
    }
    let debounceTimeout;

    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }

    waitForElement("#collection-filters", ([pdp]) => {
        document.body.classList.add(testInfo.className);

(function () {
  'use strict';

  if (window.__lmSizeFilter) return;
  window.__lmSizeFilter = true;

  var BAR_ID = 'collection-filters';
  var TOGGLE_ID = 'lm-size-toggle';
  var PANEL_ID = 'lm-size-filter';
  var READY_CLASS = 'lm-sf-ready';
  var SIZE_PARAM = 'filter.v.t.shopify.size';
  var SHOE_PARAM = 'filter.v.t.shopify.shoe-size';

  function range(from, to) {
    var out = [];
    for (var i = from; i <= to; i++) out.push([String(i), String(i)]);
    return out;
  }

  // [display label, native filter value, label in native drawer (for availability)]
  // `onlyOn`: optional list of paths where this group is shown (all pages if omitted)
  var GROUPS = [
    {
      key: 'clothing',
      title: 'Kledingmaat',
      param: SIZE_PARAM,
      sizes: [
        ['XXS', 'XXS', 'XXS'],
        ['XS - 34', 'XS - 34', 'XS · 34'],
        ['S - 36', 'S - 36', 'S · 36'],
        ['M - 38', 'M - 38', 'M · 38'],
        ['L - 40', 'L - 40', 'L · 40'],
        ['XL - 42', 'XL - 42', 'XL · 42'],
        ['XXL', 'XXL- 44', 'XXL · 44']
      ]
    },
    { key: 'jeans', title: 'Jeansmaat', param: SIZE_PARAM, sizes: range(24, 33) },
    {
      key: 'shoes',
      title: 'Schoenmaat',
      param: SHOE_PARAM,
      sizes: range(35, 42),
      onlyOn: ['/nl/collections/shop']
    }
  ];

  function groupVisible(g) {
    if (!g.onlyOn) return true;
    var path = location.pathname.replace(/\/$/, '');
    return g.onlyOn.indexOf(path) !== -1;
  }

  var state = { clothing: null, jeans: null, shoes: null };
  var isOpen = false;

  // Availability read from the native filter drawer:
  // { 'Kledingmaat': { 'XS · 34': true, ... }, 'Jeansmaat': {...}, ... }
  var avail = null;
  var probing = false;
  var probedSearch = null;   // location.search the current `avail` belongs to
  var probeTimer = null;

  // Values this component owns, per URL param
  var OWNED = {};
  OWNED[SIZE_PARAM] = [];
  OWNED[SHOE_PARAM] = [];
  GROUPS.forEach(function (g) {
    g.sizes.forEach(function (s) { OWNED[g.param].push(s[1]); });
  });

  var CHEVRON =
    '<svg class="lm-sf-toggle__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="currentColor" stroke="currentColor" stroke-width="0.1" d="M5.12723 5.93969L9.94843 0.347513C10.1083 0.158702 9.86065 -0.127638 9.69348 0.062645C9.69349 0.0626329 4.99976 5.50701 4.99976 5.50701L0.306028 0.0626326C0.236887 -0.0174705 0.12389 -0.0186618 0.053442 0.0599533C-0.016902 0.138713 -0.0179215 0.267377 0.0510883 0.347513L4.87229 5.93969C4.93904 6.01989 5.06047 6.02032 5.12723 5.93969Z"></path>' +
    '</svg>';

  function isCollectionPage() {
    return /\/collections\//.test(location.pathname) &&
      !excludedUrls.includes(location.pathname);
  }

  // ---------- URL <-> state ----------
  function readStateFromUrl() {
    var params = new URLSearchParams(location.search);
    GROUPS.forEach(function (g) {
      var active = params.getAll(g.param);
      var match = null;
      g.sizes.forEach(function (s) {
        if (!match && active.indexOf(s[1]) !== -1) match = s[1];
      });
      state[g.key] = match;
    });
  }

  function buildUrl() {
    var params = new URLSearchParams(location.search);

    // Keep size values this component doesn't own (e.g. set via the drawer)
    [SIZE_PARAM, SHOE_PARAM].forEach(function (param) {
      var keep = params.getAll(param).filter(function (v) {
        return OWNED[param].indexOf(v) === -1;
      });
      params.delete(param);
      keep.forEach(function (v) { params.append(param, v); });
    });

    // Same param twice = OR in Shopify
    GROUPS.forEach(function (g) {
      if (state[g.key]) params.append(g.param, state[g.key]);
    });

    params.delete('page');
    var qs = params.toString();
    return location.pathname + (qs ? '?' + qs : '') + location.hash;
  }

  // ---------- Client-side navigation (no full page reload) ----------
  var routerCache = null;

  function getFiber(el) {
    if (!el) return null;
    for (var k in el) {
      if (k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0) {
        return el[k];
      }
    }
    return null;
  }

  function findRouter() {
    if (routerCache) return routerCache;

    var start = document.getElementById(BAR_ID) || document.body;
    var fiber = getFiber(start);
    var guard = 0;

    while (fiber && guard++ < 2000) {
      var v = fiber.memoizedProps && fiber.memoizedProps.value;
      if (v && typeof v === 'object') {
        // React Router / Shopify Hydrogen (data router)
        if (v.router && typeof v.router.navigate === 'function') {
          routerCache = { type: 'rr-data', r: v.router };
          return routerCache;
        }
        // React Router (navigator)
        if (v.navigator && typeof v.navigator.push === 'function') {
          routerCache = { type: 'rr-nav', r: v.navigator };
          return routerCache;
        }
        // Next.js (app or pages router)
        if (typeof v.push === 'function' && typeof v.prefetch === 'function') {
          routerCache = { type: 'next', r: v };
          return routerCache;
        }
      }
      fiber = fiber.return;
    }

    if (window.next && window.next.router && typeof window.next.router.push === 'function') {
      routerCache = { type: 'next', r: window.next.router };
      return routerCache;
    }
    return null;
  }

  function navigate(url) {
    var found = findRouter();
    try {
      if (found) {
        if (found.type === 'rr-data') {
          found.r.navigate(url, { preventScrollReset: true });
        } else if (found.type === 'rr-nav') {
          found.r.push(url);
        } else if ('asPath' in found.r) {
          found.r.push(url, undefined, { scroll: false }); // Next pages router
        } else {
          found.r.push(url, { scroll: false });            // Next app router
        }
        return;
      }
    } catch (e) {
      routerCache = null;
    }
    location.assign(url); // last resort
  }

  // ---------- UI ----------
  function buildToggle() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = TOGGLE_ID;
    btn.className = 'lm-sf-toggle font-avant-garde';
    btn.setAttribute('aria-controls', PANEL_ID);
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = CHEVRON + '<span class="lm-sf-toggle__label">Maat</span>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!isOpen);
      // Availability not loaded yet for this URL: check right away
      if (isOpen && !probing && location.search !== probedSearch) {
        clearTimeout(probeTimer);
        probe();
      }
    });
    return btn;
  }

  function buildPanel() {
    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'font-avant-garde';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Filter op maat');
    panel.setAttribute('data-path', location.pathname);
    panel.hidden = true;

    GROUPS.forEach(function (g) {
      if (!groupVisible(g)) return;

      var row = document.createElement('div');
      row.className = 'lm-sf__group';

      var label = document.createElement('p');
      label.className = 'lm-sf__label';
      label.textContent = g.title;
      var rangeEl = document.createElement('span');
      rangeEl.className = 'lm-sf__range';
      rangeEl.textContent = g.sizes[0][0].split(' ')[0] + ' - ' +
        g.sizes[g.sizes.length - 1][0].split(' ')[0];
      label.appendChild(rangeEl);

      var chips = document.createElement('div');
      chips.className = 'lm-sf__chips';

      g.sizes.forEach(function (s) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lm-sf__chip';
        btn.setAttribute('data-group', g.key);
        btn.setAttribute('data-title', g.title);
        btn.setAttribute('data-label', s[2] || s[0]);
        btn.setAttribute('data-value', s[1]);
        btn.setAttribute('aria-pressed', 'false');
        var span = document.createElement('span');
        span.textContent = s[0];
        btn.appendChild(span);
        chips.appendChild(btn);
      });

      row.appendChild(label);
      row.appendChild(chips);
      panel.appendChild(row);
    });

    panel.addEventListener('click', onChipClick);
    return panel;
  }

  function setOpen(open) {
    isOpen = open;
    render();
  }

  function render() {
    var toggle = document.getElementById(TOGGLE_ID);
    var panel = document.getElementById(PANEL_ID);

    var count = 0;
    GROUPS.forEach(function (g) {
      if (groupVisible(g) && state[g.key]) count++;
    });

    if (toggle) {
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.querySelector('.lm-sf-toggle__label').textContent =
        'Maat' + (count ? ' (' + count + ')' : '');
    }

    if (panel) {
      panel.hidden = !isOpen;
      var chips = panel.querySelectorAll('.lm-sf__chip');
      for (var i = 0; i < chips.length; i++) {
        var c = chips[i];
        var on = state[c.getAttribute('data-group')] === c.getAttribute('data-value');
        c.setAttribute('aria-pressed', on ? 'true' : 'false');

        // Same availability as the native drawer (selected chips stay usable)
        var title = c.getAttribute('data-title');
        var off = !on && !!avail && !!avail[title] &&
          avail[title][c.getAttribute('data-label')] !== true;
        c.disabled = off;
        c.setAttribute('aria-disabled', off ? 'true' : 'false');
      }
    }
  }

  function onChipClick(e) {
    var btn = e.target.closest('.lm-sf__chip');
    if (!btn || btn.disabled) return;
    var group = btn.getAttribute('data-group');
    var value = btn.getAttribute('data-value');

    // Single select per group; clicking the active one deselects it
    state[group] = state[group] === value ? null : value;

    // Shoe size is a separate Shopify filter (AND with clothing sizes),
    // so keep it exclusive to avoid an always-empty result.
    if (group === 'shoes' && state.shoes) {
      state.clothing = null;
      state.jeans = null;
    } else if (group !== 'shoes' && state[group]) {
      state.shoes = null;
    }

    render();
    navigate(buildUrl());
  }

  // Close on outside click / Escape
  document.addEventListener('click', function (e) {
    if (!isOpen || probing) return;
    var bar = document.getElementById(BAR_ID);
    if (bar && !bar.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (isOpen && !probing && e.key === 'Escape') {
      setOpen(false);
      var t = document.getElementById(TOGGLE_ID);
      if (t) t.focus();
    }
  });

  // ---------- Read availability from the native drawer ----------
  function waitFor(fn, timeout) {
    return new Promise(function (resolve, reject) {
      var start = Date.now();
      (function tick() {
        var res = null;
        try { res = fn(); } catch (e) { /* ignore */ }
        if (res) return resolve(res);
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(tick, 50);
      })();
    });
  }

  function log() {
    if (window.lmSfDebug) {
      try { console.log.apply(console, ['[size-filter]'].concat([].slice.call(arguments))); } catch (e) { /* ignore */ }
    }
  }

  function norm(t) {
    return (t || '').replace(/\s+/g, ' ').trim();
  }

  // The FILTER drawer specifically (other headlessui dialogs, e.g. menu/cart, are ignored)
  function getDrawer() {
    var panels = document.querySelectorAll('[id^="headlessui-dialog-panel"]');
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      if (p.querySelector('button[aria-label="Filters sluiten"]')) return p;
      var h = p.querySelector('h2');
      if (h && norm(h.textContent).toLowerCase() === 'filter') return p;
    }
    return null;
  }

  function findMaatTrigger() {
    var drawer = getDrawer();
    if (!drawer) return null;
    var btns = drawer.querySelectorAll('button[aria-controls]');
    for (var i = 0; i < btns.length; i++) {
      // "Maat" or "Maat (1)" when a size is active
      if (/^maat\b/i.test(norm(btns[i].textContent))) return btns[i];
    }
    return null;
  }

  function readSizes(trigger) {
    var region = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!region || region.hidden) return null;
    var titles = region.querySelectorAll('p');
    if (!titles.length) return null;

    var data = {};
    var chipCount = 0;
    for (var i = 0; i < titles.length; i++) {
      var title = norm(titles[i].textContent);
      var wrap = titles[i].nextElementSibling;
      if (!wrap) continue;
      data[title] = {};
      for (var j = 0; j < wrap.children.length; j++) {
        var chip = wrap.children[j];
        var label = norm(chip.textContent);
        var enabled = chip.tagName === 'A' &&
          chip.getAttribute('aria-disabled') !== 'true' &&
          !chip.querySelector('[aria-disabled="true"]');
        data[title][label] = enabled;
        chipCount++;
      }
    }
    return chipCount ? data : null;
  }

  function closeDrawer() {
    var drawer = getDrawer();
    if (!drawer) return;
    var close = drawer.querySelector('button[aria-label="Filters sluiten"]') ||
      drawer.querySelector('button[aria-label]');
    if (close) {
      close.click();
    } else {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
  }

  // React only reacts to clicks after hydration: wait until the button has React props
  function isHydrated(el) {
    for (var k in el) {
      if (k.indexOf('__reactProps$') === 0 || k.indexOf('__reactEventHandlers$') === 0) return true;
    }
    return false;
  }

  var attempts = {};      // per URL
  var MAX_ATTEMPTS = 4;

  function probe() {
    if (probing) return;
    var search = location.search;
    if (search === probedSearch) return;

    var bar = document.getElementById(BAR_ID);
    var filterBtn = bar && bar.querySelector(':scope > .grid > :nth-child(1) button');
    if (!filterBtn) { log('no filter button yet'); return retryLater(search, 800); }
    if (!isHydrated(filterBtn)) { log('page not hydrated yet'); return retryLater(search, 800, true); }
    if (getDrawer()) { log('drawer open by user, retry later'); return retryLater(search, 1500, true); }

    var root = document.documentElement;
    var active = document.activeElement;
    var scrollY = window.scrollY;
    var openedMaat = false;
    var trigger = null;

    probing = true;
    attempts[search] = (attempts[search] || 0) + 1;
    log('probe start', search, 'attempt', attempts[search]);
    root.classList.add('lm-sf-probing');
    filterBtn.click();

    waitFor(findMaatTrigger, 5000)
      .then(function (t) {
        trigger = t;
        if (t.getAttribute('aria-expanded') !== 'true') {
          t.click();
          openedMaat = true;
        }
        return waitFor(function () { return readSizes(t); }, 5000);
      })
      .then(function (data) {
        log('availability', data);
        if (location.search === search) {
          avail = data;
          probedSearch = search;
        }
      })
      .catch(function (err) {
        log('probe failed', err && err.message);
      })
      .then(function () {
        if (openedMaat && trigger && trigger.isConnected) trigger.click(); // leave drawer as it was
        closeDrawer();
        setTimeout(function () {
          root.classList.remove('lm-sf-probing');
          probing = false;
          if (Math.abs(window.scrollY - scrollY) > 2) window.scrollTo(0, scrollY);
          if (active && active.focus && active !== document.body) {
            try { active.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
          } else if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
          render();
          if (location.search !== probedSearch) retryLater(location.search, 1000);
          scheduleMount();
        }, 400);
      });
  }

  function retryLater(search, delay, free) {
    // `free` = waiting for page/user, doesn't count as a failed attempt
    if (!free && (attempts[search] || 0) >= MAX_ATTEMPTS) {
      log('giving up for', search);
      return;
    }
    clearTimeout(probeTimer);
    probeTimer = setTimeout(probe, delay);
  }

  function scheduleProbe() {
    var search = location.search;
    if (search === probedSearch || probing) return;
    if ((attempts[search] || 0) >= MAX_ATTEMPTS) return;
    clearTimeout(probeTimer);
    // short delay so the site has loaded the new results first
    probeTimer = setTimeout(probe, 600);
  }

  // ---------- Mount / keep alive through React re-renders ----------
  function cleanup() {
    var t = document.getElementById(TOGGLE_ID);
    var p = document.getElementById(PANEL_ID);
    if (t) t.remove();
    if (p) p.remove();
    var bar = document.getElementById(BAR_ID);
    if (bar) bar.classList.remove(READY_CLASS);
  }

  function mount() {
    if (!isCollectionPage()) { cleanup(); return; }

    var bar = document.getElementById(BAR_ID);
    if (!bar) return;
    var grid = bar.querySelector(':scope > .grid');
    if (!grid) return;

    if (!bar.classList.contains(READY_CLASS)) bar.classList.add(READY_CLASS);

    // "Maat" button inside the bar row (order handled in CSS)
    var toggle = document.getElementById(TOGGLE_ID);
    if (!toggle || toggle.parentElement !== grid) {
      if (toggle) toggle.remove();
      grid.appendChild(buildToggle());
    }

    // Dropdown panel directly under the bar row
    // (rebuilt when the path changes, so page-specific rows show/hide correctly)
    var panel = document.getElementById(PANEL_ID);
    if (!panel || panel.parentElement !== bar || bar.lastElementChild !== panel ||
        panel.getAttribute('data-path') !== location.pathname) {
      if (panel) panel.remove();
      bar.appendChild(buildPanel());
    }

    readStateFromUrl();
    render();
    if (!probing) scheduleProbe();
  }

  var scheduled = false;
  function scheduleMount() {
    if (scheduled || probing) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      mount();
    });
  }

  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () {
      var res = orig.apply(this, arguments);
      scheduleMount();
      return res;
    };
  });
  window.addEventListener('popstate', scheduleMount);

  new MutationObserver(scheduleMount).observe(document.body, {
    childList: true,
    subtree: true
  });

  scheduleMount();
})();
    });
})();