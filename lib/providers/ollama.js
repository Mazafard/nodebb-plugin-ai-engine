'use strict';

const OllamaProvider = {
	name: 'ollama',

	async resolveBaseUrl(rawUrl) {
		const url = (rawUrl || 'http://localhost:11434').replace(/\/+$/, '');
		if (url.includes('localhost') || url.includes('127.0.0.1')) {
			try {
				const check = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(1000) });
				if (check.ok) return url;
			} catch (e) {
				const dockerUrl = url.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
				try {
					const dockerCheck = await fetch(`${dockerUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
					if (dockerCheck.ok) return dockerUrl;
				} catch (err) {
					// fallback to original
				}
			}
		}
		return url;
	},

	async testConnection(config) {
		const baseUrl = await this.resolveBaseUrl(config.ollamaUrl);
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
			return { ok: true, latencyMs, models, resolvedUrl: baseUrl };
		} catch (err) {
			const cause = err.cause ? ` (${err.cause.code || err.cause.message})` : '';
			return {
				ok: false,
				error: `Could not connect to Ollama at ${baseUrl}${cause}. If running NodeBB in Docker, ensure Ollama is running and accessible on host.docker.internal:11434.`,
			};
		}
	},

	async listModels(config) {
		const baseUrl = await this.resolveBaseUrl(config.ollamaUrl);
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
		const baseUrl = await this.resolveBaseUrl(config.ollamaUrl);
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
		const baseUrl = await this.resolveBaseUrl(config.ollamaUrl);
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
