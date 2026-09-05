'use strict';

const BaseTabStrategy = require('./base');
const { ApplyPresetCommand } = require('../commands');

/**
 * [Pattern 4: Strategy Pattern]
 * OverviewTabStrategy coordinates preset selection.
 */
class OverviewTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { alerts, eventBus } = this.context;
		const sync = () => {
			const on = $('#enabled').is(':checked');
			$('#card-master-overview').toggleClass('card-disabled', !on);
			$('#master-card-body').toggleClass('card-switch-disabled', !on);
			$('#card-master-overview').find('button:not(.form-check-input)').prop('disabled', !on);
		};
		$('#enabled').on('change', sync);
		sync();

		$('.apply-preset-btn').on('click', function () {
			const preset = $(this).attr('data-preset');
			new ApplyPresetCommand(preset, alerts, eventBus).execute();
		});
	}
}

module.exports = OverviewTabStrategy;
