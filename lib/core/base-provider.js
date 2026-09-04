'use strict';

const eventBus = require('./events/event-bus');

/**
 * [Pattern 10: Template Method Pattern]
 * Invariant base provider defining the execution skeleton for all LLMs.
 */
class BaseProvider {
	constructor(name) {
		if (new.target === BaseProvider) {
			throw new TypeError('Cannot construct BaseProvider instances directly.');
		}
		this.name = name;
	}

	/**
	 * Template Method: defines the fixed algorithm workflow
	 */
	async executeWorkflow(request, config) {
		this.validateRequest(request);
		const formattedRequest = this.beforeRequest(request);

		const startTime = Date.now();
		let rawResponse;
		let isSuccess = true;
		let errorMessage = null;

		try {
			rawResponse = await this.doRequest(formattedRequest, config);
		} catch (err) {
			isSuccess = false;
			errorMessage = err.message;
			eventBus.emit('inference:error', {
				provider: this.name,
				model: request.model,
				error: err.message,
			});
			throw err;
		} finally {
			const latencyMs = Date.now() - startTime;
			eventBus.emit('inference:complete', {
				type: request.metadata?.type || 'inference',
				provider: this.name,
				model: request.model || 'default',
				latencyMs,
				success: isSuccess,
				error: errorMessage,
			});
		}

		return this.afterRequest(rawResponse, request);
	}

	validateRequest(request) {
		if (!request || !request.prompt) {
			throw new Error(`[${this.name}] Cannot execute inference without a prompt.`);
		}
	}

	beforeRequest(request) {
		// Hook for subclasses to format request if needed
		return Object.assign({}, request);
	}

	/**
	 * Primitive abstract method: must be implemented by concrete adapters
	 */
	async doRequest(request, config) {
		throw new Error(`doRequest() not implemented on ${this.name}`);
	}

	afterRequest(rawResponse, request) {
		// Hook to standardize response
		return {
			text: typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse),
			data: typeof rawResponse === 'object' ? rawResponse : null,
			format: request.format,
		};
	}

	// Vendor specific auxiliary methods
	async testConnection(config) {
		throw new Error(`testConnection() not implemented on ${this.name}`);
	}

	async listModels(config) {
		throw new Error(`listModels() not implemented on ${this.name}`);
	}
}

module.exports = BaseProvider;
