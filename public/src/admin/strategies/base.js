'use strict';

/**
 * [Pattern 10: Template Method Pattern]
 * BaseTabStrategy defining tab lifecycle hooks.
 */
class BaseTabStrategy {
	constructor(tabId, context) {
		this.tabId = tabId;
		this.context = context;
	}

	init() {
		this.bindEvents();
	}

	bindEvents() {}

	onActivate() {}
}

module.exports = BaseTabStrategy;
