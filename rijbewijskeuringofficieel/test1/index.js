(() => {
    'use strict';
    const testInfo = {
        className: 'gmd-41',
        debug: 0,
        testName: 'T41 | Navigatie weghalen in afsprakenformulier',
        testVersion: 'v1'
    };
 
    let debounceTimeout;
 
    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }
 
    waitForElement("body:has(#wijcbf_step_indicator .progress-bar)", ([pdp]) => {
        document.body.classList.add(testInfo.className);

   const targetDiv = document.querySelector(".gmd-41 header .navbar .logo");

        if (targetDiv && !document.querySelector(".gmd-41 .gmd-phone")) {
            targetDiv.insertAdjacentHTML(
                "afterend",
                `<a href="tel:085 060 2626" class="gmd-phone">085 060 2626</a>`
            );
        }
    });
})(); 
 
