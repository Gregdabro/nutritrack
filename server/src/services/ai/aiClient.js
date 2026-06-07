const { createProvider } = require('./AIProviderFactory');
const logger = require('../../logger');

const PRIMARY_PROVIDER  = process.env.AI_PROVIDER         || 'deepseek';
const FALLBACK_PROVIDER = process.env.AI_FALLBACK_PROVIDER || 'claude';
const MAX_RETRIES = 2;

/**
 * Try calling provider.parseFood with exponential backoff.
 * Delays: 500ms, 1000ms before retry 1 and 2.
 * @param {import('./AIProvider')} provider
 * @param {string} input
 * @returns {Promise<Array|null>}
 */
async function withRetry(provider, input) {
  const delays = [500, 1000];
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await provider.parseFood(input);
      return result;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Parse food text using primary provider with retry, then fallback with retry.
 * Returns null if both providers fail (graceful degradation).
 * @param {string} input
 * @returns {Promise<Array<{name: string, grams: number, uncertain: boolean}>|null>}
 */
async function parseFood(input) {
  // Try primary
  try {
    const primary = createProvider(PRIMARY_PROVIDER);
    const result = await withRetry(primary, input);
    return result;
  } catch (primaryErr) {
    logger.warn({ err: primaryErr, provider: PRIMARY_PROVIDER }, 'Primary AI provider failed, trying fallback');
  }

  // Try fallback
  try {
    const fallback = createProvider(FALLBACK_PROVIDER);
    const result = await withRetry(fallback, input);
    return result;
  } catch (fallbackErr) {
    logger.error({ err: fallbackErr, provider: FALLBACK_PROVIDER }, 'Fallback AI provider also failed');
    return null;
  }
}

module.exports = { parseFood };
