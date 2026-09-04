'use strict';

/**
 * [Pattern 12: Command Pattern]
 * Base Command interface encapsulating an AI operation into a standalone object.
 */
class BaseAICommand {
	constructor(settings) {
		if (new.target === BaseAICommand) {
			throw new TypeError('Cannot construct BaseAICommand instances directly.');
		}
		this.settings = settings;
	}

	async execute() {
		throw new Error('execute() must be implemented by concrete command.');
	}
}

module.exports = BaseAICommand;
