(() => {
    'use strict';
    const testInfo = {
        className: 'gmd-02',
        debug: 0,
        testName: 'Test Name',
        testVersion: 'v1'
    };
 
    let debounceTimeout;
 
    function waitForElement(waitFor, callback, minElements = 1, isVariable = false, timer = 10000, frequency = 25) {
        let elements = isVariable ? window[waitFor] : document.querySelectorAll(waitFor);
        if (timer <= 0) return;
        (!isVariable && elements.length >= minElements) || (isVariable && typeof window[waitFor] !== 'undefined') ?
        callback(elements): setTimeout(() => waitForElement(waitFor, callback, minElements, isVariable, timer - frequency), frequency);
    }

    waitForElement(".product .product-info .variant-picker__option", ([pdp]) => {
        document.body.classList.add(testInfo.className);


        
(function () {
    async function initVariantList() {
        const picker = document.querySelector(
            ".gmd-02 .variant-picker__option-values"
        );

        if (!picker || document.querySelector(".gmd-02  .gmd-custom-variant-list")) {
            return;
        }

        const radios = [
            ...picker.querySelectorAll(' input[type="radio"]')
        ];

        if (!radios.length) return;

        let product;

        try {
            const response = await fetch(
                window.location.pathname.replace(/\/$/, "") + ".js"
            );

            if (!response.ok) throw new Error("Product data unavailable");

            product = await response.json();
        } catch (error) {
            console.error("Product data error:", error);
            return;
        }

        const variants = product.variants || [];
        const selectedQuantities = {};

        function money(cents) {
            if (cents == null) return "";

            return new Intl.NumberFormat(
                document.documentElement.lang || "nl-NL",
                {
                    style: "currency",
                    currency: product.currency || "EUR"
                }
            ).format(cents / 100);
        }
function updateTotalPrice() {
    const total = Object.entries(selectedQuantities).reduce(
        (sum, [id, quantity]) => {
            const variant = variants.find(v => v.id === Number(id));
            return sum + (variant ? variant.price * quantity : 0);
        },
        0
    );

    const totalPrice = money(total);

    document.querySelectorAll(
        ".gmd-02 price-list sale-price,.gmd-02  .button-price .current-price"
    ).forEach(element => {
        element.textContent = totalPrice;
    });
}
function ensureDefaultQuantity() {
    const hasQuantity = Object.values(selectedQuantities)
        .some(quantity => quantity > 0);

    if (hasQuantity) return;

    const firstVariant = matchedVariants[0]?.variant;
    if (!firstVariant) return;

    selectedQuantities[firstVariant.id] = 1;

    const firstRow = list.querySelector(
        `[data-variant-id="${firstVariant.id}"]`
    );

    if (firstRow) {
        firstRow.querySelector(
            ".gmd-custom-variant-qty"
        ).textContent = "1";

        firstRow.querySelector(
            ".gmd-custom-variant-quantity button:first-child"
        ).disabled = false;
    }

    updateTotalPrice();
}
        async function getVariantStockStatus(variantId) {
            try {
                const url = new URL(window.location.href);
                url.searchParams.set("variant", variantId);

                const response = await fetch(url.pathname + url.search);

                if (!response.ok) return "Stock unavailable";

                const html = await response.text();
                const doc = new DOMParser().parseFromString(
                    html,
                    "text/html"
                );

                const stock = doc.querySelector(
                    ".instock[data-product-instock]"
                );

                return stock?.innerText.trim() || "Stock unavailable";
            } catch (error) {
                console.error("Stock status error:", variantId, error);
                return "Stock unavailable";
            }
        }

        // Create popup once
        function createPostedPopup() {
            if (document.querySelector(".gmd-02 .gmd-posted-modal")) return;

            const overlay = document.createElement("div");
            overlay.className = "gmd-posted-modal";
            overlay.setAttribute("aria-hidden", "true");

            overlay.innerHTML = `
                <div class="gmd-posted-dialog"
                     role="dialog"
                     aria-modal="true"
                     aria-labelledby="gmd-posted-title">

                    <button type="button"
                            class="gmd-posted-close"
                            aria-label="Close popup">
                        &times;
                    </button>

                    <div class="gmd-posted-bell">
                        <svg xmlns="http://www.w3.org/2000/svg"
                             width="40" height="40"
                             viewBox="0 0 40 40" fill="none">
                            <path d="M24.325 31.825C23.7728 32.3935 23.1121 32.8454 22.3821 33.154C21.6521 33.4626 20.8676 33.6216 20.075 33.6216C19.2824 33.6216 18.4979 33.4626 17.7679 33.154C17.0379 32.8454 16.3772 32.3935 15.825 31.825C15.661 31.6409 15.4623 31.491 15.2403 31.3838C15.0182 31.2767 14.7773 31.2143 14.5311 31.2004C14.285 31.1864 14.0385 31.2212 13.8058 31.3026C13.5731 31.3841 13.3587 31.5106 13.175 31.675C12.8239 32.0265 12.6266 32.5031 12.6266 33C12.6266 33.4968 12.8239 33.9734 13.175 34.325C14.0569 35.3169 15.1389 36.1108 16.3497 36.6545C17.5605 37.1981 18.8727 37.4792 20.2 37.4792C21.5273 37.4792 22.8395 37.1981 24.0503 36.6545C25.2611 36.1108 26.3431 35.3169 27.225 34.325C27.3894 34.1412 27.5159 33.9269 27.5973 33.6942C27.6788 33.4615 27.7135 33.215 27.6996 32.9689C27.6857 32.7227 27.6233 32.4817 27.5161 32.2597C27.409 32.0377 27.2591 31.839 27.075 31.675C26.8932 31.4876 26.6734 31.3415 26.4303 31.2463C26.1872 31.1512 25.9265 31.1093 25.6658 31.1236C25.4052 31.1378 25.1506 31.2077 24.9193 31.3287C24.688 31.4498 24.4853 31.619 24.325 31.825Z"
                                  fill="#231F20"/>
                            <path d="M34.55 25.9C32.75 24.775 31.625 20.3 31.15 12.5C31.0897 11.1061 30.7516 9.73837 30.1555 8.47696C29.5594 7.21556 28.7173 6.08595 27.6787 5.15443C26.64 4.22292 25.4258 3.50828 24.1072 3.05245C22.7886 2.59662 21.3922 2.4088 20 2.50001C18.6093 2.41566 17.2157 2.60827 15.9 3.06666C14.5844 3.52504 13.3728 4.24009 12.3356 5.17032C11.2984 6.10054 10.4562 7.22745 9.85785 8.48566C9.25951 9.74388 8.91694 11.1084 8.85 12.5C8.4 20.225 7.25 24.7 5.475 25.825C5.10086 26.0505 4.81203 26.3936 4.6537 26.8008C4.49537 27.2079 4.47649 27.656 4.6 28.075L5.15 29.55H33.45C33.8914 29.5503 34.3207 29.4063 34.6727 29.14C35.0247 28.8738 35.2801 28.4998 35.4 28.075L35.725 26.575L34.55 25.9ZM10.125 25.9C11.715 21.6122 12.5195 17.0731 12.5 12.5C12.5615 11.5905 12.8072 10.7029 13.2223 9.89127C13.6374 9.07964 14.2132 8.36087 14.9146 7.77865C15.6161 7.19642 16.4286 6.7629 17.3029 6.50441C18.1771 6.24593 19.0947 6.16788 20 6.27501C20.926 6.17478 21.8626 6.26654 22.7515 6.54456C23.6404 6.82258 24.4624 7.28089 25.1663 7.89087C25.8701 8.50084 26.4406 9.24938 26.8421 10.0897C27.2436 10.9301 27.4676 11.8442 27.5 12.775C27.5439 17.256 28.3906 21.6928 30 25.875L10.125 25.9Z"
                                  fill="#231F20"/>
                        </svg>
                    </div>

                    <h2 id="gmd-posted-title">Keep me posted</h2>

                    <p class="gmd-posted-description">
                        Dit product is momenteel uitverkocht.
                        Laat hieronder je e-mailadres achter en ontvang
                        direct een melding zodra deze optie weer op voorraad is.
                    </p>

                    <div class="gmd-posted-product">
                        <img class="gmd-posted-product-image"
                             src=""
                             alt="">

                        <div class="gmd-posted-product-details">
                            <strong class="gmd-posted-product-title"></strong>
                            <span class="gmd-posted-variant-title"></span>
                            <span class="gmd-posted-product-price"></span>
                        </div>
                    </div>

                    <form class="gmd-posted-form">
                        <input type="email"
                               class="gmd-posted-email"
                               placeholder="Je e-mailadres"
                               aria-label="Je e-mailadres"
                               required>

                        <button type="submit" class="gmd-posted-submit">
                            MELD MIJ AAN
                        </button>

                        <p class="gmd-posted-message" aria-live="polite"></p>
                    </form>

                    <p class="gmd-posted-privacy">
                        We gebruiken je e-mailadres alleen om je te informeren
                        over de beschikbaarheid van dit product.
                    </p>
                    
<div class="gmd-posted-success" style="display:none;">
    <div class="gmd-posted-success-icon">
       <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
  <rect x="3" y="7" width="34" height="28" fill="#EB001B"/>
  <path d="M35.7143 40H0.102075L0 6.64847e-06C0 6.64847e-06 1.91875 0 4.28571 0H35.7143C38.0813 0 40 1.82016e-05 40 1.82016e-05V40C40 40 38.0813 40 35.7143 40ZM17.4387 31.2447L33.8673 14.8162C34.4252 14.2583 34.4252 13.3538 33.8673 12.7959L31.8471 10.7756C31.2892 10.2178 30.3846 10.2177 29.8267 10.7756L16.4286 24.1737L10.1733 17.9184C9.61545 17.3605 8.71089 17.3605 8.15295 17.9184L6.13268 19.9387C5.57482 20.4965 5.57482 21.4011 6.13268 21.9589L15.4184 31.2446C15.9763 31.8027 16.8808 31.8027 17.4387 31.2447Z" fill="white"/>
</svg>
    </div>

    <h2>Je staat op de lijst</h2>

    <p>
        Bedankt! We geven je een seintje zodra
        de <span class="gmd-posted-success-variant"></span>
        weer op voorraad is.
    </p>
<!-- Same product structure as the original popup -->
<div class="gmd-posted-product gmd-posted-success-product">
    <img class="gmd-posted-product-image" src="" alt="">

    <div class="gmd-posted-product-details">
        <strong class="gmd-posted-product-title"></strong>
        <span class="gmd-posted-variant-title"></span>
        <span class="gmd-posted-product-price"></span>
    </div>
</div>
    <button type="button" class="gmd-posted-success-close">
        Sluiten
    </button>
</div>

                </div>
            `;

            document.body.appendChild(overlay);

            const closePopup = () => {
                overlay.classList.remove("is-open");
                overlay.setAttribute("aria-hidden", "true");
                document.body.classList.remove("gmd-posted-no-scroll");
            };

            overlay.querySelector(".gmd-02 .gmd-posted-close")
                .addEventListener("click", closePopup);

            overlay.addEventListener("click", event => {
                if (event.target === overlay) closePopup();
            });

            document.addEventListener("keydown", event => {
                if (event.key === "Escape" && overlay.classList.contains("is-open")) {
                    closePopup();
                }
            });

            // UI only: connect this form to a back-in-stock service/API
            // to actually save emails and send notifications.
     // Klaviyo back-in-stock subscription
overlay.querySelector(".gmd-02 .gmd-posted-form")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const email = overlay.querySelector(".gmd-02 .gmd-posted-email");
        const message = overlay.querySelector(".gmd-02 .gmd-posted-message");
        const button = overlay.querySelector(".gmd-02 .gmd-posted-submit");

        if (!email.checkValidity()) {
            email.reportValidity();
            return;
        }

        const variantId = overlay.dataset.variantId;

        if (!variantId) {
            message.textContent = "Please select a variant.";
            message.classList.add("is-visible");
            return;
        }

        const payload = {
            data: {
                type: "back-in-stock-subscription",
                attributes: {
                    profile: {
                        data: {
                            type: "profile",
                            attributes: {
                                email: email.value.trim()
                            }
                        }
                    },
                    channels: ["EMAIL"]
                },
                relationships: {
                    variant: {
                        data: {
                            type: "catalog-variant",
                            id: `$shopify:::$default:::${variantId}`
                        }
                    }
                }
            }
        };

        button.disabled = true;
        button.textContent = "PLEASE WAIT...";
        message.textContent = "";
        message.classList.remove("is-visible");

        try {
            const response = await fetch(
                "https://a.klaviyo.com/client/back-in-stock-subscriptions?company_id=VK6yQz",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        revision: "2023-12-15"
                    },
                    body: JSON.stringify(payload)
                }
            );

          
if (response.status === 202) {
    overlay.querySelector(".gmd-posted-form").style.display = "none";
    overlay.querySelector(".gmd-posted-description").style.display = "none";
    overlay.querySelector(".gmd-posted-privacy").style.display = "none";
    overlay.querySelector(".gmd-posted-bell").style.display = "none";

    const success = overlay.querySelector(".gmd-posted-success");
    const variantText = overlay.querySelector(".gmd-posted-success-variant");

    variantText.textContent =
        overlay.querySelector(".gmd-posted-variant-title").textContent;

    success.style.display = "block";
const successProduct = overlay.querySelector(
    ".gmd-posted-success-product"
);

const originalProduct = overlay.querySelector(
    ".gmd-posted-product:not(.gmd-posted-success-product)"
);

successProduct.querySelector(".gmd-posted-product-image").src =
    originalProduct.querySelector(".gmd-posted-product-image").src;

successProduct.querySelector(".gmd-posted-product-image").alt =
    originalProduct.querySelector(".gmd-posted-product-image").alt;

successProduct.querySelector(".gmd-posted-product-title").textContent =
    originalProduct.querySelector(".gmd-posted-product-title").textContent;

successProduct.querySelector(".gmd-posted-variant-title").textContent =
    originalProduct.querySelector(".gmd-posted-variant-title").textContent;

successProduct.querySelector(".gmd-posted-product-price").textContent =
    originalProduct.querySelector(".gmd-posted-product-price").textContent;
    overlay.querySelector(".gmd-posted-success-close").onclick = () => {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("gmd-posted-no-scroll");
    };
}
else {
                const errorText = await response.text();

                console.error("Klaviyo error:", response.status, errorText);

                message.textContent =
                    "Unable to register. Please try again.";

                message.classList.add("is-visible");
            }
        } catch (error) {
            console.error("Klaviyo request failed:", error);

            message.textContent =
                "Something went wrong. Please try again.";

            message.classList.add("is-visible");
        } finally {
            button.disabled = false;
            button.textContent = "MELD MIJ AAN";
        }
    });
        }

        function openPostedPopup(variant) {
            createPostedPopup();

            const overlay = document.querySelector(".gmd-02 .gmd-posted-modal");
            overlay.dataset.variantId = variant.id;
            const image = overlay.querySelector(".gmd-02 .gmd-posted-product-image");

            // Use variant image when available; otherwise use product image.
            const imageUrl =
                variant.featured_image?.src ||
                (typeof variant.featured_image === "string"
                    ? variant.featured_image
                    : "") ||
                product.featured_image ||
                product.images?.[0] ||
                "";

            if (imageUrl) {
                image.src = imageUrl.startsWith("//")
                    ? window.location.protocol + imageUrl
                    : imageUrl;

                image.alt = product.title || "";
                image.style.display = "block";
            } else {
                image.removeAttribute("src");
                image.alt = "";
                image.style.display = "none";
            }

            overlay.querySelector(".gmd-02 .gmd-posted-product-title").textContent =
                product.title || "";

            overlay.querySelector(".gmd-02 .gmd-posted-variant-title").textContent =
                variant.title || "";

            overlay.querySelector(".gmd-02 .gmd-posted-product-price").textContent =
                money(variant.price);

            overlay.querySelector(".gmd-02 .gmd-posted-email").value = "";
            overlay.querySelector(".gmd-02 .gmd-posted-message").textContent = "";
            overlay.querySelector(".gmd-02 .gmd-posted-message")
                .classList.remove("is-visible");

            overlay.classList.add("is-open");
            overlay.setAttribute("aria-hidden", "false");
            document.body.classList.add("gmd-posted-no-scroll");

            overlay.querySelector(".gmd-02 .gmd-posted-email").focus();
        }

        createPostedPopup();

        const list = document.createElement("div");
        list.className = "gmd-custom-variant-list";

        const matchedVariants = radios
            .map(radio => ({
                radio,
                variant: variants.find(v =>
                    v.title.trim().toLowerCase() ===
                    radio.value.trim().toLowerCase()
                )
            }))
            .filter(item => item.variant);

const stockStatuses = matchedVariants.map(() => "Checking stock...");

        matchedVariants.forEach(({ variant }, index) => {
            const row = document.createElement("div");
            row.className = "gmd-custom-variant-row";
            row.dataset.variantId = variant.id;

            selectedQuantities[variant.id] = 0;

            const name = document.createElement("div");
            name.className = "gmd-custom-variant-name";
            name.textContent = variant.title;

            const prices = document.createElement("div");
            prices.className = "gmd-custom-variant-prices";

            if (
                variant.compare_at_price != null &&
                variant.compare_at_price > 0
            ) {
                const regular = document.createElement("span");
                regular.className = "gmd-custom-variant-regular";
                regular.textContent = money(variant.compare_at_price);
                prices.appendChild(regular);
            }

            const sale = document.createElement("span");
            sale.className = "gmd-custom-variant-sale";
            sale.textContent = money(variant.price);
            prices.appendChild(sale);

            const stock = document.createElement("div");
            stock.className = "gmd-custom-variant-stock";

           const status = stockStatuses[index];

            stock.textContent = status;
            stock.classList.add("is-stock-unknown");
            stock.dataset.stockLoaded = "false";

            const quantity = document.createElement("div");
            quantity.className = "gmd-custom-variant-quantity";

            const minus = document.createElement("button");
            minus.type = "button";
            minus.textContent = "−";
            minus.setAttribute("aria-label", "Decrease quantity");
            minus.disabled = true;

            const qty = document.createElement("span");
            qty.className = "gmd-custom-variant-qty";
            qty.textContent = "0";

            const plus = document.createElement("button");
            plus.type = "button";
            plus.textContent = "+";
            plus.setAttribute("aria-label", "Increase quantity");

            let count = 0;

            // Allow quantity increase for every variant, including out of stock
            plus.disabled = false;
            plus.removeAttribute("disabled");
            plus.setAttribute("aria-disabled", "false");

            minus.addEventListener("click", () => {
                count = Math.max(0, count - 1);

                qty.textContent = count;
                selectedQuantities[variant.id] = count;
                minus.disabled = count === 0;

                ensureDefaultQuantity();

                // Sync local count if the first variant was auto-selected
                const firstVariant = matchedVariants[0]?.variant;

                if (firstVariant && variant.id === firstVariant.id) {
                    count = selectedQuantities[variant.id];
                    qty.textContent = count;
                    minus.disabled = count === 0;
                }

                updateTotalPrice();
            });

                plus.addEventListener("click", () => {
                count++;
                qty.textContent = count;
                selectedQuantities[variant.id] = count;
                minus.disabled = count === 0;
                updateTotalPrice();
            });

            quantity.append(minus, qty, plus);

            row.append(name, stock, prices, quantity);

            // Keep me posted for this specific sold-out variant
            if (status.toLowerCase() === "out of stock") {
                const posted = document.createElement("button");
                posted.type = "button";
                posted.className = "gmd-posted";

                posted.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg"
                         width="20" height="20"
                         viewBox="0 0 20 20" fill="none">
                        <path d="M16.5 16.825H3.51877C2.87894 16.825 2.26531 16.5708 1.81288 16.1184C1.36044 15.666 1.10627 15.0523 1.10627 14.4125V5.54375C1.10545 5.22641 1.16724 4.91203 1.28811 4.61861C1.40899 4.32519 1.58656 4.0585 1.81066 3.83381C2.03477 3.60913 2.30099 3.43087 2.5941 3.30924C2.88721 3.18761 3.20143 3.125 3.51877 3.125H16.5C17.1388 3.12665 17.7508 3.38156 18.2019 3.83381C18.653 4.28606 18.9063 4.89875 18.9063 5.5375V14.4125C18.9063 15.0513 18.653 15.6639 18.2019 16.1162C17.7508 16.5684 17.1388 16.8233 16.5 16.825ZM3.51877 4.69375C3.29334 4.69375 3.07714 4.7833 2.91773 4.94271C2.75832 5.10212 2.66877 5.31832 2.66877 5.54375V14.4125C2.66877 14.6379 2.75832 14.8541 2.91773 15.0135C2.91773 15.0135 3.07714 15.1729 3.51877 15.2625H16.5C16.6114 15.2625 16.7216 15.2405 16.8244 15.1977C16.9271 15.1549 17.0204 15.0922 17.0989 15.0132C17.1773 14.9342 17.2393 14.8404 17.2813 14.7373C17.3234 14.6342 17.3446 14.5238 17.3438 14.4125V5.54375C17.3446 5.43242 17.3234 5.32203 17.2813 5.21894C17.2393 5.11585 17.1773 5.0221 17.0989 4.94308C17.0204 4.86407 16.9271 4.80136 16.8244 4.75857C16.7216 4.71578 16.6114 4.69375 16.5 4.69375H3.51877Z" fill="#2E2E2E"/>
                        <path d="M10.075 12.1C9.76839 12.0992 9.47434 11.978 9.25626 11.7625L2.62501 5.31873C2.47583 5.17452 2.39004 4.97695 2.38653 4.76949C2.38301 4.56203 2.46205 4.36166 2.60626 4.21248C2.75047 4.0633 2.94804 3.97751 3.1555 3.97399C3.36297 3.97048 3.56333 4.04952 3.71251 4.19373L10.075 10.3812L16.5375 4.04373C16.609 3.96518 16.6958 3.90204 16.7926 3.85817C16.8893 3.81431 16.994 3.79063 17.1002 3.7886C17.2064 3.78656 17.3119 3.80621 17.4103 3.84634C17.5087 3.88647 17.5978 3.94624 17.6723 4.02199C17.7468 4.09774 17.805 4.18789 17.8435 4.28692C17.8819 4.38595 17.8998 4.49178 17.8959 4.59794C17.8921 4.7041 17.8666 4.80875 17.8211 4.90436C17.7756 5.00035 17.711 5.08606 17.6313 5.15623L10.9 11.7562C10.7922 11.8654 10.6637 11.952 10.5221 12.011C10.3804 12.0701 10.2285 12.1003 10.075 12.1Z" fill="#2E2E2E"/>
                        <path d="M17.1437 16.3C17.0235 16.3014 16.9045 16.2751 16.7961 16.2231C16.6877 16.171 16.5928 16.0947 16.5187 16L11.7062 9.81246C11.5929 9.64746 11.5472 9.44524 11.5786 9.24754C11.61 9.04983 11.7161 8.87172 11.875 8.74996C11.9553 8.68579 12.0476 8.63836 12.1465 8.61048C12.2454 8.58261 12.3489 8.57485 12.4509 8.58767C12.5529 8.60049 12.6512 8.63362 12.7402 8.68512C12.8291 8.73661 12.9068 8.80541 12.9687 8.88746L17.7812 15.0687C17.9079 15.2332 17.9646 15.441 17.9388 15.647C17.913 15.853 17.8079 16.0405 17.6437 16.1687C17.496 16.2662 17.3203 16.3123 17.1437 16.3Z" fill="#2E2E2E"/>
                        <path d="M3.01252 16.3C2.83886 16.2987 2.6702 16.2417 2.53127 16.1375C2.36937 16.0084 2.26464 15.821 2.23868 15.6155C2.21299 15.41 2.26864 15.2026 2.39377 15.0375L7.20627 8.85627C7.26906 8.7742 7.3474 8.70529 7.43681 8.65349C7.52623 8.60169 7.62498 8.56801 7.72741 8.55437C7.82985 8.54073 7.93396 8.5474 8.03382 8.574C8.13368 8.6006 8.22732 8.64661 8.30939 8.7094C8.39147 8.77218 8.46037 8.85052 8.51218 8.93994C8.56398 9.02936 8.59766 9.12811 8.6113 9.23054C8.62493 9.33297 8.61826 9.43709 8.59166 9.53695C8.56506 9.63681 8.51906 9.73044 8.45627 9.81252L3.63127 16C3.55692 16.0929 3.46281 16.2417 3.35577 16.2199C3.24873 16.2718 3.13147 16.2992 3.01252 16.3Z" fill="#2E2E2E"/>
                    </svg>
                    <span>Keep me posted</span>
                `;

                posted.addEventListener("click", () => {
                    openPostedPopup(variant);
                });

                row.appendChild(posted);
            }

            list.appendChild(row);
        });

        picker.insertAdjacentElement("afterend", list);
        // Fetch stock statuses in the background after rendering the list.
        (async function updateStockInBackground() {
            await Promise.all(
                matchedVariants.map(async ({ variant }) => {
                    const row = list.querySelector(
                        `[data-variant-id="${variant.id}"]`
                    );

                    if (!row) return;

                    const stock = row.querySelector(".gmd-custom-variant-stock");

                    try {
                        const status = await getVariantStockStatus(variant.id);
                        const normalizedStatus = status.trim().toLowerCase();

                        stock.textContent = status;

                        stock.classList.remove(
                            "is-in-stock",
                            "is-low-stock",
                            "is-out-of-stock",
                            "is-stock-unknown",
                            "available"
                        );

                        if (
                            variant.available === true &&
                            normalizedStatus === "out of stock"
                        ) {
                            stock.classList.add("available");
                        }

                        if (normalizedStatus === "in stock") {
                            stock.classList.add("is-in-stock");
                        } else if (normalizedStatus === "almost out of stock") {
                            stock.classList.add("is-low-stock");
                        } else if (normalizedStatus === "out of stock") {
                            stock.classList.add("is-out-of-stock");
                        } else {
                            stock.classList.add("is-stock-unknown");
                        }

                        stock.dataset.stockLoaded = "true";

                        // Add Keep me posted for sold-out variants after stock loads.
                        if (
                            normalizedStatus === "out of stock" &&
                            !row.querySelector(".gmd-posted")
                        ) {
                            const posted = document.createElement("button");
                            posted.type = "button";
                            posted.className = "gmd-posted";
                            posted.textContent = "Keep me posted";

                            posted.addEventListener("click", () => {
                                openPostedPopup(variant);
                            });

                            row.appendChild(posted);
                        }
                    } catch (error) {
                        console.error(
                            "Background stock update failed:",
                            variant.id,
                            error
                        );
                    }
                })
            );
        })();
        // Existing product form: add selected variants to cart
        const productForm = document.querySelector(
            "form.product-info__buy-form"
        );

        if (productForm && !productForm.dataset.multiVariantReady) {
            productForm.dataset.multiVariantReady = "true";

            productForm.addEventListener("submit", async function (event) {
                const items = Object.entries(selectedQuantities)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([id, quantity]) => ({
                        id: Number(id),
                        quantity
                    }));

                if (!items.length) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                const submitButton = productForm.querySelector(
                    'button[type="submit"]'
                );
            const buttonContent = submitButton?.querySelector(":scope > div");
            const buttonLoader = submitButton?.querySelector(".button__loader");

            if (submitButton) {
                submitButton.classList.add("gmd-add-to-cart");
                submitButton.classList.add("is-loading");

                if (buttonContent) {
                    buttonContent.style.transform = "translateY(-10px)";
                    buttonContent.style.opacity = "0";
                }

                if (buttonLoader) {
                    buttonLoader.style.transform = "translateY(0px)";
                    buttonLoader.style.opacity = "1";
                }
            }
                if (submitButton) submitButton.disabled = true;

                try {
                    const root = window.Shopify?.routes?.root || "/";

                    const response = await fetch(root + "cart/add.js", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({ items })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.description ||
                            result.message ||
                            "Unable to add variants to cart."
                        );
                    }

                    const drawer = document.querySelector("#cart-drawer");

                    if (!drawer) {
                        throw new Error("Cart drawer element was not found.");
                    }

                    const sectionUrl = new URL(
                        window.location.pathname,
                        window.location.origin
                    );

                    sectionUrl.searchParams.set("sections", "cart-drawer");

                    const sectionResponse = await fetch(
                        sectionUrl.pathname + sectionUrl.search
                    );

                    if (sectionResponse.ok) {
                        const sections = await sectionResponse.json();
                        const html = sections["cart-drawer"];

                        if (html) {
                            const doc = new DOMParser().parseFromString(
                                html,
                                "text/html"
                            );

                            const updatedDrawer =
                                doc.querySelector("#cart-drawer");

                            if (updatedDrawer) {
                                drawer.innerHTML = updatedDrawer.innerHTML;
                            }
                        }
                    }

                    if (typeof drawer.show === "function") {
                        drawer.show();
                    } else if (typeof drawer.open === "function") {
                        drawer.open();
                    } else if (typeof drawer.showModal === "function") {
                        drawer.showModal();
                    } else {
                        document.documentElement.dispatchEvent(
                            new CustomEvent("cart:refresh", { bubbles: true })
                        );

                        document.documentElement.dispatchEvent(
                            new CustomEvent("cart:open", { bubbles: true })
                        );
                    }
                } catch (error) {
                    console.error("Add to cart error:", error);
                    alert(error.message || "Something went wrong.");
                } finally {
    if (submitButton) {
        submitButton.disabled = false;

        setTimeout(() => {
            if (buttonContent) {
                buttonContent.style.transform = "translateY(10px)";
                buttonContent.style.opacity = "0";

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        buttonContent.style.transform = "translateY(0px)";
                        buttonContent.style.opacity = "1";
                    });
                });
            }

            if (buttonLoader) {
                buttonLoader.style.transform = "translateY(-10px)";
                buttonLoader.style.opacity = "0";
            }

            submitButton.classList.remove("is-loading");
        }, 300);
    }
}
            }, true);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initVariantList);
    } else {
        initVariantList();
    }
})();
 document.querySelectorAll(".gmd-02 .variant-picker fieldset.variant-picker__option").forEach((fieldset) => {
    const optionName = fieldset.querySelector("legend")?.textContent
        .replace(":", "")
        .trim()
        .toLowerCase();

    if (optionName) {
        fieldset.classList.add(`option-${optionName}`);
    }
});

    });
})();
// out of stock
// https://www.zeuzfitness.com/en/products/zeuz-kettlebells
// pre order
//https://www.zeuzfitness.com/en/products/zeuz-strongman-sandbag?variant=48428537086217
