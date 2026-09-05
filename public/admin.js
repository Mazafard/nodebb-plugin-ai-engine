'use strict';

/**
 * Auto-generated bundle from public/src/admin/ modules.
 * Handles client-side ACP logic for Cortex AI Engine.
 */
define('admin/plugins/ai-engine', ['settings', 'alerts'], function (settings, alerts) {

	// --- Module: events.js ---
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

	// --- Module: transport.js ---
/**
 * [Pattern 5: Adapter Pattern]
 * Normalizes jQuery AJAX and CSRF headers across forum paths.
 */
class AjaxClientAdapter {
	constructor() {
		this.forumPath = (typeof config !== 'undefined' && config.relative_path) ? config.relative_path : '';
		this.csrfHeader = (typeof config !== 'undefined' && config.csrf_token) ? config.csrf_token : '';
	}

	async request(endpoint, options = {}) {
		const url = this.forumPath + endpoint;
		const method = options.method || 'GET';
		const headers = Object.assign({
			'x-csrf-token': this.csrfHeader,
		}, options.headers || {});

		if (method !== 'GET' && options.body && !headers['content-type']) {
			headers['content-type'] = 'application/json';
		}

		return new Promise((resolve, reject) => {
			$.ajax({
				url,
				type: method,
				headers,
				data: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
				success: (res) => resolve(res),
				error: (xhr) => {
					const err = (xhr.responseJSON && xhr.responseJSON.error) || xhr.statusText || 'Network request failed';
					reject(new Error(err));
				},
			});
		});
	}
}

	// --- Module: proxy.js ---
/**
 * [Pattern 9: Proxy Pattern]
 * In-memory client-side cache proxy preventing duplicate model queries.
 */
class ClientModelCacheProxy {
	constructor(adapter, eventBus) {
		this.adapter = adapter;
		this.eventBus = eventBus;
		this.cache = new Map();
	}

	async getModels(provider, forceRefresh = false) {
		const key = (provider || '').toLowerCase().trim();
		if (!forceRefresh && this.cache.has(key)) {
			return this.cache.get(key);
		}

		const res = await this.adapter.request(`/api/v3/plugins/ai-engine/models/${key}`, { method: 'GET' });
		const models = (res && res.models) ? res.models : [];
		this.cache.set(key, models);
		if (this.eventBus) {
			this.eventBus.emit('models:cached', { provider: key, models });
		}
		return models;
	}

	setModels(provider, models) {
		const key = (provider || '').toLowerCase().trim();
		this.cache.set(key, models || []);
		if (this.eventBus) {
			this.eventBus.emit('models:cached', { provider: key, models });
		}
	}

	getCached(provider) {
		return this.cache.get((provider || '').toLowerCase().trim()) || null;
	}

	clear() {
		this.cache.clear();
	}
}

	// --- Module: api.js ---
/**
 * [Pattern 6: Facade Pattern]
 * High-level API Facade masking backend endpoints for the ACP.
 */
class AdminAPIFacade {
	constructor(adapter, proxy, eventBus, settingsModule, alertsModule) {
		this.adapter = adapter;
		this.proxy = proxy;
		this.eventBus = eventBus;
		this.settings = settingsModule;
		this.alerts = alertsModule;
	}

	async testProvider(provider, configPayload) {
		const res = await this.adapter.request('/api/v3/plugins/ai-engine/test-provider', {
			method: 'POST',
			body: { provider, config: configPayload },
		});
		if (res && res.ok && res.models && res.models.length) {
			this.proxy.setModels(provider, res.models);
		}
		this.eventBus.emit('provider:tested', { provider, res });
		return res;
	}

	async fetchModels(provider, forceRefresh = true) {
		const models = await this.proxy.getModels(provider, forceRefresh);
		this.eventBus.emit('models:received', { provider, models });
		return models;
	}

	async simulateModeration(sampleText, title = '') {
		return await this.adapter.request('/api/v3/plugins/ai-engine/simulate-moderation', {
			method: 'POST',
			body: { sampleText, title },
		});
	}

	async provisionBot() {
		return await this.adapter.request('/api/v3/plugins/ai-engine/provision-bot', {
			method: 'POST',
		});
	}

	saveSettings(formElement, callback) {
		const alerts = this.alerts;
		this.settings.save('ai-engine', formElement, function () {
			alerts.success('Cortex AI Engine configuration saved successfully!');
			if (typeof callback === 'function') callback();
		});
	}
}

	// --- Module: decorator.js ---
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

	// --- Module: widget-factory.js ---
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

	// --- Module: builder.js ---
/**
 * [Pattern 13: Builder Pattern]
 * Fluent builder for interactive model catalog with live API pricing and sorting.
 */
class ModelPickerBuilder {
	constructor() {
		this.provider = '';
		this.models = [];
		this.currentValue = '';
		this.targetInputSelector = '';
	}

	forProvider(p) { this.provider = p; return this; }
	withModels(m) { this.models = m || []; return this; }
	withCurrentValue(v) { this.currentValue = v || ''; return this; }
	withTargetInput(s) { this.targetInputSelector = s; return this; }

	build($container) {
		if (!$container || !$container.length) return;
		if (!this.models || !this.models.length) {
			$container.html('').addClass('d-none');
			return;
		}

		const norm = this.models.map(m => (typeof m === 'string'
			? { id: m, name: m, priceScore: 999, formattedPrice: 'API Rate', tier: 'standard' }
			: Object.assign({ priceScore: 999, formattedPrice: 'API Rate', tier: 'standard' }, m)));

		const provider = this.provider;
		const targetInput = this.targetInputSelector;
		const currentVal = this.currentValue;

		const html = `
			<div class="model-picker-card p-3 bg-light rounded-3 border mt-2">
				<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 pb-2 border-bottom">
					<span class="small fw-bold text-dark"><i class="fa fa-cubes text-primary me-1"></i> Received Models (${norm.length}):</span>
					<div class="d-flex align-items-center gap-2">
						<input type="text" class="form-control form-control-sm model-filter-input" placeholder="Search models..." style="width: 130px;">
						<select class="form-select form-select-sm model-sort-select" style="width: 145px;">
							<option value="price-asc">Price: Low to High</option>
							<option value="price-desc">Price: High to Low</option>
							<option value="name-asc">Name: A to Z</option>
						</select>
					</div>
				</div>
				<div class="model-pills-scroll-area d-flex flex-wrap gap-2" style="max-height: 200px; overflow-y: auto;"></div>
			</div>
		`;
		$container.html(html).removeClass('d-none');

		const $scroll = $container.find('.model-pills-scroll-area');
		const render = (list) => {
			let out = '';
			list.forEach(m => {
				const isSel = (m.id === currentVal || m.name === currentVal);
				const btnClass = isSel ? 'btn-primary active' : 'btn-outline-secondary bg-white text-dark';
				const badgeClass = m.tier === 'free' ? 'bg-success text-white' : 'bg-primary-subtle text-primary border';
				out += `<button type="button" class="btn btn-sm ${btnClass} model-select-pill d-inline-flex align-items-center gap-2 py-1 px-2" data-provider="${provider}" data-model="${m.id}" data-target-input="${targetInput}"><span class="small fw-semibold">${m.name}</span><span class="badge ${badgeClass}" style="font-size: 0.68rem;">${m.formattedPrice}</span></button>`;
			});
			$scroll.html(out || '<div class="small text-muted p-2">No matching models found.</div>');
		};

		const refresh = () => {
			const q = ($container.find('.model-filter-input').val() || '').toLowerCase().trim();
			const sort = $container.find('.model-sort-select').val() || 'price-asc';
			let filtered = norm.filter(m => !q || m.name.toLowerCase().includes(q) || (m.formattedPrice || '').toLowerCase().includes(q));
			if (sort === 'price-asc') filtered.sort((a, b) => a.priceScore - b.priceScore);
			else if (sort === 'price-desc') filtered.sort((a, b) => b.priceScore - a.priceScore);
			else filtered.sort((a, b) => a.name.localeCompare(b.name));
			render(filtered);
		};

		$container.find('.model-filter-input').on('input', refresh);
		$container.find('.model-sort-select').on('change', refresh);
		refresh();
	}
}

	// --- Module: validator.js ---
/**
 * [Pattern 7: Chain of Responsibility Pattern]
 * Sequential validation pipeline for admin settings inputs.
 */
class FormValidationHandler {
	setNext(handler) {
		this.next = handler;
		return handler;
	}

	validate(data) {
		if (this.next) {
			return this.next.validate(data);
		}
		return { valid: true };
	}
}

class SecretInputValidator extends FormValidationHandler {
	validate(data) {
		if (data.ollamaEnabled && data.ollamaUseCloud && !data.ollamaApiKey) {
			return { valid: false, message: 'Ollama Cloud is enabled but API Key / Bearer Token is empty.' };
		}
		if (data.geminiEnabled && !data.geminiApiKey) {
			return { valid: false, message: 'Google Gemini is enabled but API Key is empty.' };
		}
		if (data.anthropicEnabled && !data.anthropicApiKey) {
			return { valid: false, message: 'Anthropic Claude is enabled but API Key is empty.' };
		}
		if (data.openaiEnabled && !data.openaiApiKey) {
			return { valid: false, message: 'OpenAI is enabled but API Key is empty.' };
		}
		return super.validate(data);
	}
}

class UrlFormatValidator extends FormValidationHandler {
	validate(data) {
		if (data.ollamaEnabled) {
			if (data.ollamaUseCloud && data.ollamaCloudUrl) {
				if (!data.ollamaCloudUrl.startsWith('http://') && !data.ollamaCloudUrl.startsWith('https://')) {
					return { valid: false, message: 'Ollama Cloud Base URL must start with https:// or http://' };
				}
			} else if (!data.ollamaUseCloud && data.ollamaUrl) {
				if (!data.ollamaUrl.startsWith('http://') && !data.ollamaUrl.startsWith('https://')) {
					return { valid: false, message: 'Ollama Daemon URL must start with http:// or https://' };
				}
			}
		}
		return super.validate(data);
	}
}

	// --- Module: commands.js ---
/**
 * [Pattern 12: Command Pattern]
 * Encapsulates Preset application and Settings saving.
 */
class ApplyPresetCommand {
	constructor(preset, alerts, eventBus) {
		this.preset = preset;
		this.alerts = alerts;
		this.eventBus = eventBus;
	}

	execute() {
		if (this.preset === 'private') {
			$('#ollamaEnabled').prop('checked', true).trigger('change');
			$('#geminiEnabled, #anthropicEnabled, #openaiEnabled').prop('checked', false).trigger('change');
			$('#moderationProvider, #copilotProvider, #summarizerProvider').val('ollama').trigger('change');
			this.alerts.success('Applied "100% Free & Private" (Ollama Local) preset! Click Save Changes to apply.');
		} else if (this.preset === 'balanced') {
			$('#ollamaEnabled, #geminiEnabled').prop('checked', true).trigger('change');
			$('#anthropicEnabled, #openaiEnabled').prop('checked', false).trigger('change');
			$('#moderationProvider').val('ollama').trigger('change');
			$('#copilotProvider, #summarizerProvider').val('gemini').trigger('change');
			this.alerts.success('Applied "Speed & Cost Champion" preset! Click Save Changes to apply.');
		} else if (this.preset === 'enterprise') {
			$('#ollamaEnabled').prop('checked', false).trigger('change');
			$('#openaiEnabled, #geminiEnabled, #anthropicEnabled').prop('checked', true).trigger('change');
			$('#moderationProvider').val('openai').trigger('change');
			$('#copilotProvider').val('gemini').trigger('change');
			$('#summarizerProvider').val('anthropic').trigger('change');
			this.alerts.success('Applied "Enterprise Synergy" preset! Click Save Changes to apply.');
		}

		$('.preset-card').removeClass('active-preset');
		$(`.preset-card[data-preset="${this.preset}"]`).addClass('active-preset');
		if (this.eventBus) {
			this.eventBus.emit('preset:applied', { preset: this.preset });
		}
	}
}

class SaveSettingsCommand {
	constructor(formSelector, apiFacade, alerts) {
		this.$form = $(formSelector);
		this.apiFacade = apiFacade;
		this.alerts = alerts;
	}

	execute() {
		const selectedCids = [];
		$('.category-checkbox:checked').each(function () {
			selectedCids.push($(this).val());
		});
		$('#copilotCategories').val(selectedCids.join(','));

		const validatorChain = new SecretInputValidator();
		validatorChain.setNext(new UrlFormatValidator());

		const formData = {
			ollamaEnabled: $('#ollamaEnabled').is(':checked'),
			ollamaUseCloud: $('#ollamaUseCloud').is(':checked'),
			ollamaUrl: $('#ollamaUrl').val(),
			ollamaCloudUrl: $('#ollamaCloudUrl').val(),
			ollamaApiKey: $('#ollamaApiKey').val(),
			geminiEnabled: $('#geminiEnabled').is(':checked'),
			geminiApiKey: $('#geminiApiKey').val(),
			anthropicEnabled: $('#anthropicEnabled').is(':checked'),
			anthropicApiKey: $('#anthropicApiKey').val(),
			openaiEnabled: $('#openaiEnabled').is(':checked'),
			openaiApiKey: $('#openaiApiKey').val(),
		};

		const validation = validatorChain.validate(formData);
		if (!validation.valid) {
			this.alerts.error(validation.message);
			return;
		}

		this.apiFacade.saveSettings(this.$form);
	}
}

	// --- Module: strategies/base.js ---
/**
 * [Pattern 10: Template Method Pattern]
 * BaseTabStrategy defining tab lifecycle hooks.
 */
class BaseTabStrategy {
	constructor(tabId, context) {
		this.tabId = tabId;
		this.context = context;
	}

	init() {
		this.bindEvents();
	}

	bindEvents() {}

	onActivate() {}
}

	// --- Module: strategies/overview.js ---
/**
 * [Pattern 4: Strategy Pattern]
 * OverviewTabStrategy coordinates preset selection.
 */
class OverviewTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { alerts, eventBus } = this.context;
		const sync = () => {
			const on = $('#enabled').is(':checked');
			$('#card-master-overview').toggleClass('card-disabled', !on);
			$('#master-card-body').toggleClass('card-switch-disabled', !on);
			$('#card-master-overview').find('button:not(.form-check-input)').prop('disabled', !on);
		};
		$('#enabled').on('change', sync);
		sync();

		$('.apply-preset-btn').on('click', function () {
			const preset = $(this).attr('data-preset');
			new ApplyPresetCommand(preset, alerts, eventBus).execute();
		});
	}
}

	// --- Module: strategies/providers.js ---
/**
 * [Pattern 4: Strategy Pattern]
 * ProvidersTabStrategy coordinates connectivity testing and live model discovery.
 */
class ProvidersTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { apiFacade, widgetFactory, alerts } = this.context;

		// Synchronize card disabled & folded look for all providers
		['ollama', 'gemini', 'anthropic', 'openai'].forEach((p) => {
			const sync = () => {
				const on = $(`#${p}Enabled`).is(':checked');
				$(`#card-${p}`).toggleClass('card-disabled', !on).toggleClass('card-folded', !on);
				$(`#card-${p}`).find('.folded-badge').toggleClass('d-none', on);
				$(`#${p}-card-body`).toggleClass('card-switch-disabled', !on);
				$(`#card-${p}`).find('button:not(.form-check-input)').prop('disabled', !on);
				if (!on) $(`#${p}-status`).html('<span class="badge bg-secondary-subtle text-secondary border">Disabled</span>');
			};
			$(`#${p}Enabled`).on('change', sync);
			sync();
		});

		const syncOllamaCloud = () => {
			const isCloud = $('#ollamaUseCloud').is(':checked');
			$('#ollama-local-url-group').toggleClass('d-none', isCloud); $('#ollama-cloud-url-group').toggleClass('d-none', !isCloud);
			$('#ollama-api-key-hint').text(isCloud ? '(Required for Ollama Cloud)' : '(Optional for local)');
		};
		$('#ollamaUseCloud').on('change', syncOllamaCloud);
		syncOllamaCloud();

		// Test provider connection
		$('.test-provider-btn').on('click', function () {
			const btn = this;
			const provider = $(btn).attr('data-provider');
			const badge = $(`#${provider}-status`);

			badge.html(widgetFactory.createStatusBadge('loading', 'Testing...'));

			const payload = {
				ollamaUrl: $('#ollamaUrl').val(), ollamaCloudUrl: $('#ollamaCloudUrl').val(),
				ollamaUseCloud: $('#ollamaUseCloud').is(':checked') ? 'on' : 'off', ollamaApiKey: $('#ollamaApiKey').val(),
				geminiApiKey: $('#geminiApiKey').val(), anthropicApiKey: $('#anthropicApiKey').val(),
				openaiApiKey: $('#openaiApiKey').val(), openaiBaseUrl: $('#openaiBaseUrl').val(),
			};

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const res = await apiFacade.testProvider(provider, payload);
					if (res && res.ok) {
						badge.html(widgetFactory.createStatusBadge('success', 'Connected', res.latencyMs));
						alerts.success(`${provider.toUpperCase()} connected successfully! (${res.latencyMs}ms)`);
						if (res.models && res.models.length) {
							new ModelPickerBuilder().forProvider(provider).withModels(res.models)
								.withCurrentValue($(`#${provider}DefaultModel`).val()).withTargetInput(`#${provider}DefaultModel`).build($(`#${provider}-model-picker`));
						}
					} else {
						badge.html(widgetFactory.createStatusBadge('failed', 'Failed'));
						alerts.error(res.error || 'Connection failed.');
					}
				} catch (err) {
					badge.html(widgetFactory.createStatusBadge('failed', 'Error'));
					alerts.error(err.message);
				}
			}, 'Testing...');
		});

		// Auto-Detect button in provider cards
		$('.auto-detect-btn').on('click', function () {
			const btn = this;
			const provider = $(btn).attr('data-provider');
			const input = $(btn).closest('.input-group').find('input');

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const models = await apiFacade.fetchModels(provider, true);
					if (models && models.length) {
						alerts.success(`Found ${models.length} available models for ${provider.toUpperCase()}`);
						new ModelPickerBuilder().forProvider(provider).withModels(models)
							.withCurrentValue(input.val() || (models[0].id || models[0])).withTargetInput(`#${input.attr('id')}`).build($(`#${provider}-model-picker`));
						if (!input.val()) input.val(models[0].id || models[0]);
					} else {
						alerts.alert({ type: 'info', title: 'Model Detection', message: 'No models detected.' });
					}
				} catch (err) {
					alerts.error('Could not auto-detect models: ' + err.message);
				}
			}, 'Detecting...');
		});
	}
}

	// --- Module: strategies/moderation.js ---
/**
 * [Pattern 4: Strategy Pattern]
 * ModerationTabStrategy coordinates sensitivity controls and sandbox evaluation.
 */
class ModerationTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { apiFacade, modelProxy, alerts } = this.context;

		const sync = () => {
			const on = $('#moderationEnabled').is(':checked');
			$('#card-moderation').toggleClass('card-disabled', !on);
			$('#moderation-card-body').toggleClass('card-switch-disabled', !on);
			$('#card-moderation').find('button:not(.form-check-input)').prop('disabled', !on);
		};
		$('#moderationEnabled').on('change', sync);
		sync();

		$('#moderationSensitivity').on('input', function () {
			$('#sensitivity-display').text($(this).val() + '%');
		});

		$('#moderationProvider').on('change', function () {
			const provider = $(this).val();
			const targetPicker = $(this).attr('data-target-picker');
			const targetInput = $(this).attr('data-target-input');
			const cachedModels = modelProxy.getCached(provider);
			if (cachedModels && cachedModels.length) {
				new ModelPickerBuilder()
					.forProvider(provider)
					.withModels(cachedModels)
					.withCurrentValue($(targetInput).val())
					.withTargetInput(targetInput)
					.build($(targetPicker));
			} else {
				$(targetPicker).html('').addClass('d-none');
			}
		});

		$('#run-sandbox-btn').on('click', function () {
			const btn = this;
			const text = $('#sandbox-input').val();
			const resultBox = $('#sandbox-result');

			if (!text || !text.trim()) {
				return alerts.error('Please enter sample text to test in the sandbox.');
			}

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const res = await apiFacade.simulateModeration(text);
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
				} catch (err) {
					alerts.error(err.message || 'Sandbox simulation failed.');
				}
			}, 'Scanning...');
		});
	}

	onActivate() {
		$('#moderationProvider').trigger('change');
	}
}

	// --- Module: strategies/copilot.js ---
/**
 * [Pattern 4: Strategy Pattern]
 * CopilotTabStrategy coordinates bot provisioning and category scoping.
 */
class CopilotTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { apiFacade, modelProxy, alerts } = this.context;

		const sync = () => {
			const on = $('#copilotEnabled').is(':checked');
			$('#card-copilot').toggleClass('card-disabled', !on);
			$('#copilot-card-body').toggleClass('card-switch-disabled', !on);
			$('#card-copilot').find('button:not(.form-check-input)').prop('disabled', !on);
		};
		$('#copilotEnabled').on('change', sync);
		sync();

		$('#provision-bot-btn').on('click', function () {
			const btn = this;
			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const res = await apiFacade.provisionBot();
					if (res && res.ok && res.botUid) {
						$('#copilotBotUid').val(res.botUid);
						alerts.success(`Cortex Bot provisioned with UID: ${res.botUid}`);
					}
				} catch (err) {
					alerts.error(err.message || 'Could not provision bot account.');
				}
			}, 'Creating...');
		});

		$('#copilotProvider').on('change', function () {
			const provider = $(this).val();
			const targetPicker = $(this).attr('data-target-picker');
			const targetInput = $(this).attr('data-target-input');
			const cachedModels = modelProxy.getCached(provider);
			if (cachedModels && cachedModels.length) {
				new ModelPickerBuilder()
					.forProvider(provider)
					.withModels(cachedModels)
					.withCurrentValue($(targetInput).val())
					.withTargetInput(targetInput)
					.build($(targetPicker));
			} else {
				$(targetPicker).html('').addClass('d-none');
			}
		});
	}

	onActivate() {
		$('#copilotProvider').trigger('change');
	}
}

	// --- Module: strategies/summarizer.js ---
/**
 * [Pattern 4: Strategy Pattern]
 * SummarizerTabStrategy coordinates thread consensus settings.
 */
class SummarizerTabStrategy extends BaseTabStrategy {
	bindEvents() {
		const { modelProxy } = this.context;

		const sync = () => {
			const on = $('#summarizerEnabled').is(':checked');
			$('#card-summarizer').toggleClass('card-disabled', !on);
			$('#summarizer-card-body').toggleClass('card-switch-disabled', !on);
			$('#card-summarizer').find('button:not(.form-check-input)').prop('disabled', !on);
		};
		$('#summarizerEnabled').on('change', sync);
		sync();

		$('#summarizerProvider').on('change', function () {
			const provider = $(this).val();
			const targetPicker = $(this).attr('data-target-picker');
			const targetInput = $(this).attr('data-target-input');
			const cachedModels = modelProxy.getCached(provider);
			if (cachedModels && cachedModels.length) {
				new ModelPickerBuilder()
					.forProvider(provider)
					.withModels(cachedModels)
					.withCurrentValue($(targetInput).val())
					.withTargetInput(targetInput)
					.build($(targetPicker));
			} else {
				$(targetPicker).html('').addClass('d-none');
			}
		});
	}

	onActivate() {
		$('#summarizerProvider').trigger('change');
	}
}

	// --- Module: strategies/audit.js ---
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

	// --- Module: tab-factory.js ---
/**
 * [Pattern 2: Factory Method Pattern]
 * TabStrategyFactory dynamically resolves and creates strategy instances.
 */
class TabStrategyFactory {
	static createStrategy(tabId, context) {
		switch (tabId) {
			case 'tab-overview':
				return new OverviewTabStrategy(tabId, context);
			case 'tab-providers':
				return new ProvidersTabStrategy(tabId, context);
			case 'tab-moderation':
				return new ModerationTabStrategy(tabId, context);
			case 'tab-copilot':
				return new CopilotTabStrategy(tabId, context);
			case 'tab-summarizer':
				return new SummarizerTabStrategy(tabId, context);
			case 'tab-audit':
				return new AuditTabStrategy(tabId, context);
			default:
				return new BaseTabStrategy(tabId, context);
		}
	}
}

	// --- Module: app.js ---
/**
 * [Pattern 1: Singleton Pattern]
 * CortexAdminApp coordinates all client-side subsystems.
 */
class CortexAdminApp {
	constructor() {
		if (CortexAdminApp.instance) {
			return CortexAdminApp.instance;
		}
		this.tabStrategies = new Map();
		this.eventBus = new AdminEventBus();
		this.adapter = new AjaxClientAdapter();
		this.proxy = new ClientModelCacheProxy(this.adapter, this.eventBus);
		this.widgetFactory = new UIWidgetFactory();
		CortexAdminApp.instance = this;
	}

	static getInstance() {
		if (!CortexAdminApp.instance) {
			CortexAdminApp.instance = new CortexAdminApp();
		}
		return CortexAdminApp.instance;
	}

	init(settingsModule, alertsModule) {
		this.apiFacade = new AdminAPIFacade(
			this.adapter,
			this.proxy,
			this.eventBus,
			settingsModule,
			alertsModule
		);

		const context = {
			eventBus: this.eventBus,
			apiFacade: this.apiFacade,
			modelProxy: this.proxy,
			widgetFactory: this.widgetFactory,
			alerts: alertsModule,
		};

		// 1. Load initial settings and restore checkbox states accurately
		settingsModule.load('ai-engine', $('#ai-settings-form'), function (err, values) {
			const vals = values || {};
			const boolKeys = [
				'enabled', 'ollamaEnabled', 'ollamaUseCloud', 'geminiEnabled',
				'anthropicEnabled', 'openaiEnabled', 'moderationEnabled',
				'copilotEnabled', 'summarizerEnabled', 'summarizerDefaultOpen',
			];
			boolKeys.forEach((k) => {
				const isChecked = vals[k] === 'on' || vals[k] === true || vals[k] === '1';
				$(`input[name="${k}"][type="checkbox"]`).prop('checked', isChecked).trigger('change');
			});
		});

		// 2. Secret inputs toggle
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

		// 3. Save Settings
		$('#save-settings-btn').on('click', () => {
			new SaveSettingsCommand('#ai-settings-form', this.apiFacade, alertsModule).execute();
		});

		// 4. Initialize tab strategies via Factory Method
		const tabIds = [
			'tab-overview',
			'tab-providers',
			'tab-moderation',
			'tab-copilot',
			'tab-summarizer',
			'tab-audit',
		];

		tabIds.forEach(id => {
			const strategy = TabStrategyFactory.createStrategy(id, context);
			strategy.init();
			this.tabStrategies.set(id, strategy);
		});

		// 5. Global Tab-Detect Buttons
		$('.tab-detect-btn').on('click', function () {
			const btn = this;
			const selectSelector = $(btn).attr('data-provider-select');
			const inputSelector = $(btn).attr('data-target-input');
			const pickerSelector = $(btn).attr('data-target-picker');
			const provider = $(selectSelector).val();

			AsyncButtonDecorator.decorate(btn, async () => {
				try {
					const models = await context.apiFacade.fetchModels(provider, true);
					if (models && models.length) {
						alertsModule.success(`Found ${models.length} models for ${provider.toUpperCase()}`);
						new ModelPickerBuilder()
							.forProvider(provider)
							.withModels(models)
							.withCurrentValue($(inputSelector).val())
							.withTargetInput(inputSelector)
							.build($(pickerSelector));
					} else {
						alertsModule.alert({
							type: 'info',
							title: 'Model Detection',
							message: `No models detected for ${provider.toUpperCase()}. Check credentials in Providers tab.`,
						});
					}
				} catch (err) {
					alertsModule.error('Detection failed: ' + err.message);
				}
			}, 'Detecting...');
		});

		// 6. Global Model Pill Select
		$(document).on('click', '.model-select-pill', function () {
			const btn = $(this);
			const provider = btn.attr('data-provider');
			const model = btn.attr('data-model');
			const targetInput = btn.attr('data-target-input');

			if (targetInput && $(targetInput).length) {
				$(targetInput).val(model);
			}

			const container = btn.closest('.model-picker-container');
			container.find('.model-select-pill').removeClass('btn-primary active').addClass('btn-outline-secondary');
			btn.removeClass('btn-outline-secondary').addClass('btn-primary active');

			alertsModule.success(`Selected ${provider.toUpperCase()} model: ${model}`);
		});

		// 7. Tab URL & Hash Persistence
		const activateTabFromHash = () => {
			const hash = window.location.hash;
			if (hash) {
				const tabBtn = $(`button[data-bs-target="${hash}"]`);
				if (tabBtn.length) {
					tabBtn.trigger('click');
					if (window.bootstrap && window.bootstrap.Tab) {
						new window.bootstrap.Tab(tabBtn[0]).show();
					}
					const cleanId = hash.replace('#', '');
					if (this.tabStrategies.has(cleanId)) {
						this.tabStrategies.get(cleanId).onActivate();
					}
				}
			}
		};

		$('button[data-bs-toggle="tab"]').on('shown.bs.tab', (e) => {
			const target = $(e.target).attr('data-bs-target');
			if (target) {
				if (history.replaceState) {
					history.replaceState(null, null, target);
				} else {
					window.location.hash = target;
				}
				const cleanId = target.replace('#', '');
				if (this.tabStrategies.has(cleanId)) {
					this.tabStrategies.get(cleanId).onActivate();
				}
			}
		});

		activateTabFromHash();
		$(window).on('hashchange', activateTabFromHash);

		// 8. Event Bus cross-tab pill re-render
		this.eventBus.on('models:cached', ({ provider, models }) => {
			$(`.provider-selector[value="${provider}"]`).each(function () {
				const picker = $($(this).attr('data-target-picker'));
				const input = $($(this).attr('data-target-input'));
				if (picker.length && input.length) {
					new ModelPickerBuilder()
						.forProvider(provider)
						.withModels(models)
						.withCurrentValue(input.val())
						.withTargetInput(`#${input.attr('id')}`)
						.build(picker);
				}
			});
		});
	}
}


	const ACP = {};
	ACP.init = function () {
		CortexAdminApp.getInstance().init(settings, alerts);
	};

	return ACP;
});
