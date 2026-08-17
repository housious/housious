(() => {
  const SELECTORS = {
    picker: '[data-custom-variant-picker]',
    json: '[data-variant-picker-json]',
    group: '[data-variant-option-group]',
    value: '[data-variant-value]',
    gallery: '[data-product-gallery]'
  };

  class CustomVariantPicker {
    constructor(element) {
      this.element = element;

      this.jsonElement = element.querySelector(
        SELECTORS.json
      );

      if (!this.jsonElement) {
        console.warn(
          'Variant picker JSON element was not found.'
        );
        return;
      }

      try {
        this.data = JSON.parse(
          this.jsonElement.textContent
        );
      } catch (error) {
        console.error(
          'Variant picker JSON is invalid:',
          error
        );
        return;
      }

      this.variants = Array.isArray(
        this.data.variants
      )
        ? this.data.variants
        : [];

      this.groups = Array.from(
        element.querySelectorAll(
          SELECTORS.group
        )
      );

      this.buttons = Array.from(
        element.querySelectorAll(
          SELECTORS.value
        )
      );

      this.productContainer =
        element.closest(
          '.product-details-container'
        ) || document;

      this.productSection =
        element.closest(
          '.housious-main-product-content'
        ) || document;

      this.gallery =
        this.productSection.querySelector(
          SELECTORS.gallery
        ) ||
        document.querySelector(
          SELECTORS.gallery
        );

      this.currentVariant =
        this.variants.find(
          (variant) =>
            String(variant.id) ===
            String(
              this.data.selectedVariantId
            )
        ) ||
        this.variants.find(
          (variant) => variant.available
        ) ||
        this.variants[0];

      if (!this.currentVariant) {
        console.warn(
          'No valid product variant was found.'
        );
        return;
      }

      this.selectedOptions = [
        ...this.currentVariant.options
      ];

      this.bindEvents();
      this.render(false);
    }

    bindEvents() {
      this.buttons.forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            if (
              button.classList.contains(
                'is-unavailable'
              )
            ) {
              return;
            }

            const optionIndex =
              Number.parseInt(
                button.dataset.optionIndex,
                10
              );

            const optionValue =
              button.dataset.optionValue;

            if (
              Number.isNaN(optionIndex) ||
              typeof optionValue !== 'string'
            ) {
              return;
            }

            this.selectOption(
              optionIndex,
              optionValue
            );
          }
        );
      });
    }

    selectOption(
      optionIndex,
      optionValue
    ) {
      const requestedOptions = [
        ...this.selectedOptions
      ];

      requestedOptions[optionIndex] =
        optionValue;

      let variant =
        this.findExactVariant(
          requestedOptions
        );

      if (
        !variant ||
        !variant.available
      ) {
        variant = this.variants.find(
          (candidate) =>
            candidate.available &&
            candidate.options[
              optionIndex
            ] === optionValue
        );
      }

      if (!variant) {
        variant =
          this.findExactVariant(
            requestedOptions
          );
      }

      if (!variant) {
        console.warn(
          'No matching variant was found for:',
          requestedOptions
        );
        return;
      }

      this.currentVariant = variant;

      this.selectedOptions = [
        ...variant.options
      ];

      this.render(true);
      this.dispatchVariantChange();
    }

    findExactVariant(options) {
      return this.variants.find(
        (variant) =>
          variant.options.every(
            (value, index) =>
              value === options[index]
          )
      );
    }

    isValueAvailable(
      optionIndex,
      optionValue
    ) {
      const candidateOptions = [
        ...this.selectedOptions
      ];

      candidateOptions[optionIndex] =
        optionValue;

      const exactVariant =
        this.findExactVariant(
          candidateOptions
        );

      if (exactVariant?.available) {
        return true;
      }

      return this.variants.some(
        (variant) =>
          variant.available &&
          variant.options[
            optionIndex
          ] === optionValue
      );
    }

    render(animateGallery = true) {
      this.updateButtons();
      this.updateForms();
      this.updatePrice();
      this.updateMainMedia(
        animateGallery
      );
      this.updateAddToCartButton();
      this.updateUrl();
    }

    updateButtons() {
      this.buttons.forEach((button) => {
        const optionIndex =
          Number.parseInt(
            button.dataset.optionIndex,
            10
          );

        const optionValue =
          button.dataset.optionValue;

        const isSelected =
          this.selectedOptions[
            optionIndex
          ] === optionValue;

        const isAvailable =
          this.isValueAvailable(
            optionIndex,
            optionValue
          );

        button.classList.toggle(
          'is-selected',
          isSelected
        );

        button.classList.toggle(
          'is-unavailable',
          !isAvailable
        );

        button.setAttribute(
          'aria-pressed',
          isSelected
            ? 'true'
            : 'false'
        );

        button.setAttribute(
          'aria-disabled',
          isAvailable
            ? 'false'
            : 'true'
        );

        const stockLabel =
          button.querySelector(
            '[data-value-stock]'
          );

        if (stockLabel) {
          stockLabel.textContent =
            isAvailable
              ? ''
              : 'Out of Stock';
        }
      });
    }

    updateForms() {
      const selector =
        'form[action*="/cart/add"] [name="id"]';

      const variantFields = new Set([
        ...this.productContainer
          .querySelectorAll(selector),

        ...this.productSection
          .querySelectorAll(selector)
      ]);

      variantFields.forEach(
        (field) => {
          field.value =
            this.currentVariant.id;

          field.dispatchEvent(
            new Event('change', {
              bubbles: true
            })
          );
        }
      );
    }

    updatePrice() {
      const currentPrice =
        this.productContainer
          .querySelector(
            '.current-price'
          );

      const comparePrice =
        this.productContainer
          .querySelector(
            '.product-price-block .compare-price'
          );

      const discount =
        this.productContainer
          .querySelector(
            '.discount-percentage'
          );

      if (currentPrice) {
        currentPrice.textContent =
          this.currentVariant
            .priceFormatted;
      }

      const compareAtPrice =
        Number(
          this.currentVariant
            .compareAtPrice
        );

      const currentVariantPrice =
        Number(
          this.currentVariant.price
        );

      const hasDiscount =
        compareAtPrice >
        currentVariantPrice;

      if (comparePrice) {
        comparePrice.textContent =
          hasDiscount
            ? this.currentVariant
                .compareAtPriceFormatted
            : '';

        comparePrice.hidden =
          !hasDiscount;
      }

      if (discount) {
        if (hasDiscount) {
          const percentage =
            Math.round(
              (
                (
                  compareAtPrice -
                  currentVariantPrice
                ) /
                compareAtPrice
              ) * 100
            );

          discount.textContent =
            `${percentage}% OFF`;

          discount.hidden = false;
        } else {
          discount.textContent = '';
          discount.hidden = true;
        }
      }
    }

    updateMainMedia(animateGallery = true) {
  const media = this.currentVariant.media;


  const gallery = document.querySelector('[data-product-gallery]');


  if (!gallery) {
    console.error('Gallery not found');
    return;
  }

  gallery.dispatchEvent(
    new CustomEvent('gallery:select-media', {
      detail: {
        mediaId: media?.id,
        media,
        animate: animateGallery
      }
    })
  );
}

    updateAddToCartButton() {
      const buttons =
        this.productContainer
          .querySelectorAll(
            '.btn-add-to-cart'
          );

      buttons.forEach((button) => {
        button.disabled =
          !this.currentVariant
            .available;

        button.setAttribute(
          'aria-disabled',
          this.currentVariant
            .available
            ? 'false'
            : 'true'
        );

        const buttonText =
          button.querySelector(
            '[data-add-to-cart-text]'
          );

        if (buttonText) {
          buttonText.textContent =
            this.currentVariant
              .available
              ? 'Add to Cart'
              : 'Sold Out';

          return;
        }

        const textNode =
          Array.from(
            button.childNodes
          ).find(
            (node) =>
              node.nodeType ===
                Node.TEXT_NODE &&
              node.textContent.trim()
          );

        if (textNode) {
          textNode.textContent =
            this.currentVariant
              .available
              ? ' Add to Cart'
              : ' Sold Out';
        }
      });
    }

    updateUrl() {
      if (
        !this.currentVariant.id
      ) {
        return;
      }

      const url = new URL(
        window.location.href
      );

      url.searchParams.set(
        'variant',
        this.currentVariant.id
      );

      window.history.replaceState(
        {},
        '',
        url.toString()
      );
    }

    dispatchVariantChange() {
      this.element.dispatchEvent(
        new CustomEvent(
          'variant:change',
          {
            bubbles: true,
            detail: {
              variant:
                this.currentVariant
            }
          }
        )
      );
    }
  }

  const initializeVariantPickers = (
    container = document
  ) => {
    container
      .querySelectorAll(
        SELECTORS.picker
      )
      .forEach((picker) => {
        if (
          picker.dataset
            .variantPickerInitialized ===
          'true'
        ) {
          return;
        }

        picker.dataset
          .variantPickerInitialized =
          'true';

        new CustomVariantPicker(
          picker
        );
      });
  };

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        initializeVariantPickers();
      }
    );
  } else {
    initializeVariantPickers();
  }

  document.addEventListener(
    'shopify:section:load',
    (event) => {
      initializeVariantPickers(
        event.target
      );
    }
  );
})();