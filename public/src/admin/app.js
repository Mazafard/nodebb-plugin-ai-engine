'use strict';

const AdminEventBus = require('./events');
const AjaxClientAdapter = require('./transport');
const ClientModelCacheProxy = require('./proxy');
const AdminAPIFacade = require('./api');
const UIWidgetFactory = require('./widget-factory');
const ModelPickerBuilder = require('./builder');
const AsyncButtonDecorator = require('./decorator');
const { SaveSettingsCommand } = require('./commands');
const TabStrategyFactory = require('./tab-factory');

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

		// 1. Load initial settings
		settingsModule.load('ai-engine', $('#ai-settings-form'));

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
			'tab-patterns',
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

module.exports = CortexAdminApp;
