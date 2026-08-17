/**
 * cart-drawer.js
 * Include in theme.liquid:
 *   <script src="{{ 'cart-drawer.js' | asset_url }}" defer></script>
 *
 * IMPORTANT: Your header cart icon link must have a `data-cart-toggle`
 * attribute so this script only intercepts that exact element, e.g.:
 *   <a href="{{ routes.cart_url }}" class="icon-box cart-box" data-cart-toggle>
 *
 * ─── STEAL DEALS SETUP ───────────────────────────────────────────
 * 1. In Shopify Admin → Products → Collections → Create collection
 *    Handle must be: steal-deals  (or change STEAL_DEAL_COLLECTION below)
 * 2. Add any products you want shown as upsells to that collection
 * 3. Set compare-at prices on those products to show the % badge
 *
 * ─── DISCOUNT CODES SETUP ────────────────────────────────────────
 * In Shopify Admin → Discounts → Create discount code for each tier:
 *   BUY2GET5   → 5% off  (min 2 items)
 *   BUY3GET10  → 10% off (min 3 items)
 *   BUY4GET15  → 15% off (min 4 items)
 * Or change the code strings in the TIER_DISCOUNTS config below.
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     CONFIG — driven by window.__cartDrawerConfig injected by
     snippets/cart-drawer.liquid from theme settings.
     Merchants change everything in Shopify Customizer →
     Theme Settings → Cart Drawer. No JS edits needed.
  ═══════════════════════════════════════════════════════════════ */
  const _cfg = window.__cartDrawerConfig || {};

  // Collection handle selected in Shopify Customizer
  const STEAL_DEAL_COLLECTION = _cfg.stealDealHandle || '';
  const STEAL_DEAL_LIMIT      = 6;

  // Tier discounts — percentages, codes and min-qty from theme settings
  const TIER_DISCOUNTS = _cfg.tierDiscounts || [
    { minItems: 4, discount: 15, label: 'Flat 15% Off', code: 'BUY4GET15', tier: 4 },
    { minItems: 3, discount: 10, label: 'Flat 10% Off', code: 'BUY3GET10', tier: 3 },
    { minItems: 2, discount: 5,  label: 'Flat 5% Off',  code: 'BUY2GET5',  tier: 2 },
  ];

  /* ═══════════════════════════════════════════════════════════════
     DOM REFS
  ═══════════════════════════════════════════════════════════════ */
  const drawer           = document.getElementById('cart-drawer');
  const overlay          = document.getElementById('cart-drawer-overlay');
  const closeBtn         = document.getElementById('cart-drawer-close');
  const itemsContainer   = document.getElementById('cart-drawer-items');
  const emptyState       = document.getElementById('cart-drawer-empty');
  const footer           = document.getElementById('cart-drawer-footer');
  const subtotalEl       = document.getElementById('cart-subtotal-value');
  const stealDealsWrap   = document.getElementById('cart-steal-deals');
  const stealOfferBar    = document.getElementById('cart-steal-offer-bar');
  const stealOfferText   = document.getElementById('cart-steal-offer-text');
  const stealApplyBtn    = document.getElementById('cart-steal-apply-btn');
  const stealProducts    = document.getElementById('cart-steal-products');
  const continueShopping = document.getElementById('cart-continue-shopping');
  const itemTemplate     = document.getElementById('cart-item-template');
  const dealTemplate     = document.getElementById('steal-deal-template');

  if (!drawer || !overlay) {
    console.warn('[CartDrawer] Required elements not found in DOM. Aborting init.');
    return;
  }

  /* ═══════════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════════ */
  let cartData       = null;
  let isBusy         = false;
  let dealsFetched   = false;   // fetch once per drawer open, not on every cart update
  let currentTier    = null;    // currently active discount tier

  /* ═══════════════════════════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════════════════════════ */
  function formatMoney(cents) {
    return '₹ ' + Math.round(cents / 100).toLocaleString('en-IN');
  }

  /** Shopify CDN image resizer — appends _<size>x to filename */
  function resizeImage(src, size = '160x200') {
    if (!src) return '';
    return src.replace(/(\.[^.?]+)(\?.*)?$/, `_${size}$1$2`);
  }

  function showLoader() {
    let loader = drawer.querySelector('.cart-drawer__loading');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'cart-drawer__loading';
      loader.innerHTML = '<div class="cart-drawer__spinner"></div>';
      drawer.appendChild(loader);
    }
    loader.classList.add('is-visible');
  }

  function hideLoader() {
    const loader = drawer.querySelector('.cart-drawer__loading');
    if (loader) loader.classList.remove('is-visible');
  }

  /* ═══════════════════════════════════════════════════════════════
     OPEN / CLOSE
  ═══════════════════════════════════════════════════════════════ */
  function openDrawer(options = {}) {
    const shouldRefresh = options.refresh !== false;
    dealsFetched = false; // re-fetch deals on each open so list stays fresh
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    if (shouldRefresh) fetchCart();
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  /* ═══════════════════════════════════════════════════════════════
     FETCH CART  — Shopify AJAX API /cart.js
  ═══════════════════════════════════════════════════════════════ */
  async function fetchCart() {
    try {
      showLoader();
      const res = await fetch('/cart.js');
      cartData  = await res.json();
      renderCart(cartData);
    } catch (err) {
      console.error('[CartDrawer] fetchCart:', err);
    } finally {
      hideLoader();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER CART ITEMS
  ═══════════════════════════════════════════════════════════════ */
  function renderCart(cart) {
    itemsContainer.innerHTML = '';

    const hasItems = cart.items && cart.items.length > 0;
    const totalQty = hasItems ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0;

    emptyState.style.display  = hasItems ? 'none' : 'flex';
    footer.style.display      = hasItems ? 'block' : 'none';

    if (!hasItems) {
      stealDealsWrap.style.display = 'none';
      updateTierBanner(0);
      return;
    }

    /* — render each line item — */
    cart.items.forEach((item, index) => {
      const node = itemTemplate.content.cloneNode(true);
      const el   = node.querySelector('.cart-item');

      el.dataset.lineIndex = index + 1;
      el.dataset.variantId = item.variant_id;

      /* image */
      const img = el.querySelector('.cart-item__image');
      img.src   = resizeImage(item.image, '160x200');
      img.alt   = item.title;

      /* title */
      el.querySelector('.cart-item__title').textContent = item.product_title || item.title;

      /* per-unit price */
      el.querySelector('.cart-item__price').textContent = formatMoney(item.final_price);

      /* quantity */
      const qtyEl = el.querySelector('.cart-item__qty-value');
      qtyEl.textContent = item.quantity;

      /* — qty controls — */
      el.querySelector('.cart-item__qty-minus').addEventListener('click', () => {
        if (isBusy) return;
        updateItem(index + 1, item.quantity - 1);
      });
      el.querySelector('.cart-item__qty-plus').addEventListener('click', () => {
        if (isBusy) return;
        updateItem(index + 1, item.quantity + 1);
      });
      el.querySelector('.cart-item__remove').addEventListener('click', () => {
        if (isBusy) return;
        updateItem(index + 1, 0);
      });

      itemsContainer.appendChild(node);
    });

    /* subtotal */
    subtotalEl.textContent = formatMoney(cart.total_price);

    /* tier banner + steal deals visibility */
    updateTierBanner(totalQty);

    /* fetch steal deals once per drawer open */
    if (STEAL_DEAL_COLLECTION && !dealsFetched) {
      dealsFetched = true;
      fetchStealDeals(cart.items.map(i => i.product_id));
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     TIER BANNER — updates dynamically as qty changes
  ═══════════════════════════════════════════════════════════════ */
  function updateTierBanner(totalQty) {
    /* highlight active tier icon */
    document.querySelectorAll('.cart-tier__item').forEach(el => el.classList.remove('is-active'));
    currentTier = TIER_DISCOUNTS.find(t => totalQty >= t.minItems) || null;

    if (currentTier) {
      const activeEl = document.querySelector(`.cart-tier__item[data-tier="${currentTier.tier}"]`);
      if (activeEl) activeEl.classList.add('is-active');
    }

    /* banner message — find the NEXT tier the user hasn't unlocked yet */
    const tiersAsc  = [...TIER_DISCOUNTS].reverse(); // [2-item, 3-item, 4-item]
    const nextTier  = tiersAsc.find(t => totalQty < t.minItems);
    const msgEl     = document.getElementById('cart-tier-message');

    if (msgEl) {
      if (!nextTier) {
        /* all tiers unlocked */
        msgEl.innerHTML = `🎉 You've unlocked the max discount of <strong>${TIER_DISCOUNTS[0].discount}% off!</strong>`;
      } else {
        const needed = nextTier.minItems - totalQty;
        msgEl.innerHTML = `🎁 Add <strong>${needed}</strong> more item${needed > 1 ? 's' : ''} to unlock <strong>${nextTier.discount}% off</strong>`;
      }
    }

    /* steal deals offer bar */
    if (currentTier) {
      if (stealOfferText) stealOfferText.textContent = `Offer Unlocked! ${currentTier.label}`;
      stealDealsWrap.style.display = 'block';
      if (stealApplyBtn) {
        stealApplyBtn.style.display  = 'inline-block';
        // Reset apply button appearance (tier may have changed)
        stealApplyBtn.textContent      = 'Apply';
        stealApplyBtn.style.background = '';
        stealApplyBtn.style.color      = '';
      }
    } else {
      stealDealsWrap.style.display = 'none';
    }

    // Keep discount input in sync with current tier automatically
    autoApplyCurrentTierDiscount();
  }

  /* ═══════════════════════════════════════════════════════════════
     FETCH STEAL DEALS
     Uses Shopify's /collections/<handle>/products.json
     Products in that collection drive this section entirely.
     Pass in cartProductIds to filter out already-in-cart items.
  ═══════════════════════════════════════════════════════════════ */
  async function fetchStealDeals(cartProductIds = []) {
    if (!STEAL_DEAL_COLLECTION) return;
    stealProducts.innerHTML = '<div class="steal-deals-loading">Loading deals…</div>';

    try {
      /* fetch more than needed so we have room to filter */
      const res  = await fetch(
        `/collections/${STEAL_DEAL_COLLECTION}/products.json?limit=${STEAL_DEAL_LIMIT + cartProductIds.length}`
      );

      if (!res.ok) throw new Error(`Collection "${STEAL_DEAL_COLLECTION}" not found (${res.status})`);

      const data     = await res.json();
      const products = (data.products || [])
        /* filter out products already in cart */
        .filter(p => !cartProductIds.includes(p.id))
        .slice(0, STEAL_DEAL_LIMIT);

      renderStealDeals(products);
    } catch (err) {
      console.error('[CartDrawer] fetchStealDeals:', err);
      stealProducts.innerHTML = '<p class="steal-deals-error">Could not load deals.</p>';
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER STEAL DEAL CARDS
  ═══════════════════════════════════════════════════════════════ */
  function renderStealDeals(products) {
    stealProducts.innerHTML = '';

    if (!products.length) {
      stealProducts.innerHTML = '<p class="steal-deals-empty">No deals available right now.</p>';
      return;
    }

    products.forEach(product => {
      /* use first available variant */
      const variant = product.variants.find(v => v.available) || product.variants[0];
      if (!variant) return;

      const node = dealTemplate.content.cloneNode(true);
      const card = node.querySelector('.steal-deal-card');

      /* image — use Shopify's CDN resize */
      const img = card.querySelector('.steal-deal-card__img');
      img.src   = product.images[0] ? resizeImage(product.images[0].src, '200x250') : '';
      img.alt   = product.title;

      /* title */
      card.querySelector('.steal-deal-card__title').textContent = product.title;

      /* prices
         products.json returns prices as strings like "1999.00"
         multiply by 100 → pass to formatMoney which divides by 100 */
      const priceCents      = Math.round(parseFloat(variant.price) * 100);
      const compareAtCents  = variant.compare_at_price
        ? Math.round(parseFloat(variant.compare_at_price) * 100)
        : 0;

      card.querySelector('.steal-deal-card__sale-price').textContent = formatMoney(priceCents);

      if (compareAtCents && compareAtCents > priceCents) {
        card.querySelector('.steal-deal-card__original-price').textContent = formatMoney(compareAtCents);
        const pct = Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
        card.querySelector('.steal-deal-card__discount-badge').textContent = `-${pct}%`;
      } else {
        const origPriceEl = card.querySelector('.steal-deal-card__original-price');
        const badgeEl      = card.querySelector('.steal-deal-card__discount-badge');
        if (origPriceEl) origPriceEl.style.display = 'none';
        if (badgeEl) badgeEl.style.display = 'none';
      }

      /* add-to-cart button on the deal card */
      const addBtn = card.querySelector('.steal-deal-card__add-btn');
      addBtn.dataset.variantId = variant.id;
      addBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (isBusy) return;
        addBtn.disabled = true;
        addBtn.innerHTML = '<div class="steal-deal-card__spinner"></div>';
        await addToCart(variant.id, 1);
        addBtn.disabled = false;
        addBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="21" r="1" fill="white"/>
          <circle cx="20" cy="21" r="1" fill="white"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      });

      stealProducts.appendChild(node);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     UPDATE CART LINE  — /cart/change.js
  ═══════════════════════════════════════════════════════════════ */
  async function updateItem(line, quantity) {
    isBusy = true;
    showLoader();
    try {
      const res = await fetch('/cart/change.js', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ line, quantity }),
      });
      cartData = await res.json();
      renderCart(cartData);
      updateCartIconCount(cartData.item_count);
    } catch (err) {
      console.error('[CartDrawer] updateItem:', err);
    } finally {
      isBusy = false;
      hideLoader();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     HOUSIOUS PREMIUM ADD-TO-CART FEEDBACK
     Brand direction: calm, premium, useful — never flashy.
     - Immediate tactile button response
     - Product page gets a dedicated inline confirmation
     - Product thumbnail glides toward the header cart on a soft arc
     - Cart badge updates immediately and receives a restrained halo
     - Drawer opens only after the confirmation has had time to register
  ═══════════════════════════════════════════════════════════════ */
  const buttonState = new WeakMap();

  function getCartIconCount() {
    const values = Array.from(document.querySelectorAll('.cart-count, [data-cart-count]'))
      .map((el) => parseInt(el.textContent, 10))
      .filter(Number.isFinite);
    return values.length ? Math.max(...values) : 0;
  }

  function ensureCartCountElements() {
    document.querySelectorAll('[data-cart-toggle]').forEach((trigger) => {
      const wrap = trigger.querySelector('.cart-icon-wrap') || trigger;
      if (wrap.querySelector('.cart-count, [data-cart-count]')) return;

      const badge = document.createElement('span');
      badge.className = 'cart-count';
      badge.setAttribute('data-cart-count', '');
      badge.setAttribute('aria-live', 'polite');
      badge.setAttribute('aria-atomic', 'true');
      badge.hidden = true;
      badge.textContent = '0';
      wrap.appendChild(badge);
    });
  }

  function getAtcContext(form, button) {
    if (
      form?.dataset?.atcContext === 'product' ||
      form?.closest('.housious-product-page') ||
      button?.classList?.contains('btn-add-to-cart')
    ) return 'product';

    return 'card';
  }

  function setAddButtonState(button, state, context = 'card') {
    if (!button) return;

    if (!buttonState.has(button)) {
      buttonState.set(button, {
        html: button.innerHTML,
        disabled: button.disabled,
      });
    }

    const original = buttonState.get(button);
    button.classList.remove('is-atc-loading', 'is-atc-success', 'is-atc-error');

    if (state === 'loading') {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.classList.add('is-atc-loading');
      button.innerHTML = '<span class="atc-feedback-spinner" aria-hidden="true"></span><span>Adding to cart</span>';
      return;
    }

    if (state === 'success') {
      button.disabled = true;
      button.removeAttribute('aria-busy');
      button.classList.add('is-atc-success');
      button.innerHTML = '<span class="atc-feedback-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M5 12.5l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Added to cart</span>';
      const hold = context === 'product' ? 1650 : 1200;
      window.setTimeout(() => setAddButtonState(button, 'reset', context), hold);
      return;
    }

    if (state === 'error') {
      button.removeAttribute('aria-busy');
      button.classList.add('is-atc-error');
      window.setTimeout(() => setAddButtonState(button, 'reset', context), 850);
      return;
    }

    button.innerHTML = original.html;
    button.disabled = original.disabled;
    button.removeAttribute('aria-busy');
    button.classList.remove('is-atc-loading', 'is-atc-success', 'is-atc-error');
    buttonState.delete(button);
  }

  function findSourceImage(form) {
    const page = form?.closest('.housious-product-page');
    if (page) {
      const mobileImage = Array.from(page.querySelectorAll('.mobile-slide img')).find((img) => {
        const rect = img.getBoundingClientRect();
        const style = window.getComputedStyle(img);
        return rect.width > 40 && rect.height > 40 && style.display !== 'none' && style.visibility !== 'hidden';
      });
      if (mobileImage) return mobileImage;

      const mainImage = page.querySelector('[data-main-product-image]');
      if (mainImage) {
        const rect = mainImage.getBoundingClientRect();
        const style = window.getComputedStyle(mainImage);
        if (rect.width > 40 && rect.height > 40 && style.display !== 'none' && style.visibility !== 'hidden') return mainImage;
      }
    }

    const scope = form?.closest('.product-item-card, .deal-product-card, .live-product-card') || form?.parentElement || document;
    const candidates = scope.querySelectorAll([
      '.product-card-media-slide[aria-hidden="false"] img',
      '.product-card-media-image',
      'img'
    ].join(','));

    return Array.from(candidates).find((img) => {
      const rect = img.getBoundingClientRect();
      const style = window.getComputedStyle(img);
      return rect.width > 20 && rect.height > 20 && style.display !== 'none' && style.visibility !== 'hidden';
    }) || null;
  }

  function getVisibleCartTarget() {
    const targets = Array.from(document.querySelectorAll('[data-cart-toggle]'));
    return targets.find((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }) || targets[0] || null;
  }

  function addProductPageAura(form) {
    const page = form?.closest('.housious-product-page');
    if (!page) return;
    page.classList.remove('is-atc-confirmed');
    void page.offsetWidth;
    page.classList.add('is-atc-confirmed');
    window.setTimeout(() => page.classList.remove('is-atc-confirmed'), 1500);
  }

  function animateProductToCart(form, context = 'card') {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const image = findSourceImage(form);
    const target = getVisibleCartTarget();
    if (!image || !target || typeof image.animate !== 'function') return;

    const imageRect = image.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const size = context === 'product'
      ? Math.max(66, Math.min(86, imageRect.width * .22, imageRect.height * .22))
      : Math.max(48, Math.min(66, imageRect.width * .34, imageRect.height * .34));

    const startLeft = imageRect.left + (imageRect.width - size) / 2;
    const startTop = imageRect.top + (imageRect.height - size) / 2;
    const targetX = targetRect.left + targetRect.width / 2 - (startLeft + size / 2);
    const targetY = targetRect.top + targetRect.height / 2 - (startTop + size / 2);

    const flyingImage = image.cloneNode(true);
    flyingImage.removeAttribute('srcset');
    flyingImage.removeAttribute('sizes');
    flyingImage.setAttribute('aria-hidden', 'true');
    Object.assign(flyingImage.style, {
      position: 'fixed',
      left: `${startLeft}px`,
      top: `${startTop}px`,
      width: `${size}px`,
      height: `${size}px`,
      objectFit: 'cover',
      borderRadius: context === 'product' ? '18px' : '14px',
      pointerEvents: 'none',
      zIndex: '10050',
      margin: '0',
      background: '#ffffff',
      border: '2px solid rgba(242,140,40,.72)',
      boxShadow: '0 18px 44px rgba(17,17,17,.18), 0 0 0 6px rgba(250,246,239,.92)',
      willChange: 'transform, opacity',
    });
    document.body.appendChild(flyingImage);

    const duration = context === 'product' ? 1080 : 860;
    const animation = flyingImage.animate([
      { transform: 'translate3d(0,0,0) scale(.90)', opacity: 0, offset: 0 },
      { transform: 'translate3d(0,-6px,0) scale(1.03)', opacity: 1, offset: .14 },
      { transform: `translate3d(${targetX * .46}px,${targetY * .30 - 22}px,0) scale(.86)`, opacity: 1, offset: .55 },
      { transform: `translate3d(${targetX}px,${targetY}px,0) scale(.28)`, opacity: .08, offset: 1 },
    ], {
      duration,
      easing: 'cubic-bezier(.22,.72,.18,1)',
      fill: 'forwards',
    });

    animation.onfinish = () => flyingImage.remove();
    animation.oncancel = () => flyingImage.remove();
  }

  function pulseCartIcon() {
    ensureCartCountElements();
    document.querySelectorAll('[data-cart-toggle]').forEach((trigger) => {
      trigger.classList.remove('cart-added-pulse');
      void trigger.offsetWidth;
      trigger.classList.add('cart-added-pulse');
      window.setTimeout(() => trigger.classList.remove('cart-added-pulse'), 1050);
    });

    document.querySelectorAll('.cart-count, [data-cart-count]').forEach((badge) => {
      badge.classList.remove('cart-count--bump');
      void badge.offsetWidth;
      badge.classList.add('cart-count--bump');
      window.setTimeout(() => badge.classList.remove('cart-count--bump'), 1050);
    });
  }

  function showProductPageStatus(form) {
    const page = form?.closest('.housious-product-page');
    const status = page?.querySelector('[data-pdp-atc-status]');
    if (!status) return;

    window.clearTimeout(showProductPageStatus._timer);
    status.classList.remove('is-visible');
    status.setAttribute('aria-hidden', 'false');
    void status.offsetWidth;
    status.classList.add('is-visible');
    showProductPageStatus._timer = window.setTimeout(() => {
      status.classList.remove('is-visible');
      status.setAttribute('aria-hidden', 'true');
    }, 2600);
  }

  function showAddToCartToast(context = 'card') {
    let toast = document.getElementById('housious-atc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'housious-atc-toast';
      toast.className = 'housious-atc-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    const subcopy = context === 'product' ? 'Your selection is now in the cart' : 'Cart updated successfully';
    toast.innerHTML = '<span class="housious-atc-toast__check" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M5 12.5l4 4L19 7" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span><strong>Added to cart</strong><small>' + subcopy + '</small></span>';

    window.clearTimeout(showAddToCartToast._timer);
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    showAddToCartToast._timer = window.setTimeout(() => toast.classList.remove('is-visible'), context === 'product' ? 2700 : 2200);
  }

  function playPremiumAtcSuccess(form, button) {
    const context = getAtcContext(form, button);
    addProductPageAura(form);
    animateProductToCart(form, context);
    pulseCartIcon();
    if (context === 'product') {
      showProductPageStatus(form);
    } else {
      showAddToCartToast(context);
    }
    setAddButtonState(button, 'success', context);
    return context;
  }

  function shouldAutoOpenDrawer() {
    const settings = window.themeCartSettings || {};
    if (settings.cartType === 'page') return false;
    return settings.autoOpen !== false;
  }

  /* ═══════════════════════════════════════════════════════════════
     ADD TO CART  — /cart/add.js
  ═══════════════════════════════════════════════════════════════ */
  async function addToCart(variantId, quantity = 1, context = {}) {
    if (isBusy) return;

    const button = context.button || null;
    const form = context.form || button?.closest('[data-type="add-to-cart-form"]') || null;

    const contextType = getAtcContext(form, button);
    isBusy = true;
    setAddButtonState(button, 'loading', contextType);

    try {
      const res = await fetch('/cart/add.js', {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body   : JSON.stringify({ id: variantId, quantity }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.description || 'Add to cart failed');
      }

      await res.json();

      // Shopify has confirmed the add. Update the visible badge immediately
      // while /cart.js is fetched in the background for the authoritative cart.
      ensureCartCountElements();
      updateCartIconCount(getCartIconCount() + quantity);
      const effectContext = playPremiumAtcSuccess(form, button);

      dealsFetched = false;
      showLoader();

      const cartRefresh = fetchCart();

      if (shouldAutoOpenDrawer()) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const delay = reduced ? 0 : (effectContext === 'product' ? 1180 : 900);
        window.setTimeout(() => openDrawer({ refresh: false }), delay);
      }

      await cartRefresh;
      updateCartIconCount(cartData?.item_count || 0);

    } catch (err) {
      console.error('[CartDrawer] addToCart:', err);
      setAddButtonState(button, 'error', contextType);
      alert(err.message || 'Could not add item to cart.');
    } finally {
      isBusy = false;
      hideLoader();
    }
  }

  async function addItemsToCart(items = []) {
    if (!items.length || isBusy) return;

    isBusy = true;
    showLoader();

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.description || 'Add to cart failed');
      }

      dealsFetched = false;
      await fetchCart();
      updateCartIconCount(cartData?.item_count || 0);
      openDrawer();

    } catch (err) {
      console.error('[CartDrawer] addItemsToCart:', err);
      alert(err.message || 'Could not add items to cart.');
    } finally {
      isBusy = false;
      hideLoader();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     APPLY DISCOUNT
     Injects a hidden "discount" input into the checkout form so the
     code is submitted with the POST to /checkout.
     Make sure these codes exist in Shopify Admin → Discounts.
  ═══════════════════════════════════════════════════════════════ */
  function applyDiscountToForm(code) {
    const form = document.getElementById('cart-drawer-checkout-form');
    if (!form) return;
    // Remove any previously injected discount input
    const existing = form.querySelector('input[name="discount"]');
    if (existing) existing.remove();

    if (code) {
      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = 'discount';
      input.value = code;
      form.appendChild(input);

      // Visual feedback on the apply button
      if (stealApplyBtn) {
        stealApplyBtn.textContent      = '✓ Applied';
        stealApplyBtn.style.background = '#2d8a4e';
        stealApplyBtn.style.color      = '#fff';
      }
    }
  }

  if (stealApplyBtn) {
    stealApplyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentTier) return;
      applyDiscountToForm(currentTier.code);
    });
  }

  // Auto-apply discount whenever tier changes so it's always up to date
  // when merchant clicks Place Order without clicking Apply manually
  function autoApplyCurrentTierDiscount() {
    if (currentTier) {
      applyDiscountToForm(currentTier.code);
    } else {
      // Remove discount if no tier active
      const form = document.getElementById('cart-drawer-checkout-form');
      const existing = form && form.querySelector('input[name="discount"]');
      if (existing) existing.remove();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     CART ICON COUNT — update header bubble
  ═══════════════════════════════════════════════════════════════ */
  function updateCartIconCount(count) {
    const safeCount = Math.max(0, parseInt(count, 10) || 0);
    ensureCartCountElements();

    [
      '.cart-count',
      '.header__cart-count',
      '[data-cart-count]',
      '#cart-count',
      '.cart-item-count',
      '.cart-link__bubble-num',
    ].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.textContent = safeCount;
        el.hidden = safeCount <= 0;
        if (safeCount > 0) el.style.removeProperty('display');
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     BIND ADD-TO-CART FORMS (product cards)
  ═══════════════════════════════════════════════════════════════ */
  function isAjaxAddForm(form) {
    if (!form || form.classList.contains('checkout-form')) return false;
    if (form.matches('[data-type="add-to-cart-form"]')) return true;
    if (!form.matches('form[action*="/cart/add"]')) return false;
    return Boolean(form.closest('.housious-product-page, .product-item-card, .product-card-action-form, .deal-product-card, .live-product-card'));
  }

  function bindAddToCartForms() {
    /* Primary path: catch every Housious add-to-cart form, including PDP. */
    document.addEventListener('submit', async (e) => {
      const form = e.target.closest('form');
      if (!isAjaxAddForm(form)) return;
      e.preventDefault();
      if (isBusy) return;
      const variantId = parseInt(form.querySelector('input[name="id"], select[name="id"]')?.value, 10);
      const quantity  = parseInt(form.querySelector('input[name="quantity"]')?.value, 10) || 1;
      if (variantId) await addToCart(variantId, quantity, { form, button: e.submitter || form.querySelector('button[name="add"]') });
    });

    /* Fallback path: some Shopify/app scripts suppress the native submit event. */
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[name="add"].btn-add-to-cart, button[name="add"].card-add-to-cart-btn');
      if (!btn) return;
      const form = btn.closest('form');
      if (!isAjaxAddForm(form)) return;
      e.preventDefault();
      if (isBusy) return;
      const variantId = parseInt(form.querySelector('input[name="id"], select[name="id"]')?.value, 10);
      const quantity  = parseInt(form.querySelector('input[name="quantity"]')?.value, 10) || 1;
      if (variantId) await addToCart(variantId, quantity, { form, button: btn });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     EVENT LISTENERS
  ═══════════════════════════════════════════════════════════════ */
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDrawer();
    });
  }

  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    closeDrawer();
  });

  if (continueShopping) {
    continueShopping.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDrawer();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  /* ─────────────────────────────────────────────────────────────
     OPEN DRAWER TRIGGER
     Scoped strictly to elements with [data-cart-toggle] so this
     never accidentally matches nav menu links, mega menu items,
     or other unrelated anchors that might resolve to /cart.

     Make sure your header cart link has this attribute, e.g.:
       <a href="{{ routes.cart_url }}" class="icon-box cart-box" data-cart-toggle>
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-cart-toggle]');
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    openDrawer();
  });

  /* ═══════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════ */
  ensureCartCountElements();
  bindAddToCartForms();

  // Keep the header badge accurate even when the page is restored from cache.
  fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
    .then((res) => res.ok ? res.json() : null)
    .then((cart) => { if (cart) updateCartIconCount(cart.item_count); })
    .catch(() => {});

  /* global API for other scripts */
  window.CartDrawer = { open: openDrawer, close: closeDrawer, addToCart, addItemsToCart, fetchCart };

})();