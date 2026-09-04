'use strict';

const requireNodeBB = require('./nodebb');
const user = requireNodeBB('./src/user');
const Settings = require('./settings');

const Bot = {
	async getOrProvisionBot(settings) {
		const configuredUid = parseInt(settings.copilotBotUid, 10);
		if (configuredUid > 0) {
			const exists = await user.exists(configuredUid);
			if (exists) {
				return configuredUid;
			}
		}

		// Check if a user with bot username already exists
		const username = (settings.copilotBotName || 'Cortex AI').trim().replace(/[^a-zA-Z0-9_\- ]/g, '');
		const safeUsername = username || 'Cortex AI';

		try {
			let uid = await user.getUidByUsername(safeUsername);
			if (uid) {
				await Settings.set({ copilotBotUid: uid });
				return uid;
			}

			// Create system bot user
			uid = await user.create({
				username: safeUsername,
				email: 'cortex-ai-bot@internal.forum',
			});

			if (uid) {
				// Set bot attributes
				await user.setUserFields(uid, {
					fullname: 'Cortex AI Community Engine',
					signature: '*🤖 Automated community assistant powered by Cortex AI Engine.*',
					banned: 0,
					'email:confirmed': 1,
				});

				await Settings.set({ copilotBotUid: uid });
				return uid;
			}
		} catch (err) {
			// If creation fails (e.g. email or username collision), fallback to uid 1 (admin)
			return 1;
		}

		return 1;
	},
};

module.exports = Bot;
