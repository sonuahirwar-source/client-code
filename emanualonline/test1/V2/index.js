(() => {
    'use strict';

    const testInfo = {
        className: 'gmd-23-v2',
        debug: 0,
        testName: 'T23 | Optimize discount-code visibility during checkout',
        testVersion: 'v2'
    };

    let debounceTimeout;
    let observerStarted = false;

    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);

        if (timer <= 0) return;

        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined')
            ? callback(elements)
            : setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }

    document.body.classList.add(testInfo.className);

    const selector = '.gmd-23-v2 div[x-data="discountForm"]>div>div:has(strong#block-discount-heading), .gmd-23-v2 .cart-summary .coupon-form-title';

    function updateDiscountHTML() {
        document.querySelectorAll(selector).forEach(el => {
            if (el.dataset.gmdUpdated === 'true') return;

            el.innerHTML = `
           <div class="gmd-diy-success">DIY20 successfully applied!</div>
                <div class="gmd-welcome-discount">
                    <div class="gmd-discount-left">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="25" viewBox="0 0 22 25" fill="none">
                            <path d="M21.875 18.75C20.5068 18.75 20.3486 17.1875 18.2373 17.1875C16.1167 17.1875 15.9509 18.75 14.5874 18.75C13.2351 18.75 13.0516 17.1875 10.9375 17.1875C8.84561 17.1875 8.63193 18.75 7.2998 18.75C5.92539 18.75 5.77627 17.1875 3.6499 17.1875C1.52358 17.1875 1.37192 18.75 0 18.75V14.8438C0 13.5498 1.0498 12.5 2.34375 12.5H3.125V5.46875H6.25V12.5H9.375V5.46875H12.5V12.5H15.625V5.46875H18.75V12.5H19.5312C20.8252 12.5 21.875 13.5498 21.875 14.8438V18.75ZM21.875 25H0V20.3125C2.11699 20.3125 2.28355 18.75 3.6499 18.75C5.0147 18.75 5.17593 20.3125 7.2998 20.3125C9.39175 20.3125 9.60532 18.75 10.9375 18.75C12.3119 18.75 12.461 20.3125 14.5874 20.3125C16.7044 20.3125 16.8709 18.75 18.2373 18.75C19.5795 18.75 19.7633 20.3125 21.875 20.3125V25ZM4.6875 4.6875C3.8208 4.6875 3.125 3.9917 3.125 3.125C3.125 1.61133 4.6875 2.00195 4.6875 0C5.27344 0 6.25 1.44043 6.25 2.73438C6.25 4.02832 5.5542 4.6875 4.6875 4.6875ZM10.9375 4.6875C10.0708 4.6875 9.375 3.9917 9.375 3.125C9.375 1.61133 10.9375 2.00195 10.9375 0C11.52344 0 12.5 1.44043 12.5 2.73438C12.5 4.02832 11.8042 4.6875 10.9375 4.6875ZM17.1875 4.6875C16.3208 4.6875 15.625 3.9917 15.625 3.125C15.625 1.61133 17.1875 2.00195 17.1875 0C17.77344 0 18.75 1.44043 18.75 2.73438C18.75 4.02832 18.0542 4.6875 17.1875 4.6875Z" fill="#30BF39"/>
                        </svg>

                        <div class="gmd-discount-message">
                            <strong>Get 20% off your first order!</strong>
                            <span>Use code <b>DIY20</b> at checkout.</span>
                        </div>
                    </div>

                    <button type="button" class="gmd-discount-copy" aria-label="Copy discount code">
                        <strong>DIY20</strong>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                            <path d="M10 14V15.25C10 15.6642 9.66422 16 9.25 16H0.75C0.335781 16 0 15.6642 0 15.25V3.75C0 3.33578 0.335781 3 0.75 3H3V12.25C3 13.215 3.78503 14 4.75 14H10V14ZM10 3.25V0H4.75C4.33578 0 4 0.335781 4 0.75V12.25C4 12.6642 4.33578 13 4.75 13H13.25C13.6642 13 14 12.6642 14 12.25V4H10.75C10.3375 4 10 3.6625 10 3.25ZM13.7803 2.28034L11.7197 0.219656C11.579 0.0790133 11.3882 1.03999e-06 11.1893 0L11 0V3H14V2.81066C14 2.61175 13.921 2.42099 13.7803 2.28034Z" fill="#6C757D"/>
                        </svg>
                    </button>
                </div>
            `;

            el.dataset.gmdUpdated = 'true';
        });

        updateAppliedCouponClass();
    }

    // Check Applied Coupon
function updateAppliedCouponClass() {
    document.querySelectorAll('.gmd-23-v2 .gmd-welcome-discount').forEach(el => {

        const wrapper = el.closest('[x-data="discountForm"]') ||
                        el.closest('.cart-summary') ||
                        el.closest('#amasty-stripe-button-modal') ||
                        document;

        const couponInput = wrapper.querySelector(
            'form#discount-coupon-form input[name="coupon_code"]'
        );

        const couponCode = couponInput?.value.trim().toLowerCase() || '';

        const isDisabled = couponInput?.disabled === true;

        el.classList.toggle(
            'gmd-diy-20',
            couponCode === 'diy20' && isDisabled
        );
    });
}
    // Copy Discount Code
    document.addEventListener('click', function(e) {
        const copyBtn = e.target.closest('.gmd-discount-copy');

        if (!copyBtn) return;

        navigator.clipboard.writeText('DIY20').then(() => {
            const originalHTML = copyBtn.innerHTML;

            copyBtn.querySelector('strong').textContent = 'COPIED!';

            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 1500);
        });
    });

    // Detect Coupon Input Changes
    document.addEventListener('input', function(e) {
        if (e.target.matches('.gmd-23-v2 input[name="coupon_code"]')) {
            updateAppliedCouponClass();
        }
    });

    document.addEventListener('change', function(e) {
        if (e.target.matches('.gmd-23-v2 input[name="coupon_code"]')) {
            updateAppliedCouponClass();
        }
    });

    // Mutation Observer
    function startObserver() {
        if (observerStarted) return;

        observerStarted = true;

        const observer = new MutationObserver(() => {
            clearTimeout(debounceTimeout);

            debounceTimeout = setTimeout(() => {
                updateDiscountHTML();
                updateAppliedCouponClass();
            }, 50);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // PDP / Amasty Modal
    waitForElement(
        ".pdp-info-accordion .product-info-block .product-quickbuy-button",
        () => {
            updateDiscountHTML();
            startObserver();
        }
    );

    // Cart Coupon Form
    waitForElement(
        ".checkout-cart-index .cart-summary .coupon-form",
        () => {
            updateDiscountHTML();
            startObserver();
        }
    );

})();
