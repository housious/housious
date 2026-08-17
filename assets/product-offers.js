(() => {
  const formatInr = (paise) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format((Number(paise) || 0) / 100);

  const updateOffers = (root, priceInPaise) => {
    root.querySelectorAll('[data-offer-card]').forEach((card) => {
      const discount = Number(card.dataset.discount) || 0;
      const finalPrice = Math.round(priceInPaise * (100 - discount) / 100);
      const saving = Math.max(0, priceInPaise - finalPrice);
      const price = card.querySelector('[data-offer-price]');
      const savingEl = card.querySelector('[data-offer-saving]');
      if (price) price.textContent = formatInr(finalPrice);
      if (savingEl) savingEl.textContent = `Save ${formatInr(saving)}`;
    });
  };

  document.addEventListener('variant:change', (event) => {
    const variant = event.detail?.variant;
    if (!variant) return;
    const price = Number(variant.price);
    if (!Number.isFinite(price)) return;
    const productPage = event.target.closest('.housious-product-page') || document;
    updateOffers(productPage, price);
  });
})();
