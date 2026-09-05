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

		// Test provider connection
		$('.test-provider-btn').on('click', function () {
			const btn = this;
			const provider = $(btn).attr('data-provider');
			const badge = $(`#${provider}-status`);

			badge.html(widgetFactory.createStatusBadge('loading', 'Testing...'));

			const providerPayload = {
				ollamaUrl: $('#ollamaUrl').val(),
				ollamaApiKey: $('#ollamaApiKey').val(),
				geminiApiKey: $('#geminiApiKey').val(),
				anthropicApiKey: $('#anthropicApiKey').val(),
				openaiApiKey: $('#openaiApiKey').val(),
				openaiBaseUrl: $('#openaiBaseUrl').val(),
			};

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const res = await apiFacade.testProvider(provider, providerPayload);
					if (res && res.ok) {
						badge.html(widgetFactory.createStatusBadge('success', 'Connected', res.latencyMs));
						alerts.success(`${provider.toUpperCase()} connected successfully! (${res.latencyMs}ms)`);
						if (res.models && res.models.length) {
							new ModelPickerBuilder()
								.forProvider(provider)
								.withModels(res.models)
								.withCurrentValue($(`#${provider}DefaultModel`).val())
								.withTargetInput(`#${provider}DefaultModel`)
								.build($(`#${provider}-model-picker`));
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
						new ModelPickerBuilder()
							.forProvider(provider)
							.withModels(models)
							.withCurrentValue(input.val() || models[0])
							.withTargetInput(`#${input.attr('id')}`)
							.build($(`#${provider}-model-picker`));
						if (!input.val()) {
							input.val(models[0]);
						}
					} else {
						alerts.alert({
							type: 'info',
							title: 'Model Detection',
							message: 'No models detected for this provider credentials.',
						});
					}
				} catch (err) {
					alerts.error('Could not auto-detect models: ' + err.message);
				}
			}, 'Detecting...');
		});
	}
}

module.exports = ProvidersTabStrategy;
