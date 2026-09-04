'use strict';

const Routes = require('./lib/routes');
const Moderation = require('./lib/features/moderation');
const AutoResponder = require('./lib/features/auto-responder');
const Summarizer = require('./lib/features/summarizer');

const plugin = {
	async init(params) {
		Routes.init(params);
	},

	async addAdminNavigation(header) {
		header.plugins = header.plugins || [];
		header.plugins.push({
			route: '/plugins/ai-engine',
			icon: 'fa-brain',
			name: 'Cortex AI Engine',
		});
		return header;
	},

	async filterPostSave(data) {
		return await Moderation.handlePostSave(data);
	},

	async actionTopicPost(data) {
		await AutoResponder.handleTopicPost(data);
	},

	async filterTopicBuild(data) {
		return await Summarizer.handleTopicBuild(data);
	},
};

module.exports = plugin;
