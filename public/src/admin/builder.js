'use strict';

/**
 * [Pattern 13: Builder Pattern]
 * Fluent builder for interactive model pill groups across ACP tabs.
 */
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

module.exports = ModelPickerBuilder;
