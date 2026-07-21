(function () {
  'use strict';

  const STORAGE_KEY = 'streamline_user';

  document.addEventListener('DOMContentLoaded', () => {

    applyTheme(localStorage.getItem('sl_theme') || 'night');

    let _serverReady = false;
    const _wakeIndicator = document.getElementById('server-wake-indicator');

    function pingServer() {
      fetch('/api/health')
        .then(res => {
          if (res.ok) {
            _serverReady = true;
            if (_wakeIndicator) _wakeIndicator.classList.add('hidden');
          }
        })
        .catch(() => {
          if (_wakeIndicator) _wakeIndicator.classList.remove('hidden');
          setTimeout(pingServer, 3000);
        });
    }
    pingServer();

    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      bootWithUser(savedUser);
      return;
    }

    const loginInput = document.getElementById('login-input');
    const loginBtn   = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    async function attemptLogin() {
      const raw = loginInput.value.trim().toLowerCase();
      loginError.classList.add('hidden');
      if (!raw) { loginInput.focus(); return; }
      loginBtn.disabled = true;
      loginBtn.textContent = '...';
      try {
        const result = await apiLogin(raw);
        if (!result.ok) throw new Error('invalid');
        localStorage.setItem(STORAGE_KEY, raw);
        initState(raw, result.data);
        tickDayCounters();
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        bootApp(raw);
      } catch (e) {
        loginError.classList.remove('hidden');
        loginInput.select();
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
      }
    }

    loginBtn.addEventListener('click', attemptLogin);
    loginInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

    async function bootWithUser(username) {
      try {
        const result = await apiLogin(username);
        if (!result.ok) throw new Error('invalid');
        initState(username, result.data);
        tickDayCounters();
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        bootApp(username);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('login-screen').classList.remove('hidden');
      }
    }

    function bootApp(username) {
      initDaily();
      initMonthly();
      initCounters();
      initSchemas();
      initBadges();
      initProfile();

      renderHome();
      renderDaily();

      onNavigate(route => {
        switch (route) {
          case 'home':     renderHome();     break;
          case 'daily':    renderDaily();    break;
          case 'monthly':  renderMonthly();  break;
          case 'counters': renderCounters(); break;
          case 'schemas':  renderSchemas();  break;
          case 'profile':  renderProfile();  break;
          case 'badges':   renderBadges();   break;
        }
      });

      startSyncLoop(username);
      if (typeof initNotifications === 'function') initNotifications();

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') doSync(username);
      });

      navigate('home');
    }

  });

})();
