(() => {
    'use strict';
    const testInfo = {
        className: 'gmd-002',
        debug: 0,
        testName: 'raamdecoratie',
        testVersion: 'v1'
    };

    const LIST_SELECTOR = '.catalog-category-view #product-list';
    const SWATCH_SELECTOR = '.swatch-option[data-option-id]';
    const MAX_TRIES = 3;

    const log = (...args) => testInfo.debug && console.log(`[${testInfo.className}]`, ...args);
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const mediaCache = new Map(); // childProductId -> Promise<src|null>

    let debounceTimeout;

    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }

    /* ---------- helpers ---------- */

    const isVisible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

    // Unique swatches per option id, prefer the visible copy
    function getSwatches(container) {
        const map = new Map();
        container.querySelectorAll(SWATCH_SELECTOR).forEach(swatch => {
            const id = swatch.dataset.optionId;
            if (!id) return;
            if (!map.has(id) || (!isVisible(map.get(id)) && isVisible(swatch))) map.set(id, swatch);
        });
        return [...map.values()];
    }

    const getSelectedId = container =>
        container.querySelector(`${SWATCH_SELECTOR}.selected`)?.dataset.optionId || null;

    // Magento deselects a selected swatch on click -> only click when not selected
    function selectSwatch(container, swatch) {
        if (getSelectedId(container) !== swatch.dataset.optionId) swatch.click();
    }

    function getColorLabel(swatch) {
        return swatch.getAttribute('option-label') ||
            swatch.getAttribute('data-option-label') ||
            swatch.querySelector('input')?.getAttribute('aria-label') ||
            swatch.getAttribute('aria-label') ||
            'Color';
    }

    function getJQuery() {
        if (window.jQuery) return Promise.resolve(window.jQuery);
        return new Promise(resolve => {
            if (typeof window.require !== 'function') return resolve(null);
            window.require(['jquery'], resolve, () => resolve(null));
        });
    }

    // Find the Magento SwatchRenderer widget of this card (waits until it is initialised)
    async function getSwatchConfig($, card, container) {
        const holders = new Set();
        for (let el = container; el && el !== card.parentElement; el = el.parentElement) holders.add(el);
        card.querySelectorAll('[class*="swatch-opt"], [data-role^="swatch-option"]').forEach(el => holders.add(el));

        for (let i = 0; i < 10; i++) {
            for (const el of holders) {
                const data = $(el).data() || {};
                const widget = Object.values(data).find(v => v?.options?.jsonConfig);
                if (widget) return widget.options;
            }
            await sleep(100);
        }
        return null;
    }

    // Find { index, images } (configurable config) anywhere inside an object
    function findCfg(obj, depth = 0) {
        if (!obj || typeof obj !== 'object' || depth > 3) return null;
        if (obj.index && obj.images && typeof obj.images === 'object' && Object.keys(obj.images).length) return obj;
        for (const key of Object.keys(obj)) {
            let v;
            try { v = obj[key]; } catch (e) { continue; }
            if (v && typeof v === 'object' && !(v instanceof Node)) {
                const found = findCfg(v, depth + 1);
                if (found) return found;
            }
        }
        return null;
    }

    // Site API (Amasty conf): /rdpdp/product/config/id/{id}/ -> same jsonConfig incl. images
    const configCache = new Map();
    async function getConfigFromApi(card) {
        const pid = getProductId(card);
        const boot = pid && document.getElementById(`rd-amconf-bootstrap-${pid}`);
        if (!boot) return null;

        let url;
        try { url = JSON.parse(boot.textContent).configUrl; } catch (e) { return null; }
        if (!url) return null;

        if (!configCache.has(url)) {
            configCache.set(url, fetch(url, {
                    credentials: 'same-origin',
                    headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
                })
                .then(r => (r.ok ? r.json() : null))
                .then(data => findCfg(data))
                .catch(() => null));
        }
        const cfg = await configCache.get(url);
        if (cfg) log('Using config API', url);
        return cfg ? { jsonConfig: cfg, mediaCallback: null } : null;
    }

    // Hyvä (Alpine.js): Amasty component data holds jsonConfig { index, images }
    function getAlpineConfig(card) {
        // Alpine.$data() is a proxy without own keys -> read the raw data stack
        for (const el of card.querySelectorAll('[x-data]')) {
            for (const data of el._x_dataStack || []) {
                const cfg = findCfg(data, 0);
                if (cfg) {
                    log('Using Alpine config from', el.getAttribute('x-data'));
                    return { jsonConfig: cfg, mediaCallback: null };
                }
            }
        }
        return null;
    }

    function getChildProductId(cfg, swatch) {
        const optionId = String(swatch.dataset.optionId);
        const attrEl = swatch.closest('[data-attribute-id], [attribute-id]');
        const attrId = attrEl?.getAttribute('data-attribute-id') || attrEl?.getAttribute('attribute-id');

        return Object.keys(cfg.index || {}).find(pid => {
            const opts = cfg.index[pid] || {};
            return attrId ? String(opts[attrId]) === optionId :
                Object.values(opts).map(String).includes(optionId);
        }) || null;
    }

    // Magento's own swatch media endpoint (same one the circles use), no DOM changes
    function fetchMedia(url, productId) {
        if (!url || !productId) return Promise.resolve(null);
        if (mediaCache.has(productId)) return mediaCache.get(productId);

        const reqUrl = new URL(url, location.origin);
        reqUrl.searchParams.set('product_id', productId);

        const promise = fetch(reqUrl.toString(), {
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
            })
            .then(r => (r.ok ? r.json() : null))
            .then(data => data && (data.small || data.medium || data.large || data.gallery?.[0]?.img) || null)
            .catch(() => null);

        mediaCache.set(productId, promise);
        return promise;
    }

    async function getImageSrc(options, swatch) {
        const cfg = options.jsonConfig;
        const productId = getChildProductId(cfg, swatch);
        if (!productId) return null;

        // 1. images already in the page config
        const imgs = cfg.images?.[productId];
        if (Array.isArray(imgs) && imgs.length) {
            const main = imgs.find(i => i.isMain) || imgs[0];
            const src = main.thumb || main.img || main.full;
            if (src) return src;
        }

        // 2. ajax media endpoint
        return fetchMedia(options.mediaCallback, productId);
    }

    // Preload so the whole gallery appears at once
    function preload(src) {
        return new Promise(resolve => {
            const img = new Image();
            const done = ok => resolve(ok ? src : null);
            const t = setTimeout(() => done(true), 1000);
            img.onload = () => { clearTimeout(t); done(true); };
            img.onerror = () => { clearTimeout(t); done(false); };
            img.src = src;
        });
    }

    /* ---------- fallback: click circles behind a frozen copy (user sees no change) ---------- */

    const getSrc = img => img.currentSrc || img.src;

    // Remove Alpine (Hyvä) + id attributes so the copy is 100% static and never steals x-ref
    function makeStatic(root) {
        [root, ...root.querySelectorAll('*')].forEach(node => {
            [...node.attributes].forEach(({ name }) => {
                if (name === 'id' || name.startsWith('x-') || name.startsWith(':') || name.startsWith('@')) {
                    node.removeAttribute(name);
                }
            });
        });
    }

    // Show a static copy in place of el, hide the real el (it still works for .click())
    function freeze(el) {
        const clone = el.cloneNode(true);
        makeStatic(clone);
        clone.classList.add('gmd-freeze-clone');
        if (clone.tagName === 'IMG') {
            clone.src = getSrc(el);
            clone.removeAttribute('srcset');
            clone.removeAttribute('sizes');
            clone.removeAttribute('loading');
        }
        el.insertAdjacentElement('afterend', clone);
        el.classList.add('gmd-frozen');
        const oldStyle = el.getAttribute('style');
        el.style.cssText += ';position:absolute!important;top:0!important;left:0!important;visibility:hidden!important;pointer-events:none!important;';
        return () => {
            clone.remove();
            el.classList.remove('gmd-frozen');
            oldStyle === null ? el.removeAttribute('style') : el.setAttribute('style', oldStyle);
        };
    }

    // Real main image of the card (never our frozen copy)
    const getMainImage = card =>
        card.querySelector('.product-image-flipper-wrap img.product-image-photo:not(.gmd-freeze-clone)') ||
        card.querySelector('.product-image-flipper-wrap img:not(.gmd-freeze-clone)') ||
        card.querySelector('img.product-image-photo:not(.gmd-freeze-clone)');

    const firstSrcset = v => (v || '').split(',')[0].trim().split(/\s+/)[0] || '';
    const toAbs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };

    // Read image from ATTRIBUTES (currentSrc does not update while the img is hidden / lazy)
    function readImage(card) {
        const img = getMainImage(card);
        if (!img) return { sig: '', url: '' };
        const src = img.getAttribute('src') || '';
        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-original') || '';
        const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
        const source = img.closest('picture')?.querySelector('source')?.getAttribute('srcset') || '';

        const realSrc = src && !src.startsWith('data:') ? src : '';
        const url = toAbs(realSrc || dataSrc || firstSrcset(srcset) || firstSrcset(source));
        return { sig: [src, dataSrc, srcset, source].join('|'), url };
    }

    // Returns true if the image actually changed
    async function waitForImageChange(card, oldSig, timeout = 4000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            await sleep(30);
            if (readImage(card).sig !== oldSig) break;
        }
        // let late updates settle (raw url -> cached url)
        let last = readImage(card).sig;
        await sleep(120);
        while (readImage(card).sig !== last) {
            last = readImage(card).sig;
            await sleep(120);
        }
        return readImage(card).sig !== oldSig;
    }

    async function captureByClicking(card, container, mainImage, swatches) {
        const result = new Map();
        const originalId = getSelectedId(container);
        const originalSig = readImage(card).sig;

        // Circles are NOT cloned (no double circles), only image + price are frozen
        const unfreezers = [mainImage, card.querySelector('.price-box')]
            .filter(Boolean)
            .map(freeze);

        try {
            for (const swatch of swatches) {
                const optionId = swatch.dataset.optionId;
                if (getSelectedId(container) !== optionId) {
                    const oldSig = readImage(card).sig;
                    swatch.click();
                    // Image did not change -> this color has no own image, don't copy the previous one
                    if (!await waitForImageChange(card, oldSig)) {
                        log('No own image for', optionId);
                        continue;
                    }
                }
                result.set(optionId, readImage(card).url);
                log('Captured', optionId, result.get(optionId));
            }

            // Restore original state
            if (originalId) {
                const original = getSwatches(container).find(s => s.dataset.optionId === originalId);
                if (original) selectSwatch(container, original);
            } else {
                container.querySelector(`${SWATCH_SELECTOR}.selected`)?.click(); // deselect
            }
            const sig = readImage(card).sig;
            if (sig !== originalSig) await waitForImageChange(card, sig, 2000);
        } finally {
            unfreezers.forEach(fn => fn());
        }

        return result;
    }

    /* ---------- cache: next page view is instant ---------- */

    const CACHE_KEY = 'gmd002-color-images';
    const CACHE_TTL = 24 * 60 * 60 * 1000;

    function readCache() {
        try {
            const data = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            return data && typeof data === 'object' ? data : {};
        } catch (e) { return {}; }
    }

    function getCached(productId) {
        const entry = productId && readCache()[productId];
        return entry && Date.now() - entry.t < CACHE_TTL ? entry.images : null;
    }

    function setCached(productId, srcMap) {
        if (!productId || !srcMap.size) return;
        try {
            const data = readCache();
            data[productId] = { t: Date.now(), images: Object.fromEntries(srcMap) };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) { /* storage full / blocked */ }
    }

    const getProductId = card =>
        card.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
        card.querySelector('[data-product_id]')?.getAttribute('data-product_id') || null;

    /* ---------- duplicates + swatch fallback ---------- */

    const colorName = swatch => getColorLabel(swatch).split(' - ')[0].trim().toLowerCase();

    // Same image for several colors -> keep it only for the color whose name is in the file name
    function removeDuplicates(swatches, srcMap) {
        const groups = new Map();
        swatches.forEach(s => {
            const src = srcMap.get(s.dataset.optionId);
            if (!src) return;
            const key = src.split('?')[0];
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(s);
        });

        groups.forEach((list, key) => {
            if (list.length < 2) return;
            const file = decodeURIComponent(key.split('/').pop()).toLowerCase();
            const owner = list.find(s => {
                const name = colorName(s);
                return name && (file.includes(name.replace(/\s+/g, '-')) ||
                    file.includes(name.replace(/\s+/g, '_')) ||
                    file.includes(name.replace(/\s+/g, '')));
            });
            list.forEach(s => s !== owner && srcMap.delete(s.dataset.optionId));
            log('Duplicate image removed:', key, 'owner:', owner && colorName(owner));
        });
    }

    // The circle's own look (image or color) when a color has no product image
    function getSwatchVisual(swatch) {
        const v = swatch.getAttribute('data-option-tooltip-value') ||
            swatch.getAttribute('option-tooltip-value') || '';
        if (/^(#|rgb)/i.test(v)) return { color: v };
        if (/\.(jpe?g|png|webp|gif|svg)/i.test(v)) return { src: v };

        const cs = getComputedStyle(swatch);
        const url = cs.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        if (url) return { src: url[1] };
        const inner = swatch.querySelector('img');
        if (inner) return { src: getSrc(inner) };
        if (cs.backgroundColor && !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor)) {
            return { color: cs.backgroundColor };
        }
        return null;
    }

    /* ---------- build gallery ---------- */

    function buildGallery(card, container, items) {
        card.querySelector('.gmd-all-color-images')?.remove();

        const gallery = document.createElement('div');
        gallery.className = 'gmd-all-color-images';

        const syncActive = () => {
            const selectedId = getSelectedId(container);
            gallery.querySelectorAll('.gmd-color-image-item').forEach(item => {
                item.classList.toggle('active', item.dataset.optionId === selectedId);
            });
        };

        items.forEach(({ swatch, src, color: bg }) => {
            const color = getColorLabel(swatch);
            const wrapper = document.createElement('div');
            wrapper.className = 'gmd-color-image-item';
            wrapper.dataset.optionId = swatch.dataset.optionId;
            wrapper.title = color;

            if (src) {
                const img = document.createElement('img');
                img.src = src;
                img.alt = color;
                wrapper.append(img);
            } else {
                wrapper.classList.add('gmd-color-image-item--swatch');
                wrapper.style.background = bg;
            }

            // Image click -> same circle selected
            wrapper.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                selectSwatch(container, swatch);
                syncActive();
            });

            gallery.appendChild(wrapper);
        });

        // "+X" -> product page (desktop after 5, mobile after 3)
        const total = items.length;
        const productUrl =
            card.querySelector('a.product-item-link')?.href ||
            card.querySelector('a.product-item-photo')?.href ||
            card.querySelector('a[href]')?.href;

        if (productUrl) {
            [['desktop', 5], ['mobile', 3]].forEach(([type, limit]) => {
                if (total <= limit) return;
                const more = document.createElement('a');
                more.className = `gmd-color-more gmd-color-more--${type}`;
                more.href = productUrl;
                more.textContent = `+${total - limit}`;
                more.setAttribute('aria-label', `${total - limit} more colors`);
                gallery.appendChild(more);
            });
        }

        container.insertAdjacentElement('beforebegin', gallery);

        // Circle click (or any selection change) -> same image active
        new MutationObserver(syncActive).observe(container, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
        syncActive();
    }

    async function processCard($, card) {
        if (card.dataset.gmdColorGallery === 'done' || card.dataset.gmdColorGallery === 'busy') return;
        const tries = +(card.dataset.gmdTries || 0);
        if (tries >= MAX_TRIES) return;

        const container = card.querySelector('.swatch-attribute-options');
        if (!container) return;
        const swatches = getSwatches(container);
        if (!swatches.length) return;

        card.dataset.gmdColorGallery = 'busy';
        card.dataset.gmdTries = tries + 1;

        // Loading dots where the gallery will appear
        card.querySelector('.gmd-all-color-images')?.remove();
        const loader = document.createElement('div');
        loader.className = 'gmd-all-color-images gmd-color-loading';
        loader.setAttribute('aria-label', 'Loading');
        loader.innerHTML = '<span></span><span></span><span></span>';
        container.insertAdjacentElement('beforebegin', loader);

        const mainImage = getMainImage(card);

        const productId = getProductId(card);
        const srcMap = new Map();

        // 0. Cache from an earlier page view (instant)
        const cached = getCached(productId);
        if (cached) {
            swatches.forEach(s => cached[s.dataset.optionId] && srcMap.set(s.dataset.optionId, cached[s.dataset.optionId]));
            log('Cache images:', srcMap.size, '/', swatches.length);
        }

        // 1. Magento / Hyvä config (no clicks)
        const options = srcMap.size < swatches.length &&
            (getAlpineConfig(card) || await getConfigFromApi(card) || ($ && await getSwatchConfig($, card, container)));
        if (options) {
            await Promise.all(swatches.map(async swatch => {
                const src = await getImageSrc(options, swatch).catch(() => null);
                if (src) srcMap.set(swatch.dataset.optionId, src);
            }));
        }
        removeDuplicates(swatches, srcMap);
        log('Config images:', srcMap.size, '/', swatches.length);

        // 2. Fallback: click hidden circles behind a frozen copy
        const missing = swatches.filter(s => !srcMap.has(s.dataset.optionId));
        if (missing.length && mainImage) {
            const clicked = await captureByClicking(card, container, mainImage, missing);
            clicked.forEach((src, id) => src && srcMap.set(id, src));
            removeDuplicates(swatches, srcMap);
        }

        // Save for the next page view
        if (!cached || srcMap.size > Object.keys(cached).length) setCached(productId, srcMap);

        // 3. Colors still without own image -> use the circle's own image / color
        const results = await Promise.all(swatches.map(async swatch => {
            const src = srcMap.get(swatch.dataset.optionId);
            const loaded = src && await preload(src);
            if (loaded) return { swatch, src: loaded };

            const visual = getSwatchVisual(swatch);
            if (visual?.src) return { swatch, src: await preload(visual.src) };
            if (visual?.color) return { swatch, color: visual.color };
            return { swatch };
        }));

        const items = results.filter(r => r.src || r.color);
        if (!items.length) {
            loader.remove();
            card.dataset.gmdColorGallery = '';
            return;
        }

        buildGallery(card, container, items);
        card.dataset.gmdColorGallery = 'done';
        log(`Card: ${items.length}/${swatches.length} color images`, card);
    }

    async function processAll() {
        const $ = await getJQuery();
        if (!$) log('jQuery not found, using click fallback');
        const cards = [...document.querySelectorAll(`${LIST_SELECTOR} .product-item`)];
        await Promise.all(cards.map(card => processCard($, card)));
    }

    waitForElement(`${LIST_SELECTOR} .products .product-item ${SWATCH_SELECTOR}`, ([swatch]) => {
        document.body.classList.add(testInfo.className);
        processAll();

        // Cards / swatches rendered later (lazy load, filters, ajax paging)
        const list = swatch.closest('#product-list') || document.querySelector(LIST_SELECTOR);
        new MutationObserver(mutations => {
            if (!mutations.some(m => m.addedNodes.length)) return;
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(processAll, 200);
        }).observe(list, { childList: true, subtree: true });
    });
})();
