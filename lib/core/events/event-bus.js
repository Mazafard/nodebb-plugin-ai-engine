'use strict';

const EventEmitter = require('events');
const requireNodeBB = require('../../nodebb');

/**
 * [Pattern 11: Observer Pattern]
 * Central event bus for real-time inference lifecycle, telemetry, and moderation alerts.
 */
class ModelEventBus extends EventEmitter {
	constructor() {
		super();
		this.setMaxListeners(50);
		this._attachDefaultListeners();
	}

	_attachDefaultListeners() {
		this.on('inference:complete', (event) => {
			let winston;
			try {
				winston = requireNodeBB('winston');
			} catch (e) {
				winston = console;
			}
			if (winston && typeof winston.info === 'function') {
				winston.info(`[cortex-ai:event] ${event.type} | provider=${event.provider} | latency=${event.latencyMs}ms | verdict=${event.verdict || 'OK'}`);
			}
		});

		this.on('post:quarantined', (event) => {
			let winston;
			try {
				winston = requireNodeBB('winston');
			} catch (e) {
				winston = console;
			}
			if (winston && typeof winston.warn === 'function') {
				winston.warn(`[cortex-ai:quarantine] Post #${event.pid || 'new'} quarantined by ${event.model} | Reason: ${event.reason}`);
			}
		});
	}
}

// Singleton event bus instance
const eventBusInstance = new ModelEventBus();

module.exports = eventBusInstance;
