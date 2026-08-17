(function () {
  function getIndiaParts(date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(date);
    const out = {};
    parts.forEach((part) => { if (part.type !== 'literal') out[part.type] = Number(part.value); });
    return out;
  }

  function secondsUntilIndiaMidnight() {
    const p = getIndiaParts(new Date());
    const elapsed = (p.hour * 3600) + (p.minute * 60) + p.second;
    return Math.max(0, 86400 - elapsed);
  }

  function updateTimer(container) {
    const blocks = container.querySelectorAll('.timer-block');
    const hoursSpan = blocks[0]?.querySelector('span');
    const minsSpan = blocks[1]?.querySelector('span');
    const secsSpan = blocks[2]?.querySelector('span');
    if (!hoursSpan || !minsSpan || !secsSpan) return;

    const total = secondsUntilIndiaMidnight();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    hoursSpan.textContent = String(h).padStart(2, '0');
    minsSpan.textContent = String(m).padStart(2, '0');
    secsSpan.textContent = String(s).padStart(2, '0');
  }

  function init(root = document) {
    root.querySelectorAll('[data-daily-deal-timer]').forEach((container) => {
      if (container.dataset.timerInitialized === 'true') return;
      container.dataset.timerInitialized = 'true';
      updateTimer(container);
      setInterval(() => updateTimer(container), 1000);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
