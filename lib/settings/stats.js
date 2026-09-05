'use strict';

const requireNodeBB = require('../nodebb');
const db = requireNodeBB('./src/database');

const STATS_KEY = 'ai-engine:stats';

const StatsManager = {
	async get() {
		try {
			if (db && typeof db.getObject === 'function') {
				const stats = await db.getObject(STATS_KEY);
				return Object.assign({
					totalCalls: 0,
					moderatedCount: 0,
					quarantinedCount: 0,
					copilotReplies: 0,
					summariesCreated: 0,
				}, stats || {});
			}
		} catch (e) {
			// ignore
		}
		return {
			totalCalls: 0,
			moderatedCount: 0,
			quarantinedCount: 0,
			copilotReplies: 0,
			summariesCreated: 0,
		};
	},

	async increment(field, count = 1) {
		try {
			if (db && typeof db.incrObjectFieldBy === 'function') {
				await db.incrObjectFieldBy(STATS_KEY, field, count);
				await db.incrObjectFieldBy(STATS_KEY, 'totalCalls', count);
			}
		} catch (e) {
			// ignore
		}
	},
};

module.exports = StatsManager;
