document.addEventListener('DOMContentLoaded', () => {
  const filterForm = document.getElementById('CollectionFiltersForm');
  if (!filterForm) return;

  const sectionRoot = document.querySelector('[data-collection-grid-section-id]');
  const sectionId = sectionRoot?.dataset.collectionGridSectionId;
  let filterAbortController = null;

  const closeDrawer = () => {
    document.querySelector('.collection-filters-sidebar')?.classList.remove('drawer-open');
    document.querySelector('.filter-drawer-overlay')?.classList.remove('active');
  };

  const initPriceSliderFramework = () => {
    const rangeMinInput = filterForm.querySelector('.range-min');
    const rangeMaxInput = filterForm.querySelector('.range-max');
    const numMinInput = filterForm.querySelector('.dynamic-min-input');
    const numMaxInput = filterForm.querySelector('.dynamic-max-input');
    const sliderTrack = filterForm.querySelector('.slider-track');
    if (!rangeMinInput || !rangeMaxInput || !sliderTrack) return;

    const updateSliderTrack = () => {
      const minLimit = parseFloat(rangeMinInput.min) || 0;
      const maxLimit = parseFloat(rangeMinInput.max) || 500;
      let minVal = parseFloat(rangeMinInput.value) || minLimit;
      let maxVal = parseFloat(rangeMaxInput.value) || maxLimit;

      if (minVal > maxVal) {
        minVal = maxVal;
        rangeMinInput.value = minVal;
      }

      const span = Math.max(1, maxLimit - minLimit);
      const percentMin = ((minVal - minLimit) / span) * 100;
      const percentMax = ((maxVal - minLimit) / span) * 100;

      sliderTrack.style.left = `${percentMin}%`;
      sliderTrack.style.right = `${100 - percentMax}%`;
      if (numMinInput) numMinInput.value = minVal;
      if (numMaxInput) numMaxInput.value = maxVal;
    };

    rangeMinInput.oninput = () => {
      if (parseFloat(rangeMinInput.value) > parseFloat(rangeMaxInput.value)) {
        rangeMinInput.value = rangeMaxInput.value;
      }
      updateSliderTrack();
    };

    rangeMaxInput.oninput = () => {
      if (parseFloat(rangeMaxInput.value) < parseFloat(rangeMinInput.value)) {
        rangeMaxInput.value = rangeMinInput.value;
      }
      updateSliderTrack();
    };

    rangeMinInput.onchange = renderFilteredPage;
    rangeMaxInput.onchange = renderFilteredPage;
    updateSliderTrack();
  };

  const buildBasePath = () =>
    window.location.pathname.includes('all-collections')
      ? '/collections/all'
      : window.location.pathname;

  const updateGridFromUrl = async (destinationUrl, { pushHistory = true } = {}) => {
    if (filterAbortController) filterAbortController.abort();
    filterAbortController = new AbortController();

    const url = new URL(destinationUrl, window.location.origin);
    if (pushHistory) history.pushState({ path: url.href }, '', url.href);

    const fetchUrl = new URL(url.href);
    if (sectionId) fetchUrl.searchParams.set('section_id', sectionId);

    const grid = document.getElementById('ProductGridContainer');
    grid?.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(fetchUrl.href, {
        signal: filterAbortController.signal,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!response.ok) throw new Error(`Filter request failed: ${response.status}`);

      const htmlString = await response.text();
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(htmlString, 'text/html');
      const newGrid = htmlDoc.getElementById('ProductGridContainer');

      if (grid && newGrid) {
        grid.innerHTML = newGrid.innerHTML;
        document.dispatchEvent(new CustomEvent('housious:product-grid-updated', { detail: { container: grid } }));
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
        window.location.href = url.href;
      }
    } finally {
      grid?.removeAttribute('aria-busy');
    }
  };

  function renderFilteredPage() {
    const formData = new FormData(filterForm);
    const searchParams = new URLSearchParams(formData);
    searchParams.delete('page');
    const destinationUrl = `${buildBasePath()}?${searchParams.toString()}`;
    updateGridFromUrl(destinationUrl);
  }

  document.body.addEventListener('click', (event) => {
    if (event.target.closest('.mobile-filter-toggle-btn')) {
      document.querySelector('.collection-filters-sidebar')?.classList.add('drawer-open');
      document.querySelector('.filter-drawer-overlay')?.classList.add('active');
      return;
    }

    if (event.target.classList.contains('filter-drawer-overlay') || event.target.closest('#MobileFilterCloseBtn')) {
      closeDrawer();
      return;
    }

    const viewMoreBtn = event.target.closest('#CategoryViewMoreBtn');
    if (viewMoreBtn) {
      event.preventDefault();
      const filterBlock = viewMoreBtn.closest('.custom-navigation-categories');
      const hiddenItems = filterBlock?.querySelectorAll('.hidden-category-item') || [];
      const expanded = viewMoreBtn.getAttribute('data-expanded') !== 'true';
      hiddenItems.forEach((item) => { item.style.display = expanded ? 'block' : 'none'; });
      viewMoreBtn.setAttribute('data-expanded', expanded ? 'true' : 'false');
      viewMoreBtn.textContent = expanded ? '- View Less' : `+ View More (${viewMoreBtn.getAttribute('data-count')})`;
      return;
    }

    const clearAll = event.target.closest('#ClearAllFilters');
    if (clearAll) {
      event.preventDefault();
      filterForm.reset();
      const rangeMin = filterForm.querySelector('.range-min');
      const rangeMax = filterForm.querySelector('.range-max');
      const numMin = filterForm.querySelector('.dynamic-min-input');
      const numMax = filterForm.querySelector('.dynamic-max-input');
      if (rangeMin) rangeMin.value = rangeMin.min;
      if (rangeMax) rangeMax.value = rangeMax.max;
      if (numMin) numMin.value = rangeMin?.min || 0;
      if (numMax) numMax.value = rangeMax?.max || 500;
      initPriceSliderFramework();
      updateGridFromUrl(buildBasePath());
      return;
    }

    const paginationLink = event.target.closest('.pagination a, .pagination-wrapper a');
    if (paginationLink) {
      event.preventDefault();
      updateGridFromUrl(paginationLink.href);
      window.scrollTo({ top: document.getElementById('ProductGridContainer')?.offsetTop || 0, behavior: 'smooth' });
    }
  });

  filterForm.addEventListener('change', (event) => {
    if (
      event.target.matches('.filter-checkbox-input') ||
      event.target.matches('input[name="filter.v.availability"]') ||
      event.target.matches('input[type="checkbox"]')
    ) {
      renderFilteredPage();
    }
  });

  window.addEventListener('popstate', () => updateGridFromUrl(window.location.href, { pushHistory: false }));
  initPriceSliderFramework();
});
