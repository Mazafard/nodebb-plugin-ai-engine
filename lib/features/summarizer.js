'use strict';

const requireNodeBB = require('../nodebb');
const db = requireNodeBB('./src/database');
const Settings = require('../settings');
const facade = require('../core/facade');

/**
 * Thread TL;DR Summarizer Feature Interface
 * Coordinates consensus extraction and summary injection via CortexAIFacade.
 */
const Summarizer = {
	async handleTopicBuild(data) {
		const settings = await Settings.get();
		if (!Settings.isTrue(settings.enabled) || !Settings.isTrue(settings.summarizerEnabled)) {
			return data;
		}

		const templateData = data.topic || data.templateData || data;
		if (!templateData || !templateData.tid) {
			return data;
		}

		const tid = parseInt(templateData.tid, 10);
		const postcount = parseInt(templateData.postcount, 10) || (templateData.posts ? templateData.posts.length : 0);
		const minPosts = parseInt(settings.summarizerMinPosts, 10) || 15;

		if (postcount < minPosts) {
			return data;
		}

		const cacheKey = `topic:${tid}:ai:summary`;
		const cached = await db.getObject(cacheKey);

		if (cached && cached.summary) {
			let parsedSummary = cached.summary;
			if (typeof parsedSummary === 'string') {
				try {
					parsedSummary = JSON.parse(parsedSummary);
				} catch (e) {
					parsedSummary = null;
				}
			}

			if (parsedSummary) {
				const lastCount = parseInt(cached.postCountAtGeneration, 10) || 0;
				const interval = parseInt(settings.summarizerUpdateInterval, 10) || 15;

				if ((postcount - lastCount) < interval) {
					templateData.aiSummary = {
						tldr: parsedSummary.tldr,
						keyPoints: parsedSummary.keyPoints || [],
						consensus: parsedSummary.consensus,
						model: cached.model,
						updatedAt: new Date(parseInt(cached.updatedAt, 10) || Date.now()).toLocaleDateString(),
						defaultOpen: settings.summarizerDefaultOpen === 'on',
					};
					return data;
				}
			}
		}

		try {
			const summaryData = await Summarizer.generateSummary(tid, templateData.title, postcount, settings);
			if (summaryData) {
				templateData.aiSummary = {
					tldr: summaryData.tldr,
					keyPoints: summaryData.keyPoints || [],
					consensus: summaryData.consensus,
					model: summaryData.model,
					updatedAt: 'Just now',
					defaultOpen: settings.summarizerDefaultOpen === 'on',
				};
			}
		} catch (err) {
			// Fail gracefully
		}

		return data;
	},

	async generateSummary(tid, title, postcount, settings) {
		return await facade.summarizeTopic(tid, title, postcount, settings);
	},
};

module.exports = Summarizer;
