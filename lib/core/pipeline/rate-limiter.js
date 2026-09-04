'use strict';

const PipelineHandler = require('./handler');

const cooldowns = new Map();

/**
 * [Pattern 7: Chain of Responsibility Pattern]
 * Rate Limiter Handler: Enforces anti-spam cooldowns per UID.
 */
class RateLimiterHandler extends PipelineHandler {
	constructor(cooldownMs = 3000) {
		super();
		this.cooldownMs = cooldownMs;
	}

	async handle(context) {
		const key = `user:${context.uid}:${context.task || 'general'}`;
		const lastTime = cooldowns.get(key) || 0;
		const now = Date.now();

		if (now - lastTime < this.cooldownMs) {
			context.rateLimited = true;
			return context; // Cooldown active, halt pipeline
		}

		cooldowns.set(key, now);
		context.rateLimited = false;

		return await super.handle(context);
	}
}

module.exports = RateLimiterHandler;
