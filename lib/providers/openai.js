'use strict';

const OpenAIProvider = {
	name: 'openai',

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
	},

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
	},

	async generateText(options, config) {
		const apiKey = (config.openaiApiKey || '').trim();
		const baseUrl = (config.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
		if (!apiKey) {
			throw new Error('OpenAI API Key is missing');
		}
		const model = options.model || config.openaiDefaultModel || 'gpt-4o-mini';

		const messages = [];
		if (options.systemPrompt) {
			messages.push({ role: 'system', content: options.systemPrompt });
		}
		messages.push({ role: 'user', content: options.prompt });

		const res = await fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages,
				temperature: options.temperature || 0.4,
				max_tokens: options.maxTokens || 2048,
			}),
			signal: AbortSignal.timeout(60000),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(`OpenAI Error: ${(err.error && err.error.message) || res.statusText}`);
		}

		const data = await res.json();
		return data.choices?.[0]?.message?.content?.trim() || '';
	},

	async generateJSON(options, config) {
		const apiKey = (config.openaiApiKey || '').trim();
		const baseUrl = (config.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
		if (!apiKey) {
			throw new Error('OpenAI API Key is missing');
		}
		const model = options.model || config.openaiDefaultModel || 'gpt-4o-mini';

		const messages = [];
		const sys = (options.systemPrompt || '') + '\nYou MUST respond strictly in valid JSON format.';
		messages.push({ role: 'system', content: sys });
		messages.push({ role: 'user', content: options.prompt });

		const res = await fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages,
				temperature: options.temperature || 0.1,
				response_format: { type: 'json_object' },
			}),
			signal: AbortSignal.timeout(45000),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(`OpenAI Error: ${(err.error && err.error.message) || res.statusText}`);
		}

		const data = await res.json();
		const text = data.choices?.[0]?.message?.content?.trim() || '{}';
		return JSON.parse(text);
	},
};

module.exports = OpenAIProvider;
