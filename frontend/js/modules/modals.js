(function () {
  'use strict';

  function openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    const anyOpen = ['task-form-modal','counter-form-modal','schema-form-modal','schema-name-modal']
      .some(m => !document.getElementById(m).classList.contains('hidden'));
    if (!anyOpen) {
      document.getElementById('modal-overlay').classList.add('hidden');
      document.body.style.overflow = '';
    }
  }
  function closeAllModals() {
    ['task-form-modal','counter-form-modal','schema-form-modal','schema-name-modal'].forEach(closeModal);
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }
  document.getElementById('modal-overlay').addEventListener('click', closeAllModals);

  let _taskFormDate = null;

  function openTaskForm(context, dateKeyVal) {
    _taskFormDate = dateKeyVal;
    const content   = document.getElementById('task-form-content');

    const catChips = Object.entries(CATEGORIES).map(([key, cat]) => `
      <button class="cat-chip" data-cat="${key}"
        style="--chip-color:${cat.color}; --chip-rgb:${cat.rgb}">
        <span class="dot" style="background:${cat.color}"></span>
        ${cat.label}
      </button>`).join('');

    const durChips = DURATIONS.map(d => `
      <button class="dur-chip" data-val="${d.value}">${d.label}</button>`).join('');

    const monthlyExtra = context === 'monthly' ? `
      <div class="form-section">
        <span class="form-label">Repeat</span>
        <div class="radio-group">
          <div class="radio-item selected" data-repeat="once">
            <div class="radio-circle"></div><span class="radio-label">Once</span>
          </div>
          <div class="radio-item" data-repeat="daily">
            <div class="radio-circle"></div><span class="radio-label">Daily</span>
          </div>
          <div class="radio-item" data-repeat="interval">
            <div class="radio-circle"></div><span class="radio-label">Every X Days</span>
          </div>
        </div>
        <div class="interval-wrap hidden" id="interval-wrap">
          <input type="text" inputmode="numeric" pattern="[0-9]*" class="interval-input" id="interval-input" placeholder="2"/>
          <span class="interval-label">days apart</span>
        </div>
      </div>` : '';

    const noteSection = context === 'daily' ? `
      <div class="form-section">
        <button class="add-note-btn" id="add-note-toggle-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Note
        </button>
        <div class="hidden" id="note-input-wrap">
          <textarea class="text-area mt-8" id="task-note-input" placeholder="Enter your note..."></textarea>
        </div>
      </div>` : '';

    content.innerHTML = `
      <h2 class="form-title">Add Task</h2>
      <div class="form-section">
        <span class="form-label">Category</span>
        <div class="category-chips">${catChips}</div>
      </div>
      <div class="form-section" id="dur-section">
        <span class="form-label">Estimated Duration</span>
        <div class="duration-chips">${durChips}</div>
      </div>
      ${monthlyExtra}
      ${noteSection}
      <div class="form-footer">
        <button class="form-btn cancel" id="task-form-cancel">Cancel</button>
        <button class="form-btn confirm" id="task-form-confirm">Confirm</button>
      </div>
    `;

    let selectedCat = null;
    content.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        content.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedCat = chip.dataset.cat;
      });
    });

    let selectedDur = null;
    content.querySelectorAll('.dur-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        content.querySelectorAll('.dur-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedDur = parseInt(chip.dataset.val);
      });
    });

    if (context === 'monthly') {
      let repeatMode = 'once';
      content.querySelectorAll('.radio-item[data-repeat]').forEach(item => {
        item.addEventListener('click', () => {
          content.querySelectorAll('.radio-item[data-repeat]').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          repeatMode = item.dataset.repeat;
          document.getElementById('interval-wrap')?.classList.toggle('hidden', repeatMode !== 'interval');
        });
      });
      content._getRepeatMode = () => repeatMode;
    }

    if (context === 'daily') {
      document.getElementById('add-note-toggle-btn').addEventListener('click', () => {
        document.getElementById('note-input-wrap').classList.toggle('hidden');
      });
    }

    document.getElementById('task-form-cancel').addEventListener('click', () => closeModal('task-form-modal'));

    document.getElementById('task-form-confirm').addEventListener('click', () => {
      if (!selectedCat) { alert('Please select a category.'); return; }

      const taskName = CATEGORIES[selectedCat].label;

      if (context === 'daily') {
        const noteText = document.getElementById('task-note-input')?.value.trim();
        const task = {
          id: uid(), text: taskName, category: selectedCat,
          duration: selectedDur || null, done: false,
          createdAt: new Date().toISOString(), completedAt: null,
        };
        addTask(_taskFormDate, task);
        if (noteText) addNote(_taskFormDate, { id: uid(), text: noteText, createdAt: new Date().toISOString() });
      } else {
        const repeatMode  = content._getRepeatMode ? content._getRepeatMode() : 'once';
        const intervalVal = parseInt(document.getElementById('interval-input')?.value) || 2;
        const [fy, fm, fd] = _taskFormDate.split('-').map(Number);
        const daysInMonth  = getDaysInMonth(fy, fm - 1);
        const baseTask = () => ({
          id: uid(), text: taskName, category: selectedCat,
          duration: selectedDur || null, done: false,
          createdAt: new Date().toISOString(), completedAt: null, repeat: repeatMode,
        });

        if (repeatMode === 'once') {
          addTask(_taskFormDate, baseTask());
        } else if (repeatMode === 'daily') {
          for (let d = fd; d <= daysInMonth; d++) {
            const key = `${fy}-${String(fm).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            addTask(key, baseTask());
          }
        } else if (repeatMode === 'interval') {
          for (let d = fd; d <= daysInMonth; d += intervalVal) {
            const key = `${fy}-${String(fm).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            addTask(key, baseTask());
          }
        }
      }
      closeModal('task-form-modal');
    });

    openModal('task-form-modal');
  }

  function openCounterForm() {
    const content = document.getElementById('counter-form-content');
    content.innerHTML = `
      <h2 class="form-title">Add Counter</h2>
      <div class="form-section">
        <span class="form-label">Counter Name</span>
        <input type="text" class="text-input" id="counter-name-input" placeholder="Counter name..."/>
      </div>
      <div class="form-section">
        <span class="form-label">Type</span>
        <div class="radio-group">
          <div class="radio-item selected" data-ctype="day">
            <div class="radio-circle"></div>
            <div>
              <span class="radio-label">Day-Based</span>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Auto +1 every new day</div>
            </div>
          </div>
          <div class="radio-item" data-ctype="manual">
            <div class="radio-circle"></div>
            <div>
              <span class="radio-label">Manual</span>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Increment by pressing a button</div>
            </div>
          </div>
        </div>
      </div>
      <div class="form-footer">
        <button class="form-btn cancel" id="counter-form-cancel">Cancel</button>
        <button class="form-btn confirm" id="counter-form-confirm">Add</button>
      </div>
    `;
    let selectedType = 'day';
    content.querySelectorAll('.radio-item[data-ctype]').forEach(item => {
      item.addEventListener('click', () => {
        content.querySelectorAll('.radio-item[data-ctype]').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedType = item.dataset.ctype;
      });
    });
    document.getElementById('counter-form-cancel').addEventListener('click', () => closeModal('counter-form-modal'));
    document.getElementById('counter-form-confirm').addEventListener('click', () => {
      const name = document.getElementById('counter-name-input').value.trim();
      if (!name) { document.getElementById('counter-name-input').focus(); return; }
      addCounter({ id: uid(), name, type: selectedType, value: 0, createdAt: new Date().toISOString() });
      closeModal('counter-form-modal');
    });
    openModal('counter-form-modal');
    setTimeout(() => document.getElementById('counter-name-input')?.focus(), 350);
  }

  let _schemaType = null;
  let _schemaFormRows = [];
  let _editingSchemaId = null;

  const SCHEMA_TYPES = {
    work:  { label: 'Work',  icon: '💼', desc: 'Task name and estimated duration' },
    sport: { label: 'Sport', icon: '🏋️', desc: 'Exercise, reps and sets' },
    study: { label: 'Study', icon: '📚', desc: 'Subject and study duration' },
  };

  function openSchemaForm() {
    _schemaType = null; _schemaFormRows = []; _editingSchemaId = null;
    renderSchemaFormTypeSelect();
    openModal('schema-form-modal');
  }

  function openSchemaEditForm(id) {
    const schema = getSchemas().find(s => s.id === id);
    if (!schema) return;
    _editingSchemaId = id;
    _schemaType = schema.type;
    _schemaFormRows = schema.items.map(i => ({...i}));
    renderSchemaFormItems();
    openModal('schema-form-modal');
  }

  function renderSchemaFormTypeSelect() {
    const content = document.getElementById('schema-form-content');
    content.innerHTML = `
      <h2 class="form-title">Add Routine</h2>
      <div class="schema-type-cards">
        ${Object.entries(SCHEMA_TYPES).map(([key,t]) => `
          <div class="schema-type-card" data-stype="${key}">
            <span class="schema-type-icon">${t.icon}</span>
            <div class="schema-type-info"><h4>${t.label}</h4><p>${t.desc}</p></div>
          </div>`).join('')}
      </div>
      <div class="form-footer" style="margin-top:8px">
        <button class="form-btn cancel" id="schema-type-cancel">Cancel</button>
      </div>
    `;
    content.querySelectorAll('.schema-type-card').forEach(card => {
      card.addEventListener('click', () => {
        _schemaType = card.dataset.stype;
        _schemaFormRows = [newSchemaRow(_schemaType)];
        renderSchemaFormItems();
      });
    });
    document.getElementById('schema-type-cancel').addEventListener('click', () => closeModal('schema-form-modal'));
  }

  function newSchemaRow(type) {
    if (type === 'sport') return { id: uid(), name: '', sets: '', reps: '' };
    return { id: uid(), name: '', duration: '' };
  }

  function renderSchemaFormItems() {
    const content = document.getElementById('schema-form-content');
    const t = SCHEMA_TYPES[_schemaType];
    const labels = _schemaType === 'sport'
      ? `<div class="row-labels">
           <span class="row-label-text" style="flex:1">Exercise</span>
           <span class="row-label-text" style="width:68px">Sets</span>
           <span class="row-label-text" style="width:68px">Reps</span>
           <span style="width:30px"></span>
         </div>`
      : `<div class="row-labels">
           <span class="row-label-text" style="flex:1">${_schemaType === 'study' ? 'Subject' : 'Task'} Name</span>
           <span class="row-label-text" style="width:80px">Duration (min)</span>
           <span style="width:30px"></span>
         </div>`;

    content.innerHTML = `
      <h2 class="form-title">${_editingSchemaId ? 'Edit' : 'Add Routine'} — ${t.icon} ${t.label}</h2>
      <div class="form-section">
        ${labels}
        <div class="schema-form-items" id="schema-rows">
          ${_schemaFormRows.map((row,idx) => buildSchemaFormRow(row,idx,_schemaType)).join('')}
        </div>
        <button class="add-row-btn" id="add-schema-row-btn" style="margin-top:8px">+ Add</button>
      </div>
      <div class="form-footer">
        <button class="form-btn cancel" id="schema-form-cancel">Cancel</button>
        <button class="form-btn confirm" id="schema-form-confirm">Continue</button>
      </div>
    `;

    wireSchemaRows();
    document.getElementById('add-schema-row-btn').addEventListener('click', () => {
      _schemaFormRows.push(newSchemaRow(_schemaType));
      renderSchemaFormItems();
    });
    document.getElementById('schema-form-cancel').addEventListener('click', () => {
      if (_editingSchemaId) { closeModal('schema-form-modal'); return; }
      renderSchemaFormTypeSelect();
    });
    document.getElementById('schema-form-confirm').addEventListener('click', () => {
      collectSchemaRows();
      if (_schemaFormRows.some(r => !r.name)) { alert('Please enter a name for every row.'); return; }
      if (_editingSchemaId) { updateSchema(_editingSchemaId, { items: _schemaFormRows }); closeModal('schema-form-modal'); }
      else openSchemaNameModal();
    });
  }

  function buildSchemaFormRow(row, idx, type) {
    if (type === 'sport') {
      return `<div class="schema-form-row" data-idx="${idx}">
        <input class="text-input" data-field="name" placeholder="Squat..." value="${escapeHtml(row.name||'')}"/>
        <input class="text-input num" data-field="sets"  type="text" inputmode="numeric" pattern="[0-9]*" placeholder="3" value="${row.sets||''}"/>
        <input class="text-input num" data-field="reps"  type="text" inputmode="numeric" pattern="[0-9]*" placeholder="10" value="${row.reps||''}"/>
        <button class="remove-row-btn" data-idx="${idx}">×</button>
      </div>`;
    }
    return `<div class="schema-form-row" data-idx="${idx}">
      <input class="text-input" data-field="name" placeholder="${type==='study'?'Mathematics...':'Report...'}" value="${escapeHtml(row.name||'')}"/>
      <input class="text-input num" data-field="duration" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="60" value="${row.duration||''}"/>
      <button class="remove-row-btn" data-idx="${idx}">×</button>
    </div>`;
  }

  function wireSchemaRows() {
    document.getElementById('schema-rows').querySelectorAll('.remove-row-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_schemaFormRows.length === 1) return;
        collectSchemaRows();
        _schemaFormRows.splice(parseInt(btn.dataset.idx), 1);
        renderSchemaFormItems();
      });
    });
  }

  function collectSchemaRows() {
    document.getElementById('schema-rows').querySelectorAll('.schema-form-row').forEach((row, idx) => {
      const inputs = row.querySelectorAll('input');
      if (_schemaType === 'sport') {
        _schemaFormRows[idx] = { id: _schemaFormRows[idx]?.id||uid(), name: inputs[0].value.trim(), sets: parseInt(inputs[1].value)||0, reps: parseInt(inputs[2].value)||0 };
      } else {
        _schemaFormRows[idx] = { id: _schemaFormRows[idx]?.id||uid(), name: inputs[0].value.trim(), duration: parseInt(inputs[1].value)||0 };
      }
    });
  }

  function openSchemaNameModal() {
    const content = document.getElementById('schema-name-content');
    content.innerHTML = `
      <h2 class="form-title">Name Your Routine</h2>
      <div class="form-section">
        <input type="text" class="text-input" id="schema-name-input" placeholder="Routine name..."/>
      </div>
      <div class="form-footer">
        <button class="form-btn cancel" id="schema-name-cancel">Cancel</button>
        <button class="form-btn confirm" id="schema-name-confirm">Save</button>
      </div>
    `;
    document.getElementById('schema-name-cancel').addEventListener('click', () => closeModal('schema-name-modal'));
    document.getElementById('schema-name-confirm').addEventListener('click', () => {
      const name = document.getElementById('schema-name-input').value.trim();
      if (!name) { document.getElementById('schema-name-input').focus(); return; }
      addSchema({ id: uid(), name, type: _schemaType, items: _schemaFormRows, createdAt: new Date().toISOString() });
      closeModal('schema-name-modal');
      closeModal('schema-form-modal');
    });
    openModal('schema-name-modal');
    setTimeout(() => document.getElementById('schema-name-input')?.focus(), 100);
  }

  function openNoteForm(dateKeyVal) {
    const content = document.getElementById('task-form-content');
    content.innerHTML = `
      <h2 class="form-title">Add Note</h2>
      <div class="form-section">
        <textarea class="text-area" id="standalone-note-input" placeholder="Enter your note..." rows="4"></textarea>
      </div>
      <div class="form-footer">
        <button class="form-btn cancel" id="note-form-cancel">Cancel</button>
        <button class="form-btn confirm" id="note-form-confirm">Save</button>
      </div>
    `;
    document.getElementById('note-form-cancel').addEventListener('click', () => closeModal('task-form-modal'));
    document.getElementById('note-form-confirm').addEventListener('click', () => {
      const text = document.getElementById('standalone-note-input').value.trim();
      if (!text) return;
      addNote(dateKeyVal, { id: uid(), text, createdAt: new Date().toISOString() });
      closeModal('task-form-modal');
    });
    openModal('task-form-modal');
    setTimeout(() => document.getElementById('standalone-note-input')?.focus(), 350);
  }

  function showConfirm(message, onConfirm, onCancel) {
    const overlay = document.getElementById('confirm-overlay');
    const msgEl   = document.getElementById('confirm-message');
    const yesBtn  = document.getElementById('confirm-yes');
    const noBtn   = document.getElementById('confirm-no');

    msgEl.textContent = message;
    overlay.classList.remove('hidden');

    function cleanup() {
      overlay.classList.add('hidden');
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
    }
    function handleYes() { cleanup(); onConfirm(); }
    function handleNo()  { cleanup(); if (onCancel) onCancel(); }

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
  }

  window.openModal          = openModal;
  window.closeModal         = closeModal;
  window.closeAllModals     = closeAllModals;
  window.openTaskForm       = openTaskForm;
  window.openCounterForm    = openCounterForm;
  window.openSchemaForm     = openSchemaForm;
  window.openSchemaEditForm = openSchemaEditForm;
  window.openNoteForm       = openNoteForm;
  window.showConfirm        = showConfirm;

})();
