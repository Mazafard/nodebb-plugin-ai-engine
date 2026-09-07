'use strict';

const requireNodeBB = require('../nodebb');
const Settings = require('../settings');
const facade = require('../core/facade');
const Bot = require('../bot');

const ApiRoutes = {
	register(router, middleware) {
		const checkAdminPrivs = (middleware && middleware.admin && middleware.admin.checkPrivileges)
			? middleware.admin.checkPrivileges
			: (req, res, next) => next();

		// 1. Provider Connection Test
		router.post('/api/v3/plugins/ai-engine/test-provider', checkAdminPrivs, async (req, res) => {
			try {
				const { provider, config } = req.body;
				const currentSettings = await Settings.get();
				const mergedConfig = Object.assign({}, currentSettings, config || {});
				const result = await facade.testProvider(provider, mergedConfig);
				return res.json(result);
			} catch (err) {
				return res.status(500).json({ ok: false, error: err.message });
			}
		});

		// 2. Fetch Models List
		router.get('/api/v3/plugins/ai-engine/models/:provider', checkAdminPrivs, async (req, res) => {
			try {
				const { provider } = req.params;
				const currentSettings = await Settings.get();
				const models = await facade.listModels(provider, currentSettings);
				return res.json({ ok: true, models });
			} catch (err) {
				return res.status(500).json({ ok: false, error: err.message });
			}
		});

		// 3. Moderation Sandbox Simulator
		router.post('/api/v3/plugins/ai-engine/simulate-moderation', checkAdminPrivs, async (req, res) => {
			try {
				const { sampleText, title } = req.body;
				if (!sampleText || !sampleText.trim()) {
					return res.status(400).json({ ok: false, error: 'Please enter sample text to test.' });
				}
				const result = await facade.simulateModeration(sampleText, title);
				return res.json({ ok: true, result });
			} catch (err) {
				return res.status(500).json({ ok: false, error: err.message });
			}
		});

		// 4. Force Regenerate Topic Summary
		router.post('/api/v3/plugins/ai-engine/summary/:tid/regenerate', async (req, res) => {
			try {
				const tid = parseInt(req.params.tid, 10);
				if (!tid) return res.status(400).json({ error: 'Invalid tid' });

				const topics = requireNodeBB('./src/topics');
				const topicData = await topics.getTopicData(tid);
				if (!topicData) return res.status(404).json({ error: 'Topic not found' });

				const summary = await facade.summarizeTopic(tid, topicData.title, topicData.postcount);
				return res.json({ ok: true, summary });
			} catch (err) {
				return res.status(500).json({ ok: false, error: err.message });
			}
		});

		// 5. 1-Click Provision Bot Account
		router.post('/api/v3/plugins/ai-engine/provision-bot', checkAdminPrivs, async (req, res) => {
			try {
				const currentSettings = await Settings.get();
				const botUid = await Bot.getOrProvisionBot(currentSettings);
				return res.json({ ok: true, botUid });
			} catch (err) {
				return res.status(500).json({ ok: false, error: err.message });
			}
		});

		// 6. Audit Logs Endpoints
		router.get('/api/v3/plugins/ai-engine/logs', checkAdminPrivs, async (req, res) => {
			const logs = await Settings.getRecentLogs(parseInt(req.query.limit, 10) || 50);
			return res.json({ ok: true, logs });
		});

		router.delete('/api/v3/plugins/ai-engine/logs', checkAdminPrivs, async (req, res) => {
			await Settings.clearAuditLogs();
			return res.json({ ok: true, logs: [] });
		});
	},
};

module.exports = ApiRoutes;
