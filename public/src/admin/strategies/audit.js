'use strict';

const BaseTabStrategy = require('./base');

/**
 * [Pattern 4: Strategy Pattern]
 * AuditTabStrategy coordinates log filtering.
 */
class AuditTabStrategy extends BaseTabStrategy {
	bindEvents() {
		$('.log-filter-btn').on('click', function () {
			const btn = $(this);
			const filter = btn.attr('data-filter');

			$('.log-filter-btn').removeClass('btn-primary').addClass('btn-outline-secondary');
			btn.removeClass('btn-outline-secondary').addClass('btn-primary');

			if (filter === 'all') {
				$('#audit-log-table tbody tr').show();
			} else {
				$('#audit-log-table tbody tr').each(function () {
					const type = $(this).attr('data-log-type') || '';
					if (type.toLowerCase().includes(filter)) {
						$(this).show();
					} else {
						$(this).hide();
					}
				});
			}
		});
	}
}

module.exports = AuditTabStrategy;
