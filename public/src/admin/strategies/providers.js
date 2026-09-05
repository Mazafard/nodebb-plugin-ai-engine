'use strict';

const BaseTabStrategy = require('./base');
const AsyncButtonDecorator = require('../decorator');
const ModelPickerBuilder = require('../builder');

/**
 * [Pattern 4: Strategy Pattern]
 * ProvidersTabStrategy coordinates connectivity testing and live model discovery.
 */
class ProvidersTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { apiFacade, widgetFactory, alerts } = this.context;

		// Synchronize card disabled & folded look for all providers
		['ollama', 'gemini', 'anthropic', 'openai'].forEach((p) => {
			const sync = () => {
				const on = $(`#${p}Enabled`).is(':checked');
				$(`#card-${p}`).toggleClass('card-disabled', !on).toggleClass('card-folded', !on);
				$(`#card-${p}`).find('.folded-badge').toggleClass('d-none', on);
				$(`#${p}-card-body`).toggleClass('card-switch-disabled', !on);
				$(`#card-${p}`).find('button:not(.form-check-input)').prop('disabled', !on);
				if (!on) $(`#${p}-status`).html('<span class="badge bg-secondary-subtle text-secondary border">Disabled</span>');
			};
			$(`#${p}Enabled`).on('change', sync);
			sync();
		});

		const syncOllamaCloud = () => {
			const isCloud = $('#ollamaUseCloud').is(':checked');
			$('#ollama-local-url-group').toggleClass('d-none', isCloud); $('#ollama-cloud-url-group').toggleClass('d-none', !isCloud);
			$('#ollama-api-key-hint').text(isCloud ? '(Required for Ollama Cloud)' : '(Optional for local)');
		};
		$('#ollamaUseCloud').on('change', syncOllamaCloud);
		syncOllamaCloud();

		// Test provider connection
		$('.test-provider-btn').on('click', function () {
			const btn = this;
			const provider = $(btn).attr('data-provider');
			const badge = $(`#${provider}-status`);

			badge.html(widgetFactory.createStatusBadge('loading', 'Testing...'));

			const payload = {
				ollamaUrl: $('#ollamaUrl').val(), ollamaCloudUrl: $('#ollamaCloudUrl').val(),
				ollamaUseCloud: $('#ollamaUseCloud').is(':checked') ? 'on' : 'off', ollamaApiKey: $('#ollamaApiKey').val(),
				geminiApiKey: $('#geminiApiKey').val(), anthropicApiKey: $('#anthropicApiKey').val(),
				openaiApiKey: $('#openaiApiKey').val(), openaiBaseUrl: $('#openaiBaseUrl').val(),
			};

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const res = await apiFacade.testProvider(provider, payload);
					if (res && res.ok) {
						badge.html(widgetFactory.createStatusBadge('success', 'Connected', res.latencyMs));
						alerts.success(`${provider.toUpperCase()} connected successfully! (${res.latencyMs}ms)`);
						if (res.models && res.models.length) {
							new ModelPickerBuilder().forProvider(provider).withModels(res.models)
								.withCurrentValue($(`#${provider}DefaultModel`).val()).withTargetInput(`#${provider}DefaultModel`).build($(`#${provider}-model-picker`));
						}
					} else {
						badge.html(widgetFactory.createStatusBadge('failed', 'Failed'));
						alerts.error(res.error || 'Connection failed.');
					}
				} catch (err) {
					badge.html(widgetFactory.createStatusBadge('failed', 'Error'));
					alerts.error(err.message);
				}
			}, 'Testing...');
		});

		// Auto-Detect button in provider cards
		$('.auto-detect-btn').on('click', function () {
			const btn = this;
			const provider = $(btn).attr('data-provider');
			const input = $(btn).closest('.input-group').find('input');

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const models = await apiFacade.fetchModels(provider, true);
					if (models && models.length) {
						alerts.success(`Found ${models.length} available models for ${provider.toUpperCase()}`);
						new ModelPickerBuilder().forProvider(provider).withModels(models)
							.withCurrentValue(input.val() || (models[0].id || models[0])).withTargetInput(`#${input.attr('id')}`).build($(`#${provider}-model-picker`));
						if (!input.val()) input.val(models[0].id || models[0]);
					} else {
						alerts.alert({ type: 'info', title: 'Model Detection', message: 'No models detected.' });
					}
				} catch (err) {
					alerts.error('Could not auto-detect models: ' + err.message);
				}
			}, 'Detecting...');
		});
	}
}

module.exports = ProvidersTabStrategy;
