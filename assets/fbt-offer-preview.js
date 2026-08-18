(function () {
  'use strict';

  const FALLBACK_TIERS = [
    { minItems: 4, discount: 15, tier: 4 },
    { minItems: 3, discount: 10, tier: 3 },
    { minItems: 2, discount: 5, tier: 2 },
  ];

  function formatMoney(paise) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((Number(paise) || 0) / 100);
  }

  function getTiers() {
    const configured = window.__cartDrawerConfig?.tierDiscounts;
    const source = Array.isArray(configured) && configured.length ? configured : FALLBACK_TIERS;

    return source
      .map((tier) => ({
        minItems: Number(tier.minItems) || 0,
        discount: Number(tier.discount) || 0,
        tier: Number(tier.tier) || Number(tier.minItems) || 0,
      }))
      .filter((tier) => tier.minItems > 0 && tier.discount > 0)
      .sort((a, b) => b.minItems - a.minItems);
  }

  function injectStyles() {
    if (document.getElementById('h-fbt-offer-preview-styles')) return;

    const style = document.createElement('style');
    style.id = 'h-fbt-offer-preview-styles';
    style.textContent = `
      .h-fbt-summary.h-fbt-summary--premium {
        justify-content: flex-start;
        padding: 18px;
        border: 1px solid #f1dfd5;
        border-radius: 12px;
        background: linear-gradient(180deg, #fff 0%, #fffaf6 100%);
        box-shadow: 0 8px 24px rgba(60, 35, 20, .045);
      }
      .h-fbt-summary--premium .h-fbt-summary-label {
        color: #454545;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: .01em;
      }
      .h-fbt-summary--premium .h-fbt-summary-price {
        margin: 6px 0 2px;
        color: #151515;
        font-size: clamp(25px, 2.4vw, 31px);
        font-weight: 650;
        letter-spacing: -.02em;
        line-height: 1.08;
      }
      .h-fbt-tax-copy {
        display: block;
        margin-bottom: 12px;
        color: #777;
        font-size: 9px;
        font-weight: 400;
      }
      .h-fbt-offer-preview {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 13px;
      }
      .h-fbt-offer-pill {
        display: inline-flex;
        width: fit-content;
        max-width: 100%;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border: 1px solid #ffd4bd;
        border-radius: 999px;
        background: #fff1e8;
        color: #d94700;
        font-size: 9px;
        font-weight: 750;
        line-height: 1.2;
      }
      .h-fbt-savings-tag {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 7px;
        padding: 9px 10px;
        border: 1px solid #b9dfbd;
        border-radius: 8px;
        background: #eff9ef;
        color: #176b2b;
        font-size: 10px;
        font-weight: 500;
        line-height: 1.35;
      }
      .h-fbt-savings-tag svg {
        width: 15px;
        height: 15px;
        flex: 0 0 15px;
      }
      .h-fbt-savings-tag strong {
        font-weight: 750;
      }
      .h-fbt-after-offer {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px;
        color: #555;
        font-size: 9px;
        line-height: 1.35;
      }
      .h-fbt-after-offer strong {
        color: #222;
        font-size: 11px;
        font-weight: 650;
      }
      .h-fbt-unlock-tag {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 7px;
        padding: 9px 10px;
        border: 1px solid #f0dfd5;
        border-radius: 8px;
        background: #fff;
        color: #5f5149;
        font-size: 10px;
        font-weight: 500;
        line-height: 1.35;
      }
      .h-fbt-trust-row {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 1px 0 11px;
        padding-top: 11px;
        border-top: 1px solid #efe2db;
        color: #555;
        font-size: 9px;
        line-height: 1.35;
      }
      .h-fbt-trust-row svg {
        width: 15px;
        height: 15px;
        flex: 0 0 15px;
        color: #ff5600;
      }
      .h-fbt-summary--premium .h-fbt-summary-note {
        margin: 0 0 11px;
        color: #777;
        font-size: 9px;
        font-weight: 400;
        line-height: 1.4;
      }
      .h-fbt-summary--premium .h-fbt-add-btn {
        min-height: 48px;
        border-radius: 7px;
        box-shadow: 0 7px 18px rgba(255, 86, 0, .13);
      }
      @media (max-width: 1100px) {
        .h-fbt-summary.h-fbt-summary--premium {
          border-left: 1px solid #f1dfd5;
        }
      }
      @media (max-width: 640px) {
        .h-fbt-summary.h-fbt-summary--premium {
          padding: 14px;
        }
        .h-fbt-summary--premium .h-fbt-summary-price {
          font-size: 27px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createPreviewMarkup(summary) {
    if (summary.querySelector('[data-fbt-offer-preview]')) return;

    const priceEl = summary.querySelector('[data-fbt-total-price]');
    if (!priceEl) return;

    const taxCopy = document.createElement('span');
    taxCopy.className = 'h-fbt-tax-copy';
    taxCopy.textContent = 'Inclusive of all taxes';
    priceEl.insertAdjacentElement('afterend', taxCopy);

    const preview = document.createElement('div');
    preview.className = 'h-fbt-offer-preview';
    preview.setAttribute('data-fbt-offer-preview', '');
    preview.innerHTML = `
      <span class="h-fbt-offer-pill" data-fbt-offer-pill hidden></span>
      <div class="h-fbt-savings-tag" data-fbt-savings-tag hidden>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 13l-7 7-9-9V4h7l9 9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/>
        </svg>
        <span>You save <strong data-fbt-save-amount></strong> on selected items</span>
      </div>
      <div class="h-fbt-after-offer" data-fbt-after-offer hidden>
        <span>Estimated after offer</span>
        <strong data-fbt-after-offer-price></strong>
      </div>
      <div class="h-fbt-unlock-tag" data-fbt-unlock-tag hidden></div>
    `;
    taxCopy.insertAdjacentElement('afterend', preview);

    const trust = document.createElement('div');
    trust.className = 'h-fbt-trust-row';
    trust.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.7-2.9 8.4-7 10-4.1-1.6-7-5.3-7-10V6l7-3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Secure checkout</span><span aria-hidden="true">•</span><span>7-day returns</span>
    `;

    const note = summary.querySelector('.h-fbt-summary-note');
    if (note) {
      note.textContent = 'Offer preview uses your current cart quantity. Final discount is confirmed in cart.';
      note.insertAdjacentElement('beforebegin', trust);
    } else {
      preview.insertAdjacentElement('afterend', trust);
    }
  }

  function initPanel(panel) {
    if (!panel || panel.dataset.fbtOfferEnhanced === 'true') return;
    panel.dataset.fbtOfferEnhanced = 'true';

    const summary = panel.querySelector('.h-fbt-summary');
    if (!summary) return;

    injectStyles();
    summary.classList.add('h-fbt-summary--premium');
    createPreviewMarkup(summary);

    let currentCartQty = 0;
    let cartQtyReady = false;
    const tiers = getTiers();

    function getSelectedData() {
      const mainId = parseInt(panel.dataset.fbtMainVariantId, 10);
      const mainPrice = parseInt(panel.dataset.fbtMainPrice, 10) || 0;
      let count = mainId ? 1 : 0;
      let total = mainId ? mainPrice : 0;

      panel.querySelectorAll('[data-fbt-item]:not([data-fbt-main-item])').forEach((card) => {
        const toggle = card.querySelector('[data-fbt-toggle]');
        if (toggle && !toggle.checked) return;

        const id = parseInt(card.dataset.variantId, 10);
        if (!id) return;
        count += 1;
        total += parseInt(card.dataset.price, 10) || 0;
      });

      return { count, total };
    }

    function renderOffer() {
      const { count, total } = getSelectedData();
      const projectedQty = Math.max(0, currentCartQty) + count;
      const tier = tiers.find((item) => projectedQty >= item.minItems) || null;
      const tiersAscending = [...tiers].sort((a, b) => a.minItems - b.minItems);
      const nextTier = tiersAscending.find((item) => projectedQty < item.minItems) || null;

      const pill = summary.querySelector('[data-fbt-offer-pill]');
      const savingsTag = summary.querySelector('[data-fbt-savings-tag]');
      const saveAmount = summary.querySelector('[data-fbt-save-amount]');
      const afterOffer = summary.querySelector('[data-fbt-after-offer]');
      const afterOfferPrice = summary.querySelector('[data-fbt-after-offer-price]');
      const unlockTag = summary.querySelector('[data-fbt-unlock-tag]');

      if (tier && total > 0) {
        const savings = Math.round(total * tier.discount / 100);
        const estimatedAfterOffer = Math.max(0, total - savings);

        if (pill) {
          pill.hidden = false;
          pill.textContent = `Buy ${tier.tier || tier.minItems} offer · ${tier.discount}% OFF`;
        }
        if (savingsTag) savingsTag.hidden = false;
        if (saveAmount) saveAmount.textContent = formatMoney(savings);
        if (afterOffer) afterOffer.hidden = false;
        if (afterOfferPrice) afterOfferPrice.textContent = formatMoney(estimatedAfterOffer);
        if (unlockTag) unlockTag.hidden = true;
      } else {
        if (pill) pill.hidden = true;
        if (savingsTag) savingsTag.hidden = true;
        if (afterOffer) afterOffer.hidden = true;

        if (unlockTag) {
          if (nextTier) {
            const needed = Math.max(1, nextTier.minItems - projectedQty);
            unlockTag.hidden = false;
            unlockTag.textContent = `Add ${needed} more item${needed === 1 ? '' : 's'} to unlock ${nextTier.discount}% off`;
          } else {
            unlockTag.hidden = true;
          }
        }
      }

      const note = summary.querySelector('.h-fbt-summary-note');
      if (note) {
        note.textContent = cartQtyReady
          ? `Offer preview based on ${projectedQty} total item${projectedQty === 1 ? '' : 's'} after adding. Final discount is confirmed in cart.`
          : 'Checking your current cart for the best quantity offer…';
      }
    }

    function syncCartQuantity() {
      return fetch('/cart.js', { headers: { Accept: 'application/json' } })
        .then((response) => response.ok ? response.json() : null)
        .then((cart) => {
          if (!cart) return;
          currentCartQty = Number(cart.item_count) || 0;
          cartQtyReady = true;
          renderOffer();
        })
        .catch(() => {
          cartQtyReady = true;
          renderOffer();
        });
    }

    panel.addEventListener('change', (event) => {
      if (!event.target.matches('[data-fbt-toggle], [data-fbt-variant-select]')) return;
      window.setTimeout(renderOffer, 0);
    });

    document.addEventListener('variant:change', (event) => {
      if (!event.detail?.variant || !event.target.closest('.housious-product-page')) return;
      window.setTimeout(renderOffer, 0);
    });

    const addButton = panel.querySelector('#HousiousAddAllToCartTrigger');
    if (addButton) {
      addButton.addEventListener('click', () => {
        window.setTimeout(syncCartQuantity, 1100);
      });
    }

    const cartCountTarget = document.querySelector('[data-cart-count], .cart-count, .header__cart-count');
    if (cartCountTarget && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        const count = parseInt(cartCountTarget.textContent, 10);
        if (Number.isFinite(count)) {
          currentCartQty = count;
          cartQtyReady = true;
          renderOffer();
        }
      });
      observer.observe(cartCountTarget, { childList: true, characterData: true, subtree: true });
    }

    renderOffer();
    syncCartQuantity();
  }

  function initAll(root) {
    (root || document).querySelectorAll('[data-fbt-panel]').forEach(initPanel);
  }

  document.addEventListener('DOMContentLoaded', () => initAll(document));
  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();