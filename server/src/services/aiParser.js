const aiClient = require('./ai/aiClient');
const logger = require('../logger');

const parseCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Normalize cache key: lowercase, trimmed, collapsed whitespace.
 * @param {string} text
 * @returns {string}
 */
function cacheKey(text) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Parse food text with in-memory caching (24h TTL).
 * Returns null if AI unavailable (graceful degradation).
 * @param {string} text
 * @returns {Promise<Array<{name: string, grams: number, uncertain: boolean}>|null>}
 */
async function parseFood(text) {
  const key = cacheKey(text);
  const cached = parseCache.get(key);

  if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL) {
    logger.debug({ key }, 'AI parse cache hit');
    return cached.result;
  }

  const result = await aiClient.parseFood(text);

  if (result !== null) {
    parseCache.set(key, { result, cachedAt: Date.now() });
  }

  return result;
}

module.exports = { parseFood };
