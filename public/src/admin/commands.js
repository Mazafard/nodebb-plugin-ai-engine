'use strict';

const { SecretInputValidator, UrlFormatValidator } = require('./validator');

/**
 * [Pattern 12: Command Pattern]
 * Encapsulates Preset application and Settings saving.
 */
class ApplyPresetCommand {
	constructor(preset, alerts, eventBus) {
		this.preset = preset;
		this.alerts = alerts;
		this.eventBus = eventBus;
	}

	execute() {
		if (this.preset === 'private') {
			$('#ollamaEnabled').prop('checked', true).trigger('change');
			$('#geminiEnabled, #anthropicEnabled, #openaiEnabled').prop('checked', false).trigger('change');
			$('#moderationProvider, #copilotProvider, #summarizerProvider').val('ollama').trigger('change');
			this.alerts.success('Applied "100% Free & Private" (Ollama Local) preset! Click Save Changes to apply.');
		} else if (this.preset === 'balanced') {
			$('#ollamaEnabled, #geminiEnabled').prop('checked', true).trigger('change');
			$('#anthropicEnabled, #openaiEnabled').prop('checked', false).trigger('change');
			$('#moderationProvider').val('ollama').trigger('change');
			$('#copilotProvider, #summarizerProvider').val('gemini').trigger('change');
			this.alerts.success('Applied "Speed & Cost Champion" preset! Click Save Changes to apply.');
		} else if (this.preset === 'enterprise') {
			$('#ollamaEnabled').prop('checked', false).trigger('change');
			$('#openaiEnabled, #geminiEnabled, #anthropicEnabled').prop('checked', true).trigger('change');
			$('#moderationProvider').val('openai').trigger('change');
			$('#copilotProvider').val('gemini').trigger('change');
			$('#summarizerProvider').val('anthropic').trigger('change');
			this.alerts.success('Applied "Enterprise Synergy" preset! Click Save Changes to apply.');
		}

		$('.preset-card').removeClass('active-preset');
		$(`.preset-card[data-preset="${this.preset}"]`).addClass('active-preset');
		if (this.eventBus) {
			this.eventBus.emit('preset:applied', { preset: this.preset });
		}
	}
}

class SaveSettingsCommand {
	constructor(formSelector, apiFacade, alerts) {
		this.$form = $(formSelector);
		this.apiFacade = apiFacade;
		this.alerts = alerts;
	}

	execute() {
		const selectedCids = [];
		$('.category-checkbox:checked').each(function () {
			selectedCids.push($(this).val());
		});
		$('#copilotCategories').val(selectedCids.join(','));

		const validatorChain = new SecretInputValidator();
		validatorChain.setNext(new UrlFormatValidator());

		const formData = {
			ollamaEnabled: $('#ollamaEnabled').is(':checked'),
			ollamaUseCloud: $('#ollamaUseCloud').is(':checked'),
			ollamaUrl: $('#ollamaUrl').val(),
			ollamaCloudUrl: $('#ollamaCloudUrl').val(),
			ollamaApiKey: $('#ollamaApiKey').val(),
			geminiEnabled: $('#geminiEnabled').is(':checked'),
			geminiApiKey: $('#geminiApiKey').val(),
			anthropicEnabled: $('#anthropicEnabled').is(':checked'),
			anthropicApiKey: $('#anthropicApiKey').val(),
			openaiEnabled: $('#openaiEnabled').is(':checked'),
			openaiApiKey: $('#openaiApiKey').val(),
		};

		const validation = validatorChain.validate(formData);
		if (!validation.valid) {
			this.alerts.error(validation.message);
			return;
		}

		this.apiFacade.saveSettings(this.$form);
	}
}

module.exports = {
	ApplyPresetCommand,
	SaveSettingsCommand,
};
