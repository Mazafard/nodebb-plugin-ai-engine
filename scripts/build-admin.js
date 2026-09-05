'use strict';

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../public/src/admin');
const outFile = path.join(__dirname, '../public/admin.js');

const files = [
	'events.js',
	'transport.js',
	'proxy.js',
	'api.js',
	'decorator.js',
	'widget-factory.js',
	'builder.js',
	'validator.js',
	'commands.js',
	'strategies/base.js',
	'strategies/overview.js',
	'strategies/providers.js',
	'strategies/moderation.js',
	'strategies/copilot.js',
	'strategies/summarizer.js',
	'strategies/audit.js',
	'strategies/patterns.js',
	'tab-factory.js',
	'app.js',
];

let body = '';

files.forEach(file => {
	const fullPath = path.join(srcDir, file);
	let content = fs.readFileSync(fullPath, 'utf8');
	// Strip strict mode and commonjs module.exports/require statements for client bundle
	content = content.replace(/'use strict';/g, '');
	content = content.replace(/const\s+\{?[a-zA-Z0-9_,\s]+\}?\s*=\s*require\([^)]+\);?/g, '');
	content = content.replace(/module\.exports\s*=\s*[^;]+;?/g, '');
	body += `\n\t// --- Module: ${file} ---\n` + content.trim() + '\n';
});

const bundle = `'use strict';

/**
 * Auto-generated bundle from public/src/admin/ modules.
 * Implements 13 GoF Design Patterns across the Admin Control Panel.
 */
define('admin/plugins/ai-engine', ['settings', 'alerts'], function (settings, alerts) {
${body}

	const ACP = {};
	ACP.init = function () {
		CortexAdminApp.getInstance().init(settings, alerts);
	};

	return ACP;
});
`;

fs.writeFileSync(outFile, bundle, 'utf8');
console.log(`[build-admin] Successfully compiled ${files.length} modules to ${outFile}`);
