'use strict';

/**
 * [Pattern 7: Chain of Responsibility Pattern]
 * Sequential validation pipeline for admin settings inputs.
 */
class FormValidationHandler {
	setNext(handler) {
		this.next = handler;
		return handler;
	}

	validate(data) {
		if (this.next) {
			return this.next.validate(data);
		}
		return { valid: true };
	}
}

class SecretInputValidator extends FormValidationHandler {
	validate(data) {
		if (data.geminiEnabled && !data.geminiApiKey) {
			return { valid: false, message: 'Google Gemini is enabled but API Key is empty.' };
		}
		if (data.anthropicEnabled && !data.anthropicApiKey) {
			return { valid: false, message: 'Anthropic Claude is enabled but API Key is empty.' };
		}
		if (data.openaiEnabled && !data.openaiApiKey) {
			return { valid: false, message: 'OpenAI is enabled but API Key is empty.' };
		}
		return super.validate(data);
	}
}

class UrlFormatValidator extends FormValidationHandler {
	validate(data) {
		if (data.ollamaEnabled && data.ollamaUrl) {
			if (!data.ollamaUrl.startsWith('http://') && !data.ollamaUrl.startsWith('https://')) {
				return { valid: false, message: 'Ollama Daemon URL must start with http:// or https://' };
			}
		}
		return super.validate(data);
	}
}

module.exports = {
	FormValidationHandler,
	SecretInputValidator,
	UrlFormatValidator,
};
