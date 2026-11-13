(() => {
    'use strict';
    const testInfo = {
        className: 'gmd-7',
        debug: 0,
        testName: 'Test Name',
        testVersion: 'v1'
    };
    // Exact path or any sub-path of these is excluded
    const excludedUrls = [
           // ---------- Schoenen ----------
    '/nl/collections/schoenen',
    '/nl/collections/sneakers',
    '/nl/collections/loafers',
    '/nl/collections/bruine-loafers',
    '/nl/collections/laarzen',
    '/nl/collections/sandalen',
    // shoe brands (only shoes)
    '/nl/collections/mercer',
    '/nl/collections/toral',

    // ---------- Accessoires ----------
    '/nl/collections/accessoires',
    // Sjaals
    '/nl/collections/sjaals',
    '/nl/collections/beige-sjaal',
    '/nl/collections/blauwe-sjaal',
    '/nl/collections/bruine-sjaal',
    // Sieraden
    '/nl/collections/sieraden',
    '/nl/collections/kettingen',
    '/nl/collections/gouden-ketting',
    '/nl/collections/oorbellen',
    '/nl/collections/gouden-oorbellen',
    '/nl/collections/ellen-beekmans',   // jewellery brand
    // Riemen
    '/nl/collections/riemen',
    '/nl/collections/grijze-riem',
    // Other
    '/nl/collections/tassen',
    '/nl/collections/handschoenen',
    '/nl/collections/petten',
    '/nl/collections/sokken',
    // Sjaals
'/nl/collections/wollen-sjaal',
'/nl/collections/cashmere-sjaal',

// Mutsen & Hoeden
'/nl/collections/mutsen',
'/nl/collections/hoeden',

// Armbanden
'/nl/collections/armbanden',

// Sokken
'/nl/collections/wollen-sokken',
'/nl/collections/witte-sokken',
'/nl/collections/zwarte-sokken',

// Riemen
'/nl/collections/zwarte-riem',
'/nl/collections/beige-riem',
'/nl/collections/blauwe-riem',
'/nl/collections/bruine-riem',
    ];

    function isExcludedPath(path) {
        path = (path || '').replace(/\/+$/, '');
        return excludedUrls.some(function (u) { return path === u || path.indexOf(u + '/') === 0; });
    }

    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }

    // No early return on excluded pages: the user can navigate client-side from an excluded page
    // to /shop without reload, so the script has to be running everywhere.
    waitForElement('body', () => {
        // Body class only on non-excluded pages; re-synced on every client-side route change
        function syncBodyClass() {
            document.body.classList.toggle(testInfo.className, !isExcludedPath(location.pathname));
        }
        syncBodyClass();

(function () {
  'use strict';

  if (window.__lmSizeFilter) return;
  window.__lmSizeFilter = true;

  var BAR_ID = 'collection-filters';
  var TOGGLE_ID = 'lm-size-toggle';
  var PANEL_ID = 'lm-size-filter';
  var READY_CLASS = 'lm-sf-ready';
  var PROBING_CLASS = 'lm-sf-probing';
  var CACHE_KEY = 'lm_sf_maat_v3';
  var CACHE_TTL = 10 * 60 * 1000;
  var MAX_ATTEMPTS = 4;
  var QUIET_MS = 500;       // page must be quiet this long before we read the drawer

  var isOpen = false;

  function log() {
    if (window.lmSfDebug || testInfo.debug) {
      try { console.log.apply(console, ['[size-filter]'].concat([].slice.call(arguments))); } catch (e) { /* ignore */ }
    }
  }
  function norm(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function normPath(p) { return (p || '').replace(/\/+$/, ''); }

  function isCollectionPage() {
    return /\/collections\//.test(location.pathname) && !isExcludedPath(location.pathname);
  }

  // ---------- Size data, per URL (path + filters) ----------
  // groups = [{ title, param, chips: [{ label, param, value, enabled }] }]
  // groups = []  → control has no "Maat" section on this URL → hide our toggle
  var cache = {};           // key → { t, groups }
  var lastForPath = {};     // pathname → groups (shown dimmed while the new URL is being read)

  function filterEntries(params) {
    var out = [];
    params.forEach(function (v, k) { if (k.indexOf('filter.') === 0) out.push(k + '\u0000' + v); });
    return out;
  }
  function pageKey() {
    return normPath(location.pathname) + '?' + filterEntries(new URLSearchParams(location.search)).sort().join('&');
  }

  try {
    var saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
    Object.keys(saved).forEach(function (k) {
      if (Date.now() - saved[k].t < CACHE_TTL) cache[k] = saved[k];
    });
  } catch (e) { /* ignore */ }

  function saveData(key, groups) {
    cache[key] = { t: Date.now(), groups: groups };
    lastForPath[key.split('?')[0]] = groups;
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* ignore */ }
  }
  function currentData() {
    var hit = cache[pageKey()];
    if (hit) return { groups: hit.groups, stale: false };
    var prev = lastForPath[normPath(location.pathname)];
    return prev ? { groups: prev, stale: true } : null;
  }

  // a minus b (count-aware)
  function minus(a, b) {
    var rest = b.slice();
    return a.filter(function (x) {
      var i = rest.indexOf(x);
      if (i === -1) return true;
      rest.splice(i, 1);
      return false;
    });
  }

  // ---------- URL helpers ----------
  function isPressed(chip, params) {
    return !!chip.param && params.getAll(chip.param).indexOf(chip.value) !== -1;
  }

  function buildUrl(groups, group, chip) {
    var params = new URLSearchParams(location.search);
    var on = isPressed(chip, params);

    function removeValues(param, values) {
      var keep = params.getAll(param).filter(function (v) { return values.indexOf(v) === -1; });
      params.delete(param);
      keep.forEach(function (v) { params.append(param, v); });
    }
    function valuesOf(g) {
      return g.chips.filter(function (c) { return c.param === g.param && c.value; })
        .map(function (c) { return c.value; });
    }

    // Single select per group (clicking the active one deselects it)
    removeValues(chip.param, valuesOf(group));

    if (!on) {
      // Groups on another Shopify param (e.g. shoe-size) are AND-ed → keep them exclusive
      groups.forEach(function (g) {
        if (g.param && g.param !== chip.param) removeValues(g.param, valuesOf(g));
      });
      params.append(chip.param, chip.value); // same param twice = OR in Shopify
    }

    params.delete('page');
    var qs = params.toString();
    return location.pathname + (qs ? '?' + qs : '') + location.hash;
  }

  // ---------- Client-side navigation (no full page reload) ----------
  var routerCache = null;

  function getFiber(el) {
    if (!el) return null;
    for (var k in el) {
      if (k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0) return el[k];
    }
    return null;
  }

  function findRouter() {
    if (routerCache) return routerCache;
    var fiber = getFiber(document.getElementById(BAR_ID) || document.body);
    var guard = 0;
    while (fiber && guard++ < 2000) {
      var v = fiber.memoizedProps && fiber.memoizedProps.value;
      if (v && typeof v === 'object') {
        if (v.router && typeof v.router.navigate === 'function') return (routerCache = { type: 'rr-data', r: v.router });
        if (v.navigator && typeof v.navigator.push === 'function') return (routerCache = { type: 'rr-nav', r: v.navigator });
        if (typeof v.push === 'function' && typeof v.prefetch === 'function') return (routerCache = { type: 'next', r: v });
      }
      fiber = fiber.return;
    }
    if (window.next && window.next.router && typeof window.next.router.push === 'function') {
      return (routerCache = { type: 'next', r: window.next.router });
    }
    return null;
  }

  function navigate(url) {
    var found = findRouter();
    try {
      if (found) {
        if (found.type === 'rr-data') found.r.navigate(url, { preventScrollReset: true });
        else if (found.type === 'rr-nav') found.r.push(url);
        else if ('asPath' in found.r) found.r.push(url, undefined, { scroll: false });
        else found.r.push(url, { scroll: false });
        return;
      }
    } catch (e) {
      routerCache = null;
    }
    location.assign(url);
  }

  // ---------- UI ----------
  var CHEVRON =
    '<svg class="lm-sf-toggle__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="currentColor" stroke="currentColor" stroke-width="0.1" d="M5.12723 5.93969L9.94843 0.347513C10.1083 0.158702 9.86065 -0.127638 9.69348 0.062645C9.69349 0.0626329 4.99976 5.50701 4.99976 5.50701L0.306028 0.0626326C0.236887 -0.0174705 0.12389 -0.0186618 0.053442 0.0599533C-0.016902 0.138713 -0.0179215 0.267377 0.0510883 0.347513L4.87229 5.93969C4.93904 6.01989 5.06047 6.02032 5.12723 5.93969Z"></path>' +
    '</svg>';

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
      if (isOpen) scheduleProbe(0);
    });
    return btn;
  }

  function buildPanel() {
    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'font-avant-garde';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Filter op maat');
    panel.hidden = true;
    panel.addEventListener('click', onChipClick);
    return panel;
  }

  // Rows are built from the control's drawer → exactly the same groups and sizes
  function fillPanel(panel, groups) {
    panel.innerHTML = '';
    groups.forEach(function (g, gi) {
      var row = document.createElement('div');
      row.className = 'lm-sf__group';

      var label = document.createElement('p');
      label.className = 'lm-sf__label';
      label.textContent = g.title;
      if (g.chips.length > 1) {
        var rangeEl = document.createElement('span');
        rangeEl.className = 'lm-sf__range';
        rangeEl.textContent = g.chips[0].label.split(' ')[0] + ' - ' +
          g.chips[g.chips.length - 1].label.split(' ')[0];
        label.appendChild(rangeEl);
      }

      var chips = document.createElement('div');
      chips.className = 'lm-sf__chips';
      g.chips.forEach(function (c, ci) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lm-sf__chip';
        btn.setAttribute('data-g', gi);
        btn.setAttribute('data-c', ci);
        btn.setAttribute('aria-pressed', 'false');
        var span = document.createElement('span');
        span.textContent = c.label;
        btn.appendChild(span);
        chips.appendChild(btn);
      });

      row.appendChild(label);
      row.appendChild(chips);
      panel.appendChild(row);
    });
    panel.__groups = groups;
  }

  function setOpen(open) {
    isOpen = open;
    render();
  }

  function render() {
    var toggle = document.getElementById(TOGGLE_ID);
    var panel = document.getElementById(PANEL_ID);
    if (!toggle || !panel) return;

    var data = currentData();
    var groups = data ? data.groups : null;
    var params = new URLSearchParams(location.search);

    // Control has no "Maat" on this URL → variant neither
    var none = !!data && !data.stale && groups.length === 0;
    if (toggle.hidden !== none) toggle.hidden = none;
    if (none && isOpen) isOpen = false;

    // Panel content
    if (!groups || !groups.length) {
      if (panel.__groups !== 'loading') {
        panel.innerHTML = '<p class="lm-sf__loading">Laden…</p>';
        panel.__groups = 'loading';
      }
    } else if (panel.__groups !== groups) {
      fillPanel(panel, groups);
    }
    panel.classList.toggle('lm-sf--updating', !!data && data.stale);
    panel.hidden = !isOpen;

    // Chip states
    var count = 0;
    if (groups && groups.length) {
      groups.forEach(function (g, gi) {
        var any = false;
        g.chips.forEach(function (c, ci) {
          var el = panel.querySelector('.lm-sf__chip[data-g="' + gi + '"][data-c="' + ci + '"]');
          if (!el) return;
          var on = isPressed(c, params);
          if (on) any = true;
          var off = !on && (!c.enabled || !c.value);   // same as the control's drawer
          el.setAttribute('aria-pressed', on ? 'true' : 'false');
          el.disabled = off;
          el.setAttribute('aria-disabled', off ? 'true' : 'false');
        });
        if (any) count++;
      });
    }

    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    var lbl = toggle.querySelector('.lm-sf-toggle__label');
    var text = 'Maat' + (count ? ' (' + count + ')' : '');
    if (lbl.textContent !== text) lbl.textContent = text;
  }

  function onChipClick(e) {
    var btn = e.target.closest('.lm-sf__chip');
    if (!btn || btn.disabled) return;
    var panel = document.getElementById(PANEL_ID);
    var groups = panel && panel.__groups;
    if (!groups || groups === 'loading') return;
    var group = groups[+btn.getAttribute('data-g')];
    var chip = group && group.chips[+btn.getAttribute('data-c')];
    if (!chip || !chip.value) return;
    navigate(buildUrl(groups, group, chip));
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

  // ---------- Read sizes from the control's filter drawer ----------
  var probing = false;
  var aborted = false;
  var pendingReplay = null;
  var probeTimer = null;
  var attempts = {};        // per pageKey
  var lastMutation = Date.now();

  function waitFor(fn, timeout) {
    return new Promise(function (resolve, reject) {
      var start = Date.now();
      (function tick() {
        if (aborted) return reject(new Error('aborted'));
        var res = null;
        try { res = fn(); } catch (e) { /* ignore */ }
        if (res) return resolve(res);
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(tick, 50);
      })();
    });
  }

  // The FILTER drawer specifically (menu / cart / search dialogs are ignored)
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
      if (/^maat\b/i.test(norm(btns[i].textContent))) return btns[i];   // "Maat" or "Maat (1)"
    }
    return null;
  }

  // Returns { groups, fresh } or null when not rendered yet.
  // fresh = every link in the drawer belongs to the CURRENT url (not the previous page)
  function readSizes(trigger) {
    var region = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!region || region.hidden) return null;
    var titles = region.querySelectorAll('p');
    if (!titles.length) return null;

    var cur = filterEntries(new URLSearchParams(location.search));
    var groups = [];
    var fresh = true;
    var count = 0;

    for (var i = 0; i < titles.length; i++) {
      var wrap = titles[i].nextElementSibling;
      if (!wrap) continue;
      var g = { title: norm(titles[i].textContent), param: null, chips: [] };

      for (var j = 0; j < wrap.children.length; j++) {
        var el = wrap.children[j];
        var a = el.tagName === 'A' ? el : el.querySelector('a[href]');
        var chip = {
          label: norm(el.textContent),
          enabled: !!a && el.getAttribute('aria-disabled') !== 'true' && !el.querySelector('[aria-disabled="true"]'),
          param: null,
          value: null
        };

        if (a) {
          var u = new URL(a.getAttribute('href'), location.origin);
          if (normPath(u.pathname) !== normPath(location.pathname)) fresh = false;
          var href = filterEntries(u.searchParams);
          var add = minus(href, cur);
          var rem = minus(cur, href);
          var entry = add.length === 1 && !rem.length ? add[0] : (rem.length === 1 && !add.length ? rem[0] : null);
          if (entry) {
            var parts = entry.split('\u0000');
            chip.param = parts[0];
            chip.value = parts[1];
            if (!g.param) g.param = chip.param;
          } else {
            fresh = false;
          }
        }
        g.chips.push(chip);
        count++;
      }
      if (g.chips.length) groups.push(g);
    }
    return count ? { groups: groups, fresh: fresh } : null;
  }

  function closeDrawer() {
    var drawer = getDrawer();
    if (!drawer) return;
    var close = drawer.querySelector('button[aria-label="Filters sluiten"]') || drawer.querySelector('button[aria-label]');
    if (close) close.click();
    else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }

  // React only reacts to clicks after hydration
  function isHydrated(el) {
    for (var k in el) {
      if (k.indexOf('__reactProps$') === 0 || k.indexOf('__reactEventHandlers$') === 0) return true;
    }
    return false;
  }

  function findFilterButton(bar) {
    var btn = bar.querySelector(':scope > .grid > :nth-child(1) button');
    if (btn) return btn;
    var all = bar.querySelectorAll('button');
    for (var i = 0; i < all.length; i++) {
      if (/^filter$/i.test(norm(all[i].textContent))) return all[i];
    }
    return null;
  }

  function anyDialogOpen() {
    return !!document.querySelector('[role="dialog"]');
  }

  function scheduleProbe(delay) {
    var key = pageKey();
    if (probing || cache[key] || !isCollectionPage()) return;
    if ((attempts[key] || 0) >= MAX_ATTEMPTS) return;
    clearTimeout(probeTimer);
    probeTimer = setTimeout(tryProbe, delay == null ? 300 : delay);
  }

  function tryProbe() {
    // wait until the site has finished rendering the new results
    var wait = QUIET_MS - (Date.now() - lastMutation);
    if (wait > 0) { probeTimer = setTimeout(tryProbe, wait + 20); return; }
    probe();
  }

  function retryLater(delay) {
    clearTimeout(probeTimer);
    probeTimer = setTimeout(tryProbe, delay);
  }

  function probe() {
    if (probing) return;
    var key = pageKey();
    if (cache[key] || (attempts[key] || 0) >= MAX_ATTEMPTS || !isCollectionPage()) return;

    var bar = document.getElementById(BAR_ID);
    var filterBtn = bar && findFilterButton(bar);
    if (!filterBtn) { log('no filter button yet'); return retryLater(800); }
    if (!isHydrated(filterBtn)) { log('not hydrated yet'); return retryLater(800); }
    if (anyDialogOpen()) { log('a dialog is open (filter/cart/menu/search), retry later'); return retryLater(1500); }

    var root = document.documentElement;
    var active = document.activeElement;
    var scrollY = window.scrollY;
    var openedMaat = false;
    var trigger = null;

    probing = true;
    aborted = false;
    attempts[key] = (attempts[key] || 0) + 1;
    log('probe', key, 'attempt', attempts[key]);
    root.classList.add(PROBING_CLASS);   // drawer invisible ONLY while this class is on
    filterBtn.click();

    waitFor(getDrawer, 4000)
      .then(function () {
        // drawer is open: no "Maat" in it → this collection has no size filter
        return waitFor(findMaatTrigger, 1500).catch(function (err) {
          if (err.message === 'timeout') return null;
          throw err;
        });
      })
      .then(function (t) {
        if (!t) {
          if (pageKey() === key) saveData(key, []);
          log('no Maat in control');
          return;
        }
        trigger = t;
        if (t.getAttribute('aria-expanded') !== 'true') { t.click(); openedMaat = true; }
        return waitFor(function () { return readSizes(t); }, 4000).then(function (res) {
          log('read', res);
          if (pageKey() !== key) return;
          if (res.fresh) saveData(key, res.groups);
          else log('drawer still shows the previous page, retry');
        });
      })
      .catch(function (err) { log('probe failed', err && err.message); })
      .then(function () {
        if (!aborted && openedMaat && trigger && trigger.isConnected) trigger.click(); // leave Maat as it was
        closeDrawer();
        var stillAborted = aborted;
        aborted = false;   // let the wait below run
        return waitFor(function () { return !getDrawer(); }, 1500).catch(function () {}).then(function () {
          return stillAborted;
        });
      })
      .then(function (wasAborted) {
        root.classList.remove(PROBING_CLASS);
        probing = false;

        if (Math.abs(window.scrollY - scrollY) > 2) window.scrollTo(0, scrollY);
        if (!wasAborted) {
          if (active && active.focus && active !== document.body) {
            try { active.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
          } else if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
        }

        // The user clicked something (Filter / cart / menu / search) while we were reading:
        // that click was blocked by the drawer, so do it for them now.
        if (pendingReplay && pendingReplay.isConnected) {
          var el = pendingReplay;
          setTimeout(function () {
            if (el.matches('input, textarea')) el.focus();
            else el.click();
          }, 30);
        }
        pendingReplay = null;

        render();
        if (!cache[pageKey()]) retryLater(wasAborted ? 2500 : 1000);
        scheduleMount();
      });
  }

  // User interaction during a probe → stop immediately, never block the real UI
  document.addEventListener('pointerdown', function (e) {
    if (!probing || !e.isTrusted) return;
    var t = e.target && e.target.closest ? e.target : null;
    if (t && t.closest('#' + TOGGLE_ID + ', #' + PANEL_ID)) return;
    pendingReplay = t ? t.closest('button, a, input, textarea, [role="button"]') : null;
    aborted = true;
    log('aborted by user');
  }, true);
  document.addEventListener('click', function (e) {
    // the click got through by itself → don't replay it
    if (pendingReplay && e.isTrusted && pendingReplay.contains(e.target)) pendingReplay = null;
  }, true);

  // ---------- Mount / keep alive through React re-renders ----------
  function cleanup() {
    var t = document.getElementById(TOGGLE_ID);
    var p = document.getElementById(PANEL_ID);
    if (t) t.remove();
    if (p) p.remove();
    var bar = document.getElementById(BAR_ID);
    if (bar) bar.classList.remove(READY_CLASS);
    isOpen = false;
  }

  var lastKey = null;

  function mount() {
    syncBodyClass();
    if (!isCollectionPage()) { cleanup(); lastKey = null; return; }

    var bar = document.getElementById(BAR_ID);
    if (!bar) return;
    var grid = bar.querySelector(':scope > .grid');
    if (!grid) return;

    if (!bar.classList.contains(READY_CLASS)) bar.classList.add(READY_CLASS);

    var toggle = document.getElementById(TOGGLE_ID);
    if (!toggle || toggle.parentElement !== grid) {
      if (toggle) toggle.remove();
      grid.appendChild(buildToggle());
    }

    var panel = document.getElementById(PANEL_ID);
    if (!panel || panel.parentElement !== bar || bar.lastElementChild !== panel) {
      if (panel) panel.remove();
      bar.appendChild(buildPanel());
    }

    var key = pageKey();
    if (key !== lastKey) {
      // other collection: close; same collection with other filters: stay open
      if (lastKey && lastKey.split('?')[0] !== key.split('?')[0]) isOpen = false;
      lastKey = key;
    }

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
      syncBodyClass();
      lastMutation = Date.now();
      scheduleMount();
      return res;
    };
  });
  window.addEventListener('popstate', function () { syncBodyClass(); lastMutation = Date.now(); scheduleMount(); });

  function isOurs(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    return !!el && !!el.closest('#' + TOGGLE_ID + ', #' + PANEL_ID + ', #headlessui-portal-root, [data-headlessui-portal]');
  }

  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      if (!isOurs(records[i].target)) {
        lastMutation = Date.now();
        scheduleMount();
        return;
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  scheduleMount();
})();
    });
})();
