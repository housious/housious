document.addEventListener('click', function(e) {
  const btn = e.target.closest('.live-add-combo-btn');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const items = JSON.parse(btn.dataset.items || '[]');

  if (window.CartDrawer && typeof window.CartDrawer.addItemsToCart === 'function') {
    window.CartDrawer.addItemsToCart(items);
  }
});