{{{ if aiSummary }}}
<div class="cortex-summary-container mb-4">
	<div class="card border-0 rounded-4 shadow-sm cortex-summary-card">
		<div class="card-header bg-transparent border-0 d-flex align-items-center justify-content-between p-3 pb-0">
			<div class="d-flex align-items-center gap-2">
				<div class="cortex-badge-icon">
					<i class="fa fa-brain text-primary"></i>
				</div>
				<div>
					<h6 class="mb-0 fw-bold d-flex align-items-center gap-2">
						Thread Consensus & TL;DR
						<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small">AI Synthesis</span>
					</h6>
				</div>
			</div>
			<div class="d-flex align-items-center gap-2">
				<span class="text-muted small d-none d-md-inline">Updated {aiSummary.updatedAt}</span>
				<button class="btn btn-sm btn-link text-muted cortex-copy-btn" title="Copy summary">
					<i class="fa fa-copy"></i>
				</button>
				<button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 cortex-toggle-btn" type="button" data-bs-toggle="collapse" data-bs-target="#cortex-summary-body" aria-expanded="{{{ if aiSummary.defaultOpen }}}true{{{ else }}}false{{{ end }}}">
					<i class="fa fa-chevron-down toggle-icon"></i>
				</button>
			</div>
		</div>
		<div class="collapse {{{ if aiSummary.defaultOpen }}}show{{{ end }}}" id="cortex-summary-body">
			<div class="card-body p-3 pt-2">
				<p class="cortex-tldr mb-3 fw-medium text-secondary">{aiSummary.tldr}</p>
				{{{ if aiSummary.keyPoints.length }}}
				<div class="cortex-keypoints mb-3">
					<span class="fw-bold small text-uppercase text-muted d-block mb-1">Key Takeaways</span>
					<ul class="mb-0 ps-3 small text-secondary">
						{{{ each aiSummary.keyPoints }}}
						<li class="mb-1">{./}</li>
						{{{ end }}}
					</ul>
				</div>
				{{{ end }}}
				{{{ if aiSummary.consensus }}}
				<div class="cortex-consensus p-2 rounded-3 bg-light border small text-muted">
					<strong class="text-dark"><i class="fa fa-check-circle text-success me-1"></i> Resolution:</strong> {aiSummary.consensus}
				</div>
				{{{ end }}}
			</div>
		</div>
	</div>
</div>
{{{ end }}}
