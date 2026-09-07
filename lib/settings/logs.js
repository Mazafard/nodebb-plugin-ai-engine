'use strict';

const requireNodeBB = require('../nodebb');
const db = requireNodeBB('./src/database');

const LOGS_KEY = 'ai-engine:logs';

const LogsManager = {
	async add(entry) {
		try {
			let winston;
			try {
				winston = requireNodeBB('winston');
			} catch (e) {
				winston = console;
			}
			if (winston && typeof winston.info === 'function') {
				winston.info(`[cortex-ai] ${entry.type || 'inference'} | verdict=${entry.verdict || 'OK'} | model=${entry.model || 'default'} | ${entry.reason || entry.title || ''}`);
			}

			if (db && typeof db.listAppend === 'function') {
				const logItem = JSON.stringify(Object.assign({
					timestamp: Date.now(),
				}, entry));
				await db.listAppend(LOGS_KEY, logItem);
				if (typeof db.listTrim === 'function') {
					await db.listTrim(LOGS_KEY, -100, -1);
				}
			}
		} catch (e) {
			// ignore
		}
	},

	async getRecent(limit = 50) {
		try {
			if (db && typeof db.getListRange === 'function') {
				const raw = await db.getListRange(LOGS_KEY, -limit, -1);
				if (Array.isArray(raw) && raw.length > 0) {
					return raw.map((item) => {
						try {
							const parsed = JSON.parse(item);
							if (parsed) {
								parsed.isFlagged = parsed.verdict === 'FLAGGED';
								parsed.formattedTime = parsed.timestamp
									? new Date(parsed.timestamp).toLocaleString()
									: 'Just now';
							}
							return parsed;
						} catch (e) {
							return null;
						}
					}).filter(Boolean).reverse();
				}
			}
		} catch (e) {
			// ignore
		}
		return [{
			timestamp: Date.now(),
			formattedTime: new Date().toLocaleString(),
			type: 'system',
			model: 'cortex/core',
			verdict: 'READY',
			isFlagged: false,
			latencyMs: 1,
			reason: 'Cortex AI Engine audit logger active and monitoring.',
		}];
	},

	async clear() {
		try {
			if (db && typeof db.delete === 'function') {
				await db.delete(LOGS_KEY);
			}
		} catch (e) {
			// ignore
		}
	},
};

module.exports = LogsManager;
