(function () {
  'use strict';

  const STATE = {
    user: null,
    data: {},
    dirty: false,
    syncTimer: null,
    listeners: {},
  };

  function emptyUserData() {
    return {
      tasks:    {},
      notes:    {},
      counters: [],
      schemas:  [],
      badges:   [],
    };
  }

  function initState(user, serverData) {
    STATE.user = user;
    STATE.data = mergeData(emptyUserData(), serverData || {});
    markClean();
  }

  function mergeData(base, incoming) {
    return {
      tasks:    { ...base.tasks,    ...(incoming.tasks    || {}) },
      notes:    { ...base.notes,    ...(incoming.notes    || {}) },
      counters: incoming.counters  || base.counters,
      schemas:  incoming.schemas   || base.schemas,
      badges:   incoming.badges    || base.badges,
    };
  }

  function getTasks(dateKey) {
    return (STATE.data.tasks[dateKey] || []).slice();
  }

  function addTask(dateKey, task) {
    if (!STATE.data.tasks[dateKey]) STATE.data.tasks[dateKey] = [];
    STATE.data.tasks[dateKey].push(task);
    markDirty();
    emit('tasks:changed', dateKey);
  }

  function completeTask(dateKey, taskId) {
    const tasks = STATE.data.tasks[dateKey];
    if (!tasks) return;
    const t = tasks.find(t => t.id === taskId);
    if (t) {
      t.done = true;
      t.completedAt = new Date().toISOString();
      markDirty();
      emit('tasks:changed', dateKey);
    }
  }

  function deleteTask(dateKey, taskId) {
    const tasks = STATE.data.tasks[dateKey];
    if (!tasks) return;
    STATE.data.tasks[dateKey] = tasks.filter(t => t.id !== taskId);
    markDirty();
    emit('tasks:changed', dateKey);
  }

  function addTasksForDate(dateKey, taskObjs) {
    if (!STATE.data.tasks[dateKey]) STATE.data.tasks[dateKey] = [];
    taskObjs.forEach(t => STATE.data.tasks[dateKey].push(t));
    markDirty();
    emit('tasks:changed', dateKey);
  }

  function getNotes(dateKey) {
    return (STATE.data.notes[dateKey] || []).slice();
  }

  function addNote(dateKey, note) {
    if (!STATE.data.notes[dateKey]) STATE.data.notes[dateKey] = [];
    STATE.data.notes[dateKey].push(note);
    markDirty();
    emit('notes:changed', dateKey);
  }

  function getCounters() { return STATE.data.counters.slice(); }

  function addCounter(counter) {
    STATE.data.counters.push(counter);
    markDirty();
    emit('counters:changed');
  }

  function incrementCounter(id) {
    const c = STATE.data.counters.find(c => c.id === id);
    if (c) { c.value = (c.value || 0) + 1; markDirty(); emit('counters:changed'); }
  }

  function resetCounter(id) {
    const c = STATE.data.counters.find(c => c.id === id);
    if (c) { c.value = 0; markDirty(); emit('counters:changed'); }
  }

  function deleteCounter(id) {
    STATE.data.counters = STATE.data.counters.filter(c => c.id !== id);
    markDirty();
    emit('counters:changed');
  }

  function getSchemas() { return STATE.data.schemas.slice(); }

  function addSchema(schema) {
    STATE.data.schemas.push(schema);
    markDirty();
    emit('schemas:changed');
  }

  function deleteSchema(id) {
    STATE.data.schemas = STATE.data.schemas.filter(s => s.id !== id);
    markDirty();
    emit('schemas:changed');
  }

  function updateSchema(id, updates) {
    const idx = STATE.data.schemas.findIndex(s => s.id === id);
    if (idx !== -1) {
      STATE.data.schemas[idx] = { ...STATE.data.schemas[idx], ...updates };
      markDirty();
      emit('schemas:changed');
    }
  }

  function getBadges() { return STATE.data.badges.slice(); }

  function earnBadge(badgeId) {
    if (!STATE.data.badges.find(b => b.id === badgeId)) {
      STATE.data.badges.push({ id: badgeId, earnedAt: new Date().toISOString() });
      markDirty();
      emit('badges:changed');
    }
  }

  function resetMonth(year, month) {
    const today = new Date();
    const todayStr = dateKey(today);
    const days = getDaysInMonth(year, month);
    for (let d = 1; d <= days; d++) {
      const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (key >= todayStr) {
        STATE.data.tasks[key] = (STATE.data.tasks[key] || []).filter(t => t.done);
      }
    }
    markDirty();
    emit('tasks:bulk');
  }

  function copyMonthToNext(year, month) {
    const days = getDaysInMonth(year, month);
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear  = month === 11 ? year + 1 : year;
    const nextDays  = getDaysInMonth(nextYear, nextMonth);

    for (let d = 1; d <= Math.min(days, nextDays); d++) {
      const srcKey  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const destKey = `${nextYear}-${String(nextMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const src = (STATE.data.tasks[srcKey] || []).filter(t => !t.done);
      if (src.length) {
        const copies = src.map(t => ({ ...t, id: uid(), done: false, completedAt: null }));
        if (!STATE.data.tasks[destKey]) STATE.data.tasks[destKey] = [];
        copies.forEach(c => STATE.data.tasks[destKey].push(c));
      }
    }
    markDirty();
    emit('tasks:bulk');
  }

  function markDirty() {
    STATE.dirty = true;
    emit('sync:dirty');
  }
  function markClean() {
    STATE.dirty = false;
    emit('sync:clean');
  }
  function isDirty() { return STATE.dirty; }
  function getSnapshot() { return JSON.parse(JSON.stringify(STATE.data)); }

  function on(event, fn) {
    if (!STATE.listeners[event]) STATE.listeners[event] = [];
    STATE.listeners[event].push(fn);
  }
  function off(event, fn) {
    if (!STATE.listeners[event]) return;
    STATE.listeners[event] = STATE.listeners[event].filter(f => f !== fn);
  }
  function emit(event, payload) {
    (STATE.listeners[event] || []).forEach(fn => fn(payload));
  }

  function tickDayCounters() {
    const lastTick = localStorage.getItem(`streamline_last_tick_${STATE.user}`);
    const today = todayKey();
    if (lastTick === today) return;
    let changed = false;
    STATE.data.counters.forEach(c => {
      if (c.type === 'day') { c.value = (c.value || 0) + 1; changed = true; }
    });
    localStorage.setItem(`streamline_last_tick_${STATE.user}`, today);
    if (changed) { markDirty(); emit('counters:changed'); }
  }

  function undoComplete(dateKey, taskId) {
    const tasks = STATE.data.tasks[dateKey];
    if (!tasks) return;
    const t = tasks.find(t => t.id === taskId);
    if (t && t.done) {
      t.done        = false;
      t.completedAt = null;
      markDirty();
      emit('tasks:changed', dateKey);
    }
  }

  function reorderTasks(dateKey, fromIdx, toIdx) {
    const tasks = STATE.data.tasks[dateKey];
    if (!tasks || fromIdx === toIdx) return;
    const moved = tasks.splice(fromIdx, 1)[0];
    tasks.splice(toIdx, 0, moved);
    markDirty();
    emit('tasks:changed', dateKey);
  }

  window.STATE             = STATE;
  window.initState         = initState;
  window.getTasks          = getTasks;
  window.addTask           = addTask;
  window.completeTask      = completeTask;
  window.undoComplete      = undoComplete;
  window.reorderTasks      = reorderTasks;
  window.deleteTask        = deleteTask;
  window.addTasksForDate   = addTasksForDate;
  window.getNotes          = getNotes;
  window.addNote           = addNote;
  window.getCounters       = getCounters;
  window.addCounter        = addCounter;
  window.incrementCounter  = incrementCounter;
  window.resetCounter      = resetCounter;
  window.deleteCounter     = deleteCounter;
  window.getSchemas        = getSchemas;
  window.addSchema         = addSchema;
  window.deleteSchema      = deleteSchema;
  window.updateSchema      = updateSchema;
  window.getBadges         = getBadges;
  window.earnBadge         = earnBadge;
  window.resetMonth        = resetMonth;
  window.copyMonthToNext   = copyMonthToNext;
  window.markDirty         = markDirty;
  window.markClean         = markClean;
  window.isDirty           = isDirty;
  window.getSnapshot       = getSnapshot;
  window.on                = on;
  window.off               = off;
  window.emit              = emit;
  window.tickDayCounters   = tickDayCounters;

})();
