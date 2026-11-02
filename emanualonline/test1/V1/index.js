
(() => {
    'use strict';

    const testInfo = {
        className: 'gmd-03',
        debug: 0,
        testName: 'Test Name',
        testVersion: 'v1'
    };

    let debounceTimeout;

    function waitForElement(
        waitFor,
        callback,
        minElements = 1,
        isVariable = false,
        timer = 10000,
        frequency = 25
    ) {
        let elements = isVariable
            ? window[waitFor]
            : document.querySelectorAll(waitFor);

        if (timer <= 0) return;

        (!isVariable && elements.length >= minElements) ||
        (isVariable && typeof window[waitFor] !== 'undefined')
            ? callback(elements)
            : setTimeout(
                () => waitForElement(
                    waitFor,
                    callback,
                    minElements,
                    isVariable,
                    timer - frequency,
                    frequency
                ),
                frequency
            );
    }

    waitForElement(
        '.pdp-info-accordion  .emo-sticky-ats-wrapper .emo-btn-wrapper .emo-buy-now-btn, .checkout-cart-index .cart-summary .coupon-form',
        ([pdp]) => {

            document.body.classList.add(testInfo.className);

            // Amasty Stripe Discount
            document.addEventListener('click', function (e) {

                const heading = e.target.closest(
                    '.gmd-03 div#amasty-stripe-button-modal div#block-discount .pb-3.text-blue'
                );

                if (!heading) return;

                const form = document.querySelector(
                    '.gmd-03 div#amasty-stripe-button-modal form#discount-coupon-form'
                );

                if (!form) return;

                heading.classList.toggle('active');
                form.classList.toggle('active');

            });

            // Cart Coupon Form
            document.addEventListener('click', function (e) {

                const heading = e.target.closest('.gmd-03 .coupon-form-title');

                if (!heading) return;

                const wrapper = heading.closest('.gmd-03 .coupon-form');

                const form = wrapper?.querySelector(
                    '.gmd-03 #discount-coupon-form'
                );

                if (!form) return;

                heading.classList.toggle('active');
                form.classList.toggle('active');

            });

        }
    );

})();
