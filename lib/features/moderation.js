'use strict';

const requireNodeBB = require('../nodebb');
const user = requireNodeBB('./src/user');
const posts = requireNodeBB('./src/posts');
const flags = requireNodeBB('./src/flags');
const Settings = require('../settings');
const ProviderManager = require('../providers');
const Prompts = require('../utils/prompts');

const Moderation = {
	async handlePostSave(data) {
		const settings = await Settings.get();
		if (settings.enabled !== 'on' || settings.moderationEnabled !== 'on') {
			return data;
		}

		const post = data.post;
		if (!post || !post.content || typeof post.content !== 'string') {
			return data;
		}

		const uid = parseInt(post.uid, 10);
		if (uid <= 0) {
			return data;
		}

		// Exemption checks: Admins & Global Mods
		const [isAdmin, isGlobalMod] = await Promise.all([
			user.isAdministrator(uid),
			user.isGlobalModerator(uid),
		]);
		if (isAdmin || isGlobalMod) {
			return data;
		}

		// User reputation & postcount thresholds
		const minRep = parseInt(settings.moderationMinReputation, 10) || 0;
		const minPosts = parseInt(settings.moderationMinPosts, 10) || 0;
		if (minRep > 0 || minPosts > 0) {
			const userData = await user.getUserFields(uid, ['reputation', 'postcount']);
			if (userData.reputation >= minRep && userData.postcount >= minPosts) {
				return data;
			}
		}

		// Run evaluation
		try {
			const providerName = settings.moderationProvider || 'ollama';
			const model = settings.moderationModel;
			const prompt = Prompts.buildModerationPrompt(post.content, data.data ? data.data.title : '');

			const result = await ProviderManager.generateJSON(providerName, {
				prompt,
				systemPrompt: Prompts.moderationSystemPrompt,
				model,
				temperature: 0.1,
			}, settings);

			await Settings.incrementStat('moderatedCount');

			const sensitivity = (parseInt(settings.moderationSensitivity, 10) || 65) / 100;
			const isFlagged = Boolean(result.flagged) && (parseFloat(result.score) >= sensitivity);

			// Log audit event
			await Settings.addAuditLog({
				type: 'moderation',
				uid,
				pid: post.pid || 0,
				verdict: isFlagged ? 'FLAGGED' : 'CLEAN',
				category: result.category || 'clean',
				score: result.score || 0,
				reason: result.reason || 'No violation detected',
				model: `${providerName}/${model || 'default'}`,
			});

			if (isFlagged) {
				await Settings.incrementStat('quarantinedCount');

				const action = settings.moderationAction || 'queue';
				if (action === 'reject') {
					throw new Error(`[[error:ai-engine-rejected, ${result.reason || 'Content flagged by automated filter'}]]`);
				}

				// Quarantine: add to NodeBB moderation queue
				if (posts && typeof posts.addToQueue === 'function') {
					await posts.addToQueue({
						uid,
						tid: post.tid,
						content: post.content,
						data: Object.assign({}, data.data || {}, {
							aiFlagReason: result.reason,
							aiCategory: result.category,
							aiScore: result.score,
						}),
					});

					// Stop immediate post publication
					throw new Error('[[error:post-queued, Your post has been submitted for moderator review.]]');
				} else {
					// Fallback: create automated moderation flag
					if (flags && typeof flags.create === 'function' && post.pid) {
						await flags.create({
							type: 'post',
							id: post.pid,
							uid: 1,
							reason: `[Cortex AI Guard] ${result.category}: ${result.reason} (Confidence: ${Math.round(result.score * 100)}%)`,
						});
					}
				}
			}
		} catch (err) {
			if (err.message && (err.message.includes('error:ai-engine-rejected') || err.message.includes('error:post-queued'))) {
				throw err;
			}
			// Fail-open: do not block users if AI provider experiences momentary outage
		}

		return data;
	},

	async simulate(sampleText, title = '') {
		const settings = await Settings.get();
		const providerName = settings.moderationProvider || 'ollama';
		const model = settings.moderationModel;
		const prompt = Prompts.buildModerationPrompt(sampleText, title);

		const startTime = Date.now();
		const result = await ProviderManager.generateJSON(providerName, {
			prompt,
			systemPrompt: Prompts.moderationSystemPrompt,
			model,
			temperature: 0.1,
		}, settings);
		const latencyMs = Date.now() - startTime;

		const sensitivity = (parseInt(settings.moderationSensitivity, 10) || 65) / 100;
		const wouldQuarantine = Boolean(result.flagged) && (parseFloat(result.score) >= sensitivity);

		return Object.assign({}, result, {
			latencyMs,
			wouldQuarantine,
			sensitivityUsed: sensitivity,
			provider: providerName,
			model: model || 'default',
		});
	},
};

module.exports = Moderation;
