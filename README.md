<div align="center">

# 🧠 AgentMind-Bridge

**Lightweight, local-first shared memory bridge for AI coding agents**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/gitstq/AgentMind-Bridge/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](tsconfig.json)

[English](#english) | [简体中文](#简体中文) | [繁體中文](#繁體中文)

</div>

---

<a name="english"></a>
## English

### 🎉 Introduction

AgentMind-Bridge is a **lightweight, open-source alternative** to cloud-based agent memory systems. It provides shared memory capabilities for AI coding agents (Claude Code, Codex, Cursor, etc.) while keeping all data **100% local** — no cloud dependencies, no subscriptions, no data leaks.

Inspired by [Hivemind](https://github.com/activeloopai/hivemind) but designed with a focus on **simplicity, privacy, and zero external dependencies**.

### ✨ Core Features

| Feature | Description |
|---------|-------------|
| 📦 **Pure Local Storage** | SQLite-based storage, all data stays on your machine |
| 🔍 **Hybrid Search** | Combines FTS5 full-text search with keyword matching |
| 🎯 **Skill Mining** | Auto-extracts reusable patterns from session traces |
| 🔌 **Multi-Agent Support** | Hooks for Claude, Codex, Cursor, and generic agents |
| ⚡ **Lightweight** | Zero external services, minimal resource usage |
| 🔒 **Privacy First** | Your data never leaves your machine |

### 🚀 Quick Start

```bash
# Install globally
npm install -g agentmind-bridge

# Or use npx
npx agentmind-bridge --help
```

### 📖 Usage Guide

#### 1. Install Hooks for Your Agent

```bash
# Install hooks for Claude Code
agentmind hooks install claude

# Install hooks for Codex
agentmind hooks install codex

# Install hooks for Cursor
agentmind hooks install cursor

# Check installation status
agentmind hooks status
```

#### 2. Manual Session Management

```bash
# Start a session
agentmind session start --agent claude --session-id my-session

# Capture events
agentmind capture --session-id my-session --type prompt --content "How do I refactor this?"
agentmind capture --session-id my-session --type agent_response --content "You should extract methods..."

# End session
agentmind session end --session-id my-session
```

#### 3. Search Memory

```bash
# Search for relevant traces
agentmind search "error handling" --limit 10

# Search with agent filter
agentmind search "database migration" --agent claude
```

#### 4. Skill Mining

```bash
# Mine skills from all sessions
agentmind skills mine

# Mine from specific session
agentmind skills mine --session my-session

# List all skills
agentmind skills list

# Show skill details
agentmind skills show error-handling
```

#### 5. Build Context

```bash
# Build context for current session
agentmind context --session-id my-session --query "authentication patterns"
```

#### 6. View Statistics

```bash
agentmind stats
```

### 💡 Design Philosophy

- **Local-First**: All data stored in `~/.agentmind/memory.db`
- **Zero Lock-in**: Plain SQLite + markdown, export anytime
- **Agent Agnostic**: Works with any AI agent that supports hooks
- **Privacy by Default**: No network calls, no telemetry

### 📦 Deployment

#### Programmatic API

```typescript
import { AgentMindBridge } from 'agentmind-bridge';

const amb = new AgentMindBridge();

// Start session
const sessionId = amb.sessions.startSession({
  agent: 'claude',
  sessionId: 'my-session'
});

// Capture event
amb.sessions.capture(sessionId, {
  type: 'prompt',
  content: 'How to handle errors?'
});

// Search
const results = amb.search.search('error handling');

// Mine skills
const skills = amb.skills.mineFromSession(sessionId);

amb.close();
```

### 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<a name="简体中文"></a>
## 简体中文

### 🎉 项目介绍

AgentMind-Bridge 是一个**轻量级、本地优先**的 AI Agent 共享记忆系统开源替代方案。它为 Claude Code、Codex、Cursor 等 AI 编程助手提供共享记忆能力，同时确保所有数据**100%本地存储**——无云服务依赖、无订阅费用、无数据泄露风险。

灵感来源于 [Hivemind](https://github.com/activeloopai/hivemind)，但专注于**简洁性、隐私保护和零外部依赖**。

### ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 📦 **纯本地存储** | 基于 SQLite，所有数据保存在本地 |
| 🔍 **混合检索** | 结合 FTS5 全文搜索与关键词匹配 |
| 🎯 **技能挖掘** | 自动从会话记录中提取可复用模式 |
| 🔌 **多 Agent 支持** | 支持 Claude、Codex、Cursor 及通用 Agent |
| ⚡ **轻量级** | 零外部服务，资源占用极低 |
| 🔒 **隐私优先** | 数据永不离开你的机器 |

### 🚀 快速开始

```bash
# 全局安装
npm install -g agentmind-bridge

# 或使用 npx
npx agentmind-bridge --help
```

### 📖 使用指南

#### 1. 为 Agent 安装钩子

```bash
# 为 Claude Code 安装钩子
agentmind hooks install claude

# 为 Codex 安装钩子
agentmind hooks install codex

# 为 Cursor 安装钩子
agentmind hooks install cursor

# 查看安装状态
agentmind hooks status
```

#### 2. 手动会话管理

```bash
# 开始会话
agentmind session start --agent claude --session-id my-session

# 捕获事件
agentmind capture --session-id my-session --type prompt --content "如何重构这段代码？"
agentmind capture --session-id my-session --type agent_response --content "你应该提取方法..."

# 结束会话
agentmind session end --session-id my-session
```

#### 3. 搜索记忆

```bash
# 搜索相关记录
agentmind search "错误处理" --limit 10

# 按 Agent 过滤搜索
agentmind search "数据库迁移" --agent claude
```

#### 4. 技能挖掘

```bash
# 从所有会话挖掘技能
agentmind skills mine

# 从指定会话挖掘
agentmind skills mine --session my-session

# 列出所有技能
agentmind skills list

# 查看技能详情
agentmind skills show error-handling
```

#### 5. 构建上下文

```bash
# 为当前会话构建上下文
agentmind context --session-id my-session --query "认证模式"
```

#### 6. 查看统计

```bash
agentmind stats
```

### 💡 设计思路

- **本地优先**: 所有数据存储在 `~/.agentmind/memory.db`
- **零锁定**: 纯 SQLite + 文本格式，随时可导出
- **Agent 无关**: 兼容任何支持钩子的 AI Agent
- **默认隐私**: 无网络请求，无遥测数据

### 📦 部署指南

#### 程序化 API

```typescript
import { AgentMindBridge } from 'agentmind-bridge';

const amb = new AgentMindBridge();

// 开始会话
const sessionId = amb.sessions.startSession({
  agent: 'claude',
  sessionId: 'my-session'
});

// 捕获事件
amb.sessions.capture(sessionId, {
  type: 'prompt',
  content: '如何处理错误？'
});

// 搜索
const results = amb.search.search('错误处理');

// 挖掘技能
const skills = amb.skills.mineFromSession(sessionId);

amb.close();
```

### 🤝 贡献指南

欢迎贡献！请阅读 [Contributing Guide](CONTRIBUTING.md) 了解详情。

### 📄 开源协议

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

<a name="繁體中文"></a>
## 繁體中文

### 🎉 專案介紹

AgentMind-Bridge 是一個**輕量級、本地優先**的 AI Agent 共享記憶系統開源替代方案。它為 Claude Code、Codex、Cursor 等 AI 編程助手提供共享記憶能力，同時確保所有資料**100%本地儲存**——無雲端服務依賴、無訂閱費用、無資料洩露風險。

靈感來源於 [Hivemind](https://github.com/activeloopai/hivemind)，但專注於**簡潔性、隱私保護和零外部依賴**。

### ✨ 核心特性

| 特性 | 說明 |
|------|------|
| 📦 **純本地儲存** | 基於 SQLite，所有資料保存在本地 |
| 🔍 **混合檢索** | 結合 FTS5 全文搜索與關鍵詞匹配 |
| 🎯 **技能挖掘** | 自動從會話記錄中提取可複用模式 |
| 🔌 **多 Agent 支援** | 支援 Claude、Codex、Cursor 及通用 Agent |
| ⚡ **輕量級** | 零外部服務，資源佔用極低 |
| 🔒 **隱私優先** | 資料永不離開你的機器 |

### 🚀 快速開始

```bash
# 全局安裝
npm install -g agentmind-bridge

# 或使用 npx
npx agentmind-bridge --help
```

### 📖 使用指南

#### 1. 為 Agent 安裝鉤子

```bash
# 為 Claude Code 安裝鉤子
agentmind hooks install claude

# 為 Codex 安裝鉤子
agentmind hooks install codex

# 為 Cursor 安裝鉤子
agentmind hooks install cursor

# 查看安裝狀態
agentmind hooks status
```

#### 2. 手動會話管理

```bash
# 開始會話
agentmind session start --agent claude --session-id my-session

# 捕獲事件
agentmind capture --session-id my-session --type prompt --content "如何重構這段程式碼？"
agentmind capture --session-id my-session --type agent_response --content "你應該提取方法..."

# 結束會話
agentmind session end --session-id my-session
```

#### 3. 搜索記憶

```bash
# 搜索相關記錄
agentmind search "錯誤處理" --limit 10

# 按 Agent 過濾搜索
agentmind search "資料庫遷移" --agent claude
```

#### 4. 技能挖掘

```bash
# 從所有會話挖掘技能
agentmind skills mine

# 從指定會話挖掘
agentmind skills mine --session my-session

# 列出所有技能
agentmind skills list

# 查看技能詳情
agentmind skills show error-handling
```

#### 5. 構建上下文

```bash
# 為當前會話構建上下文
agentmind context --session-id my-session --query "認證模式"
```

#### 6. 查看統計

```bash
agentmind stats
```

### 💡 設計思路

- **本地優先**: 所有資料儲存在 `~/.agentmind/memory.db`
- **零鎖定**: 純 SQLite + 文字格式，隨時可匯出
- **Agent 無關**: 相容任何支援鉤子的 AI Agent
- **預設隱私**: 無網路請求，無遙測資料

### 📦 部署指南

#### 程序化 API

```typescript
import { AgentMindBridge } from 'agentmind-bridge';

const amb = new AgentMindBridge();

// 開始會話
const sessionId = amb.sessions.startSession({
  agent: 'claude',
  sessionId: 'my-session'
});

// 捕獲事件
amb.sessions.capture(sessionId, {
  type: 'prompt',
  content: '如何處理錯誤？'
});

// 搜索
const results = amb.search.search('錯誤處理');

// 挖掘技能
const skills = amb.skills.mineFromSession(sessionId);

amb.close();
```

### 🤝 貢獻指南

歡迎貢獻！請閱讀 [Contributing Guide](CONTRIBUTING.md) 了解詳情。

### 📄 開源協議

MIT 許可證 - 詳見 [LICENSE](LICENSE) 文件。
