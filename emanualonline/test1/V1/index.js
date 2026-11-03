
(() => {
    'use strict';

    const testInfo = {
        className: 'gmd-23',
        debug: 0,
        testName: 'T23 | Optimize discount-code visibility during checkout',
        testVersion: 'v1'
    };

    // Track manual close
    const manuallyClosed = new WeakSet();

    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);

        if (timer <= 0) return;

        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined')
            ? callback(elements)
            : setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }

    function isCouponApplied(form) {
        if (!form) return false;

        const remove = form.querySelector('.gmd-23 input[name="remove"]');
        const couponInput = form.querySelector('.gmd-23 input[name="coupon_code"]');

        return !!(
            remove &&
            remove.value === '1' &&
            couponInput &&
            couponInput.disabled
        );
    }

    function checkCouponApplied(heading, form) {
        if (!heading || !form) return;

        if (isCouponApplied(form) && !manuallyClosed.has(heading)) {
            heading.classList.add('active');
            form.classList.add('active');
        }
    }

    function handleToggle(heading, form) {
        if (!heading || !form) return;

        const isActive = heading.classList.contains('active');

        if (isActive) {
            heading.classList.remove('active');
            form.classList.remove('active');

            // Prevent automatic reopening
            manuallyClosed.add(heading);
        } else {
            heading.classList.add('active');
            form.classList.add('active');

            manuallyClosed.delete(heading);
        }
    }

    // Amasty Stripe Discount
    waitForElement(
        ".pdp-info-accordion .product-info-block .product-quickbuy-button",
        () => {
            document.body.classList.add(testInfo.className);

            const observer = new MutationObserver(() => {
                const modal = document.querySelector('#amasty-stripe-button-modal');
                if (!modal) return;

                const heading = modal.querySelector(
                    '.gmd-23 div[x-data="discountForm"]>div>div:has(strong#block-discount-heading)'
                );

                const form = modal.querySelector('form#discount-coupon-form');

                if (!heading || !form) return;

                checkCouponApplied(heading, form);
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled', 'value']
            });

            document.addEventListener('click', function(e) {
                const heading = e.target.closest(
                    '.gmd-23 #amasty-stripe-button-modal div[x-data="discountForm"] .pb-3.text-blue'
                );

                if (!heading) return;

                const modal = heading.closest('#amasty-stripe-button-modal');
                const form = modal && modal.querySelector('form#discount-coupon-form');

                if (!form) return;

                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                handleToggle(heading, form);
            }, true);
        }
    );

    // Cart Coupon Form
    waitForElement(
        ".checkout-cart-index .cart-summary .coupon-form",
        ([cart]) => {
            document.body.classList.add(testInfo.className);

            const heading = cart.querySelector('.coupon-form-title');
            const form = cart.querySelector('#discount-coupon-form');

            checkCouponApplied(heading, form);

            document.addEventListener('click', function(e) {
                const clickedHeading = e.target.closest(
                    '.gmd-23 .coupon-form-title'
                );

                if (!clickedHeading) return;

                const wrapper = clickedHeading.closest('.coupon-form');
                const couponForm = wrapper && wrapper.querySelector('#discount-coupon-form');

                if (!couponForm) return;

                handleToggle(clickedHeading, couponForm);
            });
        }
    );

})();
