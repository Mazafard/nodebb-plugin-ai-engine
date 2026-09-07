'use strict';

const requireNodeBB = require('../nodebb');
const meta = requireNodeBB('./src/meta');
const defaults = require('./defaults');
const stats = require('./stats');
const logs = require('./logs');

const SETTINGS_KEY = 'ai-engine';

const Settings = {
	defaults,

	isTrue(val) {
		return val === 'on' || val === true || val === '1' || val === 1;
	},

	async get() {
		let current = {};
		try {
			if (meta && meta.settings && typeof meta.settings.get === 'function') {
				current = (await meta.settings.get(SETTINGS_KEY)) || {};
			}
		} catch (e) {
			// fallback
		}
		const merged = Object.assign({}, defaults, current);
		const boolKeys = [
			'enabled', 'ollamaEnabled', 'ollamaUseCloud', 'geminiEnabled',
			'anthropicEnabled', 'openaiEnabled', 'moderationEnabled',
			'copilotEnabled', 'summarizerEnabled', 'summarizerDefaultOpen',
		];
		boolKeys.forEach((k) => {
			if (merged[k] !== undefined) {
				merged[k] = this.isTrue(merged[k]) ? 'on' : 'off';
			}
		});
		return merged;
	},

	async set(newSettings) {
		if (meta && meta.settings && typeof meta.settings.set === 'function') {
			await meta.settings.set(SETTINGS_KEY, newSettings);
		}
	},

	async getStats() {
		return await stats.get();
	},

	async incrementStat(field, count = 1) {
		return await stats.increment(field, count);
	},

	async addAuditLog(entry) {
		return await logs.add(entry);
	},

	async getRecentLogs(limit = 25) {
		return await logs.getRecent(limit);
	},

	async clearAuditLogs() {
		return await logs.clear();
	},
};

module.exports = Settings;
