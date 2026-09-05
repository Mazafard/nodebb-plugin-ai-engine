'use strict';

/**
 * [Pattern 8: Decorator Pattern]
 * Automatically decorates async action buttons with spinner icons and disabled states.
 */
class AsyncButtonDecorator {
	static async decorate(buttonElement, asyncFn, loadingText = '') {
		const $btn = $(buttonElement);
		const originalHtml = $btn.html();
		const originalDisabled = $btn.prop('disabled');

		$btn.prop('disabled', true);
		$btn.html(`<i class="fa fa-spinner fa-spin me-1"></i> ${loadingText}`);

		try {
			return await asyncFn();
		} finally {
			$btn.html(originalHtml);
			$btn.prop('disabled', originalDisabled);
		}
	}
}

module.exports = AsyncButtonDecorator;
