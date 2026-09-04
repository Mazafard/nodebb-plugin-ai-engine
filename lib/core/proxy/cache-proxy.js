'use strict';

const crypto = require('crypto');
const requireNodeBB = require('../../nodebb');
const db = requireNodeBB('./src/database');

/**
 * [Pattern 9: Proxy Pattern]
 * Transparent caching proxy caching deterministic inferences in Redis.
 */
class CachedProviderProxy {
	constructor(realProvider, defaultTtlSeconds = 3600) {
		this.realProvider = realProvider;
		this.name = realProvider.name;
		this.defaultTtlSeconds = defaultTtlSeconds;
	}

	async executeWorkflow(request, config) {
		// Only cache requests marked as cacheable (e.g. summaries, static queries)
		const cacheKey = request.metadata?.cacheKey || (request.metadata?.cacheable ? this._generateKey(request) : null);

		if (cacheKey && db && typeof db.get === 'function') {
			try {
				const cached = await db.get(`cortex:cache:${cacheKey}`);
				if (cached) {
					const parsed = JSON.parse(cached);
					parsed.fromCache = true;
					return parsed;
				}
			} catch (e) {
				// Cache miss on parse error
			}
		}

		const response = await this.realProvider.executeWorkflow(request, config);

		if (cacheKey && db && typeof db.set === 'function') {
			try {
				await db.set(`cortex:cache:${cacheKey}`, JSON.stringify(response));
				if (typeof db.expire === 'function') {
					await db.expire(`cortex:cache:${cacheKey}`, this.defaultTtlSeconds);
				}
			} catch (e) {
				// Ignore cache write errors
			}
		}

		return response;
	}

	_generateKey(request) {
		const hash = crypto.createHash('sha256');
		hash.update(`${this.name}:${request.model}:${request.prompt}`);
		return hash.digest('hex');
	}

	async testConnection(config) {
		return await this.realProvider.testConnection(config);
	}

	async listModels(config) {
		return await this.realProvider.listModels(config);
	}
}

module.exports = CachedProviderProxy;
