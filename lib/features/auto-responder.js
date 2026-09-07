'use strict';

const Settings = require('../settings');
const Bot = require('../bot');
const facade = require('../core/facade');

/**
 * Community Copilot Feature Interface
 * Coordinates AI auto-responses via the CortexAIFacade.
 */
const AutoResponder = {
	async handleTopicPost(data) {
		const settings = await Settings.get();
		if (!Settings.isTrue(settings.enabled) || !Settings.isTrue(settings.copilotEnabled)) {
			return;
		}

		const topic = data.topic;
		const post = data.post;
		if (!topic || !post || !topic.tid || !post.content) {
			return;
		}

		const botUid = await Bot.getOrProvisionBot(settings);
		if (parseInt(post.uid, 10) === botUid) {
			return; // Do not reply to self
		}

		const delayMs = Math.max(1000, (parseInt(settings.copilotDelaySeconds, 10) || 5) * 1000);

		setTimeout(async () => {
			try {
				await facade.generateCopilotReply(topic, post, settings);
			} catch (err) {
				// Failed replies are logged but do not disrupt forum operations
			}
		}, delayMs);
	},
};

module.exports = AutoResponder;
