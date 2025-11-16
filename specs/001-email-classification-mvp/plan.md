# Implementation Plan: Email Classification MVP

**Branch**: `001-email-classification-mvp` | **Date**: 2025-11-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-email-classification-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an MVP email intelligence system using n8n workflows that automatically classifies incoming emails into 6 categories (KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER) with urgency levels and action types, organizes Gmail inbox via labels and archiving, sends Telegram notifications for high-priority items, and supports manual correction via Supabase. The system will use n8n's native AI Agent with OpenAI Chat Model for classification, Supabase Vector Store for memory and learning, Gmail nodes for email operations, and Telegram nodes for notifications. All workflows must follow the n8n-native architecture pattern from the Swim Dad Assistant reference implementation.

## Technical Context

**Platform/Version**: n8n (workflow automation platform) - latest stable version
**Primary Dependencies**:
- n8n native nodes: AI Agent, OpenAI Chat Model, Embeddings OpenAI, Supabase Vector Store, Gmail Trigger, Gmail (Get/Modify Message), Telegram, Structured Output Parser, Default Data Loader
- External services: OpenAI API (GPT-4), Supabase (PostgreSQL + pgvector), Gmail API, Telegram Bot API
- Code nodes: JavaScript only for data transformation (minimal usage per constitution)

**Storage**: Supabase (PostgreSQL with pgvector extension) for email data, classifications, actions, notifications, and correction logs
**Testing**:
- n8n workflow testing via manual execution with test emails
- Classification accuracy validation against 100-email test set
- Integration testing for Gmail, Telegram, Supabase connections
- Error scenario testing (API failures, rate limits, malformed emails)

**Target Platform**: n8n cloud or self-hosted n8n instance (Docker-based deployment)

**Project Type**: Workflow-based automation (n8n visual workflows, no traditional codebase structure)

**Performance Goals**:
- <10 seconds per email processing time (classification + storage + actions)
- <2 minutes notification delivery for high-priority emails (95% of time)
- 500 emails/day throughput without degradation
- 80%+ classification accuracy measured against manual review

**Constraints**:
- MUST use n8n native nodes (no custom Python/Execute Command nodes except as last resort)
- Maximum 50 nodes per workflow (constitution limit)
- Maximum 3 parallel branches per workflow (constitution limit)
- Maximum 6 classification categories (constitution limit)
- Maximum 5 AI Agent tools per workflow (constitution limit)
- Vector embeddings: 1536 dimensions (OpenAI Ada-002 standard)
- Gmail API quota: sufficient for 500 emails/day
- Telegram Bot API rate limits must be respected

**Scale/Scope**:
- Single user personal email account (MVP)
- 500 emails/day processing capacity
- Indefinite data retention (multi-year email archives)
- 5 n8n workflows: Email Processing (main), Classification, Organization, Notification, Correction Logging

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value with clear acceptance criteria
  - 5 user stories with clear priorities and independent tests
  - 9 measurable success criteria (80% accuracy, 2min delivery, 60% clutter reduction, etc.)
  - 25 functional requirements with testable outcomes

- [x] **Test-Driven Development**: Test strategy defined with test-first approach planned
  - Testing approach: Manual n8n workflow execution with test emails
  - Classification accuracy validation against 100-email labeled test set
  - Integration testing for all external APIs (Gmail, Telegram, Supabase)
  - Error scenario testing defined in edge cases section

- [x] **n8n-Native Architecture**: Components use native n8n nodes per Principle 3
  - AI Agent + OpenAI Chat Model for classification (native)
  - Supabase Vector Store for memory and similarity search (native)
  - Gmail Trigger and Gmail nodes for email operations (native)
  - Telegram node for notifications (native)
  - Embeddings OpenAI for vector generation (native)
  - Structured Output Parser for JSON parsing (native)
  - Code nodes (JavaScript) only for data transformation (minimal)
  - **No Execute Command or Python nodes required**
  - Follows Swim Dad Assistant reference pattern

- [x] **Progressive Enhancement**: MVP defined with incremental delivery path
  - Priority P1: Classification (foundation, can test independently)
  - Priority P2: Organization (builds on P1, delivers inbox cleanup)
  - Priority P3: Notifications (adds alert value)
  - Priority P4: Manual Correction (enables learning)
  - Priority P5: Audit Logging (observability)
  - Each priority deliverable and testable independently

- [x] **Observable Systems**: Logging and monitoring strategy defined
  - 100% audit trail coverage (FR-015, FR-016, FR-018, FR-024)
  - n8n built-in execution history for workflow debugging
  - Supabase logs for all classification decisions, actions, errors, corrections
  - Notification delivery status tracking
  - Classification accuracy tracking via correction logs

- [x] **Security by Design**: Security considerations identified and addressed
  - n8n credential vault for API keys (OpenAI, Gmail, Telegram, Supabase)
  - Supabase RLS (Row Level Security) for data access control
  - Email content encrypted at rest in Supabase
  - OAuth2 for Gmail API authentication
  - Data retention policy defined (indefinite with privacy compliance assumption)

- [x] **Documentation as Code**: Documentation plan included in implementation
  - Implementation plan (this document)
  - Research findings (research.md - Phase 0)
  - Data model documentation (data-model.md - Phase 1)
  - Quickstart guide (quickstart.md - Phase 1)
  - n8n workflow visual diagrams serve as executable documentation
  - All documentation versioned in Git

- [x] **Memory-Driven Learning**: Leverage Supabase Vector Store per Principle 8
  - Supabase Vector Store in insert mode for storing email embeddings
  - Supabase Vector Store in retrieve-as-tool mode for similarity search
  - Vector Store connected to AI Agent as tool for context retrieval
  - Embeddings OpenAI for 1536-dimension vectors
  - Correction logs support future model improvement

**GATE STATUS**: ✅ PASSED - All constitutional principles satisfied with n8n-native approach

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### n8n Workflows (not traditional source code)

**IMPORTANT**: This is an n8n workflow-based system. There is no traditional source code structure with src/ directories. The implementation consists of visual workflows in n8n.

```text
n8n Workflows:
├── Email-Processing-Main                    # Main orchestration workflow
│   ├── Gmail Trigger (poll every 5 min)
│   ├── Get Message (Gmail)
│   └── Execute Workflow: Classification
│
├── Classification-Workflow                   # AI classification workflow
│   ├── AI Agent
│   │   ├── Connected: OpenAI Chat Model (GPT-4)
│   │   └── Tool: Supabase Vector Store (retrieve)
│   ├── Embeddings OpenAI
│   ├── Structured Output Parser
│   ├── Default Data Loader
│   ├── Supabase Vector Store (insert)
│   └── Code Node (format classification JSON)
│
├── Organization-Workflow                     # Gmail organization workflow
│   ├── Gmail: Add Labels
│   ├── Gmail: Mark Read (conditional)
│   ├── Gmail: Archive (conditional)
│   └── Supabase: Log Actions
│
├── Notification-Workflow                     # Telegram notification workflow
│   ├── Code Node (check quiet hours)
│   ├── Telegram: Send Message (conditional)
│   └── Supabase: Log Notification
│
└── Correction-Logging-Workflow              # Supabase trigger for corrections
    └── Supabase Database Trigger (on UPDATE)
        └── Supabase: Insert Correction Log
```

**Supabase Database Structure**:
```sql
-- Tables defined in data-model.md (Phase 1 output)
emails
classifications
email_actions
notifications
correction_logs
```

**Documentation Structure** (Git repository):
```text
specs/001-email-classification-mvp/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (SQL schema)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (n8n workflow JSON exports)
│   ├── email-processing-main.json
│   ├── classification-workflow.json
│   ├── organization-workflow.json
│   ├── notification-workflow.json
│   └── correction-logging-workflow.json
└── checklists/
    └── requirements.md  # Specification validation
```

**Testing Structure**:
```text
test-data/               # Test email samples
├── test-emails-100.json             # Labeled test set (100 emails)
├── classification-ground-truth.json # Expected classifications
└── edge-case-emails.json           # Edge case test scenarios
```

**Structure Decision**: n8n workflow-based architecture with no traditional codebase. All logic implemented as visual workflows using native n8n nodes. Documentation and workflow exports stored in Git for version control. Supabase handles data persistence.

## n8n MCP Workflow Generation Strategy

**IMPORTANT**: This implementation uses n8n MCP (Model Context Protocol) tools for **programmatic workflow generation** instead of manual UI creation. This aligns with the "Documentation as Code" and automation-first principles.

### Available n8n MCP Tools

This environment provides comprehensive n8n MCP tools for workflow automation:

**Discovery & Research**:
- `mcp__n8n-mcp__list_nodes` - Discover available n8n nodes (525+ nodes, 263 AI tools)
- `mcp__n8n-mcp__search_nodes` - Find nodes by keyword with real-world examples
- `mcp__n8n-mcp__get_node_info` - Get full node documentation and schemas
- `mcp__n8n-mcp__get_node_essentials` - Get node configuration with template examples
- `mcp__n8n-mcp__get_node_documentation` - Get readable docs with auth/patterns

**Workflow Creation & Management**:
- `mcp__n8n-mcp__n8n_create_workflow` - Create workflows programmatically from JSON
- `mcp__n8n-mcp__n8n_get_workflow` - Retrieve existing workflow definitions
- `mcp__n8n-mcp__n8n_update_full_workflow` - Update complete workflow
- `mcp__n8n-mcp__n8n_update_partial_workflow` - Incremental workflow updates
- `mcp__n8n-mcp__n8n_list_workflows` - List all workflows in n8n instance

**Validation & Testing**:
- `mcp__n8n-mcp__validate_workflow` - Validate workflow structure, connections, expressions
- `mcp__n8n-mcp__validate_node_operation` - Validate individual node configurations
- `mcp__n8n-mcp__n8n_autofix_workflow` - Automatically fix common validation errors

**Templates & Examples**:
- `mcp__n8n-mcp__list_templates` - Browse 2000+ community workflow templates
- `mcp__n8n-mcp__search_templates` - Find templates by keyword
- `mcp__n8n-mcp__get_template` - Get complete workflow JSON from templates

### Implementation Workflow (MCP-First Approach)

#### Step 1: Node Discovery & Validation

Before creating workflows, use MCP tools to discover and validate required nodes:

```javascript
// 1. Search for Gmail nodes
mcp__n8n-mcp__search_nodes({ query: "gmail", includeExamples: true })

// 2. Get AI Agent node documentation
mcp__n8n-mcp__get_node_documentation({ nodeType: "nodes-langchain.agent" })

// 3. Get Supabase Vector Store essentials with examples
mcp__n8n-mcp__get_node_essentials({
  nodeType: "nodes-langchain.vectorStoreSupabase",
  includeExamples: true
})

// 4. Validate OpenAI Chat Model configuration
mcp__n8n-mcp__validate_node_operation({
  nodeType: "nodes-langchain.lmChatOpenAi",
  config: { temperature: 0.4, maxTokens: 500 }
})
```

#### Step 2: Programmatic Workflow Creation

Create workflows using `n8n_create_workflow` with complete node definitions:

```javascript
// Example: Create Classification Workflow
mcp__n8n-mcp__n8n_create_workflow({
  name: "Classification-Workflow",
  nodes: [
    {
      id: "start",
      name: "Start",
      type: "n8n-nodes-base.start",
      typeVersion: 1,
      position: [250, 300],
      parameters: {}
    },
    {
      id: "extract-text",
      name: "Extract Text",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [450, 300],
      parameters: {
        language: "javaScript",
        jsCode: "// Extract subject + first 500 words\nconst email = $input.first().json;\nconst subject = email.subject || '';\nconst body = email.body || '';\nconst preview = body.slice(0, 2500);\nreturn { subject, body_preview: preview };"
      }
    },
    {
      id: "ai-agent",
      name: "AI Classification Agent",
      type: "@n8n/n8n-nodes-langchain.agent",
      typeVersion: 1.7,
      position: [650, 300],
      parameters: {
        agent: "conversationalAgent",
        systemMessage: "You are an email classification assistant...",
        // Full prompt from research.md
      },
      credentials: {
        openAiApi: { id: "openai-credential-id", name: "OpenAI - GPT-4" }
      }
    }
    // ... additional nodes
  ],
  connections: {
    "start": { main: [[{ node: "extract-text", type: "main", index: 0 }]] },
    "extract-text": { main: [[{ node: "ai-agent", type: "main", index: 0 }]] }
    // ... additional connections
  },
  settings: {
    executionOrder: "v1",
    saveExecutionProgress: true
  }
})
```

#### Step 3: Validation & Auto-Fix

Validate created workflows before activation:

```javascript
// Validate complete workflow
mcp__n8n-mcp__n8n_validate_workflow({
  id: "workflow-id-from-creation",
  options: {
    validateNodes: true,
    validateConnections: true,
    validateExpressions: true
  }
})

// Auto-fix common issues
mcp__n8n-mcp__n8n_autofix_workflow({
  id: "workflow-id-from-creation",
  applyFixes: true,
  confidenceThreshold: "medium"
})
```

#### Step 4: Template-Based Acceleration

Leverage existing templates for common patterns:

```javascript
// Search for similar workflows
mcp__n8n-mcp__search_templates({ query: "gmail classification" })

// Get template for reference
mcp__n8n-mcp__get_template({
  templateId: 1234,
  mode: "structure"  // nodes + connections only
})
```

### Implementation Phase Integration

**Phase 0 (Current)**: Research complete, node requirements identified

**Phase 1 (Current)**: Data model and contracts defined

**Phase 2 (Next - `/speckit.tasks`)**: Generate tasks including:
- Task: "Use MCP to discover and validate all required n8n nodes"
- Task: "Generate Classification-Workflow JSON using MCP create_workflow"
- Task: "Generate Organization-Workflow JSON using MCP create_workflow"
- Task: "Generate Notification-Workflow JSON using MCP create_workflow"
- Task: "Generate Email-Processing-Main JSON using MCP create_workflow"
- Task: "Validate all workflows using MCP validate_workflow"
- Task: "Test workflows with sample emails and verify execution"

**Phase 3 (Implementation - `/speckit.implement`)**: Execute MCP-based workflow creation
- Use MCP tools to programmatically create all 5 workflows
- Validate configurations automatically
- Export workflow JSON to contracts/ for version control
- Test end-to-end with labeled email dataset

### Benefits of MCP-First Approach

1. **Automation**: Workflows created programmatically from specifications
2. **Version Control**: Workflow JSON definitions tracked in Git
3. **Validation**: Automatic validation before deployment
4. **Reproducibility**: Same workflows can be recreated across environments
5. **Testing**: Workflows can be tested programmatically
6. **Documentation as Code**: Workflow definitions ARE the implementation
7. **CI/CD Ready**: Can be integrated into automated deployment pipelines

### Fallback: Manual UI Creation

Manual workflow creation via n8n UI remains available as fallback (see quickstart.md Section 3) for:
- Environments without n8n MCP access
- Exploratory workflow prototyping
- Visual debugging and inspection

**Primary approach**: Use n8n MCP tools for all workflow creation and management.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations**: All constitution principles satisfied. n8n-native architecture with no custom code nodes or complexity limit violations.
