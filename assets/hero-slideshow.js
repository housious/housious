document.addEventListener('DOMContentLoaded', function () {

  const heroSlider = document.querySelector('.hero-slider');

  if (!heroSlider || typeof Swiper === 'undefined') return;

  const autoplayEnabled =
    heroSlider.dataset.autoplay === 'true';

  const autoplaySpeed =
    parseInt(heroSlider.dataset.speed || 5000);

  new Swiper('.hero-slider', {
    loop: true,
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 0,

    autoplay: autoplayEnabled
      ? {
          delay: autoplaySpeed,
          disableOnInteraction: false
        }
      : false,

    pagination: {
      el: '.swiper-pagination',
      clickable: true
    },

    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
  });

});