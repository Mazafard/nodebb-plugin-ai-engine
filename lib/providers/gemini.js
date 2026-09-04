'use strict';

const GeminiProvider = {
	name: 'gemini',

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
			return { ok: false, error: err.message || 'Connection to Gemini API failed.' };
		}
	},

	async listModels(config) {
		const apiKey = (config.geminiApiKey || '').trim();
		if (!apiKey) {
			return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
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
		return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
	},

	async generateText(options, config) {
		const apiKey = (config.geminiApiKey || '').trim();
		if (!apiKey) {
			throw new Error('Gemini API Key is missing');
		}
		const model = options.model || config.geminiDefaultModel || 'gemini-1.5-flash';

		const contents = [];
		contents.push({
			role: 'user',
			parts: [{ text: options.prompt }],
		});

		const body = {
			contents,
			generationConfig: {
				temperature: options.temperature || 0.4,
				maxOutputTokens: options.maxTokens || 2048,
			},
		};

		if (options.systemPrompt) {
			body.systemInstruction = {
				parts: [{ text: options.systemPrompt }],
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
		if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
			return '';
		}
		return candidate.content.parts[0].text.trim();
	},

	async generateJSON(options, config) {
		const apiKey = (config.geminiApiKey || '').trim();
		if (!apiKey) {
			throw new Error('Gemini API Key is missing');
		}
		const model = options.model || config.geminiDefaultModel || 'gemini-1.5-flash';

		const body = {
			contents: [
				{
					role: 'user',
					parts: [{ text: options.prompt }],
				},
			],
			generationConfig: {
				temperature: options.temperature || 0.1,
				responseMimeType: 'application/json',
			},
		};

		if (options.systemPrompt) {
			body.systemInstruction = {
				parts: [{ text: options.systemPrompt }],
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
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
		return JSON.parse(text);
	},
};

module.exports = GeminiProvider;
