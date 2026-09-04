'use strict';

const BaseProvider = require('../base-provider');

/**
 * [Pattern 4: Strategy Pattern & Pattern 5: Adapter Pattern]
 * Concrete Adapter for Google Gemini REST API.
 */
class GeminiAdapter extends BaseProvider {
	constructor() {
		super('gemini');
	}

	async testConnection(config) {
		const apiKey = (config.geminiApiKey || '').trim();
		if (!apiKey) {
			return { ok: false, error: 'Gemini API Key is empty.' };
		}
		const startTime = Date.now();
		try {
			const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
				method: 'GET',
				signal: AbortSignal.timeout(6000),
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				const msg = (errData.error && errData.error.message) || res.statusText;
				return { ok: false, error: `Gemini API Error (${res.status}): ${msg}` };
			}
			const data = await res.json();
			const latencyMs = Date.now() - startTime;
			const models = (data.models || [])
				.filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
				.map((m) => m.name.replace('models/', ''));
			return { ok: true, latencyMs, models };
		} catch (err) {
			const cause = err.cause ? ` (${err.cause.code || err.cause.message || ''})` : '';
			return { ok: false, error: (err.message || 'Connection to Gemini API failed.') + cause };
		}
	}

	async listModels(config) {
		const apiKey = (config.geminiApiKey || '').trim();
		if (!apiKey) {
			return [];
		}
		try {
			const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
				method: 'GET',
				signal: AbortSignal.timeout(6000),
			});
			if (res.ok) {
				const data = await res.json();
				return (data.models || [])
					.filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
					.map((m) => m.name.replace('models/', ''));
			}
		} catch (e) {
			// ignore
		}
		return [];
	}

	async doRequest(request, config) {
		const apiKey = (config.geminiApiKey || '').trim();
		if (!apiKey) {
			throw new Error('Gemini API Key is missing');
		}
		const model = request.model || config.geminiDefaultModel || 'gemini-1.5-flash';

		const contents = [
			{
				role: 'user',
				parts: [{ text: request.prompt }],
			},
		];

		const generationConfig = {
			temperature: request.temperature || 0.3,
			maxOutputTokens: request.maxTokens || 2048,
		};

		if (request.format === 'json') {
			generationConfig.responseMimeType = 'application/json';
		}

		const body = {
			contents,
			generationConfig,
		};

		if (request.systemPrompt) {
			body.systemInstruction = {
				parts: [{ text: request.systemPrompt }],
			};
		}

		const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(45000),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(`Gemini API Error: ${(err.error && err.error.message) || res.statusText}`);
		}

		const data = await res.json();
		const candidate = data.candidates && data.candidates[0];
		const text = candidate?.content?.parts?.[0]?.text || '';

		if (request.format === 'json') {
			return JSON.parse(text || '{}');
		}
		return text.trim();
	}
}

module.exports = GeminiAdapter;
