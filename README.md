# Cortex: Next-Gen AI Community Engine for NodeBB
`nodebb-plugin-ai-engine`

[![NodeBB v4 Compatible](https://img.shields.io/badge/NodeBB-%5E4.0.0-blue.svg)](https://nodebb.org)
[![License: BSD-2-Clause](https://img.shields.io/badge/License-BSD--2--Clause-green.svg)](LICENSE)

A unified, multi-model AI suite for NodeBB that seamlessly handles real-time moderation triage, automated first-response RAG assistance, and long-thread summarization across self-hosted and cloud LLMs.

---

## 🌟 The 3 Core Pillars

### 1. 🛡️ Smart Moderation & Zero-Day Quarantine
- Evaluates newly submitted posts and topics on `filter:post.save`.
- Detects deceptive promotional link farming, crypto scams, and toxic behavior that regex and keyword filters miss.
- **Cost-Free Local Triage:** Run lightweight models locally with **Ollama** (`llama3.2:3b` or `mistral`) for total user privacy and zero API expense.
- Suspicious posts are automatically quarantined in NodeBB's native **Moderation Queue** with detailed AI audit notes.
- Whitelisting thresholds for user reputation and postcount prevent false positives on trusted members.

### 2. 🤖 Community Copilot (Instant First-Response & RAG)
- Detects new support or troubleshooting questions on `action:topic.post`.
- Semantic search extracts relevant solved forum discussions.
- Posts an authoritative, structured first reply as a dedicated bot account (`@cortex-bot`).
- Configurable artificial reply delay gives the forum a natural conversation cadence.
- Whitelist specific categories (e.g., enable in "Support", disable in "General Discussion").

### 3. 📑 Thread Synthesizer (Long-Thread TL;DR Consensus Card)
- For sprawling discussions (>15 posts), generates an executive summary at the head of the topic.
- Highlights:
  1. **Core Problem / Thesis Debated**
  2. **Key Differing Arguments**
  3. **Community Resolution / Consensus**
- Stored in Redis cache with intelligent invalidation—only updates when new replies arrive.
- Collapsible accordion with one-click copy and moderator re-roll controls.

---

## ⚡ Supported Providers

| Provider | Recommended For | Supported Models |
| :--- | :--- | :--- |
| **Ollama** | 100% Free & Private Moderation | `llama3.2:3b`, `mistral`, `gemma2`, `qwen2.5` |
| **Google Gemini** | Ultra-Fast Sub-Second RAG Copilot | `gemini-1.5-flash`, `gemini-1.5-pro` |
| **Anthropic** | Nuanced Debate Synthesis & Summaries | `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022` |
| **OpenAI** | General Frontier Standard | `gpt-4o`, `gpt-4o-mini`, `o1-mini` |

Admins can mix-and-match models per feature or use 1-click operational presets (*Local Sanctuary*, *Speed & Cost Champion*, *Enterprise Synergy*).

---

## 🚀 Installation

```bash
# In your NodeBB root:
npm install nodebb-plugin-ai-engine
./nodebb build
```

Then navigate to **ACP > Plugins > Cortex AI Engine** to configure your API keys and models.

---

## 🧪 Interactive Testing Sandbox

The plugin includes an in-ACP **Moderation Sandbox** allowing administrators to test sample posts and verify scoring, confidence, and quarantine rules in real-time before enabling live actions on their community.

---

## 📄 License
BSD-2-Clause © 2026 Cortex Team
