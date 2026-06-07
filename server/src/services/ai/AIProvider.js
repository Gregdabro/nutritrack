/**
 * Base interface for AI providers.
 * All providers must implement parseFood().
 */
class AIProvider {
  /**
   * Parse free-text food input into structured list.
   * @param {string} input
   * @returns {Promise<Array<{name: string, grams: number, uncertain: boolean}>>}
   */
  async parseFood(input) {
    throw new Error('Not implemented');
  }
}

module.exports = AIProvider;
