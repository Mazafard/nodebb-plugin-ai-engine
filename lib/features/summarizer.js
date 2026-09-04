'use strict';

const requireNodeBB = require('../nodebb');
const db = requireNodeBB('./src/database');
const posts = requireNodeBB('./src/posts');
const topics = requireNodeBB('./src/topics');
const Settings = require('../settings');
const ProviderManager = require('../providers');
const Prompts = require('../utils/prompts');

const Summarizer = {
	async handleTopicBuild(data) {
		const settings = await Settings.get();
		if (settings.enabled !== 'on' || settings.summarizerEnabled !== 'on') {
			return data;
		}

		const templateData = data.templateData;
		if (!templateData || !templateData.tid) {
			return data;
		}

		const tid = parseInt(templateData.tid, 10);
		const postcount = parseInt(templateData.postcount, 10) || (templateData.posts ? templateData.posts.length : 0);
		const minPosts = parseInt(settings.summarizerMinPosts, 10) || 15;

		if (postcount < minPosts) {
			return data;
		}

		// Check cache
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
				const lastGeneratedCount = parseInt(cached.postCountAtGeneration, 10) || 0;
				const updateInterval = parseInt(settings.summarizerUpdateInterval, 10) || 15;

				// If not enough new posts to justify re-summarizing, use cache
				if ((postcount - lastGeneratedCount) < updateInterval) {
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

		// Trigger asynchronous generation or generate now if not cached yet
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
		if (!settings) {
			settings = await Settings.get();
		}

		// Fetch topic posts for context
		const pids = await topics.getPids(tid);
		if (!pids || pids.length === 0) {
			return null;
		}

		// Take first post + last 25 posts to keep token length optimal and capture resolution
		let targetPids = pids;
		if (pids.length > 30) {
			targetPids = [pids[0]].concat(pids.slice(-25));
		}

		const postRecords = await posts.getPostsFields(targetPids, ['pid', 'uid', 'content', 'timestamp']);
		const formattedPosts = [];

		for (const p of postRecords) {
			if (p && p.content) {
				const clean = p.content.replace(/<[^>]*>?/gm, '').trim();
				if (clean.length > 0) {
					const user = requireNodeBB('./src/user');
					const username = (await user.getUserField(p.uid, 'username')) || 'user';
					formattedPosts.push({ username, content: clean });
				}
			}
		}

		if (formattedPosts.length === 0) {
			return null;
		}

		const providerName = settings.summarizerProvider || 'anthropic';
		const model = settings.summarizerModel;
		const prompt = Prompts.buildSummarizerPrompt(title || `Topic #${tid}`, formattedPosts);

		const startTime = Date.now();
		const result = await ProviderManager.generateJSON(providerName, {
			prompt,
			systemPrompt: Prompts.summarizerSystemPrompt,
			model,
			temperature: 0.2,
		}, settings);
		const latencyMs = Date.now() - startTime;

		if (!result || !result.tldr) {
			return null;
		}

		const cacheRecord = {
			tid,
			postCountAtGeneration: postcount,
			updatedAt: Date.now(),
			model: `${providerName}/${model || 'default'}`,
			summary: JSON.stringify(result),
		};

		await db.setObject(`topic:${tid}:ai:summary`, cacheRecord);
		await Settings.incrementStat('summariesCreated');
		await Settings.addAuditLog({
			type: 'summarizer',
			tid,
			title: title || `Topic #${tid}`,
			provider: providerName,
			model: model || 'default',
			postsAnalyzed: formattedPosts.length,
			latencyMs,
		});

		return Object.assign({}, result, { model: cacheRecord.model });
	},
};

module.exports = Summarizer;
