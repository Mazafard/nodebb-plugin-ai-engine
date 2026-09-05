'use strict';

/**
 * Live Model Pricing Service
 * Queries live public model pricing API and enriches detected models with real-time costs.
 */
class ModelPricingService {
	constructor() {
		this.cache = new Map();
		this.lastFetch = 0;
		this.CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours
	}

	async fetchLivePricing() {
		const now = Date.now();
		if (this.cache.size > 0 && now - this.lastFetch < this.CACHE_TTL) return this.cache;

		try {
			const res = await fetch('https://openrouter.ai/api/v1/models', {
				headers: { 'User-Agent': 'NodeBB-AI-Engine/1.0' }, signal: AbortSignal.timeout(6000),
			});
			if (res.ok) {
				const json = await res.json();
				for (const item of (json.data || [])) {
					if (item.id && item.pricing) {
						const input1M = (parseFloat(item.pricing.prompt) || 0) * 1000000;
						const output1M = (parseFloat(item.pricing.completion) || 0) * 1000000;
						const pData = {
							input: input1M, output: output1M, score: input1M + output1M,
							formatted: input1M === 0 && output1M === 0 ? 'Free' : `$${input1M.toFixed(input1M < 0.05 ? 4 : (input1M < 0.2 ? 3 : 2))}/1M`,
						};
						const rawId = item.id.toLowerCase();
						this.cache.set(rawId, pData);
						this.cache.set(rawId.split('/').pop(), pData);
						this.cache.set(rawId.replace(/[^a-z0-9]/g, ''), pData);
					}
				}
				this.lastFetch = now;
			}
		} catch (err) { /* silent fallback */ }
		return this.cache;
	}

	async enrichList(provider, modelList) {
		const p = (provider || '').toLowerCase().trim();
		if (p === 'ollama') {
			return (modelList || []).map(m => {
				const id = typeof m === 'string' ? m : (m.id || m.name || '');
				return { id, name: id, priceInput: 0, priceOutput: 0, priceScore: 0, formattedPrice: 'Free (Local)', tier: 'free' };
			});
		}

		await this.fetchLivePricing();

		return (modelList || []).map(m => {
			const id = typeof m === 'string' ? m : (m.id || m.name || '');
			const clean = id.toLowerCase().replace(/^models\//, '').trim();
			const norm = clean.replace(/[^a-z0-9]/g, '');

			let match = this.cache.get(clean) || this.cache.get(norm);
			if (!match) {
				for (const [key, data] of this.cache.entries()) {
					if ((p === 'gemini' && key.includes('gemini') && clean.includes('flash') && key.includes('flash')) ||
						(p === 'gemini' && key.includes('gemini') && clean.includes('pro') && key.includes('pro')) ||
						(p === 'openai' && key.includes('gpt-4o-mini') && clean.includes('4o-mini')) ||
						(p === 'openai' && key.includes('gpt-4o') && clean.includes('4o') && !clean.includes('mini')) ||
						(p === 'anthropic' && key.includes('sonnet') && clean.includes('sonnet')) ||
						(p === 'anthropic' && key.includes('haiku') && clean.includes('haiku'))) {
						match = data;
						break;
					}
				}
			}

			if (match) {
				return {
					id, name: id, priceInput: match.input, priceOutput: match.output,
					priceScore: match.score, formattedPrice: match.formatted,
					tier: match.score === 0 ? 'free' : (match.score < 1.0 ? 'budget' : 'standard'),
				};
			}

			return { id, name: id, priceInput: 0, priceOutput: 0, priceScore: 999, formattedPrice: 'API Rate', tier: 'standard' };
		});
	}
}

module.exports = new ModelPricingService();
