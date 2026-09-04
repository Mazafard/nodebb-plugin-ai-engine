'use strict';

const OllamaAdapter = require('./adapters/ollama-adapter');
const GeminiAdapter = require('./adapters/gemini-adapter');
const AnthropicAdapter = require('./adapters/anthropic-adapter');
const OpenAIAdapter = require('./adapters/openai-adapter');
const RetryDecorator = require('./decorators/retry-decorator');
const TelemetryDecorator = require('./decorators/telemetry-decorator');
const CachedProviderProxy = require('./proxy/cache-proxy');

let instance = null;

/**
 * [Pattern 1: Singleton Pattern & Pattern 2: Factory Method Pattern]
 * Central Model Factory coordinating all LLM provider instances across the forum.
 */
class CentralModelFactory {
	constructor() {
		if (instance) {
			return instance;
		}
		this._providerPool = new Map();
		instance = this;
	}

	/**
	 * [Pattern 1: Singleton Pattern] Accessor
	 */
	static getInstance() {
		if (!instance) {
			instance = new CentralModelFactory();
		}
		return instance;
	}

	/**
	 * [Pattern 2: Factory Method Pattern]
	 * Instantiates, decorates (Retry + Telemetry), and proxies the requested provider.
	 */
	createProvider(type) {
		const key = (type || 'ollama').toLowerCase().trim();

		if (this._providerPool.has(key)) {
			return this._providerPool.get(key);
		}

		let baseAdapter;
		switch (key) {
			case 'ollama':
				baseAdapter = new OllamaAdapter();
				break;
			case 'gemini':
				baseAdapter = new GeminiAdapter();
				break;
			case 'anthropic':
				baseAdapter = new AnthropicAdapter();
				break;
			case 'openai':
				baseAdapter = new OpenAIAdapter();
				break;
			default:
				throw new Error(`[CentralModelFactory] Unsupported provider type: "${type}"`);
		}

		// Apply Decorators: Retry -> Telemetry -> Cache Proxy
		const withRetry = new RetryDecorator(baseAdapter, 2, 600);
		const withTelemetry = new TelemetryDecorator(withRetry);
		const proxiedProvider = new CachedProviderProxy(withTelemetry, 3600);

		this._providerPool.set(key, proxiedProvider);
		return proxiedProvider;
	}

	/**
	 * Retrieves the configured provider for a given task
	 */
	getProviderForTask(task, settings) {
		let providerName = 'ollama';
		let modelName = '';

		if (task === 'moderation') {
			providerName = settings.moderationProvider || 'ollama';
			modelName = settings.moderationModel || '';
		} else if (task === 'copilot') {
			providerName = settings.copilotProvider || 'gemini';
			modelName = settings.copilotModel || '';
		} else if (task === 'summarizer') {
			providerName = settings.summarizerProvider || 'anthropic';
			modelName = settings.summarizerModel || '';
		}

		const provider = this.createProvider(providerName);
		return { provider, modelName, providerName };
	}

	clearPool() {
		this._providerPool.clear();
	}
}

module.exports = CentralModelFactory;
