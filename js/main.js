/* ============================================================
   PyPrep Pro — Main JavaScript (Utilities, Theme, Nav, Scroll)
   Author: Rohan Patil | rohanjpatil01
   ============================================================ */

'use strict';

// ── Theme Toggle ─────────────────────────────────────────────
const ThemeManager = (() => {
  const KEY = 'pyprep_theme';
  const root = document.documentElement;

  function get()  { return localStorage.getItem(KEY) || 'dark'; }
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
    const navbar   = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');

    if (!navbar) return;

    // Scroll shadow
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    // Mobile toggle
    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        const isOpen = mobileNav.classList.contains('open');
        hamburger.setAttribute('aria-expanded', isOpen);
      });

      // Close on outside click
      document.addEventListener('click', e => {
        if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
          mobileNav.classList.remove('open');
        }
      });
    }

    // Active link
    const links = document.querySelectorAll('.navbar__link, .mobile-nav .navbar__link');
    const current = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === current) link.classList.add('active');
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
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
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
    const step = timestamp => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
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
          const el     = e.target;
          const target = parseInt(el.dataset.count);
          animateCount(el, target);
          observer.unobserve(el);
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

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function toggle(type, id, meta = {}) {
    const all = getAll();
    if (!all[type]) all[type] = {};
    if (all[type][id]) {
      delete all[type][id];
      save(all);
      return false;
    } else {
      all[type][id] = { ...meta, savedAt: Date.now() };
      save(all);
      return true;
    }
  }

  function isBookmarked(type, id) {
    const all = getAll();
    return !!(all[type] && all[type][id]);
  }

  function count() {
    const all = getAll();
    return Object.values(all).reduce((acc, cat) => acc + Object.keys(cat).length, 0);
  }

  return { getAll, toggle, isBookmarked, count };
})();

// ── Progress Tracking ─────────────────────────────────────────
const Progress = (() => {
  const KEY = 'pyprep_progress';

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY)) || initData(); }
    catch { return initData(); }
  }

  function initData() {
    return {
      testsAttempted: 0,
      totalScore: 0,
      totalQuestions: 0,
      topicScores: {},
      completedSections: [],
      lastActivity: null,
      streak: 0,
      lastStreakDate: null
    };
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function recordTest(topic, score, total) {
    const d = get();
    d.testsAttempted++;
    d.totalScore += score;
    d.totalQuestions += total;
    if (!d.topicScores[topic]) d.topicScores[topic] = { score: 0, total: 0, attempts: 0 };
    d.topicScores[topic].score   += score;
    d.topicScores[topic].total   += total;
    d.topicScores[topic].attempts++;
    d.lastActivity = Date.now();
    updateStreak(d);
    save(d);
  }

  function updateStreak(d) {
    const today = new Date().toDateString();
    if (d.lastStreakDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    d.streak = d.lastStreakDate === yesterday ? (d.streak || 0) + 1 : 1;
    d.lastStreakDate = today;
  }

  function getAccuracy() {
    const d = get();
    if (!d.totalQuestions) return 0;
    return Math.round((d.totalScore / d.totalQuestions) * 100);
  }

  function getReadinessScore() {
    const acc = getAccuracy();
    const d   = get();
    const tests = Math.min(d.testsAttempted * 2, 20);
    return Math.min(Math.round(acc * 0.75 + tests * 0.25), 100);
  }

  function getWeakTopics() {
    const d = get();
    return Object.entries(d.topicScores)
      .map(([topic, s]) => ({ topic, pct: Math.round(s.score / s.total * 100) }))
      .filter(t => t.pct < 60)
      .sort((a, b) => a.pct - b.pct);
  }

  return { get, save, recordTest, getAccuracy, getReadinessScore, getWeakTopics };
})();

// ── Daily Seed ────────────────────────────────────────────────
function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailyItem(arr) {
  if (!arr || !arr.length) return null;
  const rand = seededRandom(getDailySeed());
  const idx  = Math.floor(rand() * arr.length);
  return arr[idx];
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

function randomSample(arr, n) {
  return shuffle(arr).slice(0, n);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
      container.querySelectorAll('.accordion__item.open').forEach(open => {
        if (open !== item) open.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('open');
    });
  });
}

// ── Timer ─────────────────────────────────────────────────────
class Timer {
  constructor(seconds, onTick, onDone) {
    this.total    = seconds;
    this.remaining = seconds;
    this.onTick   = onTick;
    this.onDone   = onDone;
    this._interval = null;
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

// ── Init All ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavManager.init();
  ScrollTop.init();
  ScrollReveal.init();
  CounterAnimation.init();
  initAccordions();
  initModals();

  // Theme toggle buttons
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', ThemeManager.toggle);
  });

  // Code copy buttons
  document.querySelectorAll('.code-block').forEach(block => {
    const copyBtn = block.querySelector('.code-block__copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = block.querySelector('code')?.textContent || block.textContent;
        copyToClipboard(code.replace('Copy', '').trim());
      });
    }
  });
});

// Export globals
window.PyPrep = {
  ThemeManager, NavManager, Toast, Bookmarks, Progress,
  getDailyItem, getDailySeed, shuffle, randomSample,
  formatTime, debounce, escapeHTML, copyToClipboard,
  openModal, closeModal, Timer
};
