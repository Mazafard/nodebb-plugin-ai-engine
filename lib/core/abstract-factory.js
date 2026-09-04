'use strict';

const ModeratePostCommand = require('./commands/moderate-command');
const CopilotReplyCommand = require('./commands/copilot-command');
const SummarizeThreadCommand = require('./commands/summarize-command');
const CentralModelFactory = require('./factory');
const ExemptionHandler = require('./pipeline/exemption');
const SanitizerHandler = require('./pipeline/sanitizer');
const RateLimiterHandler = require('./pipeline/rate-limiter');

/**
 * [Pattern 3: Abstract Factory Pattern]
 * Defines the abstract interface for feature engine families.
 * Each family produces its own pipeline of handlers, commands, and provider bindings.
 */
class FeatureEngineFactory {
	createPipeline() {
		throw new Error('createPipeline() must be implemented by subclass');
	}

	createCommand(...args) {
		throw new Error('createCommand() must be implemented by subclass');
	}

	getProvider(settings) {
		throw new Error('getProvider() must be implemented by subclass');
	}
}

/**
 * Moderation Engine Family
 */
class ModerationEngineFactory extends FeatureEngineFactory {
	createPipeline() {
		const exemption = new ExemptionHandler();
		const sanitizer = new SanitizerHandler();
		exemption.setNext(sanitizer);
		return exemption;
	}

	createCommand(postData, settings) {
		return new ModeratePostCommand(postData, settings);
	}

	getProvider(settings) {
		return CentralModelFactory.getInstance().getProviderForTask('moderation', settings);
	}
}

/**
 * Copilot Engine Family
 */
class CopilotEngineFactory extends FeatureEngineFactory {
	createPipeline() {
		const rateLimiter = new RateLimiterHandler();
		const sanitizer = new SanitizerHandler();
		rateLimiter.setNext(sanitizer);
		return rateLimiter;
	}

	createCommand(topicData, postData, settings) {
		return new CopilotReplyCommand(topicData, postData, settings);
	}

	getProvider(settings) {
		return CentralModelFactory.getInstance().getProviderForTask('copilot', settings);
	}
}

/**
 * Summarizer Engine Family
 */
class SummarizerEngineFactory extends FeatureEngineFactory {
	createPipeline() {
		const sanitizer = new SanitizerHandler();
		return sanitizer;
	}

	createCommand(tid, title, postcount, settings) {
		return new SummarizeThreadCommand(tid, title, postcount, settings);
	}

	getProvider(settings) {
		return CentralModelFactory.getInstance().getProviderForTask('summarizer', settings);
	}
}

/**
 * Top-level Abstract Factory selector
 */
class AIEngineAbstractFactory {
	static getFactory(feature) {
		switch ((feature || '').toLowerCase()) {
			case 'moderation':
				return new ModerationEngineFactory();
			case 'copilot':
				return new CopilotEngineFactory();
			case 'summarizer':
				return new SummarizerEngineFactory();
			default:
				throw new Error(`[AIEngineAbstractFactory] Unknown feature engine: "${feature}"`);
		}
	}
}

module.exports = {
	FeatureEngineFactory,
	ModerationEngineFactory,
	CopilotEngineFactory,
	SummarizerEngineFactory,
	AIEngineAbstractFactory,
};
