document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".mobile-gallery-slider");
  const dots = document.querySelectorAll(".gallery-dot");
  const thumbnails = document.querySelectorAll(".thumbnail-item");
  const desktopImage = document.getElementById("HousiousMainImage");

  function setActive(index) {
    thumbnails.forEach(item => {
      item.classList.remove("active");
    });
    dots.forEach(dot => {
      dot.classList.remove("active");
    });

    if (thumbnails[index]) {
      thumbnails[index].classList.add("active");
    }
    if (dots[index]) {
      dots[index].classList.add("active");
    }
  }

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      const imageUrl = thumb.dataset.image;

      // 1. Change image on desktop frame smoothly
      if (desktopImage && window.innerWidth > 767) {
        desktopImage.src = imageUrl;
      }

      // 2. Adjust slider scroll positions on mobile views
      if (slider && window.innerWidth <= 767) {
        const slideWidth = slider.getBoundingClientRect().width;
        slider.scrollTo({
          left: slideWidth * index,
          behavior: "smooth"
        });
      }
      setActive(index);
    });
  });

  // Track user finger touch-swipe and switch dots accordingly
  if (slider) {
    slider.addEventListener("scroll", () => { 
      const slideWidth = slider.getBoundingClientRect().width;
      if (slideWidth > 0) {
        const index = Math.round(slider.scrollLeft / slideWidth);
        setActive(index);
      }
    });
  }

  
});