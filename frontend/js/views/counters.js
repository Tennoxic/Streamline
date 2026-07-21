(function () {
  'use strict';

  function renderCounters() {
    const counters = getCounters();
    const list     = document.getElementById('counter-list');
    const empty    = document.getElementById('counter-empty');

    if (counters.length === 0) {
      empty.classList.remove('hidden');
      list.querySelectorAll('.counter-card').forEach(el => el.remove());
      return;
    }
    empty.classList.add('hidden');

    const existing = {};
    list.querySelectorAll('.counter-card[data-id]').forEach(el => {
      existing[el.dataset.id] = el;
    });

    const currentIds = new Set(counters.map(c => c.id));

    Object.keys(existing).forEach(id => {
      if (!currentIds.has(id)) existing[id].remove();
    });

    counters.forEach(c => {
      if (existing[c.id]) {
        const valEl = existing[c.id].querySelector('.counter-value');
        if (valEl) valEl.textContent = c.value || 0;
      } else {
        const card = document.createElement('div');
        card.className = 'counter-card';
        card.dataset.id = c.id;
        card.innerHTML = `
          <div class="counter-info">
            <div class="counter-name">${escapeHtml(c.name)}</div>
            <div class="counter-value">${c.value || 0}</div>
            <div class="counter-type">${c.type === 'day' ? 'Day-Based' : 'Manual'}</div>
          </div>
          <div class="counter-actions">
            ${c.type === 'manual' ? `
              <button class="counter-btn increment" data-id="${c.id}" aria-label="Increment">+</button>
            ` : ''}
            <button class="counter-btn reset" data-id="${c.id}" aria-label="Reset">↺</button>
            <button class="counter-btn delete" data-id="${c.id}" aria-label="Delete">🗑</button>
          </div>`;

        card.querySelector('.counter-btn.increment')?.addEventListener('click', () => {
          incrementCounter(c.id);
          renderCounters();
        });
        card.querySelector('.counter-btn.reset')?.addEventListener('click', () => {
          showConfirm('Reset this counter?', () => { resetCounter(c.id); renderCounters(); });
        });
        card.querySelector('.counter-btn.delete')?.addEventListener('click', () => {
          showConfirm('Delete this counter? This cannot be undone.', () => { deleteCounter(c.id); renderCounters(); });
        });
        list.appendChild(card);
      }
    });
  }

  function initCounters() {
    document.getElementById('add-counter-btn').addEventListener('click', openCounterForm);
    on('counters:changed', () => {
      if (currentRoute() === 'counters') renderCounters();
    });
  }

  window.renderCounters = renderCounters;
  window.initCounters   = initCounters;

})();
