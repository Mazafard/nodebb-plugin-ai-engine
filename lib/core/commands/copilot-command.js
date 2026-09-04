'use strict';

const BaseAICommand = require('./base-command');
const CentralModelFactory = require('../factory');
const InferenceRequestBuilder = require('../builders/request-builder');
const SearchHelper = require('../../utils/search-helper');
const Prompts = require('../../utils/prompts');
const Bot = require('../../bot');
const Settings = require('../../settings');
const requireNodeBB = require('../../nodebb');
const db = requireNodeBB('./src/database');
const topics = requireNodeBB('./src/topics');

/**
 * [Pattern 12: Command Pattern]
 * Encapsulates the Copilot RAG search & automated first-response workflow.
 */
class CopilotReplyCommand extends BaseAICommand {
	constructor(topicData, postData, settings) {
		super(settings);
		this.topic = topicData;
		this.post = postData;
	}

	async execute() {
		if (!this.topic || !this.post || !this.topic.tid || !this.post.content) {
			return;
		}

		// Category Whitelist
		if (this.settings.copilotCategories && this.settings.copilotCategories.trim()) {
			const allowedCids = this.settings.copilotCategories
				.split(',')
				.map((c) => parseInt(c.trim(), 10))
				.filter(Boolean);

			if (allowedCids.length > 0 && !allowedCids.includes(parseInt(this.topic.cid, 10))) {
				return;
			}
		}

		const botUid = await Bot.getOrProvisionBot(this.settings);
		if (parseInt(this.post.uid, 10) === botUid) {
			return;
		}

		// Prevent duplicate auto-replies
		const alreadyReplied = await db.getObjectField(`topic:${this.topic.tid}`, 'cortex:copilot:replied');
		if (alreadyReplied) {
			return;
		}

		await db.setObjectField(`topic:${this.topic.tid}`, 'cortex:copilot:replied', 1);

		// 1. RAG: Retrieve related solved threads
		const relatedTopics = await SearchHelper.findRelatedTopics(this.topic.title, this.topic.tid, 3);

		// 2. Factory provider resolution
		const factory = CentralModelFactory.getInstance();
		const { provider, modelName, providerName } = factory.getProviderForTask('copilot', this.settings);

		// 3. Request Builder
		let systemPrompt = Prompts.copilotSystemPrompt;
		if (this.settings.copilotCustomPrompt && this.settings.copilotCustomPrompt.trim()) {
			systemPrompt += '\n\nAdditional Community Rules:\n' + this.settings.copilotCustomPrompt.trim();
		}

		const prompt = Prompts.buildCopilotPrompt(this.topic.title, this.post.content, relatedTopics);
		const request = new InferenceRequestBuilder()
			.withPrompt(prompt)
			.withSystemPrompt(systemPrompt)
			.withModel(modelName)
			.withTemperature(0.3)
			.withMaxTokens(1500)
			.withMetadata('type', 'copilot_reply')
			.build();

		// 4. Execute inference
		const response = await provider.executeWorkflow(request, this.settings);
		let replyContent = response.text || '';

		if (!replyContent || replyContent.length < 20) {
			return;
		}

		replyContent += `\n\n---\n*🤖 **Cortex Copilot** · Automated community response. Was this helpful? React to let us know!*`;

		// 5. Post to thread
		await topics.reply({
			tid: this.topic.tid,
			uid: botUid,
			content: replyContent,
		});

		await Settings.incrementStat('copilotReplies');
		await Settings.addAuditLog({
			type: 'copilot_reply',
			tid: this.topic.tid,
			title: this.topic.title,
			provider: providerName,
			model: modelName || 'default',
			ragCandidatesFound: relatedTopics.length,
			latencyMs: response.latencyMs,
		});
	}
}

module.exports = CopilotReplyCommand;
