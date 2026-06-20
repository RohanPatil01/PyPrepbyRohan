/* ============================================================
   PyPrepbyRohan — Extra Features
   Streak & XP · Topic Heatmap · Spaced Repetition
   Per-question Timer · Notes · Share Card · Random Challenge
   ============================================================ */
'use strict';

// ══════════════════════════════════════════════════════════════
// 1. XP & STREAK SYSTEM
// ══════════════════════════════════════════════════════════════
const XPSystem = (() => {
  const KEY = 'pyprep_xp';
  const LEVELS = [
    { min:0,    label:'Beginner',     icon:'🌱', color:'#4cde9a' },
    { min:100,  label:'Learner',      icon:'📖', color:'#4f8ef7' },
    { min:300,  label:'Practitioner', icon:'⚡', color:'#7c5cfc' },
    { min:600,  label:'Intermediate', icon:'🔥', color:'#ffb347' },
    { min:1000, label:'Advanced',     icon:'💎', color:'#ff5c5c' },
    { min:1500, label:'Expert',       icon:'🏆', color:'#ffd700' },
  ];

  const XP_REWARDS = {
    correct_answer:  10,
    complete_test:   25,
    perfect_score:   50,
    daily_login:     20,
    streak_bonus:    15,  // per day of streak
  };

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { xp:0, streak:0, lastDate:null, totalTests:0, perfectScores:0 }; }
    catch { return { xp:0, streak:0, lastDate:null, totalTests:0, perfectScores:0 }; }
  }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

  function getLevel(xp) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) { if (xp >= l.min) lvl = l; else break; }
    return lvl;
  }

  function getNextLevel(xp) {
    for (let i = 0; i < LEVELS.length - 1; i++) {
      if (xp < LEVELS[i+1].min) return LEVELS[i+1];
    }
    return null;
  }

  function awardXP(type, amount) {
    const d = get();
    const earned = amount || XP_REWARDS[type] || 0;
    d.xp += earned;
    save(d);
    showXPToast(earned, type);
    updateXPDisplay();
    return earned;
  }

  function recordTestComplete(correct, total) {
    const d = get();
    d.totalTests++;
    const earned = correct * XP_REWARDS.correct_answer + XP_REWARDS.complete_test;
    let bonus = 0;
    if (correct === total) { d.perfectScores++; bonus = XP_REWARDS.perfect_score; }
    d.xp += earned + bonus;

    // Streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now()-86400000).toDateString();
    if (d.lastDate !== today) {
      if (d.lastDate === yesterday) { d.streak++; } else { d.streak = 1; }
      d.lastDate = today;
      d.xp += XP_REWARDS.daily_login + (d.streak > 1 ? d.streak * XP_REWARDS.streak_bonus : 0);
    }
    save(d);
    updateXPDisplay();
    return { earned, bonus };
  }

  function showXPToast(amount, type) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:80px;right:24px;z-index:9999;
      background:linear-gradient(135deg,#7c5cfc,#4f8ef7);color:#fff;
      padding:10px 18px;border-radius:50px;font-weight:700;font-size:0.9rem;
      box-shadow:0 4px 20px rgba(124,92,252,0.4);
      animation:slideInRight 0.3s ease;pointer-events:none;`;
    el.textContent = `+${amount} XP`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity 0.4s'; setTimeout(()=>el.remove(),400); }, 2000);
  }

  function updateXPDisplay() {
    const d = get();
    const lvl = getLevel(d.xp);
    const next = getNextLevel(d.xp);

    // Update all XP widgets on page
    document.querySelectorAll('.xp-badge').forEach(el => {
      el.innerHTML = `${lvl.icon} <span>${lvl.label}</span> <span style="opacity:0.7;font-size:0.78rem;">${d.xp} XP</span>`;
      el.style.background = lvl.color + '22';
      el.style.borderColor = lvl.color + '55';
      el.style.color = lvl.color;
    });
    document.querySelectorAll('.xp-streak').forEach(el => {
      el.textContent = `🔥 ${d.streak} day streak`;
    });
    document.querySelectorAll('.xp-bar').forEach(bar => {
      const pct = next ? Math.round(((d.xp - (getLevel(d.xp).min)) / (next.min - getLevel(d.xp).min)) * 100) : 100;
      bar.style.width = pct + '%';
    });
  }

  function renderWidget(container) {
    if (!container) return;
    const d = get();
    const lvl = getLevel(d.xp);
    const next = getNextLevel(d.xp);
    const pct = next ? Math.round(((d.xp - lvl.min) / (next.min - lvl.min)) * 100) : 100;
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="width:52px;height:52px;border-radius:50%;background:${lvl.color}22;border:2px solid ${lvl.color};display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">${lvl.icon}</div>
        <div style="flex:1;min-width:160px;">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:2px;">${lvl.label} <span style="font-size:0.78rem;color:var(--text-muted);font-weight:400;">${d.xp} XP total</span></div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">${next ? `${next.min - d.xp} XP to ${next.icon} ${next.label}` : '🏆 Max Level Reached!'}</div>
          <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;">
            <div class="xp-bar" style="height:100%;width:${pct}%;background:${lvl.color};border-radius:3px;transition:width 0.6s ease;"></div>
          </div>
        </div>
        <div style="text-align:center;padding:10px 16px;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid var(--border-glass);">
          <div style="font-size:1.4rem;font-weight:800;color:var(--brand-danger);">🔥 ${d.streak}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">Day Streak</div>
        </div>
        <div style="text-align:center;padding:10px 16px;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid var(--border-glass);">
          <div style="font-size:1.4rem;font-weight:800;">${d.totalTests}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">Tests Done</div>
        </div>
      </div>`;
  }

  return { get, awardXP, recordTestComplete, updateXPDisplay, renderWidget, getLevel, LEVELS };
})();


// ══════════════════════════════════════════════════════════════
// 2. TOPIC HEATMAP
// ══════════════════════════════════════════════════════════════
const TopicHeatmap = (() => {
  const TOPICS = [
    'basics','variables','strings','lists','tuples','sets','dictionaries',
    'functions','lambda','comprehensions','oop','exceptions',
    'filehandling','modules','operators','loops','scope','mutability','generators'
  ];
  const LABELS = {
    basics:'Basics', variables:'Variables', strings:'Strings',
    lists:'Lists', tuples:'Tuples', sets:'Sets', dictionaries:'Dicts',
    functions:'Functions', lambda:'Lambda', comprehensions:'Comprehensions',
    oop:'OOP', exceptions:'Exceptions', filehandling:'File Handling',
    modules:'Modules', operators:'Operators', loops:'Loops',
    scope:'Scope', mutability:'Mutability', generators:'Generators'
  };

  function getScore(topic) {
    const d = window.PyPrep.Progress.get();
    const s = d.topicScores[topic];
    if (!s || !s.total) return null;
    return Math.round(s.score / s.total * 100);
  }

  function getColor(pct) {
    if (pct === null) return { bg:'var(--bg-secondary)', border:'var(--border-glass)', text:'var(--text-muted)' };
    if (pct >= 80) return { bg:'rgba(76,222,154,0.20)', border:'rgba(76,222,154,0.45)', text:'var(--brand-success)' };
    if (pct >= 60) return { bg:'rgba(79,142,247,0.18)', border:'rgba(79,142,247,0.40)', text:'var(--brand-primary)' };
    if (pct >= 40) return { bg:'rgba(255,179,71,0.18)', border:'rgba(255,179,71,0.40)', text:'var(--brand-warning)' };
    return { bg:'rgba(255,92,92,0.15)', border:'rgba(255,92,92,0.40)', text:'var(--brand-danger)' };
  }

  function render(container) {
    if (!container) return;
    container.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
        <h4 style="margin:0;">📊 Topic Performance Heatmap</h4>
        <div style="margin-left:auto;display:flex;gap:8px;font-size:0.72rem;flex-wrap:wrap;">
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:rgba(76,222,154,0.20);border:1px solid rgba(76,222,154,0.45);display:inline-block;"></span>80%+</span>
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:rgba(79,142,247,0.18);border:1px solid rgba(79,142,247,0.40);display:inline-block;"></span>60-79%</span>
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:rgba(255,179,71,0.18);border:1px solid rgba(255,179,71,0.40);display:inline-block;"></span>40-59%</span>
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:rgba(255,92,92,0.15);border:1px solid rgba(255,92,92,0.40);display:inline-block;"></span>&lt;40%</span>
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:var(--bg-secondary);border:1px solid var(--border-glass);display:inline-block;"></span>Not tried</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
        ${TOPICS.map(topic => {
          const pct = getScore(topic);
          const c   = getColor(pct);
          return `<div style="padding:10px 8px;border-radius:var(--radius-md);background:${c.bg};border:1px solid ${c.border};text-align:center;cursor:default;" title="${LABELS[topic]}: ${pct !== null ? pct+'%' : 'Not attempted'}">
            <div style="font-size:0.75rem;font-weight:600;color:${c.text};margin-bottom:3px;">${LABELS[topic]}</div>
            <div style="font-size:0.8rem;font-weight:800;color:${c.text};">${pct !== null ? pct+'%' : '—'}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  return { render };
})();


// ══════════════════════════════════════════════════════════════
// 3. SPACED REPETITION — Wrong Question Bank
// ══════════════════════════════════════════════════════════════
const SpacedRepetition = (() => {
  const KEY = 'pyprep_wrong_bank';

  function get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

  function addWrong(id, type, questionData) {
    const d = get();
    d[id] = { ...questionData, type, wrongCount:(d[id]?.wrongCount||0)+1, lastSeen:Date.now() };
    save(d);
  }

  function removeWrong(id) {
    const d = get();
    delete d[id];
    save(d);
  }

  function getAll() { return Object.values(get()); }
  function count()  { return Object.keys(get()).length; }

  function renderBadge(container) {
    if (!container) return;
    const n = count();
    if (n === 0) { container.innerHTML = '<span style="font-size:0.82rem;color:var(--text-muted);">No wrong answers saved yet.</span>'; return; }
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div style="padding:8px 18px;border-radius:var(--radius-pill);background:rgba(255,92,92,0.12);border:1px solid rgba(255,92,92,0.25);color:var(--brand-danger);font-weight:700;font-size:0.88rem;">
          ❌ ${n} question${n!==1?'s':''} to review
        </div>
        <a href="mcq.html?mode=review" style="font-size:0.82rem;color:var(--brand-primary);">Practice wrong answers →</a>
      </div>`;
  }

  return { addWrong, removeWrong, getAll, count, renderBadge };
})();


// ══════════════════════════════════════════════════════════════
// 4. NOTES SYSTEM
// ══════════════════════════════════════════════════════════════
const Notes = (() => {
  const KEY = 'pyprep_notes';
  function get()    { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(d)  { localStorage.setItem(KEY, JSON.stringify(d)); }
  function setNote(id, text) { const d=get(); if(text.trim()) d[id]=text; else delete d[id]; save(d); }
  function getNote(id)       { return get()[id] || ''; }
  function count()           { return Object.keys(get()).length; }

  function renderNoteWidget(id, container) {
    if (!container) return;
    const existing = getNote(id);
    container.innerHTML = `
      <div style="margin-top:12px;">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:6px;">📝 My Notes</div>
        <textarea id="note-${id}" placeholder="Add your own notes for this question…" style="width:100%;min-height:80px;padding:10px 14px;border-radius:var(--radius-md);background:var(--bg-secondary);border:1px solid var(--border-glass);color:var(--text-primary);font-size:0.85rem;font-family:var(--font-body);resize:vertical;outline:none;transition:border 0.25s;line-height:1.6;">${existing}</textarea>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button onclick="Notes.save('${id}', document.getElementById('note-${id}').value)" style="padding:6px 14px;border-radius:var(--radius-sm);background:var(--brand-primary);color:#fff;border:none;font-size:0.78rem;font-weight:600;cursor:pointer;">Save Note</button>
          ${existing ? `<button onclick="Notes.clear('${id}', this)" style="padding:6px 14px;border-radius:var(--radius-sm);background:var(--bg-card);border:1px solid var(--border-glass);font-size:0.78rem;cursor:pointer;">Clear</button>` : ''}
        </div>
      </div>`;

    const ta = container.querySelector('textarea');
    ta.addEventListener('focus', () => ta.style.borderColor='var(--brand-primary)');
    ta.addEventListener('blur',  () => ta.style.borderColor='var(--border-glass)');
  }

  function saveFromUI(id, text) {
    setNote(id, text);
    window.PyPrep.Toast.show(text.trim() ? 'Note saved!' : 'Note cleared.', 'success');
  }

  function clearNote(id, btn) {
    setNote(id,'');
    const ta = document.getElementById('note-'+id);
    if (ta) ta.value = '';
    btn.style.display='none';
    window.PyPrep.Toast.show('Note cleared.','info');
  }

  return { get, setNote, getNote, count, renderNoteWidget, save:saveFromUI, clear:clearNote };
})();

// Make Notes accessible globally (used in onclick attrs)
window.Notes = Notes;


// ══════════════════════════════════════════════════════════════
// 5. SHARE RESULT CARD
// ══════════════════════════════════════════════════════════════
const ShareCard = (() => {
  function generate(data) {
    // data: { score, correct, total, time, level, streak, title }
    const modal = document.createElement('div');
    modal.style.cssText = `position:fixed;inset:0;background:rgba(7,14,31,0.8);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;`;

    const lvl = XPSystem.getLevel(XPSystem.get().xp);

    modal.innerHTML = `
      <div style="background:var(--bg-modal);border:1px solid var(--border-glass);border-radius:var(--radius-xl);padding:32px;max-width:440px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.4);">
        <div id="share-card-inner" style="background:linear-gradient(135deg,#0d1b3e,#1a0d40);border-radius:var(--radius-lg);padding:28px;text-align:center;margin-bottom:20px;">
          <div style="font-size:2rem;margin-bottom:8px;">🐍</div>
          <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:800;color:#fff;margin-bottom:4px;">PyPrepbyRohan</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:20px;">Python Interview Preparation</div>

          <div style="font-family:var(--font-display);font-size:3.5rem;font-weight:800;background:linear-gradient(135deg,#4f8ef7,#7c5cfc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;">${data.score}%</div>
          <div style="color:rgba(255,255,255,0.7);font-size:0.9rem;margin-bottom:20px;">${data.correct} / ${data.total} correct · ${data.time}</div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
            <div style="background:rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:1.2rem;font-weight:800;color:#fff;">${lvl.icon}</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.55);">${lvl.label}</div>
            </div>
            <div style="background:rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:1.2rem;font-weight:800;color:#ff9f43;">🔥 ${XPSystem.get().streak}</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.55);">Day Streak</div>
            </div>
            <div style="background:rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:1.2rem;font-weight:800;color:#4cde9a;">${XPSystem.get().xp} XP</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.55);">Total XP</div>
            </div>
          </div>

          <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);">github.com/RohanPatil01 · PyPrepbyRohan</div>
        </div>

        <div style="display:flex;gap:10px;">
          <button onclick="ShareCard.copyText()" style="flex:1;padding:11px;border-radius:var(--radius-md);background:var(--grad-primary);color:#fff;border:none;font-weight:600;cursor:pointer;font-size:0.85rem;">📋 Copy Result</button>
          <button onclick="this.closest('[style*=fixed]').remove()" style="padding:11px 16px;border-radius:var(--radius-md);background:var(--bg-secondary);border:1px solid var(--border-glass);cursor:pointer;font-size:0.85rem;">✕</button>
        </div>
      </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
    window._shareData = data;
  }

  function copyText() {
    const d = window._shareData || {};
    const lvl = XPSystem.getLevel(XPSystem.get().xp);
    const text = `🐍 PyPrepbyRohan Result\n\nScore: ${d.score}% (${d.correct}/${d.total} correct)\nTime: ${d.time}\nLevel: ${lvl.icon} ${lvl.label}\nStreak: 🔥 ${XPSystem.get().streak} days\n\nPractice Python interviews → github.com/RohanPatil01`;
    navigator.clipboard.writeText(text).then(() => window.PyPrep.Toast.show('Result copied! Share it on LinkedIn 🚀', 'success', 4000));
  }

  return { generate, copyText };
})();
window.ShareCard = ShareCard;


// ══════════════════════════════════════════════════════════════
// 6. PER-QUESTION TIMER (Pressure Mode)
// ══════════════════════════════════════════════════════════════
const PressureMode = (() => {
  let timer = null;
  let onTimeout = null;

  function start(seconds, onTick, onDone) {
    stop();
    let rem = seconds;
    onTimeout = onDone;
    onTick(rem);
    timer = setInterval(() => {
      rem--;
      onTick(rem);
      if (rem <= 0) { stop(); onDone(); }
    }, 1000);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function renderBar(container, seconds, onTimeout) {
    if (!container) return;
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span id="ptimer-text" style="font-family:var(--font-mono);font-size:0.88rem;font-weight:700;color:var(--brand-primary);flex-shrink:0;">⏱ ${seconds}s</span>
        <div style="flex:1;height:5px;background:var(--border-color);border-radius:3px;overflow:hidden;">
          <div id="ptimer-bar" style="height:100%;width:100%;background:var(--brand-primary);border-radius:3px;transition:width 1s linear;"></div>
        </div>
      </div>`;

    start(seconds,
      (rem) => {
        const el = document.getElementById('ptimer-text');
        const bar = document.getElementById('ptimer-bar');
        const pct = (rem / seconds) * 100;
        if (el)  el.textContent  = `⏱ ${rem}s`;
        if (bar) bar.style.width = pct + '%';
        if (el) {
          if (pct < 30) { el.style.color = 'var(--brand-danger)'; if(bar) bar.style.background='var(--brand-danger)'; }
          else if (pct < 60) { el.style.color = 'var(--brand-warning)'; if(bar) bar.style.background='var(--brand-warning)'; }
        }
      },
      () => { window.PyPrep.Toast.show('⏰ Time up for this question!', 'warning'); if (onTimeout) onTimeout(); }
    );
  }

  return { start, stop, renderBar };
})();


// ══════════════════════════════════════════════════════════════
// 7. RANDOM DAILY CHALLENGE WIDGET
// ══════════════════════════════════════════════════════════════
const DailyChallenge = (() => {
  // Lightweight challenges — no JSON fetch needed
  const CHALLENGES = [
    { title:'Two Sum', difficulty:'Easy', desc:'Given a list and a target, return indices of two numbers that add up to target.', hint:'Use a hash map for O(n) solution.' },
    { title:'Reverse a String', difficulty:'Easy', desc:'Write a function to reverse a string without using [::-1].', hint:'Use two pointers or recursion.' },
    { title:'Find Duplicates', difficulty:'Easy', desc:'Given a list, return all elements that appear more than once.', hint:'Use collections.Counter.' },
    { title:'Valid Parentheses', difficulty:'Medium', desc:'Check if a string of brackets is valid (every open has a matching close).', hint:'Use a stack.' },
    { title:'Max Subarray', difficulty:'Medium', desc:'Find the contiguous subarray with the largest sum.', hint:"Kadane's Algorithm — O(n)." },
    { title:'Group Anagrams', difficulty:'Medium', desc:'Group a list of strings by their anagram families.', hint:'Sort each word as the key.' },
    { title:'LRU Cache', difficulty:'Hard', desc:'Implement a Least Recently Used cache with O(1) get and put.', hint:'Use OrderedDict from collections.' },
    { title:'Word Break', difficulty:'Hard', desc:'Given a string and a dictionary, can the string be segmented into dictionary words?', hint:'Dynamic programming with a dp array.' },
    { title:'Longest Palindrome', difficulty:'Medium', desc:'Find the longest palindromic substring in a given string.', hint:'Expand from center for O(n²) solution.' },
    { title:'Flatten Nested List', difficulty:'Easy', desc:'Flatten a list of arbitrarily nested lists into a single flat list.', hint:'Use recursion or a stack.' },
    { title:'First Non-Repeating', difficulty:'Medium', desc:'Find the first character in a string that does not repeat.', hint:'Use OrderedDict or two passes.' },
    { title:'Product Except Self', difficulty:'Hard', desc:'Return array where each element is product of all others. No division allowed.', hint:'Left and right pass arrays.' },
  ];

  const DIFF_COLOR = { Easy:'var(--brand-success)', Medium:'var(--brand-warning)', Hard:'var(--brand-danger)' };

  function render(container) {
    if (!container) return;
    const c   = window.PyPrep.getDailyItem(CHALLENGES);
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="padding:4px 12px;border-radius:var(--radius-pill);background:${DIFF_COLOR[c.difficulty]}22;color:${DIFF_COLOR[c.difficulty]};font-size:0.75rem;font-weight:700;">${c.difficulty}</span>
        <h4 style="margin:0;">${c.title}</h4>
      </div>
      <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:12px;">${c.desc}</p>
      <div id="dc-hint" style="display:none;padding:10px 14px;border-radius:var(--radius-md);background:rgba(79,142,247,0.08);border:1px solid rgba(79,142,247,0.18);font-size:0.83rem;color:var(--text-secondary);margin-bottom:10px;">💡 ${c.hint}</div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('dc-hint').style.display='block';this.style.display='none';" style="padding:7px 16px;border-radius:var(--radius-sm);background:var(--bg-tag);border:1px solid var(--border-glass);font-size:0.8rem;font-weight:600;color:var(--brand-primary);cursor:pointer;">Show Hint</button>
        <a href="coding.html" style="padding:7px 16px;border-radius:var(--radius-sm);background:var(--grad-primary);color:#fff;font-size:0.8rem;font-weight:600;text-decoration:none;">View All Challenges →</a>
      </div>`;
  }

  return { render };
})();


// ══════════════════════════════════════════════════════════════
// INIT — Run all features on page load
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // XP display on any page that has xp-badge elements
  XPSystem.updateXPDisplay();

  // XP widget
  const xpWidget = document.getElementById('xp-widget');
  if (xpWidget) XPSystem.renderWidget(xpWidget);

  // Heatmap
  const heatmap = document.getElementById('topic-heatmap');
  if (heatmap) TopicHeatmap.render(heatmap);

  // Wrong bank badge
  const wrongBadge = document.getElementById('wrong-bank-badge');
  if (wrongBadge) SpacedRepetition.renderBadge(wrongBadge);

  // Daily challenge widget
  const dcWidget = document.getElementById('daily-challenge-widget');
  if (dcWidget) DailyChallenge.render(dcWidget);
});

// Export to window
window.PyPrepFeatures = { XPSystem, TopicHeatmap, SpacedRepetition, Notes, ShareCard, PressureMode, DailyChallenge };
