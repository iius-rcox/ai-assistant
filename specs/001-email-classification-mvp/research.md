# Phase 0: Technical Research - Email Classification MVP

**Date**: 2025-11-15
**Feature**: 001-email-classification-mvp
**Purpose**: Document technical research, best practices, and architectural decisions for n8n-based email intelligence system

## Research Areas

### 1. n8n AI Agent Configuration for Email Classification

**Decision**: Use AI Agent node with OpenAI Chat Model (GPT-4) and Supabase Vector Store as tool

**Rationale**:
- AI Agent provides native LangChain integration with n8n's visual workflow builder
- GPT-4 offers superior classification accuracy vs GPT-3.5 for nuanced email content
- Structured Output Parser ensures reliable JSON responses (critical for automated workflows)
- Vector Store as tool enables similarity-based context retrieval for improved accuracy

**Best Practices Identified**:
- **System Prompt Design**: Use explicit category definitions, few-shot examples, and JSON schema in system prompt
- **Temperature Setting**: 0.3-0.5 for classification (balance between consistency and nuance detection)
- **Max Tokens**: 500 tokens sufficient for classification output (category, urgency, action, confidence, extractions)
- **Tool Configuration**: Vector Store in retrieve-as-tool mode with similarity threshold 0.7
- **Error Handling**: Enable retry on failure (3 attempts) with exponential backoff in AI Agent settings

**Prompt Engineering Pattern**:
```
System: You are an email classification assistant. Classify emails into categories...
[Category definitions with examples]
Output JSON schema: {category, urgency, action, confidence, extracted_names, extracted_dates, extracted_amounts}

User: Email content here...
```

**Alternatives Considered**:
- GPT-3.5: Lower cost but ~15% accuracy reduction on email classification benchmarks
- Claude/Anthropic: No native n8n node (violates constitution), would require HTTP Request node
- Fine-tuned model: Deferred to Phase 3, requires significant labeled dataset

**Reference**: Swim Dad Assistant workflow (ID: ykCnP0wqdrlmgtzq) demonstrates AI Agent + Vector Store pattern

---

### 2. Supabase Vector Store Setup with pgvector

**Decision**: Use Supabase PostgreSQL with pgvector extension for email storage and vector similarity search

**Rationale**:
- Native n8n Supabase Vector Store node available (constitution requirement)
- pgvector provides efficient similarity search for 1536-dimension OpenAI embeddings
- Integrated PostgreSQL database for relational data (classifications, actions, logs)
- Supabase RLS (Row Level Security) for access control
- Built-in REST API for manual corrections via Supabase dashboard

**Configuration Requirements**:
- Enable pgvector extension: `CREATE EXTENSION vector;`
- Vector column type: `vector(1536)` for OpenAI Ada-002 embeddings
- Index type: `ivfflat` for similarity search (good balance for <1M vectors)
- Distance metric: Cosine similarity (industry standard for semantic search)

**Table Design Pattern**:
```sql
-- Email embeddings table
CREATE TABLE email_embeddings (
  id BIGSERIAL PRIMARY KEY,
  email_id TEXT UNIQUE NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON email_embeddings USING ivfflat (embedding vector_cosine_ops);
```

**n8n Node Configuration**:
- **Insert Mode**: Store email embeddings after classification
- **Retrieve Mode**: Query similar emails as AI Agent tool (top 5 results, similarity > 0.7)
- **Metadata**: Include category, urgency, sender for contextual filtering

**Best Practices**:
- Batch insert embeddings (10-50 at a time) to avoid API rate limits
- Use connection pooling for high-volume operations
- Monitor vector index size (rebuild if >1M vectors or query performance degrades)

**Alternatives Considered**:
- Pinecone: Requires separate service, no native n8n integration, higher cost
- Weaviate: Similar to Pinecone, additional infrastructure complexity
- In-memory vectors: Not suitable for indefinite retention requirement

---

### 3. Gmail API Integration Patterns

**Decision**: Use native n8n Gmail Trigger and Gmail nodes for email operations

**Rationale**:
- Gmail Trigger provides reliable polling (1-60 min intervals)
- Native OAuth2 handling via n8n credentials
- Built-in rate limit management
- Supports all required operations: get message, modify labels, mark read, archive

**Gmail API Quota Limits**:
- 1 billion quota units per day (default)
- Read operations: 5 units per request
- Modify operations: 50 units per request
- 500 emails/day = ~25,000 units (well within limits)

**Polling Strategy**:
- Trigger interval: 5 minutes (balance between responsiveness and API calls)
- Filter: Only unread messages in INBOX (reduces processing overhead)
- Batch size: Process up to 10 emails per trigger execution

**Label Management**:
- Pre-create labels: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
- Use label IDs (not names) in workflows for reliability
- Gmail API auto-creates labels if they don't exist (feature, not bug)

**Error Handling Patterns**:
- Rate limit (429): Exponential backoff with 3 retries (n8n native)
- Network errors (5xx): Retry with backoff
- Invalid message ID (404): Log error, continue processing (don't block workflow)
- Malformed email: Classify as OTHER with low confidence flag

**Best Practices**:
- Use batch requests for label operations (reduce API calls by 80%)
- Cache label IDs to avoid repeated list label API calls
- Implement duplicate detection via message_id before processing

**Alternatives Considered**:
- Gmail Push Notifications (Cloud Pub/Sub): Requires additional infrastructure, overkill for MVP
- IMAP protocol: No native n8n node, would violate constitution

---

### 4. Telegram Bot API Setup

**Decision**: Use native n8n Telegram node for high-priority notifications

**Rationale**:
- Native Telegram node with built-in retry logic
- Simple bot creation via BotFather (5-minute setup)
- Rich formatting support (markdown, HTML)
- No SMS costs vs Twilio/similar

**Bot Setup Steps**:
1. Create bot via BotFather: `/newbot` command
2. Obtain bot token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
3. Get chat ID: Send message to bot, call getUpdates API
4. Store credentials in n8n vault

**Message Formatting**:
```
🔴 HIGH URGENCY EMAIL

From: sender@example.com
Subject: Email subject here

Action Required: RESPOND
Category: WORK

[View in Gmail](gmail_link)
```

**Rate Limits**:
- 30 messages per second to same chat
- 500 messages per hour (MVP: max ~50/day, well within limits)

**Quiet Hours Implementation**:
- Code node checks current time against quiet hours window (10pm-7am)
- Queue notifications in Supabase `pending_notifications` table
- Scheduled trigger sends queued notifications at 7am

**Error Handling**:
- Bot blocked by user: Log error, disable notifications for that user
- Network failure: Retry 3 times, fallback to email notification
- Invalid chat ID: Alert operator, requires reconfiguration

**Alternatives Considered**:
- SMS via Twilio: High cost (~$0.01/message), less feature-rich
- Email notifications: Defeats purpose (already in email), low urgency perception
- Slack: Requires workspace, higher complexity, not in constitution

---

### 5. OpenAI Embeddings for Vector Search

**Decision**: Use Embeddings OpenAI node with text-embedding-ada-002 model

**Rationale**:
- 1536 dimensions (industry standard, good semantic representation)
- Low cost ($0.0001 per 1K tokens)
- Fast inference (<100ms per email)
- Proven accuracy for email similarity matching

**Embedding Strategy**:
- Input: Email subject + first 500 words of body (truncate long emails)
- Preprocessing: Remove quoted text, signatures, HTML tags
- Metadata: Store sender, timestamp, category for hybrid search

**Cost Estimation**:
- 500 emails/day × 200 tokens/email × $0.0001/1K tokens = $0.01/day
- Annual cost: ~$3.65 (negligible)

**Best Practices**:
- Normalize text before embedding (lowercase, remove special chars)
- Cache embeddings to avoid re-computing for duplicate content
- Monitor embedding quality via similarity score distribution

**Alternatives Considered**:
- text-embedding-3-small: Newer, cheaper, but less tested for email domain
- text-embedding-3-large: 3072 dimensions, overkill for MVP, higher storage costs
- Sentence-BERT: No native n8n node, requires custom deployment

---

### 6. Workflow Orchestration Patterns

**Decision**: 5 separate n8n workflows with Execute Workflow nodes for modularity

**Rationale**:
- Stays under 50-node limit per workflow (constitution requirement)
- Independent testing and deployment of each workflow
- Clear separation of concerns (classification, organization, notification)
- Easier debugging via n8n execution logs

**Workflow Execution Flow**:
```
Gmail Trigger (Email-Processing-Main)
  ↓
Execute Workflow: Classification
  ↓ (returns classification JSON)
Execute Workflow: Organization (parallel)
Execute Workflow: Notification (parallel)
  ↓
Supabase: Log completion
```

**Inter-Workflow Communication**:
- Use Execute Workflow node output as input to next workflow
- Pass email_id as primary key for data lookup
- Store intermediate results in Supabase for fault tolerance

**Error Isolation**:
- Classification failure: Skip organization/notification, log error
- Organization failure: Still send notification (priority)
- Notification failure: Log for retry, don't block future emails

**Best Practices**:
- Name workflows clearly: `Email-Processing-Main`, `Classification-Workflow`
- Tag workflows for environment: `env:production`, `feature:001`
- Use n8n's built-in error workflow for global error handling

---

## Technology Stack Summary

| Component | Technology | Native n8n Node | Justification |
|-----------|------------|----------------|---------------|
| Orchestration | n8n | N/A | Core platform per constitution |
| Email Trigger | Gmail API | ✅ Gmail Trigger | Reliable polling, OAuth2 built-in |
| Email Operations | Gmail API | ✅ Gmail (Get/Modify) | Native label/archive/read support |
| AI Classification | OpenAI GPT-4 | ✅ AI Agent + OpenAI Chat Model | Best accuracy, native LangChain integration |
| Vector Embeddings | OpenAI Ada-002 | ✅ Embeddings OpenAI | Industry standard, low cost |
| Vector Storage | Supabase pgvector | ✅ Supabase Vector Store | Native node, integrated PostgreSQL |
| Data Storage | Supabase PostgreSQL | ✅ Supabase | RLS, REST API, native node |
| Notifications | Telegram | ✅ Telegram | No SMS cost, rich formatting |
| Data Transformation | JavaScript | ✅ Code Node | Minimal usage per constitution |
| JSON Parsing | n8n Parser | ✅ Structured Output Parser | Reliable AI response parsing |
| Data Preparation | n8n Loader | ✅ Default Data Loader | Vector store document preparation |

**Constitution Compliance**: 100% native n8n nodes, zero Execute Command or Python nodes

---

## Implementation Risks & Mitigations

### Risk 1: Classification Accuracy Below 80% Target

**Mitigation**:
- Use GPT-4 (not GPT-3.5) for higher baseline accuracy
- Implement few-shot examples in system prompt (5-10 examples per category)
- Leverage vector similarity search for contextual classification
- Enable manual corrections to build training dataset for future fine-tuning

### Risk 2: Gmail API Rate Limits

**Mitigation**:
- Batch label operations (10 emails per batch)
- 5-minute polling interval (not 1-minute)
- Exponential backoff on 429 errors (n8n native)
- Monitor quota usage via Google Cloud Console

### Risk 3: Vector Store Performance Degradation

**Mitigation**:
- Start with ivfflat index (good up to 1M vectors)
- Monitor query latency in n8n execution logs
- Plan to rebuild index quarterly or when >500K vectors
- Set similarity threshold 0.7 to limit result set size

### Risk 4: Notification Spam

**Mitigation**:
- Strict high-priority criteria (urgency=HIGH or action in [PAYMENT, CALENDAR, RESPOND])
- Quiet hours enforcement (10pm-7am)
- Daily notification cap (e.g., max 20 notifications/day)
- Allow user to adjust threshold via Supabase config table

### Risk 5: Data Growth (Indefinite Retention)

**Mitigation**:
- Monitor Supabase storage usage monthly
- Estimate: 500 emails/day × 10KB avg = 5MB/day = 1.8GB/year (manageable)
- Supabase Free Tier: 500MB (upgrade to Pro at $25/month for unlimited)
- Compress old email bodies (>6 months) to reduce storage

---

## Next Steps (Phase 1)

1. Generate `data-model.md`: SQL schema for Supabase tables
2. Create `contracts/`: Export workflow JSON templates for each workflow
3. Write `quickstart.md`: Setup guide for n8n, Supabase, Gmail, Telegram, OpenAI
4. Update Claude agent context with n8n-specific patterns

---

**Research Complete**: All technical unknowns resolved. Ready for Phase 1 design.
