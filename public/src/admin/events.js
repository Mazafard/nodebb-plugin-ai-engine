'use strict';

/**
 * [Pattern 11: Observer Pattern]
 * Client-Side Event Bus for cross-tab synchronization.
 */
class AdminEventBus {
	constructor() {
		this.listeners = new Map();
	}

	on(event, callback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event).push(callback);
		return this;
	}

	off(event, callback) {
		if (!this.listeners.has(event)) return this;
		const filtered = this.listeners.get(event).filter(cb => cb !== callback);
		this.listeners.set(event, filtered);
		return this;
	}

	emit(event, data) {
		if (!this.listeners.has(event)) return;
		this.listeners.get(event).forEach(cb => {
			try {
				cb(data);
			} catch (e) {
				console.error(`[AdminEventBus] Error in listener for "${event}":`, e);
			}
		});
	}
}

module.exports = AdminEventBus;
