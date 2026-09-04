'use strict';

const BaseProviderDecorator = require('./base-decorator');
const Settings = require('../../settings');

/**
 * [Pattern 8: Decorator Pattern]
 * Telemetry decorator recording latency and persisting usage metrics.
 */
class TelemetryDecorator extends BaseProviderDecorator {
	constructor(wrappedProvider) {
		super(wrappedProvider);
	}

	async executeWorkflow(request, config) {
		const startTime = Date.now();
		try {
			const result = await this.wrappedProvider.executeWorkflow(request, config);
			const duration = Date.now() - startTime;
			result.latencyMs = duration;
			await Settings.incrementStat('totalCalls');
			return result;
		} catch (err) {
			await Settings.incrementStat('totalCalls');
			throw err;
		}
	}
}

module.exports = TelemetryDecorator;
