'use strict';

const PipelineHandler = require('./handler');
const requireNodeBB = require('../../nodebb');
const user = requireNodeBB('./src/user');

/**
 * [Pattern 7: Chain of Responsibility Pattern]
 * Exemption Handler: Bypasses AI screening for staff and high-reputation members.
 */
class ExemptionHandler extends PipelineHandler {
	async handle(context) {
		const uid = parseInt(context.uid, 10);
		if (!uid || uid <= 0) {
			context.isExempt = false;
			return await super.handle(context);
		}

		// Staff exemptions
		const [isAdmin, isGlobalMod] = await Promise.all([
			user.isAdministrator ? user.isAdministrator(uid) : false,
			user.isGlobalModerator ? user.isGlobalModerator(uid) : false,
		]);

		if (isAdmin || isGlobalMod) {
			context.isExempt = true;
			context.exemptionReason = 'Staff privilege';
			return context; // Halt chain, bypass AI
		}

		// Threshold exemptions
		const minRep = parseInt(context.settings?.moderationMinReputation, 10) || 0;
		const minPosts = parseInt(context.settings?.moderationMinPosts, 10) || 0;

		if (minRep > 0 || minPosts > 0) {
			if (user.getUserFields) {
				const userData = await user.getUserFields(uid, ['reputation', 'postcount']);
				if (userData.reputation >= minRep && userData.postcount >= minPosts) {
					context.isExempt = true;
					context.exemptionReason = 'Reputation threshold met';
					return context; // Halt chain, bypass AI
				}
			}
		}

		context.isExempt = false;
		return await super.handle(context);
	}
}

module.exports = ExemptionHandler;
