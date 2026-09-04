'use strict';

const requireNodeBB = require('./nodebb');
const Settings = require('./settings');
const facade = require('./core/facade');
const Bot = require('./bot');
const Version = require('./version');

const Routes = {
	init(params) {
		const { router, middleware } = params;
		const routeHelpers = requireNodeBB('./src/routes/helpers');
		const categories = requireNodeBB('./src/categories');

		const renderAdminPage = async (req, res) => {
			const [settings, stats, logs, allCategories] = await Promise.all([
				Settings.get(),
				Settings.getStats(),
				Settings.getRecentLogs(30),
				categories.getCategoriesByRole ? categories.getCategoriesByRole(req.uid, 'read') : (categories.buildForSelect ? categories.buildForSelect(1) : []),
			]);

			// Parse whitelisted CIDs for checkbox selection
			const selectedCids = (settings.copilotCategories || '')
				.split(',')
				.map((c) => parseInt(c.trim(), 10))
				.filter(Boolean);

			const formattedCategories = (allCategories || []).map((cat) => ({
				cid: cat.cid,
				name: cat.name,
				selected: selectedCids.includes(parseInt(cat.cid, 10)),
			}));

			res.render('admin/plugins/ai-engine', {
				settings,
				stats,
				logs,
				version: Version.get(),
				categories: formattedCategories,
				title: 'Cortex AI Community Engine',
			});
		};

		// Plugin metadata & health info endpoint
		router.get('/api/v3/plugins/ai-engine/info', (req, res) => {
			return res.json(Object.assign({ status: 'ok' }, Version.getInfo()));
		});

		if (routeHelpers && routeHelpers.setupAdminPageRoute) {
			routeHelpers.setupAdminPageRoute(router, '/admin/plugins/ai-engine', renderAdminPage);
		} else {
			router.get('/admin/plugins/ai-engine', middleware.admin.buildHeader, renderAdminPage);
		}

		// Security middleware for ACP API routes
		const checkAdminPrivs = (middleware && middleware.admin && middleware.admin.checkPrivileges)
			? middleware.admin.checkPrivileges
			: (req, res, next) => next();

		// 1. Provider Connection Test (routed via CortexAIFacade)
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

		// 2. Fetch Models List (routed via CortexAIFacade)
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

		// 3. Moderation Sandbox Simulator (routed via CortexAIFacade)
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

		// 4. Force Regenerate Topic Summary (routed via CortexAIFacade)
		router.post('/api/v3/plugins/ai-engine/summary/:tid/regenerate', async (req, res) => {
			try {
				const tid = parseInt(req.params.tid, 10);
				if (!tid) {
					return res.status(400).json({ error: 'Invalid tid' });
				}
				const topics = requireNodeBB('./src/topics');
				const topicData = await topics.getTopicData(tid);
				if (!topicData) {
					return res.status(404).json({ error: 'Topic not found' });
				}

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
	},
};

module.exports = Routes;
