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
		$('.apply-preset-btn').on('click', function () {
			const preset = $(this).attr('data-preset');
			new ApplyPresetCommand(preset, alerts, eventBus).execute();
		});
	}
}

module.exports = OverviewTabStrategy;
