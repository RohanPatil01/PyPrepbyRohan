/* ============================================================
   PyPrep Pro — Main JavaScript
   Author: Rohan Patil
   GitHub : https://github.com/RohanPatil01
   Insta  : https://www.instagram.com/rohanjpatil01
   LinkedIn: https://www.linkedin.com/in/rohanpatil01/
   ============================================================ */

'use strict';

// ── Theme Toggle ─────────────────────────────────────────────
const ThemeManager = (() => {
  const KEY  = 'pyprep_theme';
  const root = document.documentElement;

  function get()  { return localStorage.getItem(KEY) || 'light'; }
  function set(t) {
    localStorage.setItem(KEY, t);
    root.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = t === 'dark' ? '☀️' : '🌙';
      btn.title = t === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  }
  function toggle() { set(get() === 'dark' ? 'light' : 'dark'); }
  function init()   { set(get()); }

  return { init, toggle, get };
})();

// ── Navbar ────────────────────────────────────────────────────
const NavManager = (() => {
  function init() {
    const navbar    = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');

    if (!navbar) return;

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
      });
      document.addEventListener('click', e => {
        if (!hamburger.contains(e.target) && !mobileNav.contains(e.target))
          mobileNav.classList.remove('open');
      });
    }

    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar__link, .mobile-nav .navbar__link').forEach(link => {
      if ((link.getAttribute('href') || '').split('?')[0] === current)
        link.classList.add('active');
    });
  }
  return { init };
})();

// ── Scroll To Top ─────────────────────────────────────────────
const ScrollTop = (() => {
  function init() {
    const btn = document.querySelector('.scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
  return { init };
})();

// ── Scroll Reveal ─────────────────────────────────────────────
const ScrollReveal = (() => {
  function init() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => observer.observe(el));
  }
  return { init };
})();

// ── Counter Animation ─────────────────────────────────────────
const CounterAnimation = (() => {
  function animateCount(el, target, duration = 1800) {
    let start = 0;
    const step = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + (el.dataset.suffix || '');
    };
    requestAnimationFrame(step);
  }
  function init() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCount(e.target, parseInt(e.target.dataset.count));
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => observer.observe(el));
  }
  return { init };
})();

// ── Toast Notification ────────────────────────────────────────
const Toast = (() => {
  function show(msg, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  return { show };
})();

// ── Bookmark System ───────────────────────────────────────────
const Bookmarks = (() => {
  const KEY = 'pyprep_bookmarks';
  function getAll() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(d)  { localStorage.setItem(KEY, JSON.stringify(d)); }
  function toggle(type, id, meta = {}) {
    const all = getAll();
    if (!all[type]) all[type] = {};
    if (all[type][id]) { delete all[type][id]; save(all); return false; }
    else { all[type][id] = { ...meta, savedAt: Date.now() }; save(all); return true; }
  }
  function isBookmarked(type, id) { const all = getAll(); return !!(all[type] && all[type][id]); }
  function count() { const all = getAll(); return Object.values(all).reduce((acc, cat) => acc + Object.keys(cat).length, 0); }
  return { getAll, toggle, isBookmarked, count };
})();

// ── Progress Tracking ─────────────────────────────────────────
const Progress = (() => {
  const KEY = 'pyprep_progress';
  function get() { try { return JSON.parse(localStorage.getItem(KEY)) || initData(); } catch { return initData(); } }
  function initData() { return { testsAttempted:0, totalScore:0, totalQuestions:0, topicScores:{}, completedSections:[], lastActivity:null, streak:0, lastStreakDate:null }; }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
  function recordTest(topic, score, total) {
    const d = get();
    d.testsAttempted++;
    d.totalScore    += score;
    d.totalQuestions += total;
    if (!d.topicScores[topic]) d.topicScores[topic] = { score:0, total:0, attempts:0 };
    d.topicScores[topic].score   += score;
    d.topicScores[topic].total   += total;
    d.topicScores[topic].attempts++;
    d.lastActivity = Date.now();
    updateStreak(d);
    save(d);
  }
  function updateStreak(d) {
    const today     = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (d.lastStreakDate === today) return;
    d.streak = d.lastStreakDate === yesterday ? (d.streak || 0) + 1 : 1;
    d.lastStreakDate = today;
  }
  function getAccuracy() { const d = get(); if (!d.totalQuestions) return 0; return Math.round((d.totalScore / d.totalQuestions) * 100); }
  function getReadinessScore() { const acc = getAccuracy(); const d = get(); const tests = Math.min(d.testsAttempted * 2, 20); return Math.min(Math.round(acc * 0.75 + tests * 0.25), 100); }
  function getWeakTopics() {
    const d = get();
    return Object.entries(d.topicScores)
      .map(([topic, s]) => ({ topic, pct: Math.round(s.score / s.total * 100) }))
      .filter(t => t.pct < 60)
      .sort((a, b) => a.pct - b.pct);
  }
  return { get, save, recordTest, getAccuracy, getReadinessScore, getWeakTopics };
})();

// ── Search Overlay (Global) ───────────────────────────────────
const GlobalSearch = (() => {
  let overlay = null;

  function init() {
    // Keyboard shortcut: Ctrl+K or Cmd+K
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
      if (e.key === 'Escape' && overlay) close();
    });

    // Search button in navbar if present
    document.querySelectorAll('.global-search-btn').forEach(btn => {
      btn.addEventListener('click', open);
    });
  }

  function open() {
    if (overlay) { overlay.querySelector('input').focus(); return; }

    overlay = document.createElement('div');
    overlay.className = 'gsearch-overlay';
    overlay.innerHTML = `
      <div class="gsearch-modal">
        <div class="gsearch-header">
          <span class="gsearch-icon">🔍</span>
          <input class="gsearch-input" type="text" placeholder="Search pages, topics, tools…" autocomplete="off" />
          <button class="gsearch-close">✕</button>
        </div>
        <div class="gsearch-results" id="gsearch-results"></div>
        <div class="gsearch-footer">
          <span>Press <kbd>↵</kbd> to navigate · <kbd>Esc</kbd> to close · <kbd>Ctrl K</kbd> to open</span>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    injectSearchStyles();

    const input = overlay.querySelector('.gsearch-input');
    const results = overlay.querySelector('#gsearch-results');

    const PAGES = [
      { title:'Interview Questions', desc:'Topic-wise Q&A with detailed answers', url:'questions.html', icon:'📋', tags:'basics oop functions strings lists tuples dicts exceptions' },
      { title:'MCQ Arena', desc:'Multiple choice tests with timer', url:'mcq.html', icon:'🎯', tags:'quiz test multiple choice' },
      { title:'Guess the Output', desc:'Predict Python code output', url:'output.html', icon:'💻', tags:'output code snippets mutability scope' },
      { title:'Coding Challenges', desc:'Easy Medium Hard problems with solutions', url:'coding.html', icon:'⌨️', tags:'problems algorithms two sum fibonacci' },
      { title:'Mock Interview', desc:'Full interview simulation', url:'mock.html', icon:'🎙️', tags:'mock simulate interview score' },
      { title:'Cheat Sheets', desc:'Quick reference for methods and syntax', url:'cheatsheet.html', icon:'📄', tags:'reference methods string list dict' },
      { title:'Interview Patterns', desc:'Mutable immutable scope closures decorators', url:'patterns.html', icon:'🧠', tags:'patterns mutable closure lambda decorator' },
      { title:'Last-Minute Revision', desc:'Flash cards and revision kits', url:'revision.html', icon:'⚡', tags:'revision flash cards 15 minute 30 minute' },
    ];

    function renderResults(q) {
      const filtered = q
        ? PAGES.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.tags.toLowerCase().includes(q))
        : PAGES;
      if (!filtered.length) { results.innerHTML = '<div class="gsearch-empty">No results found</div>'; return; }
      results.innerHTML = filtered.map((p, i) => `
        <a href="${p.url}" class="gsearch-item" data-idx="${i}">
          <span class="gsearch-item__icon">${p.icon}</span>
          <div>
            <div class="gsearch-item__title">${p.title}</div>
            <div class="gsearch-item__desc">${p.desc}</div>
          </div>
          <span class="gsearch-item__arrow">→</span>
        </a>`).join('');
    }

    renderResults('');
    setTimeout(() => input.focus(), 50);

    input.addEventListener('input', debounce(() => renderResults(input.value.trim().toLowerCase()), 150));
    overlay.querySelector('.gsearch-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  function close() {
    overlay?.remove();
    overlay = null;
  }

  function injectSearchStyles() {
    if (document.getElementById('gsearch-styles')) return;
    const s = document.createElement('style');
    s.id = 'gsearch-styles';
    s.textContent = `
      .gsearch-overlay { position:fixed;inset:0;background:rgba(7,14,31,0.75);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:80px 20px 20px;animation:fadeIn 0.2s ease; }
      .gsearch-modal   { width:100%;max-width:580px;background:var(--bg-modal);backdrop-filter:blur(24px);border:1px solid var(--border-glass);border-radius:var(--radius-xl);overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.4);animation:fadeInUp 0.25s ease; }
      .gsearch-header  { display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border-glass); }
      .gsearch-icon    { font-size:1.1rem;flex-shrink:0; }
      .gsearch-input   { flex:1;background:none;border:none;outline:none;font-size:1rem;color:var(--text-primary);font-family:var(--font-body); }
      .gsearch-input::placeholder { color:var(--text-muted); }
      .gsearch-close   { background:var(--bg-tag);border:1px solid var(--border-glass);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.8rem;color:var(--text-muted);transition:all 0.2s; }
      .gsearch-close:hover { background:rgba(255,92,92,0.15);color:var(--brand-danger); }
      .gsearch-results { max-height:360px;overflow-y:auto; }
      .gsearch-item    { display:flex;align-items:center;gap:14px;padding:14px 20px;text-decoration:none;color:var(--text-primary);transition:background 0.15s;border-bottom:1px solid var(--border-glass); }
      .gsearch-item:hover { background:var(--bg-tag); }
      .gsearch-item__icon  { font-size:1.3rem;flex-shrink:0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:8px; }
      .gsearch-item__title { font-weight:600;font-size:0.9rem;margin-bottom:2px; }
      .gsearch-item__desc  { font-size:0.78rem;color:var(--text-muted); }
      .gsearch-item__arrow { margin-left:auto;color:var(--text-muted);font-size:0.9rem; }
      .gsearch-empty   { padding:32px;text-align:center;color:var(--text-muted);font-size:0.9rem; }
      .gsearch-footer  { padding:10px 20px;border-top:1px solid var(--border-glass);font-size:0.75rem;color:var(--text-muted); }
      kbd { background:var(--bg-secondary);border:1px solid var(--border-glass);border-radius:4px;padding:2px 6px;font-size:0.72rem;font-family:var(--font-mono); }
    `;
    document.head.appendChild(s);
  }

  return { init, open };
})();

// ── Daily Seed ────────────────────────────────────────────────
function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function seededRandom(seed) {
  let s = seed;
  return function() { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function getDailyItem(arr) {
  if (!arr || !arr.length) return null;
  const rand = seededRandom(getDailySeed());
  return arr[Math.floor(rand() * arr.length)];
}

// ── Utility Functions ─────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomSample(arr, n) { return shuffle(arr).slice(0, n); }
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => Toast.show('Copied to clipboard!', 'success'))
    .catch(() => Toast.show('Copy failed.', 'error'));
}

// ── Accordion ─────────────────────────────────────────────────
function initAccordions(container = document) {
  container.querySelectorAll('.accordion__header').forEach(header => {
    header.addEventListener('click', () => {
      const item  = header.closest('.accordion__item');
      const isOpen = item.classList.contains('open');
      container.querySelectorAll('.accordion__item.open').forEach(o => { if (o !== item) o.classList.remove('open'); });
      item.classList.toggle('open', !isOpen);
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.remove('open'));
  });
}

// ── Timer Class ───────────────────────────────────────────────
class Timer {
  constructor(seconds, onTick, onDone) {
    this.total = seconds; this.remaining = seconds;
    this.onTick = onTick; this.onDone = onDone; this._interval = null;
  }
  start() {
    this.onTick(this.remaining);
    this._interval = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);
      if (this.remaining <= 0) { this.stop(); this.onDone(); }
    }, 1000);
  }
  stop()  { clearInterval(this._interval); }
  pause() { this.stop(); }
  reset() { this.stop(); this.remaining = this.total; }
  pct()   { return Math.round((this.remaining / this.total) * 100); }
}

// ── Back to Top Button Injection ──────────────────────────────
function injectScrollTop() {
  if (!document.querySelector('.scroll-top')) {
    const btn = document.createElement('button');
    btn.className = 'scroll-top';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);
  }
}

// ── Branding Panel (About the Creator) ───────────────────────
const BrandingPanel = (() => {
  const LINKS = {
    github:   'https://github.com/RohanPatil01',
    instagram:'https://www.instagram.com/rohanjpatil01',
    linkedin: 'https://www.linkedin.com/in/rohanpatil01/'
  };

  function inject() {
    // Only inject once and only if a placeholder exists
    const target = document.getElementById('branding-panel-slot');
    if (!target) return;

    target.innerHTML = `
      <div style="padding:28px;border-radius:var(--radius-xl);background:var(--bg-card);backdrop-filter:var(--blur-glass);border:1px solid var(--border-glass);display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--grad-primary);display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0;box-shadow:0 0 24px rgba(79,142,247,0.35);">👨‍💻</div>
        <div style="flex:1;min-width:200px;">
          <div style="font-family:var(--font-display);font-size:1.05rem;font-weight:800;margin-bottom:3px;">Built by Rohan Patil</div>
          <div style="font-size:0.83rem;color:var(--text-muted);margin-bottom:12px;">Python enthusiast · Open-source · Made for the community</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="${LINKS.github}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--radius-pill);background:var(--bg-secondary);border:1px solid var(--border-glass);font-size:0.8rem;font-weight:600;color:var(--text-primary);text-decoration:none;transition:all 0.25s;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              GitHub
            </a>
            <a href="${LINKS.linkedin}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--radius-pill);background:rgba(10,102,194,0.12);border:1px solid rgba(10,102,194,0.25);font-size:0.8rem;font-weight:600;color:#0a66c2;text-decoration:none;transition:all 0.25s;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
            <a href="${LINKS.instagram}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:var(--radius-pill);background:rgba(225,48,108,0.10);border:1px solid rgba(225,48,108,0.22);font-size:0.8rem;font-weight:600;color:#e1306c;text-decoration:none;transition:all 0.25s;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
          </div>
        </div>
        <div style="text-align:right;font-size:0.78rem;color:var(--text-muted);white-space:nowrap;">
          <div>⭐ Star on GitHub</div>
          <div style="margin-top:4px;">🐍 PyPrep Pro v1.0</div>
        </div>
      </div>`;
  }

  return { inject };
})();

// ── Init All ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavManager.init();
  ScrollTop.init();
  ScrollReveal.init();
  CounterAnimation.init();
  initAccordions();
  initModals();
  GlobalSearch.init();
  BrandingPanel.inject();
  injectScrollTop();

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', ThemeManager.toggle);
  });

  document.querySelectorAll('.code-block').forEach(block => {
    const copyBtn = block.querySelector('.code-block__copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = block.querySelector('code')?.textContent || block.textContent;
        copyToClipboard(code.replace('Copy','').trim());
      });
    }
  });
});

// Export globals
window.PyPrep = {
  ThemeManager, NavManager, Toast, Bookmarks, Progress,
  GlobalSearch, BrandingPanel,
  getDailyItem, getDailySeed, shuffle, randomSample,
  formatTime, debounce, escapeHTML, copyToClipboard,
  openModal, closeModal, Timer
};
