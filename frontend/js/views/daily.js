(function () {
  'use strict';

  function renderDaily() {
    const key   = todayKey();
    const tasks = getTasks(key);
    const notes = getNotes(key);

    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    document.getElementById('daily-dayname').textContent = WEEKDAYS[date.getDay()];
    document.getElementById('daily-date').textContent    = `${d} ${MONTHS[m - 1]} ${y}`;

    const done  = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const sub   = document.getElementById('daily-sub');
    sub.textContent = total === 0
      ? 'No tasks for today yet.'
      : `${done}/${total} of today's tasks completed.`;

    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('daily-progress').style.width = pct + '%';

    const listEl = document.getElementById('daily-task-list');

    if (tasks.length === 0) {
      listEl.innerHTML = `<div class="empty-state" style="padding:24px 20px">
        <span class="empty-icon">✅</span>
        <p>Tap the button below to add a task.</p>
      </div>`;
    } else {
      if (listEl.querySelector('.empty-state')) listEl.innerHTML = '';

      const existing = {};
      listEl.querySelectorAll('.task-item[data-id]').forEach(el => {
        existing[el.dataset.id] = el;
      });

      const currentIds = new Set(tasks.map(t => t.id));

      Object.keys(existing).forEach(id => {
        if (!currentIds.has(id)) existing[id].remove();
      });

      tasks.forEach((t, idx) => {
        if (existing[t.id]) {
          const el  = existing[t.id];
          const was = el.classList.contains('done');
          el.dataset.idx = idx;
          if (!t.done) {
            el.draggable = true;
          } else {
            el.removeAttribute('draggable');
          }
          if (was !== t.done) {
            el.classList.toggle('done', t.done);
            el.innerHTML = buildTaskRowInner(t);
            attachRowListeners(el, t, key);
          }
        } else {
          const el = document.createElement('div');
          el.className = `task-item${t.done ? ' done' : ''}`;
          el.dataset.id  = t.id;
          el.dataset.idx = idx;
          el.style.animationDelay = `${idx * 0.04}s`;
          if (!t.done) el.draggable = true;
          el.innerHTML = buildTaskRowInner(t);
          attachRowListeners(el, t, key);
          listEl.appendChild(el);
        }
      });
    }

    const notesSection = document.getElementById('daily-notes-section');
    const notesList    = document.getElementById('daily-notes-list');
    if (notes.length === 0) {
      notesSection.classList.add('hidden');
    } else {
      notesSection.classList.remove('hidden');
      notesList.innerHTML = notes.map(n =>
        `<div class="note-item">${escapeHtml(n.text)}</div>`
      ).join('');
    }
  }

  function attachRowListeners(el, t, key) {
    el.querySelector('.task-complete-btn')?.addEventListener('click', () => {
      completeTask(key, t.id);
    });
    el.querySelector('.task-undo-btn')?.addEventListener('click', () => {
      undoComplete(key, t.id);
    });
  }

  function buildTaskRowInner(t) {
    const cat = CATEGORIES[t.category] || CATEGORIES.other;
    return `
      <span class="task-cat-dot" style="background:${cat.color}"></span>
      <span class="task-text">${escapeHtml(t.text)}</span>
      <span class="task-duration">${formatDuration(t.duration)}</span>
      ${t.done ? `
        <button class="task-undo-btn" data-id="${t.id}" aria-label="Undo">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7v6h6"/><path d="M3 13C5 7 10 4 16 5.5a9 9 0 0 1 5 7.5"/>
          </svg>
        </button>` : `
        <button class="task-complete-btn" data-id="${t.id}" aria-label="Complete">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>`}`;
  }

  function initDragDrop(listEl, key) {
    let _dragIdx = null;
    let _dragEl  = null;

    listEl.addEventListener('dragstart', e => {
      const item = e.target.closest('.task-item[data-id]');
      if (!item || item.classList.contains('done')) { e.preventDefault(); return; }
      _dragEl  = item;
      _dragIdx = parseInt(item.dataset.idx);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    listEl.addEventListener('dragend', () => {
      if (_dragEl) _dragEl.classList.remove('dragging');
      listEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      _dragEl = null; _dragIdx = null;
    });

    listEl.addEventListener('dragover', e => {
      e.preventDefault();
      const item = e.target.closest('.task-item[data-id]');
      if (!item || item === _dragEl || item.classList.contains('done')) return;
      listEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });

    listEl.addEventListener('drop', e => {
      e.preventDefault();
      const target = e.target.closest('.task-item[data-id]');
      if (!target || target === _dragEl) return;
      const toIdx = parseInt(target.dataset.idx);
      if (_dragIdx !== null && toIdx !== _dragIdx) {
        reorderTasks(key, _dragIdx, toIdx);
      }
    });
  }

  function initDaily() {
    const listEl = document.getElementById('daily-task-list');
    initDragDrop(listEl, todayKey());

    document.getElementById('daily-add-task-btn').addEventListener('click', () => {
      openTaskForm('daily', todayKey());
    });
    on('tasks:changed', (k) => {
      if (currentRoute() === 'daily' && k === todayKey()) renderDaily();
    });
    on('notes:changed', (k) => {
      if (currentRoute() === 'daily' && k === todayKey()) renderDaily();
    });
  }

  window.renderDaily = renderDaily;
  window.initDaily   = initDaily;

})();
