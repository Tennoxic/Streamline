(function () {
  'use strict';

  const CATEGORIES = {
    education: { label: 'Education',      color: '#4e9fff', rgb: '78,159,255',  emoji: '📚' },
    personal:  { label: 'Personal Growth', color: '#a78bfa', rgb: '167,139,250', emoji: '🌱' },
    work:      { label: 'Work',            color: '#ff6b6b', rgb: '255,107,107', emoji: '💼' },
    sport:     { label: 'Sport',           color: '#51cf66', rgb: '81,207,102',  emoji: '🏃' },
    social:    { label: 'Social',          color: '#ffd43b', rgb: '255,212,59',  emoji: '👥' },
    home:      { label: 'Home',            color: '#ff8c42', rgb: '255,140,66',  emoji: '🏠' },
    other:     { label: 'Other',           color: '#cc5de8', rgb: '204,93,232',  emoji: '✨' },
  };

  const DURATIONS = [
    { label: '15m',  value: 15  },
    { label: '30m',  value: 30  },
    { label: '45m',  value: 45  },
    { label: '1h',   value: 60  },
    { label: '2h',   value: 120 },
  ];

  const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function todayKey() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date());
  }
  function dateKey(date) {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(date);
  }
  function formatDateFull(dateStr) {
    const [y,m,d] = dateStr.split('-').map(Number);
    const date = new Date(y, m-1, d);
    return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[m-1]} ${y}`;
  }
  function formatMonthLabel(year, month) {
    return `${MONTHS[month]} ${year}`;
  }
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }
  function formatDuration(minutes) {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes/60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  function initials(name) {
    return name ? name.slice(0,1).toUpperCase() : '?';
  }
  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window.CATEGORIES       = CATEGORIES;
  window.DURATIONS        = DURATIONS;
  window.WEEKDAYS         = WEEKDAYS;
  window.MONTHS           = MONTHS;
  window.todayKey         = todayKey;
  window.dateKey          = dateKey;
  window.formatDateFull   = formatDateFull;
  window.formatMonthLabel = formatMonthLabel;
  window.getDaysInMonth   = getDaysInMonth;
  window.uid              = uid;
  window.formatDuration   = formatDuration;
  window.initials         = initials;
  window.capitalize       = capitalize;
  window.escapeHtml       = escapeHtml;

  function applyTheme(theme) {
    const valid = ['night', 'dawn', 'forest', 'light', 'amber'];
    const t = valid.includes(theme) ? theme : 'night';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('sl_theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const colors = { night:'#111214', dawn:'#0d0e1a', forest:'#0a110d', light:'#f0f0f2', amber:'#12100a' };
      meta.content = colors[t] || '#111214';
    }
  }
  window.applyTheme = applyTheme;

})();
