(function(){
  const wrapper = document.getElementById('live-search-wrapper');
  const input = document.getElementById('live-search-input');
  const resultsBox = document.getElementById('live-search-results');
  if (!wrapper || !input || !resultsBox) return;

  let debounceTimer;
  let currentController;

  function escapeHtml(str){
    return (str || '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function formatMoney(value){
  if (typeof Shopify !== 'undefined' && Shopify.formatMoney && typeof window.moneyFormat !== 'undefined') {
    return Shopify.formatMoney(value * 100, window.moneyFormat);
  }
  return 'Rs. ' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

  function renderResults(data, query){
    const products = data.resources.results.products || [];
    const collections = data.resources.results.collections || [];

    if (!products.length && !collections.length) {
      resultsBox.innerHTML = '<div class="live-search-empty">No results for "' + escapeHtml(query) + '"</div>';
      resultsBox.classList.add('active');
      return;
    }

    let html = '<div class="live-search-inner">';

    if (collections.length) {
      html += '<div class="live-search-section-title">Collections</div>';
      collections.forEach(c => {
        html += `
          <a href="${c.url}" class="live-search-item live-search-item--collection">
            <span class="live-search-thumb live-search-thumb--icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </span>
            <div class="live-search-item-info">
              <span class="live-search-item-title">${escapeHtml(c.title)}</span>
            </div>
            <svg class="live-search-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>`;
      });
    }

    if (products.length) {
  html += '<div class="live-search-section-title">Products</div>';
  products.forEach(p => {

    const priceNum = parseFloat(p.price_min);
    const compareNum = parseFloat(p.compare_at_price_min);

    const hasCompare = !isNaN(compareNum) && compareNum > priceNum;

    let discountPercentage = 0;
    if (hasCompare) {
      discountPercentage = Math.round(((compareNum - priceNum) * 100) / compareNum);
    }

    html += `
      <a href="${p.url}" class="live-search-item">
        <span class="live-search-thumb">
          ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">` : ''}
        </span>
        <div class="live-search-item-info">
          <span class="live-search-item-title">${escapeHtml(p.title)}</span>
          <span class="live-search-item-price">
            <span class="live-search-price-current">${p.price}</span>
            ${hasCompare ? `<s class="live-search-price-compare">${formatMoney(compareNum)}</s>` : ''}
            ${hasCompare ? `<span class="live-search-discount-badge">${discountPercentage}% OFF</span>` : ''}
          </span>
        </div>
        <svg class="live-search-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>`;
  });
}

    html += `</div><a href="/search?q=${encodeURIComponent(query)}" class="live-search-view-all">
      View all results for "${escapeHtml(query)}"
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>`;

    resultsBox.innerHTML = html;
    resultsBox.classList.add('active');
  }

  function fetchResults(query){
    if (currentController) currentController.abort();
    currentController = new AbortController();

    resultsBox.innerHTML = '<div class="live-search-loading">Searching...</div>';
    resultsBox.classList.add('active');

    fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,collection&resources[limit]=6&resources[options][unavailable_products]=last`, {
      signal: currentController.signal
    })
      .then(res => res.json())
      .then(data => renderResults(data, query))
      .catch(err => {
        if (err.name !== 'AbortError') {
          resultsBox.innerHTML = '<div class="live-search-empty">Something went wrong. Try again.</div>';
        }
      });
  }

  input.addEventListener('input', function(){
    const query = this.value.trim();

    clearTimeout(debounceTimer);

    if (query.length < 2) {
      resultsBox.classList.remove('active');
      resultsBox.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => fetchResults(query), 300);
  });

  input.addEventListener('focus', function(){
    if (this.value.trim().length >= 2 && resultsBox.innerHTML) {
      resultsBox.classList.add('active');
    }
  });

  document.addEventListener('click', function(e){
    if (!wrapper.contains(e.target)) {
      resultsBox.classList.remove('active');
    }
  });

  input.addEventListener('keydown', function(e){
    if (e.key === 'Escape') {
      resultsBox.classList.remove('active');
      this.blur();
    }
  });
})();

/* ===============================
   MOBILE MEGA MENU DRAWER
================================ */

(function(){

  document.addEventListener("DOMContentLoaded", function(){

    const categoryBtn = document.querySelector(".category-btn");

    if(!categoryBtn) return;


    const megaParents = document.querySelectorAll(".mega-parent");

    if(!megaParents.length) return;


    const overlay = document.createElement("div");
    overlay.className = "mobile-mega-overlay";


    const drawer = document.createElement("div");
    drawer.className = "mobile-mega-drawer";


    let sidebarHTML = "";
    let contentHTML = "";


    megaParents.forEach((parent,index)=>{


      const parentLink = parent.querySelector(":scope > a");

      if(!parentLink) return;


      const title = parentLink.textContent.trim();

      const panelID = "mobile-mega-panel-"+index;


      sidebarHTML += `

        <button 
          class="mobile-mega-tab ${index===0?'active':''}"
          data-panel="${panelID}">
            ${title}
        </button>

      `;



      const children = parent.querySelectorAll(
        ".mega-item:not(.mega-item-view-all)"
      );


      contentHTML += `

        <div 
          class="mobile-mega-panel ${index===0?'active':''}"
          id="${panelID}">


          <div class="mobile-mega-title">
             ${title}
          </div>


          <div class="mobile-mega-grid">


            <a href="${parentLink.href}" 
               class="mobile-mega-card">


             <div class="mobile-mega-image view-all">

              <div class="view-all-circle-icon">

                      <svg viewBox="0 0 24 24">
                          <path d="M12 5V19"/>
                          <path d="M5 12H19"/>
                      </svg>

                  </div>

              </div>

              <span>
                View All
              </span>

            </a>


      `;



      children.forEach(child=>{


        const img = child.querySelector("img");

        const image = img ? img.src : "";

        const text = child.textContent.trim();



        contentHTML += `


          <a href="${child.href}" 
             class="mobile-mega-card">


             <div class="mobile-mega-image">


                ${
                  image
                  ?
                  `<img src="${image}" loading="lazy">`
                  :
                  ""
                }


             </div>


             <span>
                ${text}
             </span>


          </a>


        `;


      });



      contentHTML += `

          </div>

        </div>


      `;


    });



    drawer.innerHTML = `


      <div class="mobile-mega-header">

          <span>
             Categories
          </span>


          <button class="mobile-mega-close">
             ×
          </button>


      </div>



      <div class="mobile-mega-layout">


          <div class="mobile-mega-sidebar">


              ${sidebarHTML}


          </div>



          <div class="mobile-mega-content">


              ${contentHTML}


          </div>


      </div>


    `;



    document.body.appendChild(overlay);

    document.body.appendChild(drawer);



    const tabs = drawer.querySelectorAll(".mobile-mega-tab");

    const panels = drawer.querySelectorAll(".mobile-mega-panel");



    tabs.forEach(tab=>{


      tab.addEventListener("click",()=>{


        const id = tab.dataset.panel;



        tabs.forEach(t=>{
          t.classList.remove("active");
        });


        panels.forEach(p=>{
          p.classList.remove("active");
        });



        tab.classList.add("active");


        const panel = drawer.querySelector("#"+id);


        if(panel){
          panel.classList.add("active");
        }


      });


    });





    function openMenu(){


      overlay.classList.add("active");

      drawer.classList.add("active");

      document.body.style.overflow="hidden";


    }



    function closeMenu(){


      overlay.classList.remove("active");

      drawer.classList.remove("active");

      document.body.style.overflow="";


    }



    categoryBtn.addEventListener("click",function(e){


      if(window.innerWidth <= 768){

        e.preventDefault();

        openMenu();

      }


    });



    overlay.addEventListener("click",closeMenu);



    drawer.querySelector(".mobile-mega-close")
    .addEventListener("click",closeMenu);



  });


})();
