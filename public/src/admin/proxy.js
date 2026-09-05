'use strict';

/**
 * [Pattern 9: Proxy Pattern]
 * In-memory client-side cache proxy preventing duplicate model queries.
 */
class ClientModelCacheProxy {
	constructor(adapter, eventBus) {
		this.adapter = adapter;
		this.eventBus = eventBus;
		this.cache = new Map();
	}

	async getModels(provider, forceRefresh = false) {
		const key = (provider || '').toLowerCase().trim();
		if (!forceRefresh && this.cache.has(key)) {
			return this.cache.get(key);
		}

		const res = await this.adapter.request(`/api/v3/plugins/ai-engine/models/${key}`, { method: 'GET' });
		const models = (res && res.models) ? res.models : [];
		this.cache.set(key, models);
		if (this.eventBus) {
			this.eventBus.emit('models:cached', { provider: key, models });
		}
		return models;
	}

	setModels(provider, models) {
		const key = (provider || '').toLowerCase().trim();
		this.cache.set(key, models || []);
		if (this.eventBus) {
			this.eventBus.emit('models:cached', { provider: key, models });
		}
	}

	getCached(provider) {
		return this.cache.get((provider || '').toLowerCase().trim()) || null;
	}

	clear() {
		this.cache.clear();
	}
}

module.exports = ClientModelCacheProxy;
