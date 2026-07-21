(function () {
  'use strict';

  function getAllBadgeDefs() {
    return [
      { id: 'first_task',   name: 'First Step',       emoji: '👣', goal: 1,    progressFn: totalCompleted },
      { id: 'tasks_5',      name: '5 Tasks',          emoji: '🌱', goal: 5,    progressFn: totalCompleted },
      { id: 'tasks_10',     name: '10 Tasks',         emoji: '✅', goal: 10,   progressFn: totalCompleted },
      { id: 'tasks_25',     name: '25 Tasks',         emoji: '⭐', goal: 25,   progressFn: totalCompleted },
      { id: 'tasks_50',     name: '50 Tasks',         emoji: '🎯', goal: 50,   progressFn: totalCompleted },
      { id: 'tasks_100',    name: '100 Tasks',        emoji: '💯', goal: 100,  progressFn: totalCompleted },
      { id: 'tasks_250',    name: '250 Tasks',        emoji: '🏆', goal: 250,  progressFn: totalCompleted },
      { id: 'tasks_500',    name: '500 Tasks',        emoji: '🥇', goal: 500,  progressFn: totalCompleted },
      { id: 'tasks_1000',   name: '1000 Tasks',       emoji: '🚀', goal: 1000, progressFn: totalCompleted },
      { id: 'tasks_2000',   name: '2000 Tasks',       emoji: '🌠', goal: 2000, progressFn: totalCompleted },
      { id: 'tasks_5000',   name: 'Legend',           emoji: '🔱', goal: 5000, progressFn: totalCompleted },

      { id: 'streak_3',     name: '3-Day Streak',     emoji: '🔥', goal: 3,   progressFn: currentStreak },
      { id: 'streak_7',     name: 'One Week Strong',  emoji: '🗓️', goal: 7,   progressFn: currentStreak },
      { id: 'streak_14',    name: 'Two Weeks',        emoji: '💪', goal: 14,  progressFn: currentStreak },
      { id: 'streak_21',    name: '3-Week Discipline',emoji: '🧠', goal: 21,  progressFn: currentStreak },
      { id: 'streak_30',    name: 'Full Month',       emoji: '🌙', goal: 30,  progressFn: currentStreak },
      { id: 'streak_60',    name: 'Two Months',       emoji: '🌟', goal: 60,  progressFn: currentStreak },
      { id: 'streak_90',    name: 'Quarter Focus',    emoji: '💎', goal: 90,  progressFn: currentStreak },
      { id: 'streak_180',   name: 'Half a Year',      emoji: '🌈', goal: 180, progressFn: currentStreak },
      { id: 'streak_365',   name: 'Full Year',        emoji: '👑', goal: 365, progressFn: currentStreak },
      { id: 'streak_500',   name: '500 Days',         emoji: '⚜️', goal: 500, progressFn: currentStreak },
      { id: 'streak_730',   name: 'Two Years',        emoji: '🏛️', goal: 730, progressFn: currentStreak },

      { id: 'sport_5',      name: 'Warm Up',          emoji: '🏃', goal: 5,   progressFn: completedByCategory('sport') },
      { id: 'sport_10',     name: 'Athlete',          emoji: '🏋️', goal: 10,  progressFn: completedByCategory('sport') },
      { id: 'sport_25',     name: 'Fighter',          emoji: '🥊', goal: 25,  progressFn: completedByCategory('sport') },
      { id: 'sport_50',     name: 'Champion',         emoji: '🏅', goal: 50,  progressFn: completedByCategory('sport') },
      { id: 'sport_100',    name: 'Legendary Athlete',emoji: '⚡', goal: 100, progressFn: completedByCategory('sport') },
      { id: 'sport_200',    name: 'Olympic Spirit',   emoji: '🏟️', goal: 200, progressFn: completedByCategory('sport') },

      { id: 'study_5',      name: 'Curious',          emoji: '📖', goal: 5,   progressFn: completedByCategory('education') },
      { id: 'study_10',     name: 'Student',          emoji: '📚', goal: 10,  progressFn: completedByCategory('education') },
      { id: 'study_25',     name: 'Researcher',       emoji: '🔬', goal: 25,  progressFn: completedByCategory('education') },
      { id: 'study_50',     name: 'Academic',         emoji: '🎓', goal: 50,  progressFn: completedByCategory('education') },
      { id: 'study_100',    name: 'Expert',           emoji: '🧬', goal: 100, progressFn: completedByCategory('education') },
      { id: 'study_200',    name: 'Doctor',           emoji: '🔭', goal: 200, progressFn: completedByCategory('education') },
      { id: 'study_500',    name: 'Professor',        emoji: '🏫', goal: 500, progressFn: completedByCategory('education') },

      { id: 'work_5',       name: 'Entrepreneur',     emoji: '💡', goal: 5,   progressFn: completedByCategory('work') },
      { id: 'work_10',      name: 'Hard Worker',      emoji: '💼', goal: 10,  progressFn: completedByCategory('work') },
      { id: 'work_25',      name: 'Efficient',        emoji: '📊', goal: 25,  progressFn: completedByCategory('work') },
      { id: 'work_50',      name: 'Professional',     emoji: '🏢', goal: 50,  progressFn: completedByCategory('work') },
      { id: 'work_100',     name: 'CEO Spirit',       emoji: '🦾', goal: 100, progressFn: completedByCategory('work') },
      { id: 'work_200',     name: 'Visionary',        emoji: '🌐', goal: 200, progressFn: completedByCategory('work') },
      { id: 'work_500',     name: 'Leader',           emoji: '🗺️', goal: 500, progressFn: completedByCategory('work') },

      { id: 'health_5',     name: 'Healthy Start',    emoji: '🥗', goal: 5,   progressFn: completedByCategory('health') },
      { id: 'health_10',    name: 'Health Focused',   emoji: '💊', goal: 10,  progressFn: completedByCategory('health') },
      { id: 'health_25',    name: 'Wellness Guru',    emoji: '🧘', goal: 25,  progressFn: completedByCategory('health') },
      { id: 'health_50',    name: 'Health Master',    emoji: '❤️', goal: 50,  progressFn: completedByCategory('health') },
      { id: 'health_100',   name: 'Nature Friend',    emoji: '🌿', goal: 100, progressFn: completedByCategory('health') },
      { id: 'health_200',   name: 'Long-Lived',       emoji: '🍀', goal: 200, progressFn: completedByCategory('health') },

      { id: 'creative_5',   name: 'Idea Seed',        emoji: '💭', goal: 5,   progressFn: completedByCategory('creative') },
      { id: 'creative_10',  name: 'Creative',         emoji: '🎨', goal: 10,  progressFn: completedByCategory('creative') },
      { id: 'creative_25',  name: 'Artist',           emoji: '🎭', goal: 25,  progressFn: completedByCategory('creative') },
      { id: 'creative_50',  name: 'Master Artist',    emoji: '🖌️', goal: 50,  progressFn: completedByCategory('creative') },
      { id: 'creative_100', name: 'Genius',           emoji: '🧩', goal: 100, progressFn: completedByCategory('creative') },

      { id: 'social_5',     name: 'Connection',       emoji: '🤝', goal: 5,   progressFn: completedByCategory('social') },
      { id: 'social_10',    name: 'Social Butterfly', emoji: '🦋', goal: 10,  progressFn: completedByCategory('social') },
      { id: 'social_25',    name: 'Community Leader', emoji: '👥', goal: 25,  progressFn: completedByCategory('social') },
      { id: 'social_50',    name: 'Inspiring',        emoji: '🌍', goal: 50,  progressFn: completedByCategory('social') },

      { id: 'finance_5',    name: 'Budget Tracker',   emoji: '📋', goal: 5,   progressFn: completedByCategory('finance') },
      { id: 'finance_10',   name: 'Saver',            emoji: '💰', goal: 10,  progressFn: completedByCategory('finance') },
      { id: 'finance_25',   name: 'Investor',         emoji: '📈', goal: 25,  progressFn: completedByCategory('finance') },
      { id: 'finance_50',   name: 'Finance Guru',     emoji: '🏦', goal: 50,  progressFn: completedByCategory('finance') },
      { id: 'finance_100',  name: 'Wealth Architect', emoji: '💎', goal: 100, progressFn: completedByCategory('finance') },

      { id: 'personal_5',   name: 'Self Investment',  emoji: '🪞', goal: 5,   progressFn: completedByCategory('personal') },
      { id: 'night_owl',    name: 'Night Owl',        emoji: '🦉', goal: 10,  progressFn: completedByCategory('personal') },
      { id: 'personal_25',  name: 'Self Discipline',  emoji: '🧭', goal: 25,  progressFn: completedByCategory('personal') },
      { id: 'personal_50',  name: 'Inner Peace',      emoji: '☮️', goal: 50,  progressFn: completedByCategory('personal') },

      { id: 'schemas_1',    name: 'First Routine',    emoji: '📋', goal: 1,   progressFn: totalSchemas },
      { id: 'schemas_3',    name: 'Planner',          emoji: '🗂️', goal: 3,   progressFn: totalSchemas },
      { id: 'schemas_5',    name: 'System Builder',   emoji: '⚙️', goal: 5,   progressFn: totalSchemas },
      { id: 'schemas_10',   name: 'Routine Architect',emoji: '🏗️', goal: 10,  progressFn: totalSchemas },
      { id: 'counters_1',   name: 'First Counter',    emoji: '🔢', goal: 1,   progressFn: totalCounters },
      { id: 'counters_3',   name: 'Tracking Expert',  emoji: '📈', goal: 3,   progressFn: totalCounters },
      { id: 'counters_5',   name: 'Data Analyst',     emoji: '📉', goal: 5,   progressFn: totalCounters },
      { id: 'counters_10',  name: 'Statistician',     emoji: '🔭', goal: 10,  progressFn: totalCounters },

      { id: 'speed_3',      name: 'Speed Boost',      emoji: '⚡', goal: 3,   progressFn: tasksInOneDay },
      { id: 'speed_5',      name: 'Full Throttle',    emoji: '🏎️', goal: 5,   progressFn: tasksInOneDay },
      { id: 'speed_10',     name: 'Like a Machine',   emoji: '🤖', goal: 10,  progressFn: tasksInOneDay },
      { id: 'speed_20',     name: 'Superhuman',       emoji: '🦸', goal: 20,  progressFn: tasksInOneDay },

      { id: 'early_bird',   name: 'Early Bird',       emoji: '🌅', goal: 7,   progressFn: currentStreak },
      { id: 'consistency',  name: 'Consistency Award',emoji: '🎖️', goal: 30,  progressFn: totalCompleted },
      { id: 'perfectionist',name: 'Perfectionist',    emoji: '💫', goal: 100, progressFn: totalCompleted },
      { id: 'overachiever', name: 'Overachiever',     emoji: '🔋', goal: 200, progressFn: totalCompleted },
      { id: 'unstoppable',  name: 'Unstoppable',      emoji: '🌊', goal: 500, progressFn: totalCompleted },
      { id: 'legend',       name: 'Legend',           emoji: '🗡️', goal: 1000, progressFn: totalCompleted },
    ];
  }

  function totalCompleted() {
    return Object.values(STATE.data.tasks).flat().filter(t => t.done).length;
  }
  function tasksInOneDay() {
    let max = 0;
    for (const tasks of Object.values(STATE.data.tasks)) {
      const done = tasks.filter(t => t.done).length;
      if (done > max) max = done;
    }
    return max;
  }
  function currentStreak() {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = dateKey(d);
      if ((STATE.data.tasks[k] || []).some(t => t.done)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }
  function totalSchemas()  { return STATE.data.schemas.length; }
  function totalCounters() { return STATE.data.counters.length; }
  function completedByCategory(cat) {
    return () => Object.values(STATE.data.tasks).flat()
      .filter(t => t.done && t.category === cat).length;
  }

  function makeMemoCache() {
    const _cache = new Map();
    return function memoCall(fn) {
      if (!_cache.has(fn)) _cache.set(fn, fn());
      return _cache.get(fn);
    };
  }

  function checkAndAwardBadges() {
    const defs    = getAllBadgeDefs();
    const earned  = getBadges().map(b => b.id);
    const memo    = makeMemoCache();

    defs.forEach(def => {
      if (earned.includes(def.id)) return;
      const prog = typeof def.progressFn === 'function' ? memo(def.progressFn) : 0;
      if (prog >= def.goal) earnBadge(def.id);
    });
  }

  function renderBadges() {
    checkAndAwardBadges();
    const defs   = getAllBadgeDefs();
    const earned = getBadges().map(b => b.id);
    const memo   = makeMemoCache();

    document.getElementById('badges-grid').innerHTML = defs.map(def => {
      const isEarned = earned.includes(def.id);
      const prog     = typeof def.progressFn === 'function' ? memo(def.progressFn) : 0;
      const current  = Math.min(prog, def.goal);
      const pct      = Math.round((current / def.goal) * 100);
      return `
        <div class="badge-card ${isEarned ? 'earned' : ''}">
          <div class="badge-circle">${def.emoji}</div>
          <div class="badge-card-name">${def.name}</div>
          <div class="badge-card-progress">
            <div class="badge-progress-bar">
              <div class="badge-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="badge-progress-text">${current} / ${def.goal}</div>
          </div>
        </div>`;
    }).join('');
  }

  function initBadges() {
    on('tasks:changed',    () => { if (currentRoute() === 'badges') renderBadges(); });
    on('counters:changed', () => { if (currentRoute() === 'badges') renderBadges(); });
    on('schemas:changed',  () => { if (currentRoute() === 'badges') renderBadges(); });
  }

  window.renderBadges        = renderBadges;
  window.initBadges          = initBadges;
  window.checkAndAwardBadges = checkAndAwardBadges;
  window.totalCompleted      = totalCompleted;
  window.currentStreak       = currentStreak;
  window.getAllBadgeDefs     = getAllBadgeDefs;

})();
