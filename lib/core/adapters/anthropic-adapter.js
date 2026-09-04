'use strict';

const BaseProvider = require('../base-provider');

/**
 * [Pattern 4: Strategy Pattern & Pattern 5: Adapter Pattern]
 * Concrete Adapter for Anthropic Messages API.
 */
class AnthropicAdapter extends BaseProvider {
	constructor() {
		super('anthropic');
	}

	async testConnection(config) {
		const apiKey = (config.anthropicApiKey || '').trim();
		if (!apiKey) {
			return { ok: false, error: 'Anthropic API Key is empty.' };
		}
		const startTime = Date.now();
		try {
			const res = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					model: 'claude-3-5-haiku-20241022',
					max_tokens: 1,
					messages: [{ role: 'user', content: 'ping' }],
				}),
				signal: AbortSignal.timeout(6000),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				const msg = (err.error && err.error.message) || res.statusText;
				return { ok: false, error: `Anthropic API (${res.status}): ${msg}` };
			}

			const latencyMs = Date.now() - startTime;
			const models = await this.listModels(config);
			return {
				ok: true,
				latencyMs,
				models,
			};
		} catch (err) {
			const cause = err.cause ? ` (${err.cause.code || err.cause.message || ''})` : '';
			return { ok: false, error: (err.message || 'Connection to Anthropic failed.') + cause };
		}
	}

	async listModels(config) {
		const apiKey = config ? (config.anthropicApiKey || '').trim() : '';
		if (!apiKey) return [];
		try {
			const res = await fetch('https://api.anthropic.com/v1/models', {
				headers: {
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
				},
				signal: AbortSignal.timeout(6000),
			});
			if (res.ok) {
				const data = await res.json();
				return (data.data || []).map((m) => m.id);
			}
		} catch (e) {
			// ignore
		}
		return [];
	}

	async doRequest(request, config) {
		const apiKey = (config.anthropicApiKey || '').trim();
		if (!apiKey) {
			throw new Error('Anthropic API Key is missing');
		}
		const model = request.model || config.anthropicDefaultModel || 'claude-3-5-sonnet-20241022';

		const body = {
			model,
			max_tokens: request.maxTokens || 2048,
			temperature: request.temperature || 0.3,
			messages: [{ role: 'user', content: request.prompt }],
		};

		let sys = request.systemPrompt || '';
		if (request.format === 'json') {
			sys += '\nYou MUST respond strictly in valid raw JSON. No markdown backticks, no explanations.';
		}
		if (sys) {
			body.system = sys;
		}

		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json',
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(60000),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(`Anthropic API Error: ${(err.error && err.error.message) || res.statusText}`);
		}

		const data = await res.json();
		const block = (data.content || []).find((b) => b.type === 'text');
		const text = block ? block.text.trim() : '';

		if (request.format === 'json') {
			const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
			return JSON.parse(cleaned || '{}');
		}
		return text;
	}
}

module.exports = AnthropicAdapter;
