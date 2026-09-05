'use strict';

const BaseTabStrategy = require('./base');
const ModelPickerBuilder = require('../builder');

/**
 * [Pattern 4: Strategy Pattern]
 * SummarizerTabStrategy coordinates thread consensus settings.
 */
class SummarizerTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { modelProxy } = this.context;

		$('#summarizerProvider').on('change', function () {
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
		$('#summarizerProvider').trigger('change');
	}
}

module.exports = SummarizerTabStrategy;
