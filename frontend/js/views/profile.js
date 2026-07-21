(function () {
  'use strict';

  let _statsPeriod = 'weekly';

  function renderProfile() {
    const name = STATE.user;
    document.getElementById('profile-name').textContent = capitalize(name);
    document.getElementById('profile-avatar').textContent = initials(name);
    renderStats(_statsPeriod);
    renderRecentBadges();
    renderImportExport();
  }

  function renderStats(period) {
    _statsPeriod = period;
    document.querySelectorAll('.stats-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.period === period);
    });

    const { completed, total, streak } = calcStats(period);
    const rate = total ? Math.round((completed / total) * 100) : 0;
    const catStats = calcCategoryStats(period);

    document.getElementById('stats-grid').innerHTML = `
      <div class="stats-main-row">
        <div class="stats-rate-block">
          <div class="stats-rate-circle">
            <svg viewBox="0 0 36 36" class="stats-donut">
              <circle class="donut-bg" cx="18" cy="18" r="15.9" fill="none" stroke-width="3"/>
              <circle class="donut-fill" cx="18" cy="18" r="15.9" fill="none" stroke-width="3"
                stroke-dasharray="${rate} ${100 - rate}" stroke-dashoffset="25"/>
            </svg>
            <span class="stats-rate-num">${rate}%</span>
          </div>
          <span class="stats-rate-label">Completion</span>
        </div>
        <div class="stats-cards-col">
          <div class="stats-mini-card">
            <span class="stats-mini-val">${completed}</span>
            <span class="stats-mini-lbl">Completed</span>
          </div>
          <div class="stats-mini-card">
            <span class="stats-mini-val">${total}</span>
            <span class="stats-mini-lbl">Total</span>
          </div>
          <div class="stats-mini-card accent">
            <span class="stats-mini-val">${streak} 🔥</span>
            <span class="stats-mini-lbl">Daily Streak</span>
          </div>
        </div>
      </div>
      ${catStats.length ? `
      <div class="stats-cat-section">
        <p class="stats-cat-title">Categories</p>
        ${catStats.map(c => `
          <div class="stats-cat-row">
            <span class="stats-cat-dot" style="background:${c.color}"></span>
            <span class="stats-cat-name">${c.label}</span>
            <div class="stats-cat-bar-wrap">
              <div class="stats-cat-bar" style="width:${c.pct}%;background:${c.color}"></div>
            </div>
            <span class="stats-cat-count">${c.count}</span>
          </div>`).join('')}
      </div>` : ''}
    `;
  }

  function calcStats(period) {
    const tasks = STATE.data.tasks;
    const today = new Date();
    const days  = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;
    let completed = 0, total = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = dateKey(d);
      const dt = tasks[k] || [];
      total     += dt.length;
      completed += dt.filter(t => t.done).length;
    }
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = dateKey(d);
      if ((tasks[k]||[]).some(t => t.done)) streak++;
      else if (i > 0) break;
    }
    return { completed, total, streak };
  }

  function calcCategoryStats(period) {
    const tasks = STATE.data.tasks;
    const today = new Date();
    const days  = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;
    const counts = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = dateKey(d);
      (tasks[k] || []).filter(t => t.done).forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + 1;
      });
    }
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({
        label: (CATEGORIES[cat] || CATEGORIES.other).label,
        color: (CATEGORIES[cat] || CATEGORIES.other).color,
        count,
        pct: Math.round((count / max) * 100),
      }));
  }

  function renderRecentBadges() {
    const badges = getBadges();
    const el     = document.getElementById('recent-badges');
    const ALL    = getAllBadgeDefs();
    if (badges.length === 0) {
      el.innerHTML = `<p style="font-size:13px;color:var(--text-muted);padding:6px 0">No badges earned yet.</p>`;
      return;
    }
    el.innerHTML = badges.slice(-3).reverse().map(b => {
      const def  = ALL.find(d => d.id === b.id) || { name: b.id, emoji: '🏅' };
      const date = new Date(b.earnedAt).toLocaleDateString('en-US');
      return `
        <div class="badge-row-mini">
          <div class="badge-icon-mini">${def.emoji}</div>
          <div class="badge-info-mini">
            <div class="badge-name-mini">${def.name}</div>
            <div class="badge-date-mini">${date}</div>
          </div>
        </div>`;
    }).join('');
  }

  function renderImportExport() {
    const el = document.getElementById('import-export-section');

    const current = localStorage.getItem('sl_theme') || 'night';
    const themes = [
      { id: 'night',  label: 'Night'  },
      { id: 'dawn',   label: 'Dawn'   },
      { id: 'forest', label: 'Forest' },
      { id: 'light',  label: 'Light'  },
      { id: 'amber',  label: 'Amber'  },
    ];

    if (!el) return;
    el.innerHTML = `
      <div class="ie-section">
        <p class="theme-section-title">Data</p>
        <div class="ie-buttons">
          <button class="ie-btn" id="export-btn" style="padding-left:3%; padding-right:3%">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <button class="ie-btn" id="import-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="17"/>
            </svg>
            Import
          </button>
        </div>
        <input type="file" id="import-file-input" accept=".json" style="display:none">
      </div>

       <div style="padding: 20px 28px 24px;">
        <p class="theme-section-title">Theme</p>
        <div class="theme-swatches">
          ${themes.map(t => `
            <button class="theme-swatch ${t.id === current ? 'active' : ''}"
              data-theme="${t.id}" title="${t.label}" aria-label="${t.label} theme">
            </button>`).join('')}
        </div>
      </div>`;

    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', handleImport);
  }

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      user: STATE.user,
      data: STATE.data,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `streamline-${STATE.user}-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const d = parsed.data || parsed;
        if (!d.tasks || !d.counters || !d.schemas || !d.badges) {
          alert('Invalid Streamline backup file.');
          return;
        }
        showConfirm(
          'This will overwrite your current data. This cannot be undone. Continue?',
          () => {
            STATE.data.tasks    = d.tasks;
            STATE.data.counters = d.counters;
            STATE.data.schemas  = d.schemas;
            STATE.data.badges   = d.badges;
            markDirty();
            emit('tasks:changed',    todayKey());
            emit('counters:changed', null);
            emit('schemas:changed',  null);
            renderProfile();
          }
        );
      } catch {
        alert('Could not read file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function initProfile() {
    document.querySelectorAll('.stats-tab').forEach(tab => {
      tab.addEventListener('click', () => renderStats(tab.dataset.period));
    });
    document.addEventListener('click', e => {
      const swatch = e.target.closest('.theme-swatch');
      if (!swatch) return;
      const theme = swatch.dataset.theme;
      applyTheme(theme);
      renderImportExport();
    });
  }

  window.renderProfile = renderProfile;
  window.initProfile   = initProfile;

})();
