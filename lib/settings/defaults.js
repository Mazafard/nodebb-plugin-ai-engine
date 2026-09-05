'use strict';

module.exports = {
	enabled: 'on',
	activePreset: 'balanced',

	// Ollama (Local & Cloud)
	ollamaEnabled: 'on',
	ollamaUseCloud: 'off',
	ollamaUrl: 'http://localhost:11434',
	ollamaCloudUrl: 'https://api.ollama.com',
	ollamaApiKey: '',
	ollamaDefaultModel: 'llama3.2:3b',

	// Gemini
	geminiEnabled: 'off',
	geminiApiKey: '',
	geminiDefaultModel: 'gemini-1.5-flash',

	// Anthropic
	anthropicEnabled: 'off',
	anthropicApiKey: '',
	anthropicDefaultModel: 'claude-3-5-sonnet-20241022',

	// OpenAI
	openaiEnabled: 'off',
	openaiApiKey: '',
	openaiBaseUrl: 'https://api.openai.com/v1',
	openaiDefaultModel: 'gpt-4o-mini',

	// Moderation Guard
	moderationEnabled: 'on',
	moderationProvider: 'ollama',
	moderationModel: 'llama3.2:3b',
	moderationSensitivity: '65',
	moderationAction: 'queue',
	moderationMinReputation: '10',
	moderationMinPosts: '5',

	// Copilot First-Response
	copilotEnabled: 'off',
	copilotProvider: 'gemini',
	copilotModel: 'gemini-1.5-flash',
	copilotBotUid: '0',
	copilotBotName: 'Cortex AI',
	copilotCategories: '',
	copilotDelaySeconds: '10',
	copilotMaxRepliesPerTopic: '1',
	copilotCustomPrompt: '',

	// Thread Summarizer
	summarizerEnabled: 'off',
	summarizerProvider: 'anthropic',
	summarizerModel: 'claude-3-5-sonnet-20241022',
	summarizerMinPosts: '15',
	summarizerUpdateInterval: '15',
	summarizerDefaultOpen: 'off',
};
