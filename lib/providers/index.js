'use strict';

const OllamaProvider = require('./ollama');
const GeminiProvider = require('./gemini');
const AnthropicProvider = require('./anthropic');
const OpenAIProvider = require('./openai');

const providers = {
	ollama: OllamaProvider,
	gemini: GeminiProvider,
	anthropic: AnthropicProvider,
	openai: OpenAIProvider,
};

const ProviderManager = {
	get(providerName) {
		const name = (providerName || '').toLowerCase().trim();
		const provider = providers[name];
		if (!provider) {
			throw new Error(`Unsupported AI Provider: "${providerName}". Supported: ollama, gemini, anthropic, openai`);
		}
		return provider;
	},

	list() {
		return Object.keys(providers);
	},

	async testConnection(providerName, config) {
		const provider = this.get(providerName);
		return await provider.testConnection(config);
	},

	async listModels(providerName, config) {
		const provider = this.get(providerName);
		return await provider.listModels(config);
	},

	async generateText(providerName, options, config) {
		const provider = this.get(providerName);
		return await provider.generateText(options, config);
	},

	async generateJSON(providerName, options, config) {
		const provider = this.get(providerName);
		return await provider.generateJSON(options, config);
	},
};

module.exports = ProviderManager;
