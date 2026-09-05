'use strict';

/**
 * [Pattern 6: Facade Pattern]
 * High-level API Facade masking backend endpoints for the ACP.
 */
class AdminAPIFacade {
	constructor(adapter, proxy, eventBus, settingsModule, alertsModule) {
		this.adapter = adapter;
		this.proxy = proxy;
		this.eventBus = eventBus;
		this.settings = settingsModule;
		this.alerts = alertsModule;
	}

	async testProvider(provider, configPayload) {
		const res = await this.adapter.request('/api/v3/plugins/ai-engine/test-provider', {
			method: 'POST',
			body: { provider, config: configPayload },
		});
		if (res && res.ok && res.models && res.models.length) {
			this.proxy.setModels(provider, res.models);
		}
		this.eventBus.emit('provider:tested', { provider, res });
		return res;
	}

	async fetchModels(provider, forceRefresh = true) {
		const models = await this.proxy.getModels(provider, forceRefresh);
		this.eventBus.emit('models:received', { provider, models });
		return models;
	}

	async simulateModeration(sampleText, title = '') {
		return await this.adapter.request('/api/v3/plugins/ai-engine/simulate-moderation', {
			method: 'POST',
			body: { sampleText, title },
		});
	}

	async provisionBot() {
		return await this.adapter.request('/api/v3/plugins/ai-engine/provision-bot', {
			method: 'POST',
		});
	}

	saveSettings(formElement, callback) {
		const alerts = this.alerts;
		this.settings.save('ai-engine', formElement, function () {
			alerts.success('Cortex AI Engine configuration saved successfully!');
			if (typeof callback === 'function') callback();
		});
	}
}

module.exports = AdminAPIFacade;
