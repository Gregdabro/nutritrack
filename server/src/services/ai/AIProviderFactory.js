const DeepSeekProvider = require('./DeepSeekProvider');
const ClaudeProvider = require('./ClaudeProvider');

const PROVIDERS = {
  deepseek: DeepSeekProvider,
  claude: ClaudeProvider,
};

function createProvider(name) {
  const ProviderClass = PROVIDERS[name];
  if (!ProviderClass) throw new Error(`Unknown AI provider: ${name}`);
  return new ProviderClass();
}

module.exports = { createProvider };
