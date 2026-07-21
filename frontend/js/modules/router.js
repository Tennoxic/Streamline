(function () {
  'use strict';

  const ROUTES = {
    home:     { viewId: 'view-home',     title: 'Streamline',   showBack: false },
    daily:    { viewId: 'view-daily',    title: 'Daily View',   showBack: true  },
    monthly:  { viewId: 'view-monthly',  title: 'Monthly View', showBack: true  },
    counters: { viewId: 'view-counters', title: 'Counters',     showBack: true  },
    schemas:  { viewId: 'view-schemas',  title: 'Routines',     showBack: true  },
    profile:  { viewId: 'view-profile',  title: 'Profile',      showBack: true  },
    badges:   { viewId: 'view-badges',   title: 'Badges',       showBack: true  },
  };

  let _currentRoute = 'home';
  let _onNavigate   = null;

  function navigate(routeName) {
    const next = ROUTES[routeName];
    if (!next) return;

    document.querySelectorAll('.view.active').forEach(v => {
      v.classList.remove('active');
    });

    const nextEl = document.getElementById(next.viewId);
    if (nextEl) {
      nextEl.classList.add('active');
    }

    const titleEl = document.getElementById('top-bar-title');
    const backBtn = document.getElementById('back-btn');
    if (titleEl) titleEl.textContent = next.title;
    if (backBtn) backBtn.classList.toggle('hidden', !next.showBack);

    _currentRoute = routeName;
    if (_onNavigate) _onNavigate(routeName);
  }

  function currentRoute() { return _currentRoute; }
  function onNavigate(fn) { _onNavigate = fn; }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('back-btn')?.addEventListener('click', () => navigate('home'));
  });

  window.navigate      = navigate;
  window.currentRoute  = currentRoute;
  window.onNavigate    = onNavigate;

})();
