(() => {
  const initQuantityControls = (root = document) => {
    root.querySelectorAll('.housious-product-page').forEach((page) => {
      if (page.dataset.quantityInitialized === 'true') return;
      page.dataset.quantityInitialized = 'true';

      const displayInput = page.querySelector('[data-product-quantity-input]');
      const formInputs = Array.from(page.querySelectorAll('[data-product-form-quantity]'));
      if (!displayInput || formInputs.length === 0) return;

      const normalize = (value) => Math.max(1, parseInt(value, 10) || 1);
      const sync = (value) => {
        const qty = normalize(value);
        displayInput.value = qty;
        formInputs.forEach((formInput) => { formInput.value = qty; });
      };

      page.querySelectorAll('[data-quantity-change]').forEach((button) => {
        button.addEventListener('click', () => {
          const delta = parseInt(button.dataset.quantityChange, 10) || 0;
          sync(normalize(displayInput.value) + delta);
        });
      });

      displayInput.addEventListener('change', () => sync(displayInput.value));
      sync(displayInput.value);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initQuantityControls());
  } else {
    initQuantityControls();
  }

  document.addEventListener('shopify:section:load', (event) => initQuantityControls(event.target));
})();
