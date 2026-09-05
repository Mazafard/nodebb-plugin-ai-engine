'use strict';

const requireNodeBB = require('../nodebb');
const meta = requireNodeBB('./src/meta');
const defaults = require('./defaults');
const stats = require('./stats');
const logs = require('./logs');

const SETTINGS_KEY = 'ai-engine';

const Settings = {
	defaults,

	async get() {
		try {
			if (meta && meta.settings && typeof meta.settings.get === 'function') {
				const current = await meta.settings.get(SETTINGS_KEY);
				return Object.assign({}, defaults, current || {});
			}
		} catch (e) {
			// fallback
		}
		return Object.assign({}, defaults);
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
};

module.exports = Settings;
