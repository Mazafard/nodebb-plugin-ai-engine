'use strict';

const PipelineHandler = require('./handler');

/**
 * [Pattern 7: Chain of Responsibility Pattern]
 * Sanitizer Handler: Cleans markdown, strips heavy codeblocks or raw images, and limits tokens.
 */
class SanitizerHandler extends PipelineHandler {
	async handle(context) {
		if (context.rawContent && typeof context.rawContent === 'string') {
			let clean = context.rawContent;

			// Strip raw base64 data URLs if any
			clean = clean.replace(/data:image\/[^;]+;base64,[^"]+/g, '[image-data]');

			// Strip excessive HTML tags
			clean = clean.replace(/<[^>]*>?/gm, '');

			// Trim leading/trailing whitespace and limit length
			context.sanitizedContent = clean.trim().slice(0, 4000);
		} else {
			context.sanitizedContent = '';
		}

		return await super.handle(context);
	}
}

module.exports = SanitizerHandler;
