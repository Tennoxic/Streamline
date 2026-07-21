(function () {
  'use strict';

  const HOME_CARDS = [
    { route: 'daily',    label: 'Daily\nView',    emoji: '📅', glow: 'rgba(124,111,255,0.3)' },
    { route: 'monthly',  label: 'Monthly\nView',  emoji: '🗓️', glow: 'rgba(78,159,255,0.3)'  },
    { route: 'counters', label: 'Counters',       emoji: '🔢', glow: 'rgba(81,207,102,0.3)'  },
    { route: 'schemas',  label: 'Routines',       emoji: '📋', glow: 'rgba(255,212,59,0.3)'  },
    { route: 'profile',  label: 'Profile',        emoji: '👤', glow: 'rgba(204,93,232,0.3)'  },
    { route: 'badges',   label: 'Badges',         emoji: '🏆', glow: 'rgba(255,140,66,0.3)'  },
  ];

  function renderHome() {
    document.getElementById('home-username').textContent = capitalize(STATE.user);
    const grid = document.getElementById('home-grid');
    grid.innerHTML = HOME_CARDS.map((c, i) => `
      <button class="home-card" data-route="${c.route}"
        style="--card-glow:${c.glow}; animation-delay:${i * 0.05}s">
        <span class="home-card-icon">${c.emoji}</span>
        <span class="home-card-label">${c.label.replace('\n','<br>')}</span>
      </button>
    `).join('');
    grid.querySelectorAll('.home-card').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.route));
    });
  }

  window.renderHome = renderHome;

})();
