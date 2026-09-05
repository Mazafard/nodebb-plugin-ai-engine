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

	async getRecent(limit = 25) {
		try {
			if (db && typeof db.getListRange === 'function') {
				const raw = await db.getListRange(LOGS_KEY, -limit, -1);
				if (Array.isArray(raw)) {
					return raw.map((item) => {
						try {
							return JSON.parse(item);
						} catch (e) {
							return null;
						}
					}).filter(Boolean).reverse();
				}
			}
		} catch (e) {
			// ignore
		}
		return [];
	},
};

module.exports = LogsManager;
