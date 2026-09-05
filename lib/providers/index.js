'use strict';

const CentralModelFactory = require('../core/factory');

/**
 * Legacy ProviderManager interface forwarding to the CentralModelFactory
 */
const ProviderManager = {
	get(providerName) {
		return CentralModelFactory.getInstance().createProvider(providerName);
	},

	list() {
		return ['ollama', 'gemini', 'anthropic', 'openai'];
	},

	async testConnection(providerName, config) {
		return await this.get(providerName).testConnection(config);
	},

	async listModels(providerName, config) {
		return await this.get(providerName).listModels(config);
	},

	async generateText(providerName, options, config) {
		return await this.get(providerName).generateText(options, config);
	},

	async generateJSON(providerName, options, config) {
		return await this.get(providerName).generateJSON(options, config);
	},
};

module.exports = ProviderManager;
