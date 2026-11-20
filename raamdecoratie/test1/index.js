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
    const CACHE_KEY = 'gmd002-color-galleries-v2';
    const CACHE_TTL = 24 * 60 * 60 * 1000;
    const MAX_TRIES = 3;

    const log = (...args) => testInfo.debug && console.log(`[${testInfo.className}]`, ...args);

    let debounceTimeout;

    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }

    /* ---------- helpers ---------- */

    const isVisible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const fileName = url => (url || '').split('?')[0].split('/').pop().toLowerCase();
    const toAbs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };

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

    const getProductId = card =>
        card.querySelector('[data-product-id]')?.getAttribute('data-product-id') || null;

    const getMainImage = card =>
        card.querySelector('.product-image-flipper-wrap img.product-image-photo') ||
        card.querySelector('.product-image-flipper-wrap img') ||
        card.querySelector('img.product-image-photo');

    const getProductUrl = card =>
        card.querySelector('a.product-item-link')?.href ||
        card.querySelector('a.product-item-photo')?.href ||
        card.querySelector('a[href]')?.href;

    /* ---------- config: { index, images } ---------- */

    // Find { index, images } anywhere inside an object
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

    // 1. Hyvä / Alpine: Amasty component data (raw data stack, $data proxy has no keys)
    function getAlpineConfig(card) {
        for (const el of card.querySelectorAll('[x-data]')) {
            for (const data of el._x_dataStack || []) {
                const cfg = findCfg(data);
                if (cfg) {
                    log('Alpine config from', el.getAttribute('x-data'));
                    return cfg;
                }
            }
        }
        return null;
    }

    // 2. Site API (Amasty conf bootstrap -> configUrl)
    const apiCache = new Map();
    async function getApiConfig(card) {
        const pid = getProductId(card);
        const boot = pid && document.getElementById(`rd-amconf-bootstrap-${pid}`);
        if (!boot) return null;

        let url;
        try { url = JSON.parse(boot.textContent).configUrl; } catch (e) { return null; }
        if (!url) return null;

        if (!apiCache.has(url)) {
            apiCache.set(url, fetch(url, {
                    credentials: 'same-origin',
                    headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
                })
                .then(r => (r.ok ? r.json() : null))
                .then(data => findCfg(data))
                .catch(() => null));
        }
        const cfg = await apiCache.get(url);
        if (cfg) log('API config', url);
        return cfg;
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

    // optionId -> [{ thumb, img }] (all images of that color, main first)
    function buildGalleries(cfg, swatches) {
        const galleries = {};
        swatches.forEach(swatch => {
            const pid = getChildProductId(cfg, swatch);
            const list = pid && cfg.images?.[pid];
            if (!Array.isArray(list) || !list.length) return;

            // Videos are kept (flagged) so they count in "+X", but are not rendered as thumbnails
            const images = [...list]
                .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0) || (+a.position || 0) - (+b.position || 0))
                .map(i => {
                    const isVideo = !!i.type && i.type !== 'image';
                    return { thumb: i.thumb || i.img || i.full, img: i.img || i.full || i.thumb, ...(isVideo && { video: true }) };
                })
                .filter(i => i.thumb || i.video);

            if (images.length) galleries[swatch.dataset.optionId] = images;
        });
        return galleries;
    }

    /* ---------- cache ---------- */

    function readCache() {
        try {
            const data = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            return data && typeof data === 'object' ? data : {};
        } catch (e) { return {}; }
    }

    function getCached(productId) {
        const entry = productId && readCache()[productId];
        return entry && Date.now() - entry.t < CACHE_TTL ? entry.g : null;
    }

    function setCached(productId, galleries) {
        if (!productId || !Object.keys(galleries).length) return;
        try {
            const data = readCache();
            data[productId] = { t: Date.now(), g: galleries };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) { /* storage full / blocked */ }
    }

    /* ---------- gallery ---------- */

    function createLoader(container) {
        const loader = document.createElement('div');
        loader.className = 'gmd-all-color-images gmd-color-loading';
        loader.setAttribute('aria-label', 'Loading');
        loader.innerHTML = '<span></span><span></span><span></span>';
        container.insertAdjacentElement('beforebegin', loader);
        return loader;
    }

    // Change the card's main image (Hyvä amFlipper reads data-img-src)
    function setMainImage(card, src) {
        const img = getMainImage(card);
        if (!img) return;
        img.setAttribute('data-img-src', src);
        img.removeAttribute('srcset');
        img.src = src;
    }

    function setupGallery(card, container, swatches, galleries) {
        card.querySelector('.gmd-all-color-images')?.remove();

        const gallery = document.createElement('div');
        gallery.className = 'gmd-all-color-images';
        container.insertAdjacentElement('beforebegin', gallery);

        let renderedId = null;

        const syncActive = () => {
            const current = fileName(getMainImage(card)?.getAttribute('src'));
            gallery.querySelectorAll('.gmd-color-image-item').forEach(item => {
                item.classList.toggle('active', fileName(item.dataset.img) === current);
            });
        };

        // Images of the selected color; no config -> main + flipper image of the card
        const getImages = optionId => {
            if (optionId && galleries[optionId]) return galleries[optionId];
            const img = getMainImage(card);
            if (!img) return [];
            return [img.getAttribute('data-img-src') || img.getAttribute('src'), img.getAttribute('data-flipper-src')]
                .filter(Boolean)
                .map(src => ({ thumb: toAbs(src), img: toAbs(src) }));
        };

        const render = (force = false) => {
            const optionId = getSelectedId(container) || swatches[0]?.dataset.optionId || null;
            if (!force && optionId === renderedId) return syncActive();
            renderedId = optionId;

            const media = getImages(optionId);
            const images = media.filter(i => !i.video);
            const color = swatches.find(s => s.dataset.optionId === optionId);
            const label = color?.getAttribute('option-label') || color?.getAttribute('aria-label') || '';

            gallery.innerHTML = '';
            images.forEach((image, i) => {
                const item = document.createElement('div');
                item.className = 'gmd-color-image-item';
                item.dataset.img = image.img;
                item.title = label;

                const img = document.createElement('img');
                img.src = image.thumb;
                img.alt = `${label} ${i + 1}`.trim();
                item.append(img);

                // Thumbnail click -> show it as main image
                item.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMainImage(card, image.img);
                    syncActive();
                });

                gallery.appendChild(item);
            });

            // "+X" -> product page (desktop after 5, mobile after 3)
            const total = media.length; // images + videos
            const productUrl = getProductUrl(card);
            if (productUrl) {
                [['desktop', 5], ['mobile', 3]].forEach(([type, limit]) => {
                    if (total <= limit) return;
                    const more = document.createElement('a');
                    more.className = `gmd-color-more gmd-color-more--${type}`;
                    more.href = productUrl;
                    more.textContent = `+${total - limit}`;
                    more.setAttribute('aria-label', `${total - limit} more images`);
                    gallery.appendChild(more);
                });
            }

            syncActive();
            log('Rendered', optionId, total, 'images');
        };

        // Circle click (selection change) -> gallery of that color
        let raf;
        new MutationObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => render());
        }).observe(container, { subtree: true, attributes: true, attributeFilter: ['class'] });

        // Main image changed by the site -> update active (and fallback gallery when no config)
        const mainImg = getMainImage(card);
        if (mainImg) {
            new MutationObserver(() => {
                const id = getSelectedId(container);
                id && galleries[id] ? syncActive() : render(true);
            }).observe(mainImg, { attributes: true, attributeFilter: ['src', 'data-img-src', 'data-flipper-src'] });
        }

        render(true);
    }

    async function processCard(card) {
        const state = card.dataset.gmdColorGallery;
        if (state === 'done' || state === 'busy') return;
        const tries = +(card.dataset.gmdTries || 0);
        if (tries >= MAX_TRIES) return;

        const container = card.querySelector('.swatch-attribute-options');
        if (!container) return;
        const swatches = getSwatches(container);
        if (!swatches.length) return;

        card.dataset.gmdColorGallery = 'busy';
        card.dataset.gmdTries = tries + 1;

        const productId = getProductId(card);
        let galleries = getCached(productId);

        if (!galleries) {
            const loader = createLoader(container);
            const cfg = getAlpineConfig(card) || await getApiConfig(card);
            galleries = cfg ? buildGalleries(cfg, swatches) : {};
            setCached(productId, galleries);
            loader.remove();
        }

        log('Card', productId, Object.keys(galleries).length, '/', swatches.length, 'colors with gallery');
        setupGallery(card, container, swatches, galleries);
        card.dataset.gmdColorGallery = 'done';
    }

    function processAll() {
        document.querySelectorAll(`${LIST_SELECTOR} .product-item`).forEach(card => processCard(card));
    }

    waitForElement(`${LIST_SELECTOR} .products .product-item ${SWATCH_SELECTOR}`, ([swatch]) => {
        document.body.classList.add(testInfo.className);
        processAll();

        // Cards / swatches rendered later (lazy load, filters, ajax paging)
        const list = swatch.closest('#product-list') || document.querySelector(LIST_SELECTOR);
        new MutationObserver(mutations => {
            if (!mutations.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && !n.closest?.('.gmd-all-color-images')))) return;
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(processAll, 200);
        }).observe(list, { childList: true, subtree: true });
    });
})();
