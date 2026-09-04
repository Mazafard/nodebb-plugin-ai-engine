'use strict';

const BaseProvider = require('../base-provider');

/**
 * [Pattern 4: Strategy Pattern & Pattern 5: Adapter Pattern]
 * Concrete Adapter for Ollama REST API.
 */
class OllamaAdapter extends BaseProvider {
	constructor() {
		super('ollama');
	}

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
					// fallback
				}
			}
		}
		return url;
	}

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
				error: `Could not connect to Ollama at ${baseUrl}${cause}. If running NodeBB in Docker, ensure Ollama is accessible on host.docker.internal:11434.`,
			};
		}
	}

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
		return [];
	}

	async doRequest(request, config) {
		const baseUrl = await this.resolveBaseUrl(config.ollamaUrl);
		const model = request.model || config.ollamaDefaultModel || 'llama3.2:3b';

		const messages = [];
		let sys = request.systemPrompt || '';
		if (request.format === 'json') {
			sys += '\nRespond ONLY with valid JSON. No markdown backticks, no preamble.';
		}
		if (sys) {
			messages.push({ role: 'system', content: sys });
		}
		messages.push({ role: 'user', content: request.prompt });

		const body = {
			model,
			messages,
			stream: false,
			options: {
				temperature: request.temperature || 0.3,
				num_predict: request.maxTokens || 1024,
			},
		};

		if (request.format === 'json') {
			body.format = 'json';
		}

		const res = await fetch(`${baseUrl}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(60000),
		});

		if (!res.ok) {
			const errText = await res.text();
			throw new Error(`Ollama error (${res.status}): ${errText}`);
		}

		const data = await res.json();
		const raw = (data.message && data.message.content) ? data.message.content.trim() : '';

		if (request.format === 'json') {
			return JSON.parse(raw || '{}');
		}
		return raw;
	}
}

module.exports = OllamaAdapter;
