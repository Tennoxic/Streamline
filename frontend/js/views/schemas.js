(function () {
  'use strict';

  const SCHEMA_TYPES = {
    work:  { label: 'Work',  icon: '💼', desc: 'Task name and estimated duration' },
    sport: { label: 'Sport', icon: '🏋️', desc: 'Exercise, reps and sets' },
    study: { label: 'Study', icon: '📚', desc: 'Subject and study duration' },
  };

  function renderSchemas() {
    const schemas = getSchemas();
    const list    = document.getElementById('schema-list');
    const empty   = document.getElementById('schema-empty');

    if (schemas.length === 0) {
      empty.classList.remove('hidden');
      list.querySelectorAll('.schema-card').forEach(el => el.remove());
      return;
    }
    empty.classList.add('hidden');
    list.innerHTML = '';

    schemas.forEach(s => {
      const typeInfo = SCHEMA_TYPES[s.type] || SCHEMA_TYPES.work;
      const card = document.createElement('div');
      card.className = 'schema-card';
      card.innerHTML = `
        <div class="schema-card-header">
          <div class="schema-card-title">
            <span>${typeInfo.icon}</span>
            <span>${escapeHtml(s.name)}</span>
            <span class="schema-type-badge">${typeInfo.label}</span>
          </div>
          <div class="schema-card-actions">
            <button class="schema-action-btn edit-schema-btn" data-id="${s.id}" title="Edit">✏️</button>
            <button class="schema-action-btn delete schema-delete-btn" data-id="${s.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="schema-items">${buildSchemaItemsHTML(s)}</div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.schema-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('Delete this routine?', () => { deleteSchema(btn.dataset.id); renderSchemas(); });
      });
    });
    list.querySelectorAll('.edit-schema-btn').forEach(btn => {
      btn.addEventListener('click', () => openSchemaEditForm(btn.dataset.id));
    });
  }

  function buildSchemaItemsHTML(s) {
    if (s.type === 'sport') {
      return s.items.map(item => `
        <div class="schema-item-row">
          <span class="schema-item-name">${escapeHtml(item.name)}</span>
          <span class="schema-item-meta">${item.sets} sets × ${item.reps} reps</span>
        </div>`).join('');
    }
    return s.items.map(item => `
      <div class="schema-item-row">
        <span class="schema-item-name">${escapeHtml(item.name)}</span>
        <span class="schema-item-meta">${formatDuration(item.duration)}</span>
      </div>`).join('');
  }

  function initSchemas() {
    document.getElementById('add-schema-btn').addEventListener('click', openSchemaForm);
    on('schemas:changed', () => { if (currentRoute() === 'schemas') renderSchemas(); });
  }

  window.renderSchemas = renderSchemas;
  window.initSchemas   = initSchemas;

})();
