

/**
 * HOUSIOUS D2C WISHLIST ENGINE WITH HEADER SYNC
 * Pure Vanilla JS LocalStorage Component
 */
function initWishlistFunctionality() {
  const wishlistBtns = document.querySelectorAll('.card-wishlist-toggle-btn');
  if (!wishlistBtns.length) return;

  let savedWishlist = JSON.parse(localStorage.getItem('housious_wishlist')) || [];

  wishlistBtns.forEach(btn => {
    const productId = btn.getAttribute('data-product-id');
    if (savedWishlist.includes(productId)) {
      btn.classList.add('is-active');
    }
  });

  updateGlobalWishlistCount(savedWishlist.length);
}

function updateGlobalWishlistCount(count) {
  const headerCountElements = document.querySelectorAll('.wishlist-count, [id*="WishlistCount"], .wishlist-icon-badge');
  headerCountElements.forEach(el => {
    el.textContent = count;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initWishlistFunctionality();

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-wishlist-toggle-btn');
    if (!btn) return;

  
    e.preventDefault(); 
    e.stopPropagation(); 

    const productId = btn.getAttribute('data-product-id');
    let savedWishlist = JSON.parse(localStorage.getItem('housious_wishlist')) || [];
    
    if (btn.classList.contains('is-active')) {
      btn.classList.remove('is-active');
      savedWishlist = savedWishlist.filter(id => id !== productId);
    } else {
      btn.classList.add('is-active');
      savedWishlist.push(productId);
    }

    localStorage.setItem('housious_wishlist', JSON.stringify(savedWishlist));
    updateGlobalWishlistCount(savedWishlist.length);
  });
});

window.initWishlistFunctionality = initWishlistFunctionality;