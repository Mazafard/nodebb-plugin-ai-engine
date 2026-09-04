'use strict';

const BaseAICommand = require('./base-command');
const CentralModelFactory = require('../factory');
const InferenceRequestBuilder = require('../builders/request-builder');
const Prompts = require('../../utils/prompts');
const Settings = require('../../settings');
const requireNodeBB = require('../../nodebb');
const db = requireNodeBB('./src/database');
const topics = requireNodeBB('./src/topics');
const posts = requireNodeBB('./src/posts');
const user = requireNodeBB('./src/user');

/**
 * [Pattern 12: Command Pattern]
 * Encapsulates thread reading, multi-page batching, and debate consensus synthesis.
 */
class SummarizeThreadCommand extends BaseAICommand {
	constructor(tid, title, postcount, settings) {
		super(settings);
		this.tid = parseInt(tid, 10);
		this.title = title || `Topic #${tid}`;
		this.postcount = parseInt(postcount, 10) || 0;
	}

	async execute() {
		if (!this.tid) return null;

		const pids = await topics.getPids(this.tid);
		if (!pids || pids.length === 0) return null;

		// Select optimal post batch (first post + last 25 replies for resolution)
		let targetPids = pids;
		if (pids.length > 30) {
			targetPids = [pids[0]].concat(pids.slice(-25));
		}

		const postRecords = await posts.getPostsFields(targetPids, ['pid', 'uid', 'content']);
		const formattedPosts = [];

		for (const p of postRecords) {
			if (p && p.content) {
				const clean = p.content.replace(/<[^>]*>?/gm, '').trim();
				if (clean.length > 0) {
					const username = user.getUserField ? (await user.getUserField(p.uid, 'username')) : 'user';
					formattedPosts.push({ username: username || 'user', content: clean });
				}
			}
		}

		if (formattedPosts.length === 0) return null;

		// Factory provider resolution
		const factory = CentralModelFactory.getInstance();
		const { provider, modelName, providerName } = factory.getProviderForTask('summarizer', this.settings);

		// Builder Pattern
		const prompt = Prompts.buildSummarizerPrompt(this.title, formattedPosts);
		const request = new InferenceRequestBuilder()
			.withPrompt(prompt)
			.withSystemPrompt(Prompts.summarizerSystemPrompt)
			.withModel(modelName)
			.withTemperature(0.2)
			.asJSON()
			.withMetadata('type', 'summarizer')
			.withMetadata('cacheable', true)
			.build();

		const response = await provider.executeWorkflow(request, this.settings);
		const result = response.data || {};

		if (!result || !result.tldr) return null;

		const cacheRecord = {
			tid: this.tid,
			postCountAtGeneration: this.postcount,
			updatedAt: Date.now(),
			model: `${providerName}/${modelName || 'default'}`,
			summary: JSON.stringify(result),
		};

		if (db && typeof db.setObject === 'function') {
			await db.setObject(`topic:${this.tid}:ai:summary`, cacheRecord);
		}

		await Settings.incrementStat('summariesCreated');
		await Settings.addAuditLog({
			type: 'summarizer',
			tid: this.tid,
			title: this.title,
			provider: providerName,
			model: modelName || 'default',
			postsAnalyzed: formattedPosts.length,
			latencyMs: response.latencyMs,
		});

		return Object.assign({}, result, { model: cacheRecord.model });
	}
}

module.exports = SummarizeThreadCommand;
