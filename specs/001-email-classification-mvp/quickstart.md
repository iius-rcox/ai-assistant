# Quickstart Guide: Email Classification MVP

**Target Audience**: Developers and operators setting up the Email Intelligence Workflow System
**Estimated Setup Time**: 2-3 hours
**Prerequisites**: Gmail account, Telegram account, basic n8n familiarity

## Overview

This guide walks through complete setup of the email classification MVP, from service configuration to workflow deployment.

## Phase 1: Service Setup (60 minutes)

### 1.1 Supabase Setup

**Create Supabase Project**:
1. Navigate to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project details:
   - Name: `email-intelligence-mvp`
   - Database Password: Generate strong password (save securely)
   - Region: Choose closest to your location
4. Wait for project provisioning (~2 minutes)

**Configure Database**:
1. Open SQL Editor in Supabase dashboard
2. Copy entire schema from `data-model.md`
3. Execute SQL (creates all tables, indexes, triggers, RLS policies)
4. Verify tables created: Navigate to Table Editor, confirm 7 tables visible

**Obtain API Keys**:
1. Navigate to Project Settings → API
2. Copy `URL` (format: `https://xxx.supabase.co`)
3. Copy `anon` key (public key for client access)
4. Copy `service_role` key (admin key for n8n workflows)
5. Save all three values securely

**Enable pgvector Extension**:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Cost Estimate**: Free tier (500MB database, 2GB file storage, 50K active users)

---

### 1.2 Gmail API Setup

**Enable Gmail API**:
1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: `email-intelligence-mvp`
3. Enable Gmail API:
   - Search "Gmail API" in API Library
   - Click "Enable"
4. Configure OAuth consent screen:
   - User Type: External
   - App name: "Email Intelligence MVP"
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `gmail.modify` and `gmail.readonly`
   - Test users: Add your Gmail address

**Create OAuth2 Credentials**:
1. Navigate to Credentials → Create Credentials → OAuth 2.0 Client ID
2. Application type: Web application
3. Name: `n8n-gmail-integration`
4. Authorized redirect URIs: Add your n8n OAuth callback URL
   - Format: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
5. Click "Create"
6. Save Client ID and Client Secret

**Create Gmail Labels** (Manual):
1. Open Gmail web interface
2. Create labels: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
3. Color-code for visual distinction (optional but recommended)

**Gmail API Quota**: Default 1 billion units/day (sufficient for 100K+ operations)

---

### 1.3 OpenAI API Setup

**Create OpenAI Account**:
1. Navigate to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Name: `email-intelligence-mvp`
6. Save API key securely (shown only once)

**Configure Billing**:
1. Navigate to Billing → Payment Methods
2. Add credit card (required for API access)
3. Set usage limits (recommended: $50/month for MVP)

**Enable Required Models**:
- GPT-4 (gpt-4-turbo-preview): For classification
- text-embedding-ada-002: For vector embeddings

**Cost Estimate**:
- GPT-4: $0.01/1K tokens input, $0.03/1K tokens output
- Embeddings: $0.0001/1K tokens
- **Estimated monthly cost for 500 emails/day**: $15-25

---

### 1.4 Telegram Bot Setup

**Create Bot via BotFather**:
1. Open Telegram app
2. Search for `@BotFather`
3. Send command: `/newbot`
4. Enter bot name: `Email Intelligence Bot`
5. Enter username: `your_email_intelligence_bot` (must end in `bot`)
6. Save bot token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

**Get Chat ID**:
1. Start conversation with your new bot
2. Send message: `/start`
3. Visit: `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
4. Find `"chat":{"id":123456789}` in response
5. Save chat ID (numeric value)

**Test Bot**:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=Test message from Email Intelligence Bot"
```

**Cost**: Free (no Telegram API fees)

---

### 1.5 n8n Setup

**Option A: n8n Cloud (Recommended for MVP)**:
1. Navigate to [n8n.cloud](https://n8n.cloud)
2. Create account and subscribe (Starter plan: $20/month)
3. Note your n8n instance URL: `https://your-name.app.n8n.cloud`

**Option B: Self-Hosted (Docker)**:
```bash
# Create docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - N8N_ENCRYPTION_KEY=your_encryption_key_here
      - WEBHOOK_URL=https://your-domain.com
      - GENERIC_TIMEZONE=America/New_York
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:

# Start n8n
docker-compose up -d
```

**Access n8n**:
- Cloud: Navigate to your instance URL
- Self-hosted: `http://localhost:5678`
- Log in with credentials configured above

---

## Phase 2: Credential Configuration (30 minutes)

### 2.1 Configure Gmail OAuth2 in n8n

1. Navigate to Credentials → Add Credential
2. Select "Gmail OAuth2 API"
3. Enter credential name: `Gmail - Primary Account`
4. Enter Client ID (from step 1.2)
5. Enter Client Secret (from step 1.2)
6. Click "Connect my account"
7. Authorize Gmail access in Google OAuth flow
8. Verify "Connected" status

### 2.2 Configure OpenAI API in n8n

1. Navigate to Credentials → Add Credential
2. Select "OpenAI API"
3. Enter credential name: `OpenAI - GPT-4`
4. Enter API Key (from step 1.3)
5. Click "Save"

### 2.3 Configure Supabase in n8n

1. Navigate to Credentials → Add Credential
2. Select "Supabase API"
3. Enter credential name: `Supabase - Email Intelligence`
4. Enter Host: Your Supabase URL (without https://)
5. Enter Service Role Secret: Your service_role key (from step 1.1)
6. Click "Save"

### 2.4 Configure Telegram in n8n

1. Navigate to Credentials → Add Credential
2. Select "Telegram API"
3. Enter credential name: `Telegram - Email Bot`
4. Enter Access Token: Your bot token (from step 1.4)
5. Click "Save"

---

## Phase 3: Workflow Deployment (45 minutes)

**IMPORTANT**: This guide offers two deployment approaches:
- **Option A (Recommended)**: Programmatic MCP-based workflow creation
- **Option B (Fallback)**: Manual UI-based workflow creation

Choose Option A if you have access to n8n MCP tools in this environment. Use Option B only if MCP tools are unavailable.

---

### Option A: MCP-Based Workflow Creation (Recommended)

**Prerequisite**: Ensure n8n instance API is accessible and credentials configured.

#### 3A.1 Configure n8n MCP Connection

```bash
# Set environment variables for n8n MCP access
export N8N_API_BASE_URL="https://your-n8n-instance.app.n8n.cloud/api/v1"
export N8N_API_KEY="your-n8n-api-key"
```

**Get API Key**:
1. Navigate to n8n → Settings → API
2. Generate new API key
3. Copy and save securely

#### 3A.2 Discover and Validate Required Nodes

Run MCP tools to discover nodes before creating workflows:

```javascript
// Search for Gmail nodes and get examples
mcp__n8n-mcp__search_nodes({
  query: "gmail",
  includeExamples: true
})

// Get AI Agent documentation
mcp__n8n-mcp__get_node_documentation({
  nodeType: "nodes-langchain.agent"
})

// Get Supabase Vector Store with examples
mcp__n8n-mcp__get_node_essentials({
  nodeType: "nodes-langchain.vectorStoreSupabase",
  includeExamples: true
})

// Validate OpenAI Chat Model config
mcp__n8n-mcp__validate_node_operation({
  nodeType: "nodes-langchain.lmChatOpenAi",
  config: { temperature: 0.4, maxTokens: 500 }
})
```

#### 3A.3 Create All Workflows Programmatically

Execute `/speckit.implement` command which will:
1. Read workflow designs from `contracts/workflow-structure.md`
2. Use MCP `n8n_create_workflow` to generate each workflow
3. Validate workflows using `validate_workflow`
4. Auto-fix issues using `n8n_autofix_workflow`
5. Export workflow JSON to `contracts/` directory
6. Test workflows with sample emails

**Alternatively**, create workflows manually using MCP:

```javascript
// Example: Create Classification Workflow
const classificationWorkflow = mcp__n8n-mcp__n8n_create_workflow({
  name: "Classification-Workflow",
  nodes: [
    // Node definitions from workflow-structure.md
    // Full JSON available after /speckit.implement execution
  ],
  connections: {
    // Connection mappings
  },
  settings: {
    executionOrder: "v1",
    saveExecutionProgress: true
  }
})

// Validate created workflow
mcp__n8n-mcp__n8n_validate_workflow({
  id: classificationWorkflow.id,
  options: {
    validateNodes: true,
    validateConnections: true,
    validateExpressions: true
  }
})
```

**Time Savings**: MCP approach reduces 45 minutes to ~10 minutes with automated validation.

---

### Option B: Manual UI-Based Workflow Creation (Fallback)

Use this approach only if n8n MCP tools are not available.

#### 3B.1 Create Classification Workflow

1. Navigate to Workflows → Add Workflow
2. Name: `Classification-Workflow`
3. Add nodes following structure from `contracts/workflow-structure.md` section 2
4. Configure AI Agent node:
   - Select credential: `OpenAI - GPT-4`
   - Model: `gpt-4-turbo-preview`
   - Temperature: 0.4
   - Max Tokens: 500
   - System Message: Copy classification prompt from `contracts/workflow-structure.md`
5. Configure Supabase Vector Store nodes:
   - Retrieve mode: Top 5 results, similarity threshold 0.7
   - Insert mode: Use Embeddings OpenAI for vector generation
6. Configure Structured Output Parser:
   - Schema: JSON schema for classification output
7. Test workflow with sample email
8. Save and activate

#### 3B.2 Create Organization Workflow

1. Create new workflow: `Organization-Workflow`
2. Add nodes following structure from `contracts/workflow-structure.md` section 3
3. Configure Gmail nodes:
   - Select credential: `Gmail - Primary Account`
   - Operations: Add Label, Mark as Read, Archive Message
4. Configure Supabase logging nodes
5. Test with sample classification result
6. Save and activate

#### 3B.3 Create Notification Workflow

1. Create new workflow: `Notification-Workflow`
2. Add nodes following structure from `contracts/workflow-structure.md` section 4
3. Configure Code node for quiet hours logic
4. Configure Telegram node:
   - Select credential: `Telegram - Email Bot`
   - Chat ID: Your chat ID (from step 1.4)
   - Message format: Use template from `contracts/workflow-structure.md`
5. Test with high-priority sample
6. Save and activate

#### 3B.4 Create Main Email Processing Workflow

1. Create new workflow: `Email-Processing-Main`
2. Add Gmail Trigger node:
   - Select credential: `Gmail - Primary Account`
   - Event: Message Received
   - Filters: `is:unread in:inbox`
   - Poll interval: 5 minutes
3. Add Execute Workflow nodes:
   - Classification-Workflow
   - Organization-Workflow (conditional on classification success)
   - Notification-Workflow (conditional on high priority)
4. Add error handling nodes
5. Test with trigger disabled (manual execution)
6. Save and activate trigger

#### 3B.5 Create Scheduled Notification Workflow

1. Create new workflow: `Send-Queued-Notifications`
2. Add Schedule Trigger:
   - Type: Cron
   - Expression: `0 7 * * *` (every day at 7:00 AM)
3. Add Supabase query for queued notifications
4. Add loop to process each queued notification
5. Save and activate

**Manual UI Creation Complete**: All 5 workflows created and configured.

---

## Phase 4: Testing & Validation (30 minutes)

### 4.1 Unit Tests

**Test Classification Workflow**:
```javascript
// Test input (paste into n8n manual execution)
{
  "email_id": 1,
  "message_id": "test-001",
  "subject": "PTA Meeting Tomorrow",
  "sender": "school@example.com",
  "body": "Don't forget the PTA meeting tomorrow at 3pm..."
}

// Expected output
{
  "category": "KIDS",
  "urgency": "HIGH",
  "action": "CALENDAR",
  "confidence": 0.85,
  "extracted_dates": ["tomorrow at 3pm"],
  "extracted_names": [],
  "extracted_amounts": []
}
```

**Test Organization Workflow**:
1. Verify Gmail label "KIDS" applied
2. Check Supabase `email_actions` table for LABEL_APPLIED log
3. Verify email remains unread (action=CALENDAR)

**Test Notification Workflow**:
1. Send high-priority test during business hours
2. Verify Telegram message received within 2 minutes
3. Check Supabase `notifications` table for SENT status

### 4.2 Integration Test

**End-to-End Test**:
1. Send real email to your Gmail account
2. Wait for Gmail Trigger (max 5 minutes)
3. Verify in n8n Executions log:
   - Email-Processing-Main executed successfully
   - Classification-Workflow completed
   - Organization-Workflow completed
   - Notification-Workflow executed (if high priority)
4. Check Gmail for applied label
5. Check Telegram for notification (if applicable)
6. Query Supabase to verify all records created

### 4.3 Error Scenarios

**Test API Failure Handling**:
1. Temporarily disable OpenAI credential
2. Trigger email processing
3. Verify error logged in n8n execution history
4. Verify email processing continues (doesn't block future emails)
5. Re-enable credential

**Test Quiet Hours**:
1. Set system time to 11:00 PM (or modify quiet hours config)
2. Trigger high-priority email
3. Verify notification QUEUED in Supabase (not SENT)
4. Verify notification sent at 7:00 AM next day

---

## Phase 5: Production Readiness (15 minutes)

### 5.1 Configure Monitoring

**Supabase Dashboard Queries**:
```sql
-- Classification accuracy (run weekly)
SELECT
  DATE_TRUNC('week', created_at) as week,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE corrected_timestamp IS NOT NULL) as corrections
FROM classifications
GROUP BY week
ORDER BY week DESC;

-- Daily processing volume
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE category='KIDS') as kids,
  COUNT(*) FILTER (WHERE category='WORK') as work,
  COUNT(*) FILTER (WHERE urgency='HIGH') as high_urgency
FROM classifications
GROUP BY date
ORDER BY date DESC
LIMIT 30;

-- Notification delivery performance
SELECT
  delivery_status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (sent_timestamp - created_at))) as avg_delivery_seconds
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY delivery_status;
```

**Set up Supabase Alerts**:
1. Navigate to Supabase → Database → Functions
2. Create alert function for error rate threshold
3. Schedule to run hourly

### 5.2 Backup Configuration

**Automated Backups**:
- Supabase Pro plan includes daily automatic backups (7-day retention)
- Manual backups via SQL Editor → Export (weekly recommended)

**Critical Data**:
- Export `emails`, `classifications`, `correction_logs` monthly
- Store exports in secure cloud storage (Google Drive, Dropbox)

### 5.3 Security Checklist

- [ ] All API keys stored in n8n credential vault (not hardcoded)
- [ ] Supabase RLS policies enabled on all tables
- [ ] Gmail OAuth2 scopes limited to `gmail.modify` and `gmail.readonly`
- [ ] Telegram bot token not exposed in public repositories
- [ ] n8n basic auth enabled (username/password required)
- [ ] n8n webhook endpoints secured with authentication tokens
- [ ] Environment variables for sensitive config (never commit to Git)

---

## Phase 6: Operational Procedures

### 6.1 Daily Operations

**Morning Routine** (5 minutes):
1. Check n8n Executions log for failures overnight
2. Review Supabase error logs
3. Verify Telegram notifications delivered correctly
4. Check classification accuracy dashboard

**Weekly Review** (15 minutes):
1. Run accuracy queries in Supabase
2. Review low-confidence classifications (<0.6)
3. Manually correct any misclassifications
4. Check API usage and costs (OpenAI dashboard)
5. Monitor Supabase storage usage

### 6.2 Manual Corrections

**Correcting Misclassified Email**:
1. Open Supabase dashboard
2. Navigate to `classifications` table
3. Find email by sender or subject
4. Click "Edit" on classification row
5. Update `category`, `urgency`, or `action`
6. Click "Save"
7. Correction automatically logged via database trigger

**Reviewing Corrections**:
```sql
-- View recent corrections
SELECT
  c.email_id,
  e.subject,
  e.sender,
  c.original_category,
  c.category as corrected_category,
  c.corrected_timestamp
FROM classifications c
JOIN emails e ON c.email_id = e.id
WHERE c.corrected_timestamp IS NOT NULL
ORDER BY c.corrected_timestamp DESC
LIMIT 50;
```

### 6.3 Troubleshooting

**Issue: Gmail Trigger Not Firing**:
- Check Gmail API quota (Google Cloud Console)
- Verify OAuth2 token not expired (re-authorize if needed)
- Check n8n execution log for trigger errors
- Verify Gmail account has unread emails in inbox

**Issue: Low Classification Accuracy**:
- Review system prompt for clarity
- Add more few-shot examples to prompt
- Check GPT-4 API status (status.openai.com)
- Increase temperature slightly (0.4 → 0.5) for more nuanced classifications
- Review vector store similarity results (may need to rebuild index)

**Issue: Notifications Not Sent**:
- Verify Telegram bot not blocked by user
- Check Telegram API status
- Review quiet hours configuration
- Check notification workflow execution log
- Verify chat ID correct

---

## Success Metrics Dashboard

**Week 1 Targets**:
- 100+ emails processed
- Classification accuracy >75% (will improve with corrections)
- <5 minutes average notification delivery
- Zero critical errors

**Month 1 Targets**:
- Classification accuracy >80%
- <2 minutes average notification delivery
- 60%+ inbox clutter reduction
- <5% error rate

---

## Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| n8n Cloud | Starter | $20 |
| Supabase | Free → Pro (if needed) | $0 → $25 |
| OpenAI API | Usage-based | $15-25 |
| Gmail API | Free (within quota) | $0 |
| Telegram Bot | Free | $0 |
| **Total** | | **$35-70/month** |

**Cost Optimization**:
- Start with Supabase Free tier (upgrade if storage >500MB)
- Monitor OpenAI usage weekly (optimize prompts to reduce tokens)
- Consider self-hosted n8n after MVP validation (save $20/month)

---

## Next Steps

After MVP is stable (1-2 weeks):
1. Review `PRD.md` Phase 2 features (draft responses, calendar integration)
2. Analyze correction logs to identify accuracy improvement opportunities
3. Consider fine-tuning GPT model on correction dataset (requires 50+ corrections)
4. Explore advanced notification rules (daily digests, category-specific alerts)

---

## MCP vs Manual Deployment Comparison

| Aspect | MCP-Based (Option A) | Manual UI (Option B) |
|--------|---------------------|---------------------|
| **Setup Time** | ~10 minutes | ~45 minutes |
| **Automation** | Fully automated | Manual node-by-node |
| **Version Control** | Workflow JSON in Git | Export required manually |
| **Validation** | Automatic pre-deployment | Manual testing only |
| **Reproducibility** | Perfect (same JSON every time) | Human error possible |
| **CI/CD Integration** | Native support | Not easily automated |
| **Recommended For** | Production deployments | Prototyping, debugging |

**Recommendation**: Use MCP-based approach (Option A) for all production deployments. The time savings, automation, and reliability benefits far outweigh the minimal learning curve.

---

## Support Resources

- **n8n Documentation**: [docs.n8n.io](https://docs.n8n.io)
- **n8n MCP Tools**: See `plan.md` section "n8n MCP Workflow Generation Strategy"
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **OpenAI API Docs**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Gmail API Docs**: [developers.google.com/gmail/api](https://developers.google.com/gmail/api)
- **Telegram Bot API**: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)

---

**Quickstart Complete**: Your Email Intelligence Workflow System is ready for production use!

**Next Step**: Run `/speckit.tasks` to generate implementation tasks, then `/speckit.implement` to execute MCP-based workflow creation.
