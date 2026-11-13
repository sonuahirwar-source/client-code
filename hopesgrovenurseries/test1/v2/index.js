(() => {
    'use strict';
    const testInfo = {
        className: 'gmd-001-v2',
        debug: 0,
        testName: 'Test Name',
        testVersion: 'v2' 
    }; 
 
    let debounceTimeout;
 
    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }
 
    waitForElement(".woocommerce .product-module.product-intro ", ([pdp]) => {
        document.body.classList.add(testInfo.className);
        const CHECK_SVG =
            '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        const log = (...args) => { if (testInfo.debug) console.log(`[${testInfo.testName} ${testInfo.testVersion}]`, ...args); };
        const $ = (sel, ctx = document) => ctx.querySelector(sel);
        const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
        const num = (str) => { const m = String(str || '').replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };

        /* "Beech Green Bare Root Hedging 1.5-2ft 40/60cm" -> "40-60cm (1.5-2ft) - Bare Root" */
        function shortTitle(t) {
            const cm = t.match(/(\d+)\s*\/\s*(\d+)\s*cm/i);
            const ft = t.match(/(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*ft)/i);
            if (!cm || !ft) return null;
            let type = '';
            if (/bare\s*root/i.test(t)) type = 'Bare Root';
            else if (/root\s*ball/i.test(t)) type = 'Root Ball';
            else if (/pot\s*grown|potted/i.test(t)) type = 'Pot Grown';
            else if (/cell\s*grown/i.test(t)) type = 'Cell Grown';
            return `${cm[1]}-${cm[2]}cm (${ft[1].replace(/\s+/g, '')})${type ? ' - ' + type : ''}`;
        }

        function fire(el, type) {
            el.dispatchEvent(new Event(type, { bubbles: true }));
        }

        function build(card) {
            if (card.getAttribute('data-ab-tiers')) return;
            const table = $('.pricing-table', card);
            if (!table) return;
            card.setAttribute('data-ab-tiers', '1');
            card.classList.add('ab-tiers-card');

            /* 1. Delivery pill banner on top
                  control can be: "Free delivery on orders over £300 - Learn More" (red-text)
                  or a link: "Free delivery on orders over £500" – anywhere in the card */
            if (!$('.ab-delivery-banner', card)) {
                const isDel = (el) => /free\s+delivery/i.test(el.textContent) && /£\s?\d/.test(el.textContent);
                /* innermost element that holds the whole sentence */
                let delEl = $$('*', card).filter((el) =>
                    !el.closest('.ab-delivery-banner, script, style, .pricing-table') && isDel(el) &&
                    !Array.from(el.children).some(isDel)
                ).pop();
                if (delEl) {
                    const amt = delEl.textContent.match(/£\s?\d[\d,]*/)[0].replace(/\s/g, '');
                    const link = delEl.closest('a') || $('a[href*="delivery"]', delEl) ||
                                 (delEl.closest('p, li') && $('a[href*="delivery"]', delEl.closest('p, li')));
                    /* hide the whole control line */
                    const line = delEl.closest('p, li, .delivery-banner') || delEl;
                    const banner = document.createElement('div');
                    banner.className = 'ab-delivery-banner';
                    /* £300 -> short dev text; other amounts (e.g. £500 rootball/instant) -> same text as control */
                    const controlText = delEl.textContent.replace(/\s+/g, ' ').split(/\s[-–]\s/)[0].trim();
                    const text = amt === '£300' ? `Free delivery over ${amt}` : controlText;
                    banner.innerHTML = `<a href="${link ? link.href : '/delivery-information/'}">${text}</a>`;
                    card.insertBefore(banner, card.firstChild);
                    line.classList.add('ab-hide');
                    log('delivery', amt);
                }
            }

            /* 2. Title */
            const h3 = $('.title', card);
            if (h3) {
                const st = shortTitle(h3.textContent.trim());
                if (st) { h3.setAttribute('data-ab-original', h3.textContent.trim()); h3.textContent = st; }
            }

            /* 3. Icon list: Age / Plants per metre / In stock */
            const list = $('.icon-list', card);
            const age = $('li.age', card);
            if (age) {
                const years = num(age.textContent);
                if (!isNaN(years)) age.innerHTML = `Age <strong>${years} year${years === 1 ? '' : 's'}</strong>`;
            }
            const stockP = $('.image .stock', card);
            const stockN = stockP ? num(stockP.textContent) : NaN;
            if (list && stockP && !isNaN(stockN) && stockP.classList.contains('in-stock') && !$('.ab-stock', list)) {
                const li = document.createElement('li');
                li.className = 'ab-stock stock-level';
                li.innerHTML = `In stock <strong>${stockN}</strong>`;
                const ppm = $('li.plants-per-metre', list);
                if (ppm && ppm.nextSibling) list.insertBefore(li, ppm.nextSibling); else list.appendChild(li);
                stockP.classList.add('ab-hide');
            }
            const minQ = $('li.minimum-quantity', card);
            if (minQ && num(minQ.textContent) <= 1) minQ.classList.add('ab-hide');

            /* 3b. Simple 2-column structure:
                   .content = [ .details (left) | .ab-col-right (.image + .purchase) ] */
            const content = $('.content', card);
            const imageEl = $('.image', card);
            const purchaseEl = $('.purchase', card);
            if (content && imageEl && !$('.ab-col-right', card)) {
                const right = document.createElement('div');
                right.className = 'ab-col-right';
                content.appendChild(right);
                right.appendChild(imageEl);
                if (purchaseEl) right.appendChild(purchaseEl);
            }

            /* 4. Promo badge -> red circle */
            const promo = $('.promo-image-bar', card);
            if (promo && !promo.classList.contains('ab-badge')) {
                promo.classList.add('ab-badge');
                promo.innerHTML = promo.textContent.trim().split(/\s+/).map((w) => `<span>${w}</span>`).join(' ');
            }

            /* 5. Tier cards from the pricing table */
            const cells = $$('tbody td', table);
            const tiers = $$('thead th', table).map((th, i) => {
                const td = cells[i];
                const min = num(th.textContent);
                if (!td || isNaN(min)) return null;
                const first = $('.first-price', td);
                const fin = $('.final-price', td);
                return {
                    min,
                    label: th.textContent.replace(/\s+/g, '').trim(),
                    was: first && fin ? first.textContent.trim() : '',
                    now: (fin || first || td).textContent.trim()
                };
            }).filter(Boolean);
            if (!tiers.length) return;

            /* base (1+) price = price per plant with no discount */
            const baseTier = tiers.find((t) => t.min <= 1) || tiers[0];
            const priceVal = (str) => num(String(str).replace(/[^\d.,]/g, ''));
            const basePrice = priceVal(baseTier.now);
            const fmt = (n) => '£' + n.toFixed(2);

            /* "£1.20 for each" line in the icon list */
            let unitLi = $('.ab-unit-price', list || card);
            if (list && !unitLi) {
                unitLi = document.createElement('li');
                unitLi.className = 'ab-unit-price unit-price';
                unitLi.innerHTML = `<strong>£<span class="unit-price-value">${basePrice.toFixed(2)}</span></strong> for each`;
                const after = $('.ab-stock', list) || $('li.plants-per-metre', list);
                if (after && after.nextSibling) list.insertBefore(unitLi, after.nextSibling); else list.appendChild(unitLi);
            }

            /* Bulk discount boxes (only tiers above 1+) */
            const wrap = document.createElement('div');
            wrap.className = 'ab-price ab-bulk';
            wrap.innerHTML = '<p class="ab-price-title">Bulk discount</p><ul class="ab-price-tiers" role="list"></ul>';
            const ul = $('ul', wrap);
            const qty = $('input.qty', card);
            const maxQ = qty && qty.max ? num(qty.max) : Infinity;

            tiers.filter((t) => t.min > 1).forEach((t) => {
                const price = priceVal(t.now);
                const save = basePrice ? Math.round((1 - price / basePrice) * 100) : 0;
                const b = document.createElement('li');
                b.className = 'ab-tier';
                b.setAttribute('role', 'button');
                b.setAttribute('tabindex', '0');
                b.setAttribute('data-min', t.min);
                b.setAttribute('data-price', price);
                b.setAttribute('aria-label', `${t.min}+ plants – save ${save}%`);
                b.innerHTML =
                    `<span class="ab-tier-check">${CHECK_SVG}</span>` +
                    `<span class="ab-tier-qty">${t.min}+ plant</span>` +
                    `<span class="ab-tier-save">Save ${save}%</span>`;
                if (t.min > maxQ) b.classList.add('ab-tier-disabled');
                ul.appendChild(b);
            });
            table.parentNode.insertBefore(wrap, table);
            table.classList.add('ab-hide');

            /* 6. Behaviour */
            const getQty = () => {
                const v = qty ? parseInt(qty.value, 10) : 1;
                return isNaN(v) || v < 1 ? 1 : v;
            };

            /* price per plant for a quantity (from the full tier list) */
            const priceFor = (v) => {
                let p = basePrice;
                tiers.forEach((t) => { if (v >= t.min) p = priceVal(t.now); });
                return p;
            };

            /* Total: <span class="price-total-original">£12.00</span> £11.40 */
            const updateTotal = () => {
                const totalP = $('.total-price', card);
                if (!totalP) return;
                let orig = $('.price-total-original', totalP);
                if (!orig) {
                    orig = document.createElement('span');
                    orig.className = 'price-total-original';
                    const strong = $('strong', totalP);
                    totalP.insertBefore(orig, strong || null);
                }
                const v = getQty();
                orig.textContent = priceFor(v) < basePrice ? fmt(v * basePrice) : '';
            };

            const setActive = () => {
                const v = getQty();
                let active = null;
                $$('.ab-tier', ul).forEach((b) => {
                    b.classList.remove('is-active');
                    b.setAttribute('aria-pressed', 'false');
                    if (v >= +b.getAttribute('data-min')) active = b;
                });
                if (active) { active.classList.add('is-active'); active.setAttribute('aria-pressed', 'true'); }

                const unitVal = unitLi && $('.unit-price-value', unitLi);
                if (unitVal) unitVal.textContent = priceFor(v).toFixed(2);

                updateTotal();
                setTimeout(updateTotal, 60); /* after the site's own total calc */
            };

            const choose = (b) => {
                if (!qty || b.classList.contains('ab-tier-disabled')) return;
                const min = Math.min(+b.getAttribute('data-min'), maxQ);
                qty.value = min;
                fire(qty, 'input'); fire(qty, 'change'); fire(qty, 'keyup');
                setActive();
                log('tier selected', min);
            };

            ul.addEventListener('click', (e) => {
                const b = e.target.closest('.ab-tier');
                if (b) choose(b);
            });
            ul.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const b = e.target.closest('.ab-tier');
                if (b) { e.preventDefault(); choose(b); }
            });

            if (qty) {
                ['input', 'change', 'keyup'].forEach((ev) => qty.addEventListener(ev, setActive));
                $$('.plus, .minus', card).forEach((btn) => btn.addEventListener('click', () => setTimeout(setActive, 0)));
            }
            setActive();
            log('card built', card);
        }

        function init() {
            $$('.product-listing').forEach(build);
        }

        // run now + for listings loaded later
        init();
        new MutationObserver(() => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(init, 50);
        }).observe(document.body, { childList: true, subtree: true });
        
    });
})();