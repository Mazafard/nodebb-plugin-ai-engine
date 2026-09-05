'use strict';

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

module.exports = ModelPickerBuilder;
