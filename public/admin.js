'use strict';

/**
 * Cortex AI Engine Admin Control Panel
 * Implements 13 Software Design Patterns on the client-side for robust UI/UX.
 */
define('admin/plugins/ai-engine', ['settings', 'alerts'], function (settings, alerts) {
	// =========================================================================
	// [Pattern 11: Observer Pattern] Client-Side Event Bus
	// =========================================================================
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

	const eventBus = new AdminEventBus();

	// =========================================================================
	// [Pattern 5: Adapter Pattern] AJAX & CSRF Transport Adapter
	// =========================================================================
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

	const ajaxAdapter = new AjaxClientAdapter();

	// =========================================================================
	// [Pattern 9: Proxy Pattern] In-Memory Client Model Cache Proxy
	// =========================================================================
	class ClientModelCacheProxy {
		constructor(adapter) {
			this.adapter = adapter;
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
			eventBus.emit('models:cached', { provider: key, models });
			return models;
		}

		setModels(provider, models) {
			const key = (provider || '').toLowerCase().trim();
			this.cache.set(key, models || []);
			eventBus.emit('models:cached', { provider: key, models });
		}

		getCached(provider) {
			return this.cache.get((provider || '').toLowerCase().trim()) || null;
		}

		clear() {
			this.cache.clear();
		}
	}

	const modelProxy = new ClientModelCacheProxy(ajaxAdapter);

	// =========================================================================
	// [Pattern 6: Facade Pattern] Unified Admin API Facade
	// =========================================================================
	class AdminAPIFacade {
		constructor(adapter, proxy) {
			this.adapter = adapter;
			this.proxy = proxy;
		}

		async testProvider(provider, configPayload) {
			const res = await this.adapter.request('/api/v3/plugins/ai-engine/test-provider', {
				method: 'POST',
				body: { provider, config: configPayload },
			});
			if (res && res.ok && res.models && res.models.length) {
				this.proxy.setModels(provider, res.models);
			}
			eventBus.emit('provider:tested', { provider, res });
			return res;
		}

		async fetchModels(provider, forceRefresh = true) {
			const models = await this.proxy.getModels(provider, forceRefresh);
			eventBus.emit('models:received', { provider, models });
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
			settings.save('ai-engine', formElement, function () {
				alerts.success('Cortex AI Engine configuration saved successfully!');
				if (typeof callback === 'function') callback();
			});
		}
	}

	const apiFacade = new AdminAPIFacade(ajaxAdapter, modelProxy);

	// =========================================================================
	// [Pattern 8: Decorator Pattern] Button Async State Decorator
	// =========================================================================
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

	// =========================================================================
	// [Pattern 3: Abstract Factory Pattern] UI Widget Factory
	// =========================================================================
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

	const widgetFactory = new UIWidgetFactory();

	// =========================================================================
	// [Pattern 13: Builder Pattern] Interactive Model Picker Builder
	// =========================================================================
	class ModelPickerBuilder {
		constructor() {
			this.provider = '';
			this.models = [];
			this.currentValue = '';
			this.targetInputSelector = '';
		}

		forProvider(provider) {
			this.provider = provider;
			return this;
		}

		withModels(models) {
			this.models = models || [];
			return this;
		}

		withCurrentValue(value) {
			this.currentValue = value || '';
			return this;
		}

		withTargetInput(selector) {
			this.targetInputSelector = selector;
			return this;
		}

		build($container) {
			if (!$container || !$container.length) return;
			if (!this.models || !this.models.length) {
				$container.html('').addClass('d-none');
				return;
			}

			let html = `
				<div class="p-2 bg-light rounded-3 border">
					<div class="d-flex justify-content-between align-items-center mb-1">
						<span class="small fw-bold text-muted"><i class="fa fa-list me-1"></i> Received Models (${this.models.length}):</span>
						<span class="small text-muted" style="font-size: 0.75rem;">Click pill to select</span>
					</div>
					<div class="d-flex flex-wrap gap-1">
			`;

			const currentVal = this.currentValue;
			const provider = this.provider;
			const targetInput = this.targetInputSelector;

			this.models.forEach(m => {
				const isSelected = (m === currentVal);
				const btnClass = isSelected ? 'btn-primary active' : 'btn-outline-secondary';
				html += `<button type="button" class="btn btn-sm ${btnClass} py-0 px-2 model-select-pill" data-provider="${provider}" data-model="${m}" data-target-input="${targetInput}">${m}</button>`;
			});

			html += `
					</div>
				</div>
			`;

			$container.html(html).removeClass('d-none');
		}
	}

	// =========================================================================
	// [Pattern 7: Chain of Responsibility] Form & Configuration Validation
	// =========================================================================
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
			if (data.ollamaEnabled && data.ollamaUrl) {
				if (!data.ollamaUrl.startsWith('http://') && !data.ollamaUrl.startsWith('https://')) {
					return { valid: false, message: 'Ollama Daemon URL must start with http:// or https://' };
				}
			}
			return super.validate(data);
		}
	}

	// =========================================================================
	// [Pattern 12: Command Pattern] Action Commands
	// =========================================================================
	class ApplyPresetCommand {
		constructor(preset) {
			this.preset = preset;
		}

		execute() {
			if (this.preset === 'private') {
				$('#ollamaEnabled').prop('checked', true);
				$('#moderationProvider').val('ollama').trigger('change');
				$('#copilotProvider').val('ollama').trigger('change');
				$('#summarizerProvider').val('ollama').trigger('change');
				alerts.success('Applied "100% Free & Private" (Ollama Local) preset! Click Save Changes to apply.');
			} else if (this.preset === 'balanced') {
				$('#ollamaEnabled').prop('checked', true);
				$('#geminiEnabled').prop('checked', true);
				$('#moderationProvider').val('ollama').trigger('change');
				$('#copilotProvider').val('gemini').trigger('change');
				$('#summarizerProvider').val('gemini').trigger('change');
				alerts.success('Applied "Speed & Cost Champion" preset! Click Save Changes to apply.');
			} else if (this.preset === 'enterprise') {
				$('#openaiEnabled').prop('checked', true);
				$('#geminiEnabled').prop('checked', true);
				$('#anthropicEnabled').prop('checked', true);
				$('#moderationProvider').val('openai').trigger('change');
				$('#copilotProvider').val('gemini').trigger('change');
				$('#summarizerProvider').val('anthropic').trigger('change');
				alerts.success('Applied "Enterprise Synergy" preset! Click Save Changes to apply.');
			}

			$('.preset-card').removeClass('active-preset');
			$(`.preset-card[data-preset="${this.preset}"]`).addClass('active-preset');
			eventBus.emit('preset:applied', { preset: this.preset });
		}
	}

	class SaveSettingsCommand {
		constructor(formSelector) {
			this.$form = $(formSelector);
		}

		execute() {
			// Aggregate category checkboxes into hidden CSV input
			const selectedCids = [];
			$('.category-checkbox:checked').each(function () {
				selectedCids.push($(this).val());
			});
			$('#copilotCategories').val(selectedCids.join(','));

			// Run Chain of Responsibility validation
			const validatorChain = new SecretInputValidator();
			validatorChain.setNext(new UrlFormatValidator());

			const formData = {
				ollamaEnabled: $('#ollamaEnabled').is(':checked'),
				ollamaUrl: $('#ollamaUrl').val(),
				geminiEnabled: $('#geminiEnabled').is(':checked'),
				geminiApiKey: $('#geminiApiKey').val(),
				anthropicEnabled: $('#anthropicEnabled').is(':checked'),
				anthropicApiKey: $('#anthropicApiKey').val(),
				openaiEnabled: $('#openaiEnabled').is(':checked'),
				openaiApiKey: $('#openaiApiKey').val(),
			};

			const validation = validatorChain.validate(formData);
			if (!validation.valid) {
				alerts.error(validation.message);
				return;
			}

			apiFacade.saveSettings(this.$form);
		}
	}

	// =========================================================================
	// [Pattern 10: Template Method & Pattern 4: Strategy Pattern] Tab Strategies
	// =========================================================================
	class BaseTabStrategy {
		constructor(tabId) {
			this.tabId = tabId;
		}

		init() {
			this.bindEvents();
		}

		bindEvents() {}

		onActivate() {}
	}

	// Tab 1: Overview Strategy
	class OverviewTabStrategy extends BaseTabStrategy {
		bindEvents() {
			$('.apply-preset-btn').on('click', function () {
				const preset = $(this).attr('data-preset');
				new ApplyPresetCommand(preset).execute();
			});
		}
	}

	// Tab 2: Providers Strategy
	class ProvidersTabStrategy extends BaseTabStrategy {
		bindEvents() {
			// Test provider connection
			$('.test-provider-btn').on('click', function () {
				const btn = this;
				const provider = $(btn).attr('data-provider');
				const badge = $(`#${provider}-status`);

				badge.html(widgetFactory.createStatusBadge('loading', 'Testing...'));

				const providerPayload = {
					ollamaUrl: $('#ollamaUrl').val(),
					geminiApiKey: $('#geminiApiKey').val(),
					anthropicApiKey: $('#anthropicApiKey').val(),
					openaiApiKey: $('#openaiApiKey').val(),
					openaiBaseUrl: $('#openaiBaseUrl').val(),
				};

				AsyncButtonDecorator.decorate(btn, async () => {
					try {
						const res = await apiFacade.testProvider(provider, providerPayload);
						if (res && res.ok) {
							badge.html(widgetFactory.createStatusBadge('success', 'Connected', res.latencyMs));
							alerts.success(`${provider.toUpperCase()} connected successfully! (${res.latencyMs}ms)`);
							if (res.models && res.models.length) {
								new ModelPickerBuilder()
									.forProvider(provider)
									.withModels(res.models)
									.withCurrentValue($(`#${provider}DefaultModel`).val())
									.withTargetInput(`#${provider}DefaultModel`)
									.build($(`#${provider}-model-picker`));
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
							new ModelPickerBuilder()
								.forProvider(provider)
								.withModels(models)
								.withCurrentValue(input.val() || models[0])
								.withTargetInput(`#${input.attr('id')}`)
								.build($(`#${provider}-model-picker`));
							if (!input.val()) {
								input.val(models[0]);
							}
						} else {
							alerts.alert({
								type: 'info',
								title: 'Model Detection',
								message: 'No models detected for this provider credentials.',
							});
						}
					} catch (err) {
						alerts.error('Could not auto-detect models: ' + err.message);
					}
				}, 'Detecting...');
			});
		}
	}

	// Tab 3: Moderation Strategy
	class ModerationTabStrategy extends BaseTabStrategy {
		bindEvents() {
			// Live sensitivity slider
			$('#moderationSensitivity').on('input', function () {
				$('#sensitivity-display').text($(this).val() + '%');
			});

			// Provider switch -> update model picker pills
			$('#moderationProvider').on('change', async function () {
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

			// Sandbox scan simulation
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

	// Tab 4: Copilot Strategy
	class CopilotTabStrategy extends BaseTabStrategy {
		bindEvents() {
			// Provision bot button
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

			// Provider switch -> update model picker pills
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

	// Tab 5: Summarizer Strategy
	class SummarizerTabStrategy extends BaseTabStrategy {
		bindEvents() {
			// Provider switch -> update model picker pills
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

	// Tab 6: Audit & Logs Strategy
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

	// Tab 7: Architecture Patterns Strategy
	class PatternsTabStrategy extends BaseTabStrategy {
		bindEvents() {}
	}

	// =========================================================================
	// [Pattern 2: Factory Method Pattern] Tab Strategy Factory
	// =========================================================================
	class TabStrategyFactory {
		static createStrategy(tabId) {
			switch (tabId) {
				case 'tab-overview':
					return new OverviewTabStrategy(tabId);
				case 'tab-providers':
					return new ProvidersTabStrategy(tabId);
				case 'tab-moderation':
					return new ModerationTabStrategy(tabId);
				case 'tab-copilot':
					return new CopilotTabStrategy(tabId);
				case 'tab-summarizer':
					return new SummarizerTabStrategy(tabId);
				case 'tab-audit':
					return new AuditTabStrategy(tabId);
				case 'tab-patterns':
					return new PatternsTabStrategy(tabId);
				default:
					return new BaseTabStrategy(tabId);
			}
		}
	}

	// =========================================================================
	// [Pattern 1: Singleton Pattern] Central Admin Application Coordinator
	// =========================================================================
	class CortexAdminApp {
		constructor() {
			if (CortexAdminApp.instance) {
				return CortexAdminApp.instance;
			}
			this.tabStrategies = new Map();
			CortexAdminApp.instance = this;
		}

		static getInstance() {
			if (!CortexAdminApp.instance) {
				CortexAdminApp.instance = new CortexAdminApp();
			}
			return CortexAdminApp.instance;
		}

		init() {
			// 1. Load initial settings via NodeBB admin helper
			settings.load('ai-engine', $('#ai-settings-form'));

			// 2. Secret password inputs visibility toggle
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

			// 3. Save Settings global trigger
			$('#save-settings-btn').on('click', function () {
				new SaveSettingsCommand('#ai-settings-form').execute();
			});

			// 4. Initialize strategies for all tabs via Factory Method
			const tabIds = [
				'tab-overview',
				'tab-providers',
				'tab-moderation',
				'tab-copilot',
				'tab-summarizer',
				'tab-audit',
				'tab-patterns',
			];

			tabIds.forEach(id => {
				const strategy = TabStrategyFactory.createStrategy(id);
				strategy.init();
				this.tabStrategies.set(id, strategy);
			});

			// 5. Global Tab-Detect Buttons across Moderation, Copilot, Summarizer
			$('.tab-detect-btn').on('click', function () {
				const btn = this;
				const selectSelector = $(btn).attr('data-provider-select');
				const inputSelector = $(btn).attr('data-target-input');
				const pickerSelector = $(btn).attr('data-target-picker');
				const provider = $(selectSelector).val();

				AsyncButtonDecorator.decorate(btn, async () => {
					try {
						const models = await apiFacade.fetchModels(provider, true);
						if (models && models.length) {
							alerts.success(`Found ${models.length} models for ${provider.toUpperCase()}`);
							new ModelPickerBuilder()
								.forProvider(provider)
								.withModels(models)
								.withCurrentValue($(inputSelector).val())
								.withTargetInput(inputSelector)
								.build($(pickerSelector));
						} else {
							alerts.alert({
								type: 'info',
								title: 'Model Detection',
								message: `No models detected for ${provider.toUpperCase()}. Check credentials in Providers tab.`,
							});
						}
					} catch (err) {
						alerts.error('Detection failed: ' + err.message);
					}
				}, 'Detecting...');
			});

			// 6. Global Model Select Pill Click Handler
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

				alerts.success(`Selected ${provider.toUpperCase()} model: ${model}`);
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

			// 8. Event Bus Subscriptions across tabs
			eventBus.on('models:cached', ({ provider, models }) => {
				// Re-render any visible pickers for this provider
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
		CortexAdminApp.getInstance().init();
	};

	return ACP;
});
