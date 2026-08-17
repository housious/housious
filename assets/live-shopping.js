document.addEventListener('DOMContentLoaded', () => {
  const liveSection = document.querySelector('.live-shopping-container');
  if (!liveSection) return;

  // Add live-shopping products to cart without simulating engagement data.
  liveSection.querySelectorAll('.add-to-cart-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const targetButton = event.currentTarget;
      const variantId = targetButton.dataset.id;
      if (!variantId) return;

      targetButton.disabled = true;
      try {
        const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
        });

        if (!response.ok) throw new Error('Unable to add product to cart.');
        await response.json();
        document.dispatchEvent(new CustomEvent('cart:refresh'));
      } catch (error) {
        console.error('Live shopping add-to-cart error:', error);
      } finally {
        targetButton.disabled = false;
      }
    });
  });

  liveSection.querySelectorAll('.tab-btn').forEach((tab) => {
    tab.addEventListener('click', () => {
      liveSection.querySelectorAll('.tab-btn').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  const likeButton = liveSection.querySelector('#likeBtn');
  const videoContainer = liveSection.querySelector('.video-container');

  const createFloatingHeart = () => {
    if (!videoContainer) return;

    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerHTML = `
      <svg viewBox="0 0 64 64" class="heart-svg" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="30" fill="#ff3b5c"/>
        <path fill="#fff" d="M32 45s-11-7.5-11-16.5c0-4.2 2.9-7.5 6.8-7.5 2.2 0 3.7 1.2 4.2 2.8.5-1.6 2-2.8 4.2-2.8 3.9 0 6.8 3.3 6.8 7.5C43 37.5 32 45 32 45z"/>
      </svg>`;
    heart.style.right = `${Math.random() * 40 + 15}px`;
    heart.style.animationDuration = `${Math.random() * 1.5 + 2.5}s`;
    heart.style.transform = `scale(${0.8 + Math.random() * 0.5})`;
    videoContainer.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  };

  if (likeButton) {
    likeButton.addEventListener('click', () => {
      const svg = likeButton.querySelector('svg');
      if (svg) svg.classList.toggle('liked');
      createFloatingHeart();
    });
  }
});
