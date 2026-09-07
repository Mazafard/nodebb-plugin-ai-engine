'use strict';

const BaseAICommand = require('./base-command');
const CentralModelFactory = require('../factory');
const InferenceRequestBuilder = require('../builders/request-builder');
const ExemptionHandler = require('../pipeline/exemption');
const SanitizerHandler = require('../pipeline/sanitizer');
const Prompts = require('../../utils/prompts');
const eventBus = require('../events/event-bus');
const Settings = require('../../settings');

/**
 * [Pattern 12: Command Pattern]
 * Encapsulates the complete post screening and quarantine workflow.
 */
class ModeratePostCommand extends BaseAICommand {
	constructor(postData, settings) {
		super(settings);
		this.postData = postData;
	}

	async execute() {
		const post = this.postData.post || this.postData;
		if (!post || !post.content) {
			return this.postData;
		}

		// 1. Execute Chain of Responsibility pipeline (Exemption -> Sanitization)
		const exemption = new ExemptionHandler();
		const sanitizer = new SanitizerHandler();
		exemption.setNext(sanitizer);

		const context = await exemption.handle({
			uid: post.uid,
			rawContent: post.content,
			settings: this.settings,
			task: 'moderation',
		});

		// If exempt from moderation, bypass AI
		if (context.isExempt) {
			return this.postData;
		}

		// 2. Obtain Provider from Singleton Factory
		const factory = CentralModelFactory.getInstance();
		const { provider, modelName, providerName } = factory.getProviderForTask('moderation', this.settings);

		// 3. Build Request using Builder Pattern
		const prompt = Prompts.buildModerationPrompt(context.sanitizedContent, this.postData.data?.title);
		const request = new InferenceRequestBuilder()
			.withPrompt(prompt)
			.withSystemPrompt(Prompts.moderationSystemPrompt)
			.withModel(modelName)
			.withTemperature(0.1)
			.asJSON()
			.withMetadata('type', 'moderation')
			.build();

		// 4. Execute via Template Method / Adapter
		const response = await provider.executeWorkflow(request, this.settings);
		const result = response.data || {};

		await Settings.incrementStat('moderatedCount');

		const sensitivity = (parseInt(this.settings.moderationSensitivity, 10) || 65) / 100;
		const isFlagged = Boolean(result.flagged) && (parseFloat(result.score) >= sensitivity);

		// 5. Audit Log & Observer Notification
		await Settings.addAuditLog({
			type: 'moderation',
			uid: post.uid,
			pid: post.pid || 0,
			verdict: isFlagged ? 'FLAGGED' : 'CLEAN',
			category: result.category || 'clean',
			score: result.score || 0,
			reason: result.reason || 'No violation detected',
			model: `${providerName}/${modelName || 'default'}`,
			latencyMs: response.latencyMs,
		});

		if (isFlagged) {
			await Settings.incrementStat('quarantinedCount');

			eventBus.emit('post:quarantined', {
				pid: post.pid,
				uid: post.uid,
				reason: result.reason,
				model: `${providerName}/${modelName || 'default'}`,
			});

			const action = this.settings.moderationAction || 'queue';
			if (action === 'reject') {
				throw new Error(`[[error:ai-engine-rejected, ${result.reason || 'Content flagged by automated filter'}]]`);
			}

			const requireNodeBB = require('../../nodebb');
			const posts = requireNodeBB('./src/posts');
			if (posts && typeof posts.addToQueue === 'function') {
				await posts.addToQueue({
					uid: post.uid,
					tid: post.tid,
					content: post.content,
					data: Object.assign({}, this.postData.data || {}, {
						aiFlagReason: result.reason,
						aiCategory: result.category,
						aiScore: result.score,
					}),
				});

				throw new Error('[[error:post-queued, Your post has been submitted for moderator review.]]');
			}
		}

		return this.postData;
	}
}

module.exports = ModeratePostCommand;
