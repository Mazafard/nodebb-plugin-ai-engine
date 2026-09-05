'use strict';

/**
 * [Pattern 3: Abstract Factory Pattern]
 * Produces standardized status badges and UI elements across all ACP tabs.
 */
class UIWidgetFactory {
	createStatusBadge(state, label, latencyMs = 0) {
		if (state === 'success') {
			const latency = latencyMs ? ` (${latencyMs}ms)` : '';
			return `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="fa fa-check-circle me-1"></i> ${label}${latency}</span>`;
		}
		if (state === 'failed') {
			return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="fa fa-times-circle me-1"></i> ${label}</span>`;
		}
		if (state === 'loading') {
			return `<span class="badge bg-info-subtle text-info border"><i class="fa fa-spinner fa-spin me-1"></i> ${label}</span>`;
		}
		return `<span class="badge bg-secondary-subtle text-secondary border">${label}</span>`;
	}
}

module.exports = UIWidgetFactory;
