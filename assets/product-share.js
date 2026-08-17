document.addEventListener('DOMContentLoaded', function() {
  const shareBtn = document.getElementById('shareProductBtn');
  
  
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: document.title,
          text: 'Check out this product from Housious!',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    });
  }
});

