'use strict';

const CentralModelFactory = require('./factory');
const {
	FeatureEngineFactory,
	ModerationEngineFactory,
	CopilotEngineFactory,
	SummarizerEngineFactory,
	AIEngineAbstractFactory,
} = require('./abstract-factory');
const facade = require('./facade');
const eventBus = require('./events/event-bus');
const InferenceRequestBuilder = require('./builders/request-builder');
const BaseProvider = require('./base-provider');

// Decorators
const RetryDecorator = require('./decorators/retry-decorator');
const TelemetryDecorator = require('./decorators/telemetry-decorator');

// Proxy
const CachedProviderProxy = require('./proxy/cache-proxy');

// Pipeline Handlers
const PipelineHandler = require('./pipeline/handler');
const ExemptionHandler = require('./pipeline/exemption');
const SanitizerHandler = require('./pipeline/sanitizer');
const RateLimiterHandler = require('./pipeline/rate-limiter');

// Commands
const BaseAICommand = require('./commands/base-command');
const ModeratePostCommand = require('./commands/moderate-command');
const CopilotReplyCommand = require('./commands/copilot-command');
const SummarizeThreadCommand = require('./commands/summarize-command');

module.exports = {
	// Facade
	facade,
	CortexAIFacade: facade,

	// Factory & Singleton
	CentralModelFactory,

	// Abstract Factory
	AIEngineAbstractFactory,
	FeatureEngineFactory,
	ModerationEngineFactory,
	CopilotEngineFactory,
	SummarizerEngineFactory,

	// Builder
	InferenceRequestBuilder,

	// Provider & Template Method
	BaseProvider,

	// Decorators
	RetryDecorator,
	TelemetryDecorator,

	// Proxy
	CachedProviderProxy,

	// Pipeline
	PipelineHandler,
	ExemptionHandler,
	SanitizerHandler,
	RateLimiterHandler,

	// Commands
	BaseAICommand,
	ModeratePostCommand,
	CopilotReplyCommand,
	SummarizeThreadCommand,

	// Observer
	eventBus,
};
