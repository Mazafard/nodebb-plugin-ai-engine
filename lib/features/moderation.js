'use strict';

const Settings = require('../settings');
const facade = require('../core/facade');

/**
 * Moderation Feature Interface
 * Coordinates post screening via the CortexAIFacade.
 */
const Moderation = {
	async handlePostSave(data) {
		const settings = await Settings.get();
		if (!Settings.isTrue(settings.enabled) || !Settings.isTrue(settings.moderationEnabled)) {
			return data;
		}

		try {
			return await facade.moderatePost(data, settings);
		} catch (err) {
			// Pass-through NodeBB quarantine and rejection signals
			if (err.message && (err.message.includes('error:ai-engine-rejected') || err.message.includes('error:post-queued'))) {
				throw err;
			}
			// Fail-open: do not block users if AI provider experiences momentary outage
			return data;
		}
	},

	async simulate(sampleText, title = '') {
		return await facade.simulateModeration(sampleText, title);
	},
};

module.exports = Moderation;
