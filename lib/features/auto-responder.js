'use strict';

const requireNodeBB = require('../nodebb');
const topics = requireNodeBB('./src/topics');
const db = requireNodeBB('./src/database');
const Settings = require('../settings');
const Bot = require('../bot');
const ProviderManager = require('../providers');
const Prompts = require('../utils/prompts');
const SearchHelper = require('../utils/search-helper');

const AutoResponder = {
	async handleTopicPost(data) {
		const settings = await Settings.get();
		if (settings.enabled !== 'on' || settings.copilotEnabled !== 'on') {
			return;
		}

		const topic = data.topic;
		const post = data.post;
		if (!topic || !post || !topic.tid || !post.content) {
			return;
		}

		// Ensure category is allowed
		if (settings.copilotCategories && settings.copilotCategories.trim()) {
			const allowedCids = settings.copilotCategories
				.split(',')
				.map((c) => parseInt(c.trim(), 10))
				.filter(Boolean);

			if (allowedCids.length > 0 && !allowedCids.includes(parseInt(topic.cid, 10))) {
				return;
			}
		}

		const botUid = await Bot.getOrProvisionBot(settings);
		if (parseInt(post.uid, 10) === botUid) {
			return; // Don't reply to bot
		}

		// Check if this topic already has an AI copilot response
		const alreadyReplied = await db.getObjectField(`topic:${topic.tid}`, 'cortex:copilot:replied');
		if (alreadyReplied) {
			return;
		}

		// Run asynchronously with configurable artificial delay
		const delayMs = Math.max(1000, (parseInt(settings.copilotDelaySeconds, 10) || 5) * 1000);

		setTimeout(async () => {
			try {
				await AutoResponder.executeReply(topic, post, botUid, settings);
			} catch (err) {
				// Failed replies are logged but don't disrupt the forum
			}
		}, delayMs);
	},

	async executeReply(topic, post, botUid, settings) {
		// Double check topic still exists and hasn't been deleted or locked
		const currentTopic = await topics.getTopicData(topic.tid);
		if (!currentTopic || currentTopic.deleted || currentTopic.locked) {
			return;
		}

		// Mark immediately to prevent race conditions
		await db.setObjectField(`topic:${topic.tid}`, 'cortex:copilot:replied', 1);

		// Retrieve candidate solved/similar discussions for RAG
		const relatedTopics = await SearchHelper.findRelatedTopics(topic.title, topic.tid, 3);

		const providerName = settings.copilotProvider || 'gemini';
		const model = settings.copilotModel;
		let systemPrompt = Prompts.copilotSystemPrompt;
		if (settings.copilotCustomPrompt && settings.copilotCustomPrompt.trim()) {
			systemPrompt += '\n\nAdditional Community Rules:\n' + settings.copilotCustomPrompt.trim();
		}

		const prompt = Prompts.buildCopilotPrompt(topic.title, post.content, relatedTopics);

		const startTime = Date.now();
		let replyContent = await ProviderManager.generateText(providerName, {
			prompt,
			systemPrompt,
			model,
			temperature: 0.3,
			maxTokens: 1500,
		}, settings);
		const latencyMs = Date.now() - startTime;

		if (!replyContent || replyContent.length < 20) {
			return;
		}

		// Append subtle bot footer
		replyContent += `\n\n---\n*🤖 **Cortex Copilot** · Automated community response. Was this helpful? React to let us know!*`;

		// Post the reply
		await topics.reply({
			tid: topic.tid,
			uid: botUid,
			content: replyContent,
		});

		await Settings.incrementStat('copilotReplies');
		await Settings.addAuditLog({
			type: 'copilot_reply',
			tid: topic.tid,
			title: topic.title,
			provider: providerName,
			model: model || 'default',
			ragCandidatesFound: relatedTopics.length,
			latencyMs,
		});
	},
};

module.exports = AutoResponder;
