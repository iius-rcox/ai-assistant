# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Email Intelligence Workflow System** built with **n8n** workflows. The system provides AI-powered email classification, automated organization, intelligent notifications, and progressive automation for personal email management.

**Core Stack:**
- **Orchestration**: n8n (native AI/LangChain nodes)
- **AI Processing**: OpenAI (via native n8n nodes: AI Agent, OpenAI Chat Model, Embeddings OpenAI)
- **Memory/Storage**: Supabase (using native Supabase Vector Store node)
- **Email/Calendar**: Google Workspace APIs (native Gmail/Calendar nodes)
- **Notifications**: Telegram Bot API (native Telegram node)
- **Development Methodology**: GitHub Spec-Kit

## Development Commands

This project uses **Spec-Kit slash commands** for structured feature development. All commands are prefixed with `/speckit.`:

### Core Workflow Commands

```bash
# Create or update feature specification from description
/speckit.specify

# Execute implementation planning workflow (creates research.md, data-model.md, quickstart.md, contracts/)
/speckit.plan

# Generate actionable, dependency-ordered tasks.md
/speckit.tasks

# Execute implementation plan by processing tasks.md
/speckit.implement

# Identify underspecified areas and encode answers into spec
/speckit.clarify

# Cross-artifact consistency analysis
/speckit.analyze

# Generate custom checklist for current feature
/speckit.checklist

# Convert tasks to GitHub issues
/speckit.taskstoissues

# Create or update project constitution
/speckit.constitution
```

### Feature Development Workflow

1. **Create specification**: `/speckit.specify "description of feature"`
2. **Plan implementation**: `/speckit.plan` (generates research, data model, contracts)
3. **Generate tasks**: `/speckit.tasks` (creates dependency-ordered tasks)
4. **Execute implementation**: `/speckit.implement`
5. **Analyze consistency**: `/speckit.analyze` (validate cross-artifact alignment)

## Architecture Principles

This project follows a **strict n8n-native architecture** defined in `.specify/memory/constitution.md`. Key principles:

### 1. n8n-Native First (CRITICAL)

**Always use native n8n nodes over custom code.** Follow this decision tree:

1. Can it be done with native n8n nodes? → **Use native nodes (REQUIRED)**
2. Requires data transformation? → Use Code node (JavaScript)
3. Requires complex computation? → Use AI Agent with tools
4. Native node exists but is limited? → Submit feature request to n8n, use workaround
5. No native alternative exists? → Document justification, use Execute Command as last resort

### 2. Reference Architecture Pattern

The **Swim Dad Assistant workflow** (n8n workflow ID: ykCnP0wqdrlmgtzq) demonstrates the required pattern:

```
Gmail Trigger
  ↓
Get a message (Gmail node)
  ↓
AI Agent (with OpenAI Chat Model)
  ├── Supabase Vector Store (retrieve-as-tool mode) ← similarity search
  └── Embeddings OpenAI ← shared embedding generation
  ↓
Structured Output Parser
  ↓
Supabase Vector Store (insert mode) ← store classified emails
```

**Key patterns:**
- AI Agent uses Vector Store as a tool for context retrieval
- Embeddings node shared between insert and retrieve operations
- Structured Output Parser ensures reliable JSON responses
- No custom Python code - all native n8n nodes

### 3. Code Node Usage Policy

**Code nodes (JavaScript)** are permitted for:
- Data formatting and transformation
- Complex conditional logic
- Parsing structured data
- Combining results from multiple nodes

**Execute Command nodes (Python/shell)** are permitted ONLY for:
- System integrations with no native node
- Documented cases where native nodes are insufficient
- Temporary solutions with migration plan to native nodes

**Each use MUST be justified in the implementation plan's Complexity Tracking section.**

### 4. Complexity Limits

- Maximum 50 nodes per workflow (split into sub-workflows after)
- Maximum 3 parallel workflow branches per n8n flow
- Maximum 6 classification categories
- Maximum 10 seconds processing time per email
- Vector embeddings: 1536 dimensions (OpenAI Ada-002)
- AI Agent tools: maximum 5 per workflow

## Project Structure

```
.
├── PRD.md                          # Product Requirements Document (3-phase roadmap)
├── .env.template                   # Environment configuration template
├── .specify/                       # Spec-Kit framework files
│   ├── memory/
│   │   └── constitution.md         # Project constitution (MUST READ)
│   ├── templates/                  # Spec-Kit templates
│   │   ├── spec-template.md
│   │   ├── plan-template.md
│   │   ├── tasks-template.md
│   │   └── checklist-template.md
│   └── scripts/bash/               # Spec-Kit bash utilities
├── .claude/commands/               # Slash command definitions
│   ├── speckit.specify.md
│   ├── speckit.plan.md
│   ├── speckit.tasks.md
│   ├── speckit.implement.md
│   ├── speckit.analyze.md
│   ├── speckit.clarify.md
│   ├── speckit.checklist.md
│   ├── speckit.taskstoissues.md
│   └── speckit.constitution.md
└── specs/                          # Feature specifications (created per feature)
    └── [###-feature-name]/
        ├── spec.md                 # Feature specification
        ├── plan.md                 # Implementation plan
        ├── tasks.md                # Dependency-ordered tasks
        ├── research.md             # Phase 0 research output
        ├── data-model.md           # Phase 1 data model
        ├── quickstart.md           # Phase 1 quickstart guide
        └── contracts/              # Phase 1 API/interface contracts
```

## Environment Configuration

Copy `.env.template` to `.env` and configure:

**n8n Configuration:**
- `N8N_HOST`, `N8N_PROTOCOL`, `N8N_WEBHOOK_URL`
- `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`
- `N8N_ENCRYPTION_KEY`

**Supabase Configuration:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`

**Telegram Configuration:**
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`

**Google Configuration:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`

**OpenAI Configuration:**
- `OPENAI_API_KEY`, `OPENAI_MODEL` (default: gpt-4-turbo-preview)

**Application Settings:**
- `TZ` (timezone), `EMAIL_POLL_INTERVAL`, `CONFIDENCE_THRESHOLD`, `MAX_EMAILS_PER_DAY`

## Constitution Compliance

Before implementing any feature, verify compliance with `.specify/memory/constitution.md`:

**Required Checks:**
1. n8n-native nodes used wherever available
2. Custom code justified and documented
3. Reference architecture patterns followed
4. Complexity limits respected
5. All principles satisfied or exceptions documented

**Core Principles:**
- User-First Design (measurable value + acceptance criteria)
- Test-Driven Development (test strategy defined)
- n8n-Native Architecture (use native nodes first)
- Progressive Enhancement (MVP + incremental delivery)
- Observable Systems (logging + monitoring)
- Security by Design (credentials vault, encryption)
- Documentation as Code (versioned documentation)
- Memory-Driven Learning (vector store for continuous improvement)

## MVP Scope (Phase 1)

**Email Classification:**
- Categories: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
- Urgency: HIGH, MEDIUM, LOW
- Action type: FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE

**Automated Organization:**
- Apply Gmail labels
- Mark FYI as read
- Archive low-value emails
- Keep action-required emails unread

**High-Priority Notifications:**
- Alerts for HIGH urgency or PAYMENT/CALENDAR/RESPOND
- Channels: SMS, Telegram
- Quiet hours support

**Data Schema (MVP):**
- `emails` table
- `email_actions` table
- `notification_log` table

## Success Metrics

The system's effectiveness is measured by:
- 80%+ email classification accuracy
- <2 minute urgent alert delivery time
- Zero missed time-sensitive events
- 90% automatic handling of actionable emails
- Decreasing correction rate over time
- >90% native n8n nodes vs custom code ratio

## Important Notes

- **Always read `.specify/memory/constitution.md`** before implementing features
- **Use native n8n MCP tools** available in this environment for node discovery and workflow operations
- **Follow the Swim Dad Assistant pattern** for all AI-powered workflows
- **Document all Constitution violations** in the Complexity Tracking section of implementation plans
- **Progressive enhancement**: Every feature must define an MVP with incremental delivery path
- **Test-driven**: Define test strategy before implementation

## Active Technologies
- Supabase (PostgreSQL with pgvector extension) for email data, classifications, actions, notifications, and correction logs (001-email-classification-mvp)
- n8n workflows (4 production workflows) at https://n8n.coxserver.com
- OpenAI GPT-4-mini for AI classification
- Telegram notifications via cox_concierge_bot
- JavaScript (n8n Code nodes only for data transformation) (002-calendar-management)
- Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt) with pgvector extension (002-calendar-management)
- TypeScript 5.6+ with Vue 3.4+ (ES2022 target) + Vue 3, Vite 5.4, Supabase JS 2.45, ApexCharts 3.54, Pinia 2.2 (003-correction-ui)
- Supabase PostgreSQL (existing database project: xmziovusqlmgygcrgyqt) (003-correction-ui)

## Production Systems

### Email Classification MVP (001-email-classification-mvp)
**Status**: ✅ LIVE and operational since 2025-11-16

**Workflows** (all created via n8n MCP):
- Classification-Workflow (MVkAVroogGQA6ePC) - AI-powered email classification with 95-99% accuracy
- Organization-Workflow (00U9iowWuwQofzlQ) - Gmail label application and organization
- Notification-Workflow (VADceJJa6WJuwCKG) - Telegram alerts for high-priority emails
- Email-Processing-Main (W42UBwlIGyfZx1M2) - ACTIVE orchestration with Gmail Trigger

**Performance**:
- Classification accuracy: 100% (4/4 test emails correct)
- Processing time: 2-6 seconds (5x faster than target)
- Telegram notifications: Working (message delivered in <1 minute)
- Gmail operations: Label application and mark-as-read working

**Database**: Supabase project xmziovusqlmgygcrgyqt with 47 emails, 33 classifications

## Recent Changes
- 003-correction-ui: Added TypeScript 5.6+ with Vue 3.4+ (ES2022 target) + Vue 3, Vite 5.4, Supabase JS 2.45, ApexCharts 3.54, Pinia 2.2
- 002-calendar-management: Added JavaScript (n8n Code nodes only for data transformation)
- 001-email-classification-mvp: MVP COMPLETE - AI classification, organization, and notifications all operational in production
