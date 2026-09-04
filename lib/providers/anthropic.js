'use strict';

const AnthropicProvider = {
	name: 'anthropic',

	async testConnection(config) {
		const apiKey = (config.anthropicApiKey || '').trim();
		if (!apiKey) {
			return { ok: false, error: 'Anthropic API Key is empty.' };
		}
		const startTime = Date.now();
		try {
			// Fast probe using messages API with max_tokens=1
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
					messages: [{ role: 'user', content: 'hi' }],
				}),
				signal: AbortSignal.timeout(6000),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				const msg = (err.error && err.error.message) || res.statusText;
				return { ok: false, error: `Anthropic API (${res.status}): ${msg}` };
			}

			const latencyMs = Date.now() - startTime;
			return {
				ok: true,
				latencyMs,
				models: [
					'claude-3-5-sonnet-20241022',
					'claude-3-5-haiku-20241022',
					'claude-3-opus-20240229',
				],
			};
		} catch (err) {
			return { ok: false, error: err.message || 'Connection to Anthropic failed.' };
		}
	},

	async listModels() {
		return [
			'claude-3-5-sonnet-20241022',
			'claude-3-5-haiku-20241022',
			'claude-3-opus-20240229',
		];
	},

	async generateText(options, config) {
		const apiKey = (config.anthropicApiKey || '').trim();
		if (!apiKey) {
			throw new Error('Anthropic API Key is missing');
		}
		const model = options.model || config.anthropicDefaultModel || 'claude-3-5-sonnet-20241022';

		const body = {
			model,
			max_tokens: options.maxTokens || 2048,
			temperature: options.temperature || 0.3,
			messages: [{ role: 'user', content: options.prompt }],
		};

		if (options.systemPrompt) {
			body.system = options.systemPrompt;
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
		return block ? block.text.trim() : '';
	},

	async generateJSON(options, config) {
		const sys = (options.systemPrompt || '') + '\nYou MUST respond ONLY in valid raw JSON. Do not include markdown codeblocks or extra explanations.';
		const raw = await this.generateText(
			Object.assign({}, options, { systemPrompt: sys, temperature: 0.1 }),
			config
		);
		const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
		return JSON.parse(cleaned);
	},
};

module.exports = AnthropicProvider;
