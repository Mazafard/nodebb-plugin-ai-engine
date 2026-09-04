'use strict';

const OllamaProvider = {
	name: 'ollama',

	async testConnection(config) {
		const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
		const startTime = Date.now();
		try {
			const res = await fetch(`${baseUrl}/api/tags`, {
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			});
			if (!res.ok) {
				return { ok: false, error: `Ollama returned HTTP ${res.status}: ${res.statusText}` };
			}
			const data = await res.json();
			const latencyMs = Date.now() - startTime;
			const models = (data.models || []).map((m) => m.name || m.model);
			return { ok: true, latencyMs, models };
		} catch (err) {
			return { ok: false, error: err.message || 'Could not connect to Ollama daemon.' };
		}
	},

	async listModels(config) {
		const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
		try {
			const res = await fetch(`${baseUrl}/api/tags`, {
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			});
			if (res.ok) {
				const data = await res.json();
				return (data.models || []).map((m) => m.name || m.model);
			}
		} catch (e) {
			// ignore
		}
		return ['llama3.2:3b', 'llama3.2:1b', 'mistral', 'gemma2', 'qwen2.5'];
	},

	async generateText(options, config) {
		const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
		const model = options.model || config.ollamaDefaultModel || 'llama3.2:3b';

		const messages = [];
		if (options.systemPrompt) {
			messages.push({ role: 'system', content: options.systemPrompt });
		}
		messages.push({ role: 'user', content: options.prompt });

		const res = await fetch(`${baseUrl}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				messages,
				stream: false,
				options: {
					temperature: options.temperature || 0.3,
					num_predict: options.maxTokens || 1024,
				},
			}),
			signal: AbortSignal.timeout(60000),
		});

		if (!res.ok) {
			const errText = await res.text();
			throw new Error(`Ollama error (${res.status}): ${errText}`);
		}

		const data = await res.json();
		return (data.message && data.message.content) ? data.message.content.trim() : '';
	},

	async generateJSON(options, config) {
		const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
		const model = options.model || config.ollamaDefaultModel || 'llama3.2:3b';

		const messages = [];
		const sys = (options.systemPrompt || '') + '\nRespond ONLY with valid JSON. No markdown backticks, no preamble.';
		messages.push({ role: 'system', content: sys });
		messages.push({ role: 'user', content: options.prompt });

		const res = await fetch(`${baseUrl}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				messages,
				format: 'json',
				stream: false,
				options: {
					temperature: options.temperature || 0.1,
				},
			}),
			signal: AbortSignal.timeout(45000),
		});

		if (!res.ok) {
			const errText = await res.text();
			throw new Error(`Ollama error (${res.status}): ${errText}`);
		}

		const data = await res.json();
		const raw = (data.message && data.message.content) ? data.message.content.trim() : '{}';
		return JSON.parse(raw);
	},
};

module.exports = OllamaProvider;
