// server/src/bot/utils.js
'use strict';

/**
 * Returns today's date string (YYYY-MM-DD) in Europe/Rome timezone.
 * @returns {string}
 */
function getTodayDate() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}

/**
 * Build a 10-char progress bar string.
 * @param {number} current
 * @param {number} goal
 * @returns {string}
 */
function progressBar(current, goal) {
  if (!goal || goal <= 0) return '░░░░░░░░░░';
  const ratio = Math.min(current / goal, 1);
  const filled = Math.round(ratio * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

module.exports = { getTodayDate, progressBar };
