'use strict';

const requireNodeBB = require('./nodebb');
const meta = requireNodeBB('./src/meta');
const db = requireNodeBB('./src/database');

const SETTINGS_KEY = 'ai-engine';

const defaults = {
	enabled: 'on',
	activePreset: 'balanced',

	// Ollama
	ollamaEnabled: 'on',
	ollamaUrl: 'http://localhost:11434',
	ollamaDefaultModel: 'llama3.2:3b',

	// Gemini
	geminiEnabled: 'off',
	geminiApiKey: '',
	geminiDefaultModel: 'gemini-1.5-flash',

	// Anthropic
	anthropicEnabled: 'off',
	anthropicApiKey: '',
	anthropicDefaultModel: 'claude-3-5-sonnet-20241022',

	// OpenAI
	openaiEnabled: 'off',
	openaiApiKey: '',
	openaiBaseUrl: 'https://api.openai.com/v1',
	openaiDefaultModel: 'gpt-4o-mini',

	// Moderation Guard
	moderationEnabled: 'on',
	moderationProvider: 'ollama',
	moderationModel: 'llama3.2:3b',
	moderationSensitivity: '65',
	moderationAction: 'queue', // 'queue' | 'flag' | 'reject'
	moderationMinReputation: '10',
	moderationMinPosts: '5',

	// Copilot First-Response
	copilotEnabled: 'off',
	copilotProvider: 'gemini',
	copilotModel: 'gemini-1.5-flash',
	copilotBotUid: '0',
	copilotBotName: 'Cortex AI',
	copilotCategories: '',
	copilotDelaySeconds: '10',
	copilotMaxRepliesPerTopic: '1',
	copilotCustomPrompt: '',

	// Thread Summarizer
	summarizerEnabled: 'off',
	summarizerProvider: 'anthropic',
	summarizerModel: 'claude-3-5-sonnet-20241022',
	summarizerMinPosts: '15',
	summarizerUpdateInterval: '15',
	summarizerDefaultOpen: 'off',
};

const Settings = {
	async get() {
		try {
			if (meta && meta.settings && typeof meta.settings.get === 'function') {
				const settings = await meta.settings.get(SETTINGS_KEY);
				return Object.assign({}, defaults, settings || {});
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
		try {
			if (db && typeof db.getObject === 'function') {
				const stats = await db.getObject('ai-engine:stats');
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

	async incrementStat(field, count = 1) {
		try {
			if (db && typeof db.incrObjectFieldBy === 'function') {
				await db.incrObjectFieldBy('ai-engine:stats', field, count);
				await db.incrObjectFieldBy('ai-engine:stats', 'totalCalls', count);
			}
		} catch (e) {
			// ignore
		}
	},

	async addAuditLog(entry) {
		try {
			if (db && typeof db.listAppend === 'function') {
				const logItem = JSON.stringify(Object.assign({
					timestamp: Date.now(),
				}, entry));
				await db.listAppend('ai-engine:logs', logItem);
				if (typeof db.listTrim === 'function') {
					await db.listTrim('ai-engine:logs', -100, -1); // keep last 100 entries
				}
			}
		} catch (e) {
			// ignore
		}
	},

	async getRecentLogs(limit = 25) {
		try {
			if (db && typeof db.getListRange === 'function') {
				const raw = await db.getListRange('ai-engine:logs', -limit, -1);
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

module.exports = Settings;
