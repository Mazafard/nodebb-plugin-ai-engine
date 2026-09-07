'use strict';

const BaseTabStrategy = require('./base');

/**
 * [Pattern 4: Strategy Pattern]
 * AuditTabStrategy coordinates real-time inference log fetching, filtering, and clearing.
 */
class AuditTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const self = this;
		$('.log-filter-btn').on('click', function () {
			const btn = $(this);
			const filter = btn.attr('data-filter') || 'all';
			$('.log-filter-btn').removeClass('btn-primary').addClass('btn-outline-secondary');
			btn.removeClass('btn-outline-secondary').addClass('btn-primary');

			$('#audit-log-table tbody tr').each(function () {
				if ($(this).attr('id') === 'empty-logs-row') return;
				const type = ($(this).attr('data-log-type') || '').toLowerCase();
				if (filter === 'all' || type.includes(filter)) {
					$(this).show();
				} else {
					$(this).hide();
				}
			});
		});

		$('#refresh-logs-btn').on('click', () => {
			this.fetchLogs();
		});

		$('#clear-logs-btn').on('click', () => {
			this.clearLogs();
		});
	}

	onActivate() {
		this.fetchLogs();
	}

	async fetchLogs() {
		const { alerts } = this.context;
		try {
			const res = await $.get('/api/v3/plugins/ai-engine/logs');
			const logs = (res && res.logs) ? res.logs : [];
			this.renderLogs(logs);
		} catch (err) {
			if (alerts) alerts.error('Failed to load logs: ' + err.message);
		}
	}

	async clearLogs() {
		const { alerts } = this.context;
		try {
			await $.ajax({ url: '/api/v3/plugins/ai-engine/logs', method: 'DELETE' });
			this.renderLogs([]);
			if (alerts) alerts.success('Audit logs cleared.');
		} catch (err) {
			if (alerts) alerts.error('Failed to clear logs: ' + err.message);
		}
	}

	renderLogs(logs) {
		const tbody = $('#audit-log-table tbody');
		tbody.empty();
		if (!logs || !logs.length) {
			tbody.html('<tr id="empty-logs-row"><td colspan="6" class="text-center text-muted py-4">No recent AI inferences logged yet.</td></tr>');
			return;
		}
		let html = '';
		logs.forEach((log) => {
			const badge = log.isFlagged ? '<span class="badge bg-danger">FLAGGED</span>' : '<span class="badge bg-success">CLEAN</span>';
			html += `<tr data-log-type="${log.type || ''}">
				<td class="small text-muted">${log.formattedTime || log.timestamp || 'Just now'}</td>
				<td><span class="badge bg-secondary-subtle text-secondary border">${log.type || 'system'}</span></td>
				<td class="small font-monospace">${log.model || 'default'}</td>
				<td>${badge}</td>
				<td class="small">${log.latencyMs || 0}ms</td>
				<td class="small text-muted text-truncate" style="max-width: 250px;">${log.reason || ''}</td>
			</tr>`;
		});
		tbody.html(html);
	}
}

module.exports = AuditTabStrategy;
