'use strict';

const requireNodeBB = require('../nodebb');
const Settings = require('../settings');
const Version = require('../version');

const AdminRoutes = {
	register(router, middleware) {
		const routeHelpers = requireNodeBB('./src/routes/helpers');
		const categories = requireNodeBB('./src/categories');

		const renderAdminPage = async (req, res) => {
			const [rawSettings, stats, logs, allCategories] = await Promise.all([
				Settings.get(),
				Settings.getStats(),
				Settings.getRecentLogs(30),
				categories.getCategoriesByRole ? categories.getCategoriesByRole(req.uid, 'read') : (categories.buildForSelect ? categories.buildForSelect(1) : []),
			]);

			const settings = Object.assign({}, rawSettings);
			const boolKeys = [
				'enabled', 'ollamaEnabled', 'ollamaUseCloud', 'geminiEnabled',
				'anthropicEnabled', 'openaiEnabled', 'moderationEnabled',
				'copilotEnabled', 'summarizerEnabled', 'summarizerDefaultOpen',
			];
			boolKeys.forEach((k) => {
				settings[k] = settings[k] === 'on' || settings[k] === true || settings[k] === '1';
			});

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
	},
};

module.exports = AdminRoutes;
