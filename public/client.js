'use strict';

$(document).ready(function () {
	// Handle copying summary content
	$(document).on('click', '.cortex-copy-btn', function (e) {
		e.preventDefault();
		const card = $(this).closest('.cortex-summary-card');
		const tldr = card.find('.cortex-tldr').text().trim();
		const consensus = card.find('.cortex-consensus').text().trim();
		const textToCopy = `${tldr}\n\n${consensus}`;

		if (navigator.clipboard) {
			navigator.clipboard.writeText(textToCopy).then(function () {
				if (window.app && window.app.alertSuccess) {
					window.app.alertSuccess('Summary copied to clipboard!');
				}
			});
		}
	});

	// Rotate toggle chevron when accordion opens/closes
	$(document).on('show.bs.collapse', '#cortex-summary-body', function () {
		$('.cortex-toggle-btn .toggle-icon').addClass('fa-chevron-up').removeClass('fa-chevron-down');
	});

	$(document).on('hide.bs.collapse', '#cortex-summary-body', function () {
		$('.cortex-toggle-btn .toggle-icon').addClass('fa-chevron-down').removeClass('fa-chevron-up');
	});
});
