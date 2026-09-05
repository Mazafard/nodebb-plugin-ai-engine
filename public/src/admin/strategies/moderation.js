'use strict';

const BaseTabStrategy = require('./base');
const AsyncButtonDecorator = require('../decorator');
const ModelPickerBuilder = require('../builder');

/**
 * [Pattern 4: Strategy Pattern]
 * ModerationTabStrategy coordinates sensitivity controls and sandbox evaluation.
 */
class ModerationTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { apiFacade, modelProxy, alerts } = this.context;

		const sync = () => {
			const on = $('#moderationEnabled').is(':checked');
			$('#card-moderation').toggleClass('card-disabled', !on);
			$('#moderation-card-body').toggleClass('card-switch-disabled', !on);
			$('#card-moderation').find('button:not(.form-check-input)').prop('disabled', !on);
		};
		$('#moderationEnabled').on('change', sync);
		sync();

		$('#moderationSensitivity').on('input', function () {
			$('#sensitivity-display').text($(this).val() + '%');
		});

		$('#moderationProvider').on('change', function () {
			const provider = $(this).val();
			const targetPicker = $(this).attr('data-target-picker');
			const targetInput = $(this).attr('data-target-input');
			const cachedModels = modelProxy.getCached(provider);
			if (cachedModels && cachedModels.length) {
				new ModelPickerBuilder()
					.forProvider(provider)
					.withModels(cachedModels)
					.withCurrentValue($(targetInput).val())
					.withTargetInput(targetInput)
					.build($(targetPicker));
			} else {
				$(targetPicker).html('').addClass('d-none');
			}
		});

		$('#run-sandbox-btn').on('click', function () {
			const btn = this;
			const text = $('#sandbox-input').val();
			const resultBox = $('#sandbox-result');

			if (!text || !text.trim()) {
				return alerts.error('Please enter sample text to test in the sandbox.');
			}

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const res = await apiFacade.simulateModeration(text);
					if (res && res.ok && res.result) {
						const r = res.result;
						const scorePercent = Math.round((r.score || 0) * 100);
						if (r.wouldQuarantine) {
							resultBox.html(`
								<span class="badge bg-danger p-2">
									<i class="fa fa-ban me-1"></i> WOULD QUARANTINE (${scorePercent}%)
								</span>
								<div class="mt-1 text-danger small">${r.category}: ${r.reason} (${r.latencyMs}ms)</div>
							`);
						} else {
							resultBox.html(`
								<span class="badge bg-success p-2">
									<i class="fa fa-check me-1"></i> PASS CLEAN (${scorePercent}%)
								</span>
								<div class="mt-1 text-success small">${r.reason || 'Clean message'} (${r.latencyMs}ms)</div>
							`);
						}
					}
				} catch (err) {
					alerts.error(err.message || 'Sandbox simulation failed.');
				}
			}, 'Scanning...');
		});
	}

	onActivate() {
		$('#moderationProvider').trigger('change');
	}
}

module.exports = ModerationTabStrategy;
