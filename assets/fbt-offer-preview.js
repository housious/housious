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
      /* Reference-inspired FBT polish — scoped only to the interactive FBT panel */
      .h-fbt-panel {
        padding: 16px 18px !important;
        border: 1px solid #f2cdb9 !important;
        border-radius: 12px !important;
        background: #fff !important;
        box-shadow: none !important;
      }

      .h-fbt-panel .h-fbt-heading-row {
        margin-bottom: 14px;
        align-items: center;
      }

      .h-fbt-panel .h-fbt-kicker {
        padding: 4px 8px;
        border-radius: 6px;
        background: #fff1e8;
        color: #ff5600;
        font-size: 8px;
        font-weight: 750;
        letter-spacing: .035em;
      }

      .h-fbt-panel .h-fbt-heading-row .fbt-panel-header-title {
        margin-top: 5px;
        font-size: clamp(18px, 1.7vw, 22px) !important;
        font-weight: 600 !important;
        line-height: 1.25;
        letter-spacing: -.015em;
      }

      .h-fbt-panel .h-fbt-selected-count {
        padding: 6px 10px;
        border: 1px solid #eaded7;
        border-radius: 999px;
        background: #fff;
        color: #444;
        font-size: 9px;
        font-weight: 600;
      }

      .h-fbt-panel .h-fbt-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(190px, 225px);
        gap: 20px;
        align-items: start !important;
      }

      .h-fbt-panel .h-fbt-products-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 28px;
        align-items: start;
        min-width: 0;
      }

      .h-fbt-panel .h-fbt-product-card {
        position: relative;
        display: flex;
        height: auto;
        min-height: 0;
        overflow: visible;
        padding: 8px;
        border: 1px solid #eee4de;
        border-radius: 10px;
        background: #fff;
        box-shadow: none !important;
      }

      .h-fbt-panel .h-fbt-product-card.is-selected {
        border-color: #f1d4c5;
        box-shadow: 0 3px 10px rgba(37, 24, 16, .035) !important;
      }

      .h-fbt-panel .h-fbt-product-card:not(.is-selected) {
        opacity: .48;
      }

      .h-fbt-panel .h-fbt-product-card:not(:last-child)::after {
        content: '+';
        position: absolute;
        top: 30%;
        right: -21px;
        z-index: 4;
        display: flex;
        width: 25px;
        height: 25px;
        align-items: center;
        justify-content: center;
        border: 1px solid #f1ded3;
        border-radius: 50%;
        background: #fff8f4;
        color: #ff6a1a;
        font-size: 18px;
        font-weight: 500;
        line-height: 1;
      }

      .h-fbt-panel .h-fbt-check {
        top: 7px;
        left: 7px;
        width: 23px;
        height: 23px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, .05);
      }

      .h-fbt-panel .h-fbt-product-image-link {
        width: 100%;
        aspect-ratio: 1 / .82;
        min-height: 0;
        padding: 0;
        overflow: hidden;
        border-radius: 7px;
        background: #faf8f6;
      }

      .h-fbt-panel .h-fbt-product-image-link img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .h-fbt-panel .h-fbt-product-meta {
        flex: 0 0 auto;
        gap: 5px;
        padding: 9px 2px 1px;
      }

      .h-fbt-panel .h-fbt-product-title {
        min-height: 32px;
        color: #202020;
        font-size: 10.5px;
        font-weight: 600;
        line-height: 1.35;
      }

      .h-fbt-panel .h-fbt-price-row {
        gap: 5px;
        margin-top: 1px;
        font-size: 11px;
      }

      .h-fbt-panel .h-fbt-price-row strong {
        color: #111;
        font-size: 11.5px;
        font-weight: 600 !important;
      }

      .h-fbt-panel .h-fbt-compare-price {
        color: #999;
        font-size: 9px;
      }

      .h-fbt-panel .h-fbt-variant-select,
      .h-fbt-panel .h-fbt-main-variant,
      .h-fbt-panel .h-fbt-single-variant {
        margin-top: 7px;
      }

      .h-fbt-panel .h-fbt-variant-select {
        min-height: 32px;
        padding: 5px 28px 5px 8px;
        border: 1px solid #ded6d1;
        border-radius: 6px;
        color: #333;
        font-size: 9px;
      }

      .h-fbt-panel .h-fbt-main-variant,
      .h-fbt-panel .h-fbt-single-variant {
        display: flex;
        min-height: 32px;
        align-items: center;
        padding: 5px 8px;
        border: 1px solid #ded6d1;
        border-radius: 6px;
        background: #fff;
        color: #555;
        font-size: 9px;
        line-height: 1.25;
      }

      .h-fbt-summary.h-fbt-summary--premium {
        display: flex;
        min-height: 0;
        justify-content: flex-start;
        padding: 5px 0 0 18px;
        border: 0;
        border-left: 1px solid #eee3dc;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

      .h-fbt-summary--premium .h-fbt-summary-label {
        color: #4b4b4b;
        font-size: 11px;
        font-weight: 500;
      }

      .h-fbt-summary--premium .h-fbt-summary-price {
        margin: 4px 0 12px;
        color: #171717;
        font-size: clamp(24px, 2.25vw, 30px);
        font-weight: 600;
        letter-spacing: -.025em;
        line-height: 1.08;
      }

      .h-fbt-offer-preview {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 7px;
        margin-bottom: 12px;
      }

      .h-fbt-offer-pill {
        display: inline-flex;
        width: fit-content;
        max-width: 100%;
        align-items: center;
        padding: 5px 8px;
        border: 1px solid #ffd2bb;
        border-radius: 999px;
        background: #fff3ec;
        color: #e44b00;
        font-size: 8.5px;
        font-weight: 650;
        line-height: 1.2;
      }

      .h-fbt-savings-tag {
        display: inline-flex;
        width: auto;
        max-width: 100%;
        align-items: center;
        gap: 6px;
        padding: 7px 9px;
        border: 1px solid #b8dfbe;
        border-radius: 7px;
        background: #eff9ef;
        color: #176b2b;
        font-size: 9.5px;
        font-weight: 500;
        line-height: 1.3;
      }

      .h-fbt-savings-tag svg {
        width: 14px;
        height: 14px;
        flex: 0 0 14px;
      }

      .h-fbt-savings-tag strong {
        font-weight: 700;
      }

      .h-fbt-unlock-tag {
        display: inline-flex;
        width: auto;
        max-width: 100%;
        align-items: center;
        padding: 7px 9px;
        border: 1px solid #eaded7;
        border-radius: 7px;
        background: #fff9f5;
        color: #66544a;
        font-size: 9px;
        font-weight: 500;
        line-height: 1.3;
      }

      .h-fbt-summary--premium .h-fbt-summary-note,
      .h-fbt-tax-copy,
      .h-fbt-after-offer,
      .h-fbt-trust-row {
        display: none !important;
      }

      .h-fbt-summary--premium .h-fbt-add-btn {
        min-height: 45px;
        margin-top: 0;
        border-radius: 5px;
        box-shadow: none;
        font-size: 11.5px;
        font-weight: 650;
      }

      @media (max-width: 1100px) {
        .h-fbt-panel .h-fbt-layout {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .h-fbt-summary.h-fbt-summary--premium {
          padding: 14px 0 0;
          border-top: 1px solid #eee3dc;
          border-left: 0;
        }
      }

      @media (max-width: 720px) {
        .h-fbt-panel {
          padding: 13px !important;
        }

        .h-fbt-panel .h-fbt-products-grid {
          grid-template-columns: 1fr;
          gap: 9px;
        }

        .h-fbt-panel .h-fbt-product-card {
          display: grid;
          grid-template-columns: 92px minmax(0, 1fr);
          padding: 7px;
        }

        .h-fbt-panel .h-fbt-product-card:not(:last-child)::after {
          display: none;
        }

        .h-fbt-panel .h-fbt-product-image-link {
          grid-column: 1;
          grid-row: 1;
          min-height: 100px;
          aspect-ratio: auto;
        }

        .h-fbt-panel .h-fbt-product-meta {
          grid-column: 2;
          grid-row: 1;
          padding: 2px 2px 2px 9px;
        }

        .h-fbt-panel .h-fbt-product-title {
          min-height: 0;
        }

        .h-fbt-summary--premium .h-fbt-summary-price {
          font-size: 26px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createPreviewMarkup(summary) {
    if (summary.querySelector('[data-fbt-offer-preview]')) return;

    const priceEl = summary.querySelector('[data-fbt-total-price]');
    if (!priceEl) return;

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
        <span>You save <strong data-fbt-save-amount></strong></span>
      </div>
      <div class="h-fbt-unlock-tag" data-fbt-unlock-tag hidden></div>
    `;
    priceEl.insertAdjacentElement('afterend', preview);

    const note = summary.querySelector('.h-fbt-summary-note');
    if (note) note.hidden = true;
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
      const unlockTag = summary.querySelector('[data-fbt-unlock-tag]');

      if (tier && total > 0) {
        const savings = Math.round(total * tier.discount / 100);

        if (pill) {
          pill.hidden = false;
          pill.textContent = `Buy ${tier.tier || tier.minItems} · ${tier.discount}% OFF`;
        }
        if (savingsTag) savingsTag.hidden = false;
        if (saveAmount) saveAmount.textContent = formatMoney(savings);
        if (unlockTag) unlockTag.hidden = true;
      } else {
        if (pill) pill.hidden = true;
        if (savingsTag) savingsTag.hidden = true;

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
    }

    function syncCartQuantity() {
      return fetch('/cart.js', { headers: { Accept: 'application/json' } })
        .then((response) => response.ok ? response.json() : null)
        .then((cart) => {
          if (!cart) return;
          currentCartQty = Number(cart.item_count) || 0;
          renderOffer();
        })
        .catch(() => renderOffer());
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