'use strict';

const path = require('path');
const pkg = require('../package.json');

const Version = {
	version: pkg.version || '1.0.0',
	name: pkg.name || 'nodebb-plugin-ai-engine',
	description: pkg.description || '',

	get() {
		return this.version;
	},

	getInfo() {
		return {
			name: this.name,
			version: this.version,
			description: this.description,
			compatibility: pkg.nbbpm ? pkg.nbbpm.compatibility : '^4.0.0',
		};
	},
};

module.exports = Version;
