'use strict';

/**
 * [Pattern 8: Decorator Pattern]
 * Base decorator forwarding calls to the wrapped provider instance.
 */
class BaseProviderDecorator {
	constructor(wrappedProvider) {
		this.wrappedProvider = wrappedProvider;
		this.name = wrappedProvider.name;
	}

	async executeWorkflow(request, config) {
		return await this.wrappedProvider.executeWorkflow(request, config);
	}

	async testConnection(config) {
		return await this.wrappedProvider.testConnection(config);
	}

	async listModels(config) {
		return await this.wrappedProvider.listModels(config);
	}
}

module.exports = BaseProviderDecorator;
