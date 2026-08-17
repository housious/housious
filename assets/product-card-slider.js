(() => {
  const SELECTORS = {
    slider: '[data-product-card-slider]',
    track: '[data-slider-track]',
    slide: '[data-slider-slide]',
    previous: '[data-slider-previous]',
    next: '[data-slider-next]',
    dot: '[data-slider-dot]'
  };

  class ProductCardSlider {
    constructor(slider) {
            this.slider = slider;
            this.track = slider.querySelector(SELECTORS.track);
            this.slides = Array.from(
                slider.querySelectorAll(SELECTORS.slide)
            );
            this.previousButton = slider.querySelector(
                SELECTORS.previous
            );
            this.nextButton = slider.querySelector(
                SELECTORS.next
            );
            this.dots = Array.from(
                slider.querySelectorAll(SELECTORS.dot)
            );

            this.currentIndex = 0;
            this.isDragging = false;
            this.dragStartX = 0;
            this.dragCurrentX = 0;
            this.dragThreshold = 40;
            this.hasDragged = false;

            if (!this.track || this.slides.length === 0) return;

            this.updateSlider();

            if (this.slides.length > 1) {
                this.bindEvents();
            }
    }

    bindEvents() {
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragCurrentX = 0;
        this.dragThreshold = 40;

        this.previousButton?.addEventListener('click', (event) => {
            this.stopProductLink(event);
            this.showPrevious();
        });

        this.nextButton?.addEventListener('click', (event) => {
            this.stopProductLink(event);
            this.showNext();
        });

        this.dots.forEach((dot) => {
            dot.addEventListener('click', (event) => {
            this.stopProductLink(event);

            const requestedIndex = Number.parseInt(
                dot.dataset.sliderDot,
                10
            );

            if (Number.isInteger(requestedIndex)) {
                this.goToSlide(requestedIndex);
            }
            });
        });

        this.slider.addEventListener(
            'pointerdown',
            this.handlePointerDown.bind(this)
        );

        this.slider.addEventListener(
            'pointermove',
            this.handlePointerMove.bind(this)
        );

        this.slider.addEventListener(
            'pointerup',
            this.handlePointerUp.bind(this)
        );

        this.slider.addEventListener(
            'pointercancel',
            this.handlePointerUp.bind(this)
        );

        this.slider.addEventListener(
            'lostpointercapture',
            this.handlePointerUp.bind(this)
        );

        this.slider.addEventListener('dragstart', (event) => {
            event.preventDefault();
        });

        const productLink = this.slider.closest('.product-card-link');

        productLink?.addEventListener('click', (event) => {
        if (!this.hasDragged) return;

        event.preventDefault();
        event.stopPropagation();
        this.hasDragged = false;
        });
    }

    handlePointerDown(event) {
        if (
            event.target.closest(
            '[data-slider-previous], [data-slider-next], [data-slider-dot]'
            )
        ) {
            return;
        }

        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragCurrentX = event.clientX;

        this.slider.classList.add('is-dragging');
        this.slider.setPointerCapture(event.pointerId);

        this.track.style.transition = 'none';
        }

        handlePointerMove(event) {
            if (!this.isDragging) return;

            this.dragCurrentX = event.clientX;

            const dragDistance = this.dragCurrentX - this.dragStartX;
            const sliderWidth = this.slider.clientWidth;

            if (!sliderWidth) return;

            const baseTranslate = this.currentIndex * -100;
            const dragPercentage = (dragDistance / sliderWidth) * 100;

            this.track.style.transform =
                `translate3d(${baseTranslate + dragPercentage}%, 0, 0)`;


            if (Math.abs(dragDistance) > 5) {
                this.hasDragged = true;
            }
        }

        handlePointerUp(event) {
        if (!this.isDragging) return;

        const dragDistance = this.dragCurrentX - this.dragStartX;

        this.isDragging = false;
        this.slider.classList.remove('is-dragging');

        if (
            event.pointerId !== undefined &&
            this.slider.hasPointerCapture(event.pointerId)
        ) {
            this.slider.releasePointerCapture(event.pointerId);
        }

        this.track.style.transition = '';

        if (Math.abs(dragDistance) >= this.dragThreshold) {
            if (dragDistance < 0) {
            this.showNext();
            } else {
            this.showPrevious();
            }
        } else {
            this.updateSlider();
        }

        this.dragStartX = 0;
        this.dragCurrentX = 0;
        }

    stopProductLink(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    showPrevious() {
      const previousIndex =
        (this.currentIndex - 1 + this.slides.length) %
        this.slides.length;

      this.goToSlide(previousIndex);
    }

    showNext() {
      const nextIndex =
        (this.currentIndex + 1) % this.slides.length;

      this.goToSlide(nextIndex);
    }

    goToSlide(index) {
      if (index < 0 || index >= this.slides.length) return;

      this.currentIndex = index;
      this.updateSlider();
    }

    updateSlider() {
      this.track.style.transform =
        `translate3d(-${this.currentIndex * 100}%, 0, 0)`;

      this.slides.forEach((slide, index) => {
        slide.setAttribute(
          'aria-hidden',
          index === this.currentIndex ? 'false' : 'true'
        );
      });

      this.dots.forEach((dot, index) => {
        const isActive = index === this.currentIndex;

        dot.classList.toggle('is-active', isActive);
        dot.setAttribute(
          'aria-current',
          isActive ? 'true' : 'false'
        );
      });
    }

    handleSwipe() {
      const swipeDistance = this.touchStartX - this.touchEndX;
      const minimumSwipeDistance = 40;

      if (Math.abs(swipeDistance) < minimumSwipeDistance) return;

      if (swipeDistance > 0) {
        this.showNext();
      } else {
        this.showPrevious();
      }
    }
  }

  const initializeProductCardSliders = (container = document) => {
    container
      .querySelectorAll(SELECTORS.slider)
      .forEach((slider) => {
        if (slider.dataset.sliderInitialized === 'true') return;

        slider.dataset.sliderInitialized = 'true';
        new ProductCardSlider(slider);
      });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initializeProductCardSliders();
  });

  document.addEventListener('shopify:section:load', (event) => {
    initializeProductCardSliders(event.target);
  });

  document.addEventListener('housious:product-grid-updated', (event) => {
    initializeProductCardSliders(event.detail?.container || document);
  });
})();