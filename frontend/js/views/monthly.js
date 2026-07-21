(function () {
  'use strict';

  let _monthYear   = new Date().getFullYear();
  let _monthMonth  = new Date().getMonth();
  let _expandedDay = null;

  function getDayOfWeek(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  function isWeekend(dateStr) {
    const dow = getDayOfWeek(dateStr);
    return dow === 0 || dow === 6;
  }

  function renderMonthly() {
    document.getElementById('month-label').textContent = formatMonthLabel(_monthYear, _monthMonth);

    const days      = getDaysInMonth(_monthYear, _monthMonth);
    const today     = todayKey();
    const list      = document.getElementById('month-day-list');
    const isDesktop = window.innerWidth >= 768;
    list.innerHTML  = '';

    const visibleDays = [];
    for (let d = 1; d <= days; d++) {
      const key = `${_monthYear}-${String(_monthMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (key >= today) visibleDays.push(d);
    }

    if (isDesktop) {
      list.classList.add('month-two-col');
      for (let i = 0; i < visibleDays.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'month-pair-row';
        row.appendChild(buildDayItem(visibleDays[i], today));
        if (visibleDays[i + 1] !== undefined) {
          row.appendChild(buildDayItem(visibleDays[i + 1], today));
        } else {
          const ph = document.createElement('div');
          ph.className = 'month-day-item month-day-placeholder';
          row.appendChild(ph);
        }
        list.appendChild(row);
      }
    } else {
      list.classList.remove('month-two-col');
      for (const d of visibleDays) {
        list.appendChild(buildDayItem(d, today));
      }
    }
  }

  function buildDayItem(d, today) {
    const key      = `${_monthYear}-${String(_monthMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const tasks    = getTasks(key);
    const notes    = getNotes(key);
    const date     = new Date(_monthYear, _monthMonth, d);
    const dayName  = WEEKDAYS[date.getDay()];
    const isToday  = key === today;
    const isExp    = _expandedDay === key;
    const wkend    = isWeekend(key);

    const dots = [...new Set(tasks.map(t => t.category))].slice(0, 5)
      .map(cat => `<span class="month-dot" style="background:${(CATEGORIES[cat]||CATEGORIES.other).color}"></span>`)
      .join('');

    const item = document.createElement('div');
    item.className = `month-day-item${isToday ? ' today' : ''}${wkend ? ' weekend' : ''}${isExp ? ' expanded' : ''}`;
    item.dataset.key = key;

    item.innerHTML = `
      <div class="month-day-header">
        <div class="month-day-label">
          <span class="month-day-num" style="${wkend ? 'color:var(--warning)' : ''}">${d}</span>
          <span class="month-day-name" style="${wkend ? 'color:var(--warning);opacity:0.8' : ''}">${dayName}</span>
          <div class="month-day-dots">${dots}</div>
        </div>
        <svg class="month-day-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="month-day-content">
        <div class="month-day-inner">
          <div class="month-day-tasks">
            ${tasks.length
              ? tasks.map(t => monthTaskRow(t, key)).join('')
              : `<p style="font-size:12px;color:var(--text-muted);padding:4px 0">No tasks.</p>`}
          </div>
          ${notes.length
            ? `<div class="notes-divider"><span>Notes</span></div>
               ${notes.map(n => `<div class="note-item">${escapeHtml(n.text)}</div>`).join('')}`
            : ''}
          <button class="wide-btn monthly-add-task-btn" data-key="${key}" style="margin-top:10px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Task
          </button>
        </div>
      </div>
    `;

    item.querySelector('.month-day-header').addEventListener('click', () => {
      _expandedDay = isExp ? null : key;
      renderMonthly();
    });
    item.querySelector('.monthly-add-task-btn').addEventListener('click', e => {
      e.stopPropagation();
      openTaskForm('monthly', key);
    });
    item.querySelectorAll('.month-task-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        showConfirm('Delete this task?', () => { deleteTask(btn.dataset.key, btn.dataset.id); });
      });
    });

    return item;
  }

  function monthTaskRow(t, key) {
    const cat = CATEGORIES[t.category] || CATEGORIES.other;
    return `
      <div class="month-task-row">
        <span class="task-cat-dot" style="background:${cat.color}"></span>
        <span class="task-text" style="${t.done ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${escapeHtml(t.text)}</span>
        <span class="task-duration">${formatDuration(t.duration)}</span>
        <button class="month-task-delete-btn" data-key="${key}" data-id="${t.id}" title="Delete" aria-label="Delete task">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>`;
  }

  function clearWeekends(year, month) {
    const days    = getDaysInMonth(year, month);
    const todayVal = todayKey();

    for (let d = 1; d <= days; d++) {
      const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (key < todayVal) continue;
      if (!isWeekend(key)) continue;
      const existing = STATE.data.tasks[key] || [];
      STATE.data.tasks[key] = existing.filter(t => t.done);
    }
    markDirty();
    emit('tasks:bulk');
  }

  function initMonthly() {
    document.getElementById('month-prev').addEventListener('click', () => {
      if (_monthMonth === 0) { _monthMonth = 11; _monthYear--; }
      else _monthMonth--;
      _expandedDay = null;
      renderMonthly();
    });

    document.getElementById('month-next').addEventListener('click', () => {
      if (_monthMonth === 11) { _monthMonth = 0; _monthYear++; }
      else _monthMonth++;
      _expandedDay = null;
      renderMonthly();
    });

    document.getElementById('reset-month-btn').addEventListener('click', () => {
      showConfirm(`Upcoming tasks in ${formatMonthLabel(_monthYear, _monthMonth)} will be cleared. Continue?`, () => { resetMonth(_monthYear, _monthMonth); renderMonthly(); });
    });

    document.getElementById('copy-month-btn').addEventListener('click', () => {
      const nM = _monthMonth === 11 ? 0 : _monthMonth + 1;
      const nY = _monthMonth === 11 ? _monthYear + 1 : _monthYear;
      showConfirm(`Tasks will be copied to ${formatMonthLabel(nY, nM)}. Continue?`, () => { copyMonthToNext(_monthYear, _monthMonth); renderMonthly(); });
    });

    document.getElementById('clear-weekends-btn').addEventListener('click', () => {
      showConfirm(`Weekend tasks in ${formatMonthLabel(_monthYear, _monthMonth)} will be cleared. Continue?`, () => { clearWeekends(_monthYear, _monthMonth); renderMonthly(); });
    });

    let _resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        if (currentRoute() === 'monthly') renderMonthly();
      }, 150);
    });

    on('tasks:changed', () => { if (currentRoute() === 'monthly') renderMonthly(); });
    on('tasks:bulk',    () => { if (currentRoute() === 'monthly') renderMonthly(); });
  }

  window.renderMonthly = renderMonthly;
  window.initMonthly   = initMonthly;

})();
