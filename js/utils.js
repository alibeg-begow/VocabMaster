/**
 * @fileoverview Utility helpers, formatters, and constants for VocabMaster
 */

/** Application constants */
const APP_CONSTANTS = {
  APP_NAME: 'VocabMaster',
  DB_NAME: 'VocabMasterDB',
  DB_VERSION: 1,
  MIN_WORDS: 10,
  MAX_WORDS: 200,
  MAX_RETRIES: 3,
  TOAST_DURATION: 3000,
  CORRECT_DELAY: 1000,
  INCORRECT_DELAY: 2000,
  ITEMS_PER_PAGE_OPTIONS: [10, 25, 50, 100, 'All'],
  DEFAULT_ITEMS_PER_PAGE: 25,
};


/** Theme color tokens */
const THEME_COLORS = {
  primary: '#1a56db',
  secondary: '#059669',
  accent: '#d97706',
  darkBg: '#0f172a',
  lightBg: '#f8fafc',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#f59e0b',
};

/**
 * Format seconds into MM:SS string
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format a Date object to a readable string
 * @param {Date|number} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Format a Date to short date only
 * @param {Date|number} date
 * @returns {string}
 */
function formatShortDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Compare two strings case-insensitively after trimming
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function compareAnswers(a, b) {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}


/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Shuffle an array (Fisher-Yates)
 * @param {Array} arr
 * @returns {Array}
 */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sleep/delay helper
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration
 */
function showToast(message, type = 'info', duration = APP_CONSTANTS.TOAST_DURATION) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-enter`;
  toast.setAttribute('role', 'alert');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.remove('toast-enter')));
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}


/**
 * Get color for accuracy percentage
 * @param {number} pct
 * @returns {string}
 */
function getAccuracyColor(pct) {
  if (pct >= 80) return THEME_COLORS.success;
  if (pct >= 50) return THEME_COLORS.warning;
  return THEME_COLORS.danger;
}

