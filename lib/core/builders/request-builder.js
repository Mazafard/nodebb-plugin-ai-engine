'use strict';

/**
 * [Pattern 13: Builder Pattern]
 * Fluent builder for constructing structured AI inference requests.
 */
class InferenceRequestBuilder {
	constructor() {
		this._request = {
			prompt: '',
			systemPrompt: '',
			model: '',
			temperature: 0.3,
			maxTokens: 2048,
			format: 'text', // 'text' | 'json'
			metadata: {},
		};
	}

	withPrompt(prompt) {
		this._request.prompt = String(prompt || '').trim();
		return this;
	}

	withSystemPrompt(systemPrompt) {
		this._request.systemPrompt = String(systemPrompt || '').trim();
		return this;
	}

	withModel(model) {
		if (model) {
			this._request.model = String(model).trim();
		}
		return this;
	}

	withTemperature(temperature) {
		const temp = parseFloat(temperature);
		this._request.temperature = !isNaN(temp) ? Math.max(0, Math.min(2, temp)) : 0.3;
		return this;
	}

	withMaxTokens(maxTokens) {
		const tokens = parseInt(maxTokens, 10);
		this._request.maxTokens = !isNaN(tokens) && tokens > 0 ? tokens : 2048;
		return this;
	}

	asJSON() {
		this._request.format = 'json';
		return this;
	}

	asText() {
		this._request.format = 'text';
		return this;
	}

	withMetadata(key, value) {
		this._request.metadata[key] = value;
		return this;
	}

	build() {
		if (!this._request.prompt) {
			throw new Error('InferenceRequest requires a prompt.');
		}
		return Object.assign({}, this._request);
	}
}

module.exports = InferenceRequestBuilder;
