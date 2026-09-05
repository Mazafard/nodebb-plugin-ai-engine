'use strict';

const CentralModelFactory = require('./factory');
const { AIEngineAbstractFactory } = require('./abstract-factory');
const InferenceRequestBuilder = require('./builders/request-builder');
const Prompts = require('../utils/prompts');
const eventBus = require('./events/event-bus');
const Settings = require('../settings');
const ModelPricing = require('./pricing');

/**
 * [Pattern 6: Facade Pattern]
 * CortexAIFacade provides a high-level, unified interface masking all subsystems:
 * - CentralModelFactory (Singleton & Factory Method)
 * - Adapters & Providers (Strategy & Adapter)
 * - Decorators (Retry, Telemetry)
 * - Proxy (Caching)
 * - Chains (Pipeline Handlers)
 * - Commands (Command execution)
 * - Request Builders (Builder)
 * - Abstract Factory (Engine families)
 * - Event Bus (Observer)
 */
class CortexAIFacade {
	constructor() {
		this.factory = CentralModelFactory.getInstance();
		this.eventBus = eventBus;
	}

	/**
	 * Executes the complete moderation workflow for a post
	 */
	async moderatePost(postData, settings) {
		const engine = AIEngineAbstractFactory.getFactory('moderation');
		const command = engine.createCommand(postData, settings);
		return await command.execute();
	}

	/**
	 * Simulates moderation evaluation for testing/admin diagnostics
	 */
	async simulateModeration(sampleText, title = '', settings = null) {
		if (!settings) {
			settings = await Settings.get();
		}

		const { provider, modelName, providerName } = this.factory.getProviderForTask('moderation', settings);
		const prompt = Prompts.buildModerationPrompt(sampleText, title);

		const request = new InferenceRequestBuilder()
			.withPrompt(prompt)
			.withSystemPrompt(Prompts.moderationSystemPrompt)
			.withModel(modelName)
			.withTemperature(0.1)
			.asJSON()
			.withMetadata('type', 'simulation')
			.build();

		const response = await provider.executeWorkflow(request, settings);
		const result = response.data || {};

		const sensitivity = (parseInt(settings.moderationSensitivity, 10) || 65) / 100;
		const wouldQuarantine = Boolean(result.flagged) && (parseFloat(result.score) >= sensitivity);

		return Object.assign({}, result, {
			latencyMs: response.latencyMs,
			wouldQuarantine,
			sensitivityUsed: sensitivity,
			provider: providerName,
			model: modelName || 'default',
		});
	}

	/**
	 * Triggers the AI Copilot first-response workflow
	 */
	async generateCopilotReply(topicData, postData, settings) {
		const engine = AIEngineAbstractFactory.getFactory('copilot');
		const command = engine.createCommand(topicData, postData, settings);
		return await command.execute();
	}

	/**
	 * Generates or retrieves a consensus summary for a topic thread
	 */
	async summarizeTopic(tid, title, postcount, settings) {
		const engine = AIEngineAbstractFactory.getFactory('summarizer');
		const command = engine.createCommand(tid, title, postcount, settings);
		return await command.execute();
	}

	/**
	 * Tests provider connectivity and credentials
	 */
	async testProvider(type, settings) {
		const provider = this.factory.createProvider(type);
		const result = await provider.testConnection(settings);
		if (result && result.models && result.models.length) {
			result.models = await ModelPricing.enrichList(type, result.models);
		}
		return result;
	}

	/**
	 * Fetches available models from the target provider
	 */
	async listModels(type, settings) {
		const provider = this.factory.createProvider(type);
		const rawModels = await provider.listModels(settings);
		return await ModelPricing.enrichList(type, rawModels);
	}

	/**
	 * Exposes the central EventBus
	 */
	getEvents() {
		return this.eventBus;
	}

	/**
	 * Resets provider pool / cache if needed
	 */
	reset() {
		this.factory.clearPool();
	}
}

// Export singleton instance of the Facade
module.exports = new CortexAIFacade();
