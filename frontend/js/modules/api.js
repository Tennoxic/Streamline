(function () {
  'use strict';

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '';

  const SYNC_INTERVAL = 10_000;
  let _syncLoop = null;

  async function apiLogin(username) {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error('login_failed');
    return res.json();
  }

  async function apiPushData(username, data) {
    const res = await fetch(`${API_BASE}/api/data/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error('push_failed');
    return res.json();
  }

  function startSyncLoop(username) {
    stopSyncLoop();
    _syncLoop = setInterval(async () => {
      if (!isDirty()) return;
      await doSync(username);
    }, SYNC_INTERVAL);
  }

  function stopSyncLoop() {
    if (_syncLoop) { clearInterval(_syncLoop); _syncLoop = null; }
  }

  async function doSync(username) {
    if (!isDirty()) return;
    setSyncStatus('pending');
    try {
      const snapshot = getSnapshot();
      await apiPushData(username, snapshot);
      markClean();
      setSyncStatus('ok');
      hideSyncErrorBanner();
    } catch (e) {
      console.error('Sync failed:', e);
      setSyncStatus('error');
      showSyncErrorBanner();
    }
  }

  function setSyncStatus(status) {
    const dot = document.getElementById('sync-indicator')?.querySelector('.sync-dot');
    if (!dot) return;
    dot.className = 'sync-dot';
    if (status === 'pending') dot.classList.add('pending');
    if (status === 'error')   dot.classList.add('error');
  }

  function showSyncErrorBanner() {
    let banner = document.getElementById('sync-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'sync-error-banner';
      banner.className = 'sync-error-banner';
      banner.innerHTML = `
        <span class="sync-error-icon">⚠️</span>
        <span class="sync-error-text">Could not save data. Check your connection.</span>
      `;
      document.body.appendChild(banner);
    }
    banner.classList.add('visible');
  }

  function hideSyncErrorBanner() {
    const banner = document.getElementById('sync-error-banner');
    if (banner) banner.classList.remove('visible');
  }

  on('sync:dirty', () => setSyncStatus('pending'));
  on('sync:clean', () => setSyncStatus('ok'));

  window.apiLogin       = apiLogin;
  window.apiPushData    = apiPushData;
  window.startSyncLoop  = startSyncLoop;
  window.stopSyncLoop   = stopSyncLoop;
  window.doSync         = doSync;
  window.setSyncStatus  = setSyncStatus;

})();
