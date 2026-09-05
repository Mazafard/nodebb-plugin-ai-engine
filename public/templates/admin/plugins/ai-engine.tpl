<div class="acp-page-container">
	<div class="row m-0">
		<div id="ai-engine-admin-container" class="col-12 p-0">
			<!-- Header Card with Telemetry -->
			<div class="ai-header-card d-flex flex-wrap align-items-center justify-content-between mb-4 p-4 rounded-4 shadow-sm">
				<div class="d-flex align-items-center gap-3">
					<div class="ai-icon-pulse">
						<i class="fa fa-brain fa-2x text-primary"></i>
					</div>
					<div>
						<div class="d-flex align-items-center gap-2">
							<h3 class="mb-0 fw-bold">Cortex AI Community Engine</h3>
							<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">v{version}</span>
							<span class="badge bg-secondary-subtle text-secondary border px-2 py-1">NodeBB v4</span>
						</div>
						<p class="text-muted mb-0 mt-1">Autonomous moderation, semantic RAG assistance, and thread synthesis powered by local and frontier LLMs.</p>
					</div>
				</div>
				<div class="d-flex align-items-center gap-3 mt-3 mt-md-0">
					<div class="telemetry-pill">
						<span class="text-muted small">Total Inferences</span>
						<span class="fw-bold fs-5 d-block text-primary">{stats.totalCalls}</span>
					</div>
					<div class="telemetry-pill">
						<span class="text-muted small">Quarantined</span>
						<span class="fw-bold fs-5 d-block text-danger">{stats.quarantinedCount}</span>
					</div>
					<div class="telemetry-pill">
						<span class="text-muted small">Copilot Replies</span>
						<span class="fw-bold fs-5 d-block text-success">{stats.copilotReplies}</span>
					</div>
					<div class="telemetry-pill">
						<span class="text-muted small">Summaries</span>
						<span class="fw-bold fs-5 d-block text-info">{stats.summariesCreated}</span>
					</div>
				</div>
			</div>

			<!-- Main Navigation Pills -->
			<ul class="nav nav-pills mb-4 gap-2" id="ai-tabs" role="tablist">
				<li class="nav-item" role="presentation">
					<button class="nav-link active rounded-pill px-4" id="overview-tab" data-bs-toggle="tab" data-bs-target="#tab-overview" type="button" role="tab">
						<i class="fa fa-sliders me-2"></i> Overview & Presets
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="providers-tab" data-bs-toggle="tab" data-bs-target="#tab-providers" type="button" role="tab">
						<i class="fa fa-bolt me-2"></i> Model Providers
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="moderation-tab" data-bs-toggle="tab" data-bs-target="#tab-moderation" type="button" role="tab">
						<i class="fa fa-shield-alt me-2"></i> Smart Moderation
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="copilot-tab" data-bs-toggle="tab" data-bs-target="#tab-copilot" type="button" role="tab">
						<i class="fa fa-robot me-2"></i> Community Copilot
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="summarizer-tab" data-bs-toggle="tab" data-bs-target="#tab-summarizer" type="button" role="tab">
						<i class="fa fa-compress-alt me-2"></i> Thread TL;DR
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="audit-tab" data-bs-toggle="tab" data-bs-target="#tab-audit" type="button" role="tab">
						<i class="fa fa-history me-2"></i> Audit & Logs
					</button>
				</li>
			</ul>

			<!-- Settings Form Wrapper -->
			<form id="ai-settings-form">
				<div class="tab-content mb-4" id="ai-tab-content">

					<!-- TAB 1: OVERVIEW & PRESETS -->
					<div class="tab-pane fade show active" id="tab-overview" role="tabpanel">
						<div class="card shadow-sm p-4 border-0 rounded-4 mb-4">
							<div class="d-flex justify-content-between align-items-center mb-3">
								<h5 class="fw-bold mb-0"><i class="fa fa-magic text-primary me-2"></i> 1-Click Operational Presets</h5>
								<div class="form-check form-switch m-0">
									<input class="form-check-input" type="checkbox" id="enabled" name="enabled" {{{ if settings.enabled }}}checked{{{ end }}}>
									<label class="form-check-label fw-bold" for="enabled">Master AI Engine Switch</label>
								</div>
							</div>
							<p class="text-muted">Select an operational profile to automatically configure provider models and balances:</p>

							<div class="row g-3 mb-4">
								<div class="col-md-4">
									<div class="preset-card card h-100 p-3 border-2" data-preset="private">
										<div class="d-flex justify-content-between align-items-center mb-2">
											<span class="badge bg-success-subtle text-success border">100% Free & Private</span>
											<i class="fa fa-server text-success"></i>
										</div>
										<h6 class="fw-bold mb-1">Local Ollama Sanctuary</h6>
										<p class="small text-muted mb-3">All moderation, RAG, and summarization runs on local self-hosted models. Zero API bills, complete privacy.</p>
										<button type="button" class="btn btn-sm btn-outline-success w-100 apply-preset-btn" data-preset="private">Apply Preset</button>
									</div>
								</div>
								<div class="col-md-4">
									<div class="preset-card card h-100 p-3 border-2 active-preset" data-preset="balanced">
										<div class="d-flex justify-content-between align-items-center mb-2">
											<span class="badge bg-primary-subtle text-primary border">Recommended</span>
											<i class="fa fa-balance-scale text-primary"></i>
										</div>
										<h6 class="fw-bold mb-1">Speed & Cost Champion</h6>
										<p class="small text-muted mb-3">Ollama for zero-cost moderation triage + Google Gemini 1.5 Flash for lightning-fast sub-second RAG & summaries.</p>
										<button type="button" class="btn btn-sm btn-outline-primary w-100 apply-preset-btn" data-preset="balanced">Apply Preset</button>
									</div>
								</div>
								<div class="col-md-4">
									<div class="preset-card card h-100 p-3 border-2" data-preset="enterprise">
										<div class="d-flex justify-content-between align-items-center mb-2">
											<span class="badge bg-warning-subtle text-warning border">Frontier Quality</span>
											<i class="fa fa-crown text-warning"></i>
										</div>
										<h6 class="fw-bold mb-1">Enterprise Synergy</h6>
										<p class="small text-muted mb-3">GPT-4o-mini for moderation, Gemini Flash for Copilot answers, and Claude 3.5 Sonnet for deep debate synthesis.</p>
										<button type="button" class="btn btn-sm btn-outline-warning w-100 apply-preset-btn" data-preset="enterprise">Apply Preset</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- TAB 2: MODEL PROVIDERS -->
					<div class="tab-pane fade" id="tab-providers" role="tabpanel">
						<div class="row g-4">
							<!-- Ollama Card -->
							<div class="col-lg-6">
								<div class="card shadow-sm p-4 border-0 rounded-4 h-100">
									<div class="d-flex justify-content-between align-items-center mb-3">
										<div class="d-flex align-items-center gap-2">
											<i class="fa fa-server fa-lg text-success"></i>
											<h5 class="fw-bold mb-0">Ollama (Local & Cloud)</h5>
										</div>
										<div class="form-check form-switch m-0">
											<input class="form-check-input" type="checkbox" id="ollamaEnabled" name="ollamaEnabled" {{{ if settings.ollamaEnabled }}}checked{{{ end }}}>
										</div>
									</div>

									<!-- Mode Selector: Local Daemon vs Ollama Cloud -->
									<div class="p-2 mb-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
										<div>
											<span class="small fw-bold text-dark d-block"><i class="fa fa-cloud text-primary me-1"></i> Use Ollama Cloud</span>
											<span class="text-muted" style="font-size: 0.75rem;">Switch from local daemon to hosted cloud endpoint</span>
										</div>
										<div class="form-check form-switch m-0">
											<input class="form-check-input" type="checkbox" id="ollamaUseCloud" name="ollamaUseCloud" {{{ if settings.ollamaUseCloud }}}checked{{{ end }}}>
										</div>
									</div>

									<!-- Local URL Input -->
									<div class="mb-3 ollama-local-field" id="ollama-local-url-group">
										<label class="form-label small fw-bold">Local Daemon URL</label>
										<input type="text" class="form-control" id="ollamaUrl" name="ollamaUrl" value="{settings.ollamaUrl}" placeholder="http://localhost:11434">
										<span class="text-muted" style="font-size: 0.75rem;">Default localhost daemon. Inside Docker, auto-resolves to host.docker.internal.</span>
									</div>

									<!-- Cloud Base URL Input -->
									<div class="mb-3 ollama-cloud-field d-none" id="ollama-cloud-url-group">
										<label class="form-label small fw-bold">Ollama Cloud Base URL</label>
										<input type="text" class="form-control" id="ollamaCloudUrl" name="ollamaCloudUrl" value="{settings.ollamaCloudUrl}" placeholder="https://api.ollama.com">
										<span class="text-muted" style="font-size: 0.75rem;">Hosted Ollama Cloud endpoint or remote GPU gateway.</span>
									</div>

									<!-- API Key / Bearer Token -->
									<div class="mb-3" id="ollama-api-key-group">
										<label class="form-label small fw-bold">API Key / Bearer Token <span class="text-muted fw-normal" id="ollama-api-key-hint">(Required for Cloud, optional for local)</span></label>
										<div class="input-group">
											<input type="password" class="form-control secret-input" id="ollamaApiKey" name="ollamaApiKey" value="{settings.ollamaApiKey}" placeholder="Optional Bearer token or gateway key">
											<button class="btn btn-outline-secondary toggle-secret-btn" type="button"><i class="fa fa-eye"></i></button>
										</div>
									</div>

									<!-- Default Model -->
									<div class="mb-3">
										<label class="form-label small fw-bold">Default Model</label>
										<div class="input-group">
											<input type="text" class="form-control" id="ollamaDefaultModel" name="ollamaDefaultModel" value="{settings.ollamaDefaultModel}" placeholder="llama3.2:3b">
											<button class="btn btn-outline-secondary auto-detect-btn" type="button" data-provider="ollama" title="Query available models">
												<i class="fa fa-sync-alt"></i> Detect
											</button>
										</div>
										<div class="model-picker-container mt-2 d-none" id="ollama-model-picker"></div>
									</div>

									<div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
										<span class="provider-status-badge text-muted small" id="ollama-status">Untested</span>
										<button type="button" class="btn btn-sm btn-outline-success test-provider-btn" data-provider="ollama">
											<i class="fa fa-plug me-1"></i> Test Connection
										</button>
									</div>
								</div>
							</div>

							<!-- Google Gemini Card -->
							<div class="col-lg-6">
								<div class="card shadow-sm p-4 border-0 rounded-4 h-100">
									<div class="d-flex justify-content-between align-items-center mb-3">
										<div class="d-flex align-items-center gap-2">
											<i class="fa fa-gem fa-lg text-primary"></i>
											<h5 class="fw-bold mb-0">Google Gemini</h5>
										</div>
										<div class="form-check form-switch m-0">
											<input class="form-check-input" type="checkbox" id="geminiEnabled" name="geminiEnabled" {{{ if settings.geminiEnabled }}}checked{{{ end }}}>
										</div>
									</div>
									<div class="mb-3">
										<label class="form-label small fw-bold">API Key</label>
										<div class="input-group">
											<input type="password" class="form-control secret-input" id="geminiApiKey" name="geminiApiKey" value="{settings.geminiApiKey}" placeholder="AIzaSy...">
											<button class="btn btn-outline-secondary toggle-secret-btn" type="button"><i class="fa fa-eye"></i></button>
										</div>
									</div>
									<div class="mb-3">
										<label class="form-label small fw-bold">Default Model</label>
										<div class="input-group">
											<input type="text" class="form-control" id="geminiDefaultModel" name="geminiDefaultModel" value="{settings.geminiDefaultModel}" placeholder="gemini-1.5-flash">
											<button class="btn btn-outline-secondary auto-detect-btn" type="button" data-provider="gemini">
												<i class="fa fa-sync-alt"></i> Detect
											</button>
										</div>
										<div class="model-picker-container mt-2 d-none" id="gemini-model-picker"></div>
									</div>
									<div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
										<span class="provider-status-badge text-muted small" id="gemini-status">Untested</span>
										<button type="button" class="btn btn-sm btn-outline-primary test-provider-btn" data-provider="gemini">
											<i class="fa fa-plug me-1"></i> Test Connection
										</button>
									</div>
								</div>
							</div>

							<!-- Anthropic Card -->
							<div class="col-lg-6">
								<div class="card shadow-sm p-4 border-0 rounded-4 h-100">
									<div class="d-flex justify-content-between align-items-center mb-3">
										<div class="d-flex align-items-center gap-2">
											<i class="fa fa-feather-alt fa-lg text-warning"></i>
											<h5 class="fw-bold mb-0">Anthropic Claude</h5>
										</div>
										<div class="form-check form-switch m-0">
											<input class="form-check-input" type="checkbox" id="anthropicEnabled" name="anthropicEnabled" {{{ if settings.anthropicEnabled }}}checked{{{ end }}}>
										</div>
									</div>
									<div class="mb-3">
										<label class="form-label small fw-bold">API Key</label>
										<div class="input-group">
											<input type="password" class="form-control secret-input" id="anthropicApiKey" name="anthropicApiKey" value="{settings.anthropicApiKey}" placeholder="sk-ant-...">
											<button class="btn btn-outline-secondary toggle-secret-btn" type="button"><i class="fa fa-eye"></i></button>
										</div>
									</div>
									<div class="mb-3">
										<label class="form-label small fw-bold">Default Model</label>
										<div class="input-group">
											<input type="text" class="form-control" id="anthropicDefaultModel" name="anthropicDefaultModel" value="{settings.anthropicDefaultModel}" placeholder="claude-3-5-sonnet-20241022">
											<button class="btn btn-outline-secondary auto-detect-btn" type="button" data-provider="anthropic">
												<i class="fa fa-sync-alt"></i> Detect
											</button>
										</div>
										<div class="model-picker-container mt-2 d-none" id="anthropic-model-picker"></div>
									</div>
									<div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
										<span class="provider-status-badge text-muted small" id="anthropic-status">Untested</span>
										<button type="button" class="btn btn-sm btn-outline-warning test-provider-btn" data-provider="anthropic">
											<i class="fa fa-plug me-1"></i> Test Connection
										</button>
									</div>
								</div>
							</div>

							<!-- OpenAI Card -->
							<div class="col-lg-6">
								<div class="card shadow-sm p-4 border-0 rounded-4 h-100">
									<div class="d-flex justify-content-between align-items-center mb-3">
										<div class="d-flex align-items-center gap-2">
											<i class="fa fa-circle-notch fa-lg text-info"></i>
											<h5 class="fw-bold mb-0">OpenAI / Compatible</h5>
										</div>
										<div class="form-check form-switch m-0">
											<input class="form-check-input" type="checkbox" id="openaiEnabled" name="openaiEnabled" {{{ if settings.openaiEnabled }}}checked{{{ end }}}>
										</div>
									</div>
									<div class="mb-3">
										<label class="form-label small fw-bold">API Key</label>
										<div class="input-group">
											<input type="password" class="form-control secret-input" id="openaiApiKey" name="openaiApiKey" value="{settings.openaiApiKey}" placeholder="sk-proj-...">
											<button class="btn btn-outline-secondary toggle-secret-btn" type="button"><i class="fa fa-eye"></i></button>
										</div>
									</div>
									<div class="row g-2 mb-2">
										<div class="col-8">
											<label class="form-label small fw-bold">Base URL</label>
											<input type="text" class="form-control" id="openaiBaseUrl" name="openaiBaseUrl" value="{settings.openaiBaseUrl}" placeholder="https://api.openai.com/v1">
										</div>
										<div class="col-4">
											<label class="form-label small fw-bold">Default Model</label>
											<div class="input-group">
												<input type="text" class="form-control" id="openaiDefaultModel" name="openaiDefaultModel" value="{settings.openaiDefaultModel}" placeholder="gpt-4o-mini">
												<button class="btn btn-outline-secondary auto-detect-btn" type="button" data-provider="openai">
													<i class="fa fa-sync-alt"></i> Detect
												</button>
											</div>
										</div>
									</div>
									<div class="model-picker-container mb-3 d-none" id="openai-model-picker"></div>
									<div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
										<span class="provider-status-badge text-muted small" id="openai-status">Untested</span>
										<button type="button" class="btn btn-sm btn-outline-info test-provider-btn" data-provider="openai">
											<i class="fa fa-plug me-1"></i> Test Connection
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- TAB 3: SMART MODERATION GUARD -->
					<div class="tab-pane fade" id="tab-moderation" role="tabpanel">
						<div class="card shadow-sm p-4 border-0 rounded-4 mb-4">
							<div class="d-flex justify-content-between align-items-center mb-3">
								<h5 class="fw-bold mb-0"><i class="fa fa-shield-alt text-danger me-2"></i> Autonomous Post Screening & Quarantine</h5>
								<div class="form-check form-switch m-0">
									<input class="form-check-input" type="checkbox" id="moderationEnabled" name="moderationEnabled" {{{ if settings.moderationEnabled }}}checked{{{ end }}}>
									<label class="form-check-label fw-semibold" for="moderationEnabled">Enable Guard</label>
								</div>
							</div>
							<p class="text-muted small">Scans submissions on <code>filter:post.save</code> for deceptive link farming, aggressive promo, and toxicity.</p>

							<div class="row g-3 mb-4">
								<div class="col-md-6">
									<label class="form-label small fw-bold">Provider</label>
									<select class="form-select provider-selector" id="moderationProvider" name="moderationProvider" data-target-picker="#moderation-model-picker" data-target-input="#moderationModel">
										<option value="ollama">Ollama (Local / Free)</option>
										<option value="gemini">Google Gemini</option>
										<option value="openai">OpenAI</option>
										<option value="anthropic">Anthropic Claude</option>
									</select>
								</div>
								<div class="col-md-6">
									<label class="form-label small fw-bold">Model Override</label>
									<div class="input-group">
										<input type="text" class="form-control" id="moderationModel" name="moderationModel" value="{settings.moderationModel}" placeholder="Leave blank for provider default">
										<button class="btn btn-outline-secondary tab-detect-btn" type="button" data-provider-select="#moderationProvider" data-target-input="#moderationModel" data-target-picker="#moderation-model-picker">
											<i class="fa fa-sync-alt"></i> Detect
										</button>
									</div>
									<div class="model-picker-container mt-2 d-none" id="moderation-model-picker"></div>
								</div>
							</div>

							<!-- Sensitivity Slider -->
							<div class="mb-4">
								<div class="d-flex justify-content-between align-items-center mb-1">
									<label class="form-label small fw-bold mb-0">Sensitivity Threshold</label>
									<span class="badge bg-primary fs-6" id="sensitivity-display">{settings.moderationSensitivity}%</span>
								</div>
								<input type="range" class="form-range" min="10" max="95" step="5" id="moderationSensitivity" name="moderationSensitivity" value="{settings.moderationSensitivity}">
								<div class="d-flex justify-content-between text-muted small">
									<span>10% (Permissive)</span>
									<span>50% (Balanced)</span>
									<span>95% (Aggressive Strict)</span>
								</div>
							</div>

							<!-- Action & Exemption Rules -->
							<div class="row g-3 mb-4">
								<div class="col-md-4">
									<label class="form-label small fw-bold">Action on Violation</label>
									<select class="form-select" id="moderationAction" name="moderationAction">
										<option value="queue" {{{ if settings.moderationAction === "queue" }}}selected{{{ end }}}>Send to NodeBB Moderation Queue</option>
										<option value="flag" {{{ if settings.moderationAction === "flag" }}}selected{{{ end }}}>Publish & Create Staff Flag</option>
										<option value="reject" {{{ if settings.moderationAction === "reject" }}}selected{{{ end }}}>Reject Post Immediately</option>
									</select>
								</div>
								<div class="col-md-4">
									<label class="form-label small fw-bold">Bypass Minimum Reputation</label>
									<input type="number" class="form-control" id="moderationMinReputation" name="moderationMinReputation" value="{settings.moderationMinReputation}">
								</div>
								<div class="col-md-4">
									<label class="form-label small fw-bold">Bypass Minimum Posts</label>
									<input type="number" class="form-control" id="moderationMinPosts" name="moderationMinPosts" value="{settings.moderationMinPosts}">
								</div>
							</div>

							<!-- 🧪 INTERACTIVE MODERATION SANDBOX -->
							<div class="sandbox-box p-3 rounded-3 border bg-light mt-3">
								<h6 class="fw-bold mb-2"><i class="fa fa-vial text-info me-2"></i> Interactive Moderation Sandbox</h6>
								<p class="small text-muted mb-2">Simulate real-time AI scanning on sample text without affecting any forum posts:</p>
								<div class="mb-2">
									<textarea class="form-control font-monospace small" id="sandbox-input" rows="3" placeholder="Paste test message or promotional link farming spam here..."></textarea>
								</div>
								<div class="d-flex justify-content-between align-items-center">
									<button type="button" class="btn btn-sm btn-info text-white" id="run-sandbox-btn">
										<i class="fa fa-play me-1"></i> Simulate AI Scan
									</button>
									<div id="sandbox-result" class="small fw-semibold"></div>
								</div>
							</div>
						</div>
					</div>

					<!-- TAB 4: COMMUNITY COPILOT -->
					<div class="tab-pane fade" id="tab-copilot" role="tabpanel">
						<div class="card shadow-sm p-4 border-0 rounded-4 mb-4">
							<div class="d-flex justify-content-between align-items-center mb-3">
								<h5 class="fw-bold mb-0"><i class="fa fa-robot text-success me-2"></i> RAG-Powered First Response Bot</h5>
								<div class="form-check form-switch m-0">
									<input class="form-check-input" type="checkbox" id="copilotEnabled" name="copilotEnabled" {{{ if settings.copilotEnabled }}}checked{{{ end }}}>
									<label class="form-check-label fw-semibold" for="copilotEnabled">Enable Copilot</label>
								</div>
							</div>
							<p class="text-muted small">Automatically analyzes new questions, searches solved forum discussions, and drafts an authoritative first reply.</p>

							<div class="row g-3 mb-4">
								<div class="col-md-3">
									<label class="form-label small fw-bold">Provider</label>
									<select class="form-select provider-selector" id="copilotProvider" name="copilotProvider" data-target-picker="#copilot-model-picker" data-target-input="#copilotModel">
										<option value="gemini">Google Gemini (Recommended)</option>
										<option value="openai">OpenAI</option>
										<option value="anthropic">Anthropic Claude</option>
										<option value="ollama">Ollama (Local)</option>
									</select>
								</div>
								<div class="col-md-3">
									<label class="form-label small fw-bold">Model Override</label>
									<div class="input-group">
										<input type="text" class="form-control" id="copilotModel" name="copilotModel" value="{settings.copilotModel}" placeholder="Leave blank for provider default">
										<button class="btn btn-outline-secondary tab-detect-btn" type="button" data-provider-select="#copilotProvider" data-target-input="#copilotModel" data-target-picker="#copilot-model-picker">
											<i class="fa fa-sync-alt"></i> Detect
										</button>
									</div>
									<div class="model-picker-container mt-2 d-none" id="copilot-model-picker"></div>
								</div>
								<div class="col-md-3">
									<label class="form-label small fw-bold">Bot User UID</label>
									<div class="input-group">
										<input type="number" class="form-control" id="copilotBotUid" name="copilotBotUid" value="{settings.copilotBotUid}">
										<button class="btn btn-outline-secondary" type="button" id="provision-bot-btn" title="Auto-create dedicated Cortex Bot account">
											<i class="fa fa-user-plus"></i> Auto-Create
										</button>
									</div>
								</div>
								<div class="col-md-3">
									<label class="form-label small fw-bold">Reply Delay (Seconds)</label>
									<input type="number" class="form-control" id="copilotDelaySeconds" name="copilotDelaySeconds" value="{settings.copilotDelaySeconds}" min="1" max="120">
								</div>
							</div>

							<!-- Category Whitelist -->
							<div class="mb-4">
								<label class="form-label small fw-bold">Allowed Categories for AI Answers</label>
								<p class="small text-muted mb-2">Check the categories where the bot is permitted to post answers:</p>
								<div class="category-selector-box p-3 rounded-3 border bg-light" style="max-height: 200px; overflow-y: auto;">
									{{{ each categories }}}
									<div class="form-check">
										<input class="form-check-input category-checkbox" type="checkbox" value="{../cid}" id="cat-{../cid}" {{{ if ../selected }}}checked{{{ end }}}>
										<label class="form-check-label small" for="cat-{../cid}">{../name}</label>
									</div>
									{{{ end }}}
								</div>
								<input type="hidden" id="copilotCategories" name="copilotCategories" value="{settings.copilotCategories}">
							</div>

							<div class="mb-3">
								<label class="form-label small fw-bold">Custom Community Prompt Guidelines</label>
								<textarea class="form-control small" id="copilotCustomPrompt" name="copilotCustomPrompt" rows="2" placeholder="e.g. Always emphasize checking our official documentation at docs.example.com">{settings.copilotCustomPrompt}</textarea>
							</div>
						</div>
					</div>

					<!-- TAB 5: THREAD TL;DR SYNTHESIZER -->
					<div class="tab-pane fade" id="tab-summarizer" role="tabpanel">
						<div class="card shadow-sm p-4 border-0 rounded-4 mb-4">
							<div class="d-flex justify-content-between align-items-center mb-3">
								<h5 class="fw-bold mb-0"><i class="fa fa-compress-alt text-info me-2"></i> Long-Thread Discussion Summarizer</h5>
								<div class="form-check form-switch m-0">
									<input class="form-check-input" type="checkbox" id="summarizerEnabled" name="summarizerEnabled" {{{ if settings.summarizerEnabled }}}checked{{{ end }}}>
									<label class="form-check-label fw-semibold" for="summarizerEnabled">Enable Summarizer</label>
								</div>
							</div>
							<p class="text-muted small">Generates a neat, cached consensus card at the head of multi-page discussions, saving members from reading hundreds of posts.</p>

							<div class="row g-3 mb-4">
								<div class="col-md-4">
									<label class="form-label small fw-bold">Provider</label>
									<select class="form-select provider-selector" id="summarizerProvider" name="summarizerProvider" data-target-picker="#summarizer-model-picker" data-target-input="#summarizerModel">
										<option value="anthropic">Anthropic Claude (Recommended)</option>
										<option value="gemini">Google Gemini</option>
										<option value="openai">OpenAI</option>
										<option value="ollama">Ollama</option>
									</select>
								</div>
								<div class="col-md-4">
									<label class="form-label small fw-bold">Model Override</label>
									<div class="input-group">
										<input type="text" class="form-control" id="summarizerModel" name="summarizerModel" value="{settings.summarizerModel}" placeholder="Leave blank for provider default">
										<button class="btn btn-outline-secondary tab-detect-btn" type="button" data-provider-select="#summarizerProvider" data-target-input="#summarizerModel" data-target-picker="#summarizer-model-picker">
											<i class="fa fa-sync-alt"></i> Detect
										</button>
									</div>
									<div class="model-picker-container mt-2 d-none" id="summarizer-model-picker"></div>
								</div>
								<div class="col-md-2">
									<label class="form-label small fw-bold">Min Posts</label>
									<input type="number" class="form-control" id="summarizerMinPosts" name="summarizerMinPosts" value="{settings.summarizerMinPosts}" min="5">
								</div>
								<div class="col-md-2">
									<label class="form-label small fw-bold">Re-summarize Delta</label>
									<input type="number" class="form-control" id="summarizerUpdateInterval" name="summarizerUpdateInterval" value="{settings.summarizerUpdateInterval}" min="5">
								</div>
							</div>

							<!-- Live Preview of Topic Card -->
							<h6 class="fw-bold mb-2">Frontend Appearance Preview</h6>
							<div class="ai-summary-card p-3 rounded-3 border mb-3">
								<div class="d-flex align-items-center justify-content-between mb-2">
									<div class="d-flex align-items-center gap-2">
										<span class="badge bg-primary-subtle text-primary border"><i class="fa fa-brain me-1"></i> Thread TL;DR</span>
										<span class="text-muted small">Consensus reached</span>
									</div>
									<span class="badge bg-light text-secondary border">Updated Just Now</span>
								</div>
								<p class="mb-2 small fw-semibold">The community verified that setting Redis cluster bus ports to 16379 in the firewall resolved quorum formation across all master nodes.</p>
								<ul class="mb-0 small text-muted ps-3">
									<li>Ubuntu 24.04 requires explicit UFW port allow rules for node-to-node cluster bus.</li>
									<li>Single master topology should be avoided for production clusters.</li>
								</ul>
							</div>
						</div>
					</div>

					<!-- TAB 6: AUDIT & LOGS -->
					<div class="tab-pane fade" id="tab-audit" role="tabpanel">
						<div class="card shadow-sm p-4 border-0 rounded-4">
							<div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
								<h5 class="fw-bold mb-0"><i class="fa fa-history text-secondary me-2"></i> Real-Time AI Inference Audit Log</h5>
								<div class="d-flex gap-1" id="log-filter-group">
									<button type="button" class="btn btn-sm btn-primary log-filter-btn" data-filter="all">All ({logs.length})</button>
									<button type="button" class="btn btn-sm btn-outline-secondary log-filter-btn" data-filter="moderation">Moderation</button>
									<button type="button" class="btn btn-sm btn-outline-secondary log-filter-btn" data-filter="copilot">Copilot</button>
									<button type="button" class="btn btn-sm btn-outline-secondary log-filter-btn" data-filter="summarizer">Summarizer</button>
								</div>
							</div>
							<div class="table-responsive">
								<table class="table table-hover align-middle mb-0" id="audit-log-table">
									<thead class="table-light">
										<tr>
											<th>Timestamp</th>
											<th>Type</th>
											<th>Model</th>
											<th>Verdict / Action</th>
											<th>Latency</th>
											<th>Details</th>
										</tr>
									</thead>
									<tbody>
										{{{ each logs }}}
										<tr data-log-type="{../type}">
											<td class="small text-muted">{../timestamp}</td>
											<td><span class="badge bg-secondary-subtle text-secondary border">{../type}</span></td>
											<td class="small font-monospace">{../model}</td>
											<td>
												{{{ if ../isFlagged }}}
												<span class="badge bg-danger">FLAGGED</span>
												{{{ else }}}
												<span class="badge bg-success">CLEAN</span>
												{{{ end }}}
											</td>
											<td class="small">{../latencyMs}ms</td>
											<td class="small text-muted text-truncate" style="max-width: 250px;">{../reason}</td>
										</tr>
										{{{ end }}}
										{{{ if !logs.length }}}
										<tr id="empty-logs-row">
											<td colspan="6" class="text-center text-muted py-4">No recent AI inferences logged yet.</td>
										</tr>
										{{{ end }}}
									</tbody>
								</table>
							</div>
						</div>
					</div>

				</div>

				<!-- Floating Save Changes Bar -->
				<div class="save-bar card shadow-lg p-3 rounded-4 border-0 d-flex flex-row align-items-center justify-content-between sticky-bottom bg-white">
					<div class="d-flex align-items-center gap-2">
						<i class="fa fa-info-circle text-primary"></i>
						<span class="small text-muted">Remember to test your provider connection before enabling live actions.</span>
					</div>
					<button type="button" class="btn btn-primary px-4 fw-bold rounded-pill" id="save-settings-btn">
						<i class="fa fa-save me-1"></i> Save Changes
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
