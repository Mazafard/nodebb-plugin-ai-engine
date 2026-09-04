'use strict';

const BaseProviderDecorator = require('./base-decorator');

/**
 * [Pattern 8: Decorator Pattern]
 * Retry decorator implementing exponential backoff on transient network faults.
 */
class RetryDecorator extends BaseProviderDecorator {
	constructor(wrappedProvider, maxRetries = 2, baseDelayMs = 500) {
		super(wrappedProvider);
		this.maxRetries = maxRetries;
		this.baseDelayMs = baseDelayMs;
	}

	async executeWorkflow(request, config) {
		let attempt = 0;
		while (true) {
			try {
				return await this.wrappedProvider.executeWorkflow(request, config);
			} catch (err) {
				attempt++;
				if (attempt > this.maxRetries || !this.isTransientError(err)) {
					throw err;
				}
				const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	isTransientError(err) {
		const msg = (err.message || '').toLowerCase();
		return msg.includes('timeout') ||
			msg.includes('etimedout') ||
			msg.includes('econnreset') ||
			msg.includes('rate limit') ||
			msg.includes('429') ||
			msg.includes('503');
	}
}

module.exports = RetryDecorator;
