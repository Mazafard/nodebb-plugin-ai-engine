'use strict';

const BaseTabStrategy = require('./strategies/base');
const OverviewTabStrategy = require('./strategies/overview');
const ProvidersTabStrategy = require('./strategies/providers');
const ModerationTabStrategy = require('./strategies/moderation');
const CopilotTabStrategy = require('./strategies/copilot');
const SummarizerTabStrategy = require('./strategies/summarizer');
const AuditTabStrategy = require('./strategies/audit');
const PatternsTabStrategy = require('./strategies/patterns');

/**
 * [Pattern 2: Factory Method Pattern]
 * TabStrategyFactory dynamically resolves and creates strategy instances.
 */
class TabStrategyFactory {
	static createStrategy(tabId, context) {
		switch (tabId) {
			case 'tab-overview':
				return new OverviewTabStrategy(tabId, context);
			case 'tab-providers':
				return new ProvidersTabStrategy(tabId, context);
			case 'tab-moderation':
				return new ModerationTabStrategy(tabId, context);
			case 'tab-copilot':
				return new CopilotTabStrategy(tabId, context);
			case 'tab-summarizer':
				return new SummarizerTabStrategy(tabId, context);
			case 'tab-audit':
				return new AuditTabStrategy(tabId, context);
			case 'tab-patterns':
				return new PatternsTabStrategy(tabId, context);
			default:
				return new BaseTabStrategy(tabId, context);
		}
	}
}

module.exports = TabStrategyFactory;
