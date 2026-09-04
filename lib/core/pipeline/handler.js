'use strict';

/**
 * [Pattern 7: Chain of Responsibility Pattern]
 * Base abstract handler in the processing pipeline.
 */
class PipelineHandler {
	constructor() {
		this.nextHandler = null;
	}

	setNext(handler) {
		this.nextHandler = handler;
		return handler;
	}

	async handle(context) {
		if (this.nextHandler) {
			return await this.nextHandler.handle(context);
		}
		return context;
	}
}

module.exports = PipelineHandler;
