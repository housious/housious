(function () {
  function getIndiaParts(date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour12: false,
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(date);
    const out = {};
    parts.forEach((part) => { if (part.type !== 'literal') out[part.type] = Number(part.value); });
    return out;
  }

  function remaining() {
    const p = getIndiaParts(new Date());
    return Math.max(0, 86400 - ((p.hour * 3600) + (p.minute * 60) + p.second));
  }

  function update(el) {
    const total = remaining();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    el.textContent = `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  }

  function init(root = document) {
    root.querySelectorAll('[data-daily-countdown]').forEach((el) => {
      if (el.dataset.countdownInitialized === 'true') return;
      el.dataset.countdownInitialized = 'true';
      update(el);
      setInterval(() => update(el), 1000);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
