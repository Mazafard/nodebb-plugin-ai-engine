'use strict';

const BaseTabStrategy = require('./base');
const AsyncButtonDecorator = require('../decorator');
const ModelPickerBuilder = require('../builder');

/**
 * [Pattern 4: Strategy Pattern]
 * CopilotTabStrategy coordinates bot provisioning and category scoping.
 */
class CopilotTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { apiFacade, modelProxy, alerts } = this.context;

		$('#provision-bot-btn').on('click', function () {
			const btn = this;
			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const res = await apiFacade.provisionBot();
					if (res && res.ok && res.botUid) {
						$('#copilotBotUid').val(res.botUid);
						alerts.success(`Cortex Bot provisioned with UID: ${res.botUid}`);
					}
				} catch (err) {
					alerts.error(err.message || 'Could not provision bot account.');
				}
			}, 'Creating...');
		});

		$('#copilotProvider').on('change', function () {
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
	}

	onActivate() {
		$('#copilotProvider').trigger('change');
	}
}

module.exports = CopilotTabStrategy;
