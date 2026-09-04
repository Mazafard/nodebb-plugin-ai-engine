'use strict';

const BaseProvider = require('../base-provider');

/**
 * [Pattern 4: Strategy Pattern & Pattern 5: Adapter Pattern]
 * Concrete Adapter for OpenAI & OpenAI-compatible REST API.
 */
class OpenAIAdapter extends BaseProvider {
	constructor() {
		super('openai');
	}

	async testConnection(config) {
		const apiKey = (config.openaiApiKey || '').trim();
		const baseUrl = (config.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
		if (!apiKey) {
			return { ok: false, error: 'OpenAI API Key is empty.' };
		}
		const startTime = Date.now();
		try {
			const res = await fetch(`${baseUrl}/models`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				signal: AbortSignal.timeout(6000),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				const msg = (err.error && err.error.message) || res.statusText;
				return { ok: false, error: `OpenAI API (${res.status}): ${msg}` };
			}

			const data = await res.json();
			const latencyMs = Date.now() - startTime;
			const models = (data.data || [])
				.map((m) => m.id)
				.filter((id) => id.includes('gpt') || id.includes('o1') || id.includes('o3'));
			return {
				ok: true,
				latencyMs,
				models,
			};
		} catch (err) {
			const cause = err.cause ? ` (${err.cause.code || err.cause.message || ''})` : '';
			return { ok: false, error: (err.message || 'Connection to OpenAI failed.') + cause };
		}
	}

	async listModels(config) {
		const apiKey = (config.openaiApiKey || '').trim();
		const baseUrl = (config.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
		if (!apiKey) {
			return [];
		}
		try {
			const res = await fetch(`${baseUrl}/models`, {
				headers: { Authorization: `Bearer ${apiKey}` },
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
		const apiKey = (config.openaiApiKey || '').trim();
		const baseUrl = (config.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
		if (!apiKey) {
			throw new Error('OpenAI API Key is missing');
		}
		const model = request.model || config.openaiDefaultModel || 'gpt-4o-mini';

		const messages = [];
		let sys = request.systemPrompt || '';
		if (request.format === 'json') {
			sys += '\nYou MUST respond strictly in valid JSON format.';
		}
		if (sys) {
			messages.push({ role: 'system', content: sys });
		}
		messages.push({ role: 'user', content: request.prompt });

		const body = {
			model,
			messages,
			temperature: request.temperature || 0.3,
			max_tokens: request.maxTokens || 2048,
		};

		if (request.format === 'json') {
			body.response_format = { type: 'json_object' };
		}

		const res = await fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(60000),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(`OpenAI Error: ${(err.error && err.error.message) || res.statusText}`);
		}

		const data = await res.json();
		const text = data.choices?.[0]?.message?.content?.trim() || '';

		if (request.format === 'json') {
			return JSON.parse(text || '{}');
		}
		return text;
	}
}

module.exports = OpenAIAdapter;
