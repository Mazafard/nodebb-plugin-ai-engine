'use strict';

define('admin/plugins/ai-engine', ['settings', 'alerts'], function (settings, alerts) {
	const ACP = {};

	ACP.init = function () {
		// 1. Settings load
		settings.load('ai-engine', $('#ai-settings-form'));

		// 2. Sensitivity Slider Live Update
		$('#moderationSensitivity').on('input', function () {
			$('#sensitivity-display').text($(this).val() + '%');
		});

		// 3. Secret Visibility Toggle
		$('.toggle-secret-btn').on('click', function () {
			const input = $(this).closest('.input-group').find('.secret-input');
			const icon = $(this).find('i');
			if (input.attr('type') === 'password') {
				input.attr('type', 'text');
				icon.removeClass('fa-eye').addClass('fa-eye-slash');
			} else {
				input.attr('type', 'password');
				icon.removeClass('fa-eye-slash').addClass('fa-eye');
			}
		});

		// 4. Save Settings
		$('#save-settings-btn').on('click', function () {
			// Aggregate category checkboxes into hidden CSV input
			const selectedCids = [];
			$('.category-checkbox:checked').each(function () {
				selectedCids.push($(this).val());
			});
			$('#copilotCategories').val(selectedCids.join(','));

			settings.save('ai-engine', $('#ai-settings-form'), function () {
				alerts.success('Cortex AI Engine configuration saved successfully!');
			});
		});

		function renderModelPicker(provider, models, currentVal) {
			const container = $(`#${provider}-model-picker`);
			if (!container.length || !models || !models.length) return;

			let html = `
				<div class="p-2 bg-light rounded-3 border">
					<div class="d-flex justify-content-between align-items-center mb-1">
						<span class="small fw-bold text-muted"><i class="fa fa-list me-1"></i> Detected Models (${models.length}):</span>
						<span class="small text-muted" style="font-size: 0.75rem;">Click to select</span>
					</div>
					<div class="d-flex flex-wrap gap-1">
			`;

			models.forEach(function (m) {
				const isSelected = (m === currentVal);
				const btnClass = isSelected ? 'btn-primary active' : 'btn-outline-secondary';
				html += `<button type="button" class="btn btn-sm ${btnClass} py-0 px-2 model-select-pill" data-provider="${provider}" data-model="${m}">${m}</button>`;
			});

			html += `
					</div>
				</div>
			`;

			container.html(html).removeClass('d-none');
		}

		// Handle clicking any model pill
		$(document).on('click', '.model-select-pill', function () {
			const btn = $(this);
			const provider = btn.attr('data-provider');
			const model = btn.attr('data-model');
			const container = $(`#${provider}-model-picker`);

			let input;
			if (provider === 'ollama') input = $('#ollamaDefaultModel');
			else if (provider === 'gemini') input = $('#geminiDefaultModel');
			else if (provider === 'anthropic') input = $('#anthropicDefaultModel');
			else if (provider === 'openai') input = $('#openaiDefaultModel');

			if (input && input.length) {
				input.val(model);
			}

			container.find('.model-select-pill').removeClass('btn-primary active').addClass('btn-outline-secondary');
			btn.removeClass('btn-outline-secondary').addClass('btn-primary active');

			alerts.success(`Selected ${provider.toUpperCase()} model: ${model}`);
		});

		// 5. Test Provider Connection
		$('.test-provider-btn').on('click', function () {
			const btn = $(this);
			const provider = btn.attr('data-provider');
			const badge = $(`#${provider}-status`);

			badge.html('<i class="fa fa-spinner fa-spin"></i> Testing...');
			btn.prop('disabled', true);

			const config = {
				ollamaUrl: $('#ollamaUrl').val(),
				geminiApiKey: $('#geminiApiKey').val(),
				anthropicApiKey: $('#anthropicApiKey').val(),
				openaiApiKey: $('#openaiApiKey').val(),
				openaiBaseUrl: $('#openaiBaseUrl').val(),
			};

			$.ajax({
				url: config.relative_path + '/api/v3/plugins/ai-engine/test-provider',
				type: 'POST',
				headers: { 'x-csrf-token': config.csrf_token },
				contentType: 'application/json',
				data: JSON.stringify({ provider, config }),
				success: function (res) {
					btn.prop('disabled', false);
					if (res && res.ok) {
						badge.html(`<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="fa fa-check-circle me-1"></i> Connected (${res.latencyMs}ms)</span>`);
						alerts.success(`${provider.toUpperCase()} connected successfully! (${res.latencyMs}ms)`);
						if (res.models && res.models.length) {
							renderModelPicker(provider, res.models, $(`#${provider}DefaultModel`).val());
						}
					} else {
						badge.html(`<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="fa fa-times-circle me-1"></i> Failed</span>`);
						alerts.error(res.error || 'Connection failed.');
					}
				},
				error: function (xhr) {
					btn.prop('disabled', false);
					badge.html(`<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="fa fa-times-circle me-1"></i> Error</span>`);
					alerts.error(xhr.responseJSON?.error || 'Network error testing provider.');
				},
			});
		});

		// 6. Auto-Detect Models
		$('.auto-detect-btn').on('click', function () {
			const btn = $(this);
			const provider = btn.attr('data-provider');
			const input = btn.closest('.input-group').find('input');

			btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i>');

			$.getJSON(config.relative_path + `/api/v3/plugins/ai-engine/models/${provider}`, function (res) {
				btn.prop('disabled', false).html('<i class="fa fa-sync-alt"></i> Detect');
				if (res && res.ok && res.models && res.models.length) {
					alerts.success(`Found ${res.models.length} available models for ${provider.toUpperCase()}`);
					renderModelPicker(provider, res.models, input.val() || res.models[0]);
					if (!input.val()) {
						input.val(res.models[0]);
					}
				} else {
					alerts.alert({
						type: 'info',
						title: 'Model Detection',
						message: 'No extra models detected, keeping current default.',
					});
				}
			}).fail(function () {
				btn.prop('disabled', false).html('<i class="fa fa-sync-alt"></i> Detect');
				alerts.error('Could not auto-detect models. Check credentials.');
			});
		});

		// 7. Interactive Moderation Sandbox
		$('#run-sandbox-btn').on('click', function () {
			const btn = $(this);
			const text = $('#sandbox-input').val();
			const resultBox = $('#sandbox-result');

			if (!text || !text.trim()) {
				return alerts.error('Please enter sample text to test in the sandbox.');
			}

			btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin me-1"></i> Scanning...');
			resultBox.html('');

			$.ajax({
				url: config.relative_path + '/api/v3/plugins/ai-engine/simulate-moderation',
				type: 'POST',
				headers: { 'x-csrf-token': config.csrf_token },
				contentType: 'application/json',
				data: JSON.stringify({ sampleText: text }),
				success: function (res) {
					btn.prop('disabled', false).html('<i class="fa fa-play me-1"></i> Simulate AI Scan');
					if (res && res.ok && res.result) {
						const r = res.result;
						const scorePercent = Math.round((r.score || 0) * 100);
						if (r.wouldQuarantine) {
							resultBox.html(`
								<span class="badge bg-danger p-2">
									<i class="fa fa-ban me-1"></i> WOULD QUARANTINE (${scorePercent}%)
								</span>
								<div class="mt-1 text-danger small">${r.category}: ${r.reason} (${r.latencyMs}ms)</div>
							`);
						} else {
							resultBox.html(`
								<span class="badge bg-success p-2">
									<i class="fa fa-check me-1"></i> PASS CLEAN (${scorePercent}%)
								</span>
								<div class="mt-1 text-success small">${r.reason || 'Clean message'} (${r.latencyMs}ms)</div>
							`);
						}
					}
				},
				error: function (xhr) {
					btn.prop('disabled', false).html('<i class="fa fa-play me-1"></i> Simulate AI Scan');
					alerts.error(xhr.responseJSON?.error || 'Sandbox simulation failed.');
				},
			});
		});

		// 8. 1-Click Operational Presets
		$('.apply-preset-btn').on('click', function () {
			const preset = $(this).attr('data-preset');

			if (preset === 'private') {
				$('#ollamaEnabled').prop('checked', true);
				$('#moderationProvider').val('ollama');
				$('#copilotProvider').val('ollama');
				$('#summarizerProvider').val('ollama');
				alerts.success('Applied "100% Free & Private" (Ollama Local) preset! Click Save Changes to apply.');
			} else if (preset === 'balanced') {
				$('#ollamaEnabled').prop('checked', true);
				$('#geminiEnabled').prop('checked', true);
				$('#moderationProvider').val('ollama');
				$('#copilotProvider').val('gemini');
				$('#summarizerProvider').val('gemini');
				alerts.success('Applied "Speed & Cost Champion" preset! Click Save Changes to apply.');
			} else if (preset === 'enterprise') {
				$('#openaiEnabled').prop('checked', true);
				$('#geminiEnabled').prop('checked', true);
				$('#anthropicEnabled').prop('checked', true);
				$('#moderationProvider').val('openai');
				$('#copilotProvider').val('gemini');
				$('#summarizerProvider').val('anthropic');
				alerts.success('Applied "Enterprise Frontier" preset! Click Save Changes to apply.');
			}

			$('.preset-card').removeClass('active-preset');
			$(this).closest('.preset-card').addClass('active-preset');
		});

		// 9. Auto-Provision Bot Account
		$('#provision-bot-btn').on('click', function () {
			const btn = $(this);
			btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i>');

			$.ajax({
				url: config.relative_path + '/api/v3/plugins/ai-engine/provision-bot',
				type: 'POST',
				headers: { 'x-csrf-token': config.csrf_token },
				success: function (res) {
					btn.prop('disabled', false).html('<i class="fa fa-user-plus"></i> Auto-Create');
					if (res && res.ok && res.botUid) {
						$('#copilotBotUid').val(res.botUid);
						alerts.success(`Cortex Bot provisioned with UID: ${res.botUid}`);
					}
				},
				error: function (xhr) {
					btn.prop('disabled', false).html('<i class="fa fa-user-plus"></i> Auto-Create');
					alerts.error(xhr.responseJSON?.error || 'Could not provision bot account.');
				},
			});
		});
	};

	return ACP;
});
