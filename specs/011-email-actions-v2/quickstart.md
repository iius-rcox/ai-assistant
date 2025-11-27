# Quickstart Guide: Email Actions V2

**Feature**: 011-email-actions-v2
**Date**: 2025-11-27

This guide provides step-by-step instructions for implementing and validating the Email Actions V2 feature.

---

## Prerequisites

Before starting implementation, ensure:

- [ ] Branch `011-email-actions-v2` is checked out
- [ ] correction-ui dev server runs without errors (`npm run dev`)
- [ ] n8n instance is accessible at https://n8n.coxserver.com
- [ ] Supabase project (xmziovusqlmgygcrgyqt) is accessible
- [ ] Telegram bot (cox_concierge_bot) is configured
- [ ] Google Calendar API credentials are available in n8n

---

## Phase 1: Database Setup (P1 - Foundation)

### Step 1.1: Run Database Migrations

Execute migrations in order:

```bash
# Connect to Supabase
cd correction-ui

# Run migrations (use Supabase CLI or Dashboard SQL Editor)
# 1. Action enum migration
supabase db push --migration-name 20251127_action_enum_migration

# 2. Sender lists table
supabase db push --migration-name 20251127_sender_lists_table

# 3. Shipments table
supabase db push --migration-name 20251127_shipments_table

# 4. Drafts table
supabase db push --migration-name 20251127_drafts_table

# 5. Calendar events table
supabase db push --migration-name 20251127_calendar_events_table

# 6. Action logs table
supabase db push --migration-name 20251127_action_logs_table
```

### Step 1.2: Verify Migration

```sql
-- Verify new columns on classifications
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'classifications'
AND column_name LIKE 'action%' OR column_name LIKE 'has_%';

-- Expected output:
-- action_v2         | text
-- action_confidence | numeric
-- action_auto_assigned | boolean
-- has_tracking_info | boolean
-- has_date_info     | boolean

-- Verify new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('shipments', 'drafts', 'calendar_events', 'sender_lists', 'action_logs');

-- Expected: 5 rows
```

### Step 1.3: Verify Migration Data

```sql
-- Check action_v2 migration from old actions
SELECT action, action_v2, COUNT(*)
FROM classifications
GROUP BY action, action_v2
ORDER BY action;

-- Expected mapping:
-- FYI      | IGNORE      | ...
-- RESPOND  | DRAFT_REPLY | ...
-- TASK     | NOTIFY      | ...
-- PAYMENT  | NOTIFY      | ...
-- CALENDAR | CALENDAR    | ...
-- NONE     | IGNORE      | ...
```

---

## Phase 2: Frontend - Action Dropdown (P1 - User Story 1)

### Step 2.1: Update Type Definitions

**File**: `correction-ui/src/types/enums.ts`

```typescript
// Add new action types (keep old ones for backward compatibility)
export const ACTION_TYPES_V2 = [
  'IGNORE',
  'SHIPMENT',
  'DRAFT_REPLY',
  'JUNK',
  'NOTIFY',
  'CALENDAR',
] as const;

export type ActionTypeV2 = (typeof ACTION_TYPES_V2)[number];
```

**Validation**: TypeScript compiles without errors.

### Step 2.2: Create ActionDropdown Component

**File**: `correction-ui/src/components/ActionDropdown.vue`

- Implement grouped dropdown with risk levels
- Add tooltip descriptions on hover
- Disable SHIPMENT when `has_tracking_info: false`
- Disable CALENDAR when `has_date_info: false`
- Style JUNK as destructive (red/warning)

**Validation**:
1. Load classification list
2. Click action cell
3. Verify 6 options appear in 4 groups
4. Hover over option → tooltip appears
5. Non-shipment email → SHIPMENT is disabled

### Step 2.3: Create ActionStatusIndicator Component

**File**: `correction-ui/src/components/ActionStatusIndicator.vue`

- Show 🔔 for NOTIFY
- Show 📅 for CALENDAR (with pending event)
- Show 📝 for DRAFT_REPLY (with pending draft)
- Show 📦 for SHIPMENT
- Show ⚠️ for JUNK

**Validation**:
1. Update a classification to each action type
2. Verify correct icon appears in row

### Step 2.4: Update ClassificationList

**File**: `correction-ui/src/components/ClassificationList.vue`

- Replace old action dropdown with ActionDropdown
- Add ActionStatusIndicator to action column
- Wire up action change to instant-save

**Validation**:
1. Change action → saves immediately
2. Toast shows "Action updated"
3. Icon updates in row

---

## Phase 3: n8n Workflow Updates (P1 - User Stories 2-3)

### Step 3.1: Update Classification-Workflow

**Workflow**: MVkAVroogGQA6ePC

1. Update AI Agent system prompt (see contracts/workflow-structure.md)
2. Add "Apply Action Thresholds" Code node
3. Update Supabase insert to include action_v2 fields
4. Add action_logs insert

**Validation**:
1. Manually trigger workflow with test email
2. Check classifications table → action_v2 is set
3. Check action_logs table → entry exists

### Step 3.2: Create Action-Processor-Workflow

**Workflow**: NEW

1. Create new workflow with nodes from contracts/workflow-structure.md
2. Test each branch:
   - IGNORE: Pass through (no special processing)
   - NOTIFY: Trigger notification
   - SHIPMENT: Extract tracking (P2)
   - DRAFT_REPLY: Generate draft (P2)
   - CALENDAR: Create event (P2)

**Validation**:
1. Set test classification to NOTIFY
2. Execute workflow
3. Receive Telegram notification

### Step 3.3: Update Notification-Workflow

**Workflow**: VADceJJa6WJuwCKG

1. Update trigger condition to check action_v2 = 'NOTIFY'
2. Update message format per contracts/telegram-messages.md

**Validation**:
1. Set test email to NOTIFY action
2. Execute Email-Processing-Main
3. Receive formatted Telegram notification

---

## Phase 4: SHIPMENT Action (P2 - User Story 4)

### Step 4.1: Implement Shipment Extraction

In Action-Processor-Workflow SHIPMENT branch:

1. Add Code node to extract tracking data
2. Generate carrier tracking URL
3. Insert into shipments table
4. Send Telegram notification

**Validation**:
1. Send test Amazon shipping email
2. Verify shipments table has entry
3. Verify tracking_number, carrier, items extracted
4. Receive Telegram with tracking link

### Step 4.2: Create ShipmentService

**File**: `correction-ui/src/services/shipmentService.ts`

Implement functions from contracts/api-endpoints.ts.

**Validation**:
1. Call `listShipments()` → returns shipments
2. Call `getPendingShipments()` → filters correctly

---

## Phase 5: DRAFT_REPLY Action (P2 - User Story 5)

### Step 5.1: Implement Draft Generation

In Action-Processor-Workflow DRAFT_REPLY branch:

1. Add AI Agent node to generate reply
2. Insert into drafts table
3. Send Telegram with inline buttons

**Validation**:
1. Send test email with question
2. Verify drafts table has entry
3. Receive Telegram with [Send] [Re-write] [Discard]

### Step 5.2: Create Draft-Reply-Handler-Workflow

**Workflow**: NEW

1. Create webhook trigger for Telegram callbacks
2. Implement SEND branch (Gmail send, update status)
3. Implement REWRITE branch (ask for instructions)
4. Implement DISCARD branch (update status)

**Validation**:
1. Click [Send] → email sent, confirmation message
2. Click [Re-write] → asked for instructions
3. Click [Discard] → confirmation message

### Step 5.3: Create DraftService

**File**: `correction-ui/src/services/draftService.ts`

**Validation**:
1. Call `getPendingDrafts()` → returns pending drafts
2. Call `getDraftByEmail(emailId)` → returns draft

---

## Phase 6: CALENDAR Action (P2 - User Story 6)

### Step 6.1: Implement Calendar Event Creation

In Action-Processor-Workflow CALENDAR branch:

1. Add Code node to extract event details
2. Add Google Calendar node (Create Event, status: tentative)
3. Insert into calendar_events table
4. Send Telegram notification with event link

**Validation**:
1. Send test email with date ("Meeting on Dec 5 at 3pm")
2. Verify calendar_events table has entry
3. Check Google Calendar → tentative event exists
4. Receive Telegram with event link

### Step 6.2: Create CalendarEventService

**File**: `correction-ui/src/services/calendarEventService.ts`

**Validation**:
1. Call `getTentativeEvents()` → returns pending events
2. Call `getUpcomingEvents(7)` → returns next 7 days

---

## Phase 7: JUNK Action (P3 - User Story 7)

### Step 7.1: Implement Junk Processing

In Action-Processor-Workflow JUNK branch:

1. Check blacklist before assigning JUNK
2. Verify NOT in protected category
3. Mark as read + archive

**Validation**:
1. Add domain to blacklist
2. Send email from blacklisted domain
3. Verify email archived to junk

### Step 7.2: Add SafeList Check

Update Classification-Workflow threshold logic:

1. Check safelist before allowing JUNK
2. If safelisted → IGNORE instead of JUNK

**Validation**:
1. Add sender to safelist
2. Send from that sender
3. Verify action is NOT JUNK

---

## Phase 8: List Management UI (P3 - User Story 8)

### Step 8.1: Create SenderListService

**File**: `correction-ui/src/services/senderListService.ts`

Implement all functions from contracts/api-endpoints.ts.

**Validation**:
1. Call `getAllEntries()` → returns safelist/blacklist
2. Call `addEntry()` → creates entry
3. Call `removeEntry()` → deactivates entry

### Step 8.2: Create ListManagementPage

**File**: `correction-ui/src/views/ListManagementPage.vue`

- Two sections: SafeList, BlackList
- Add entry form (email or domain)
- Remove entry button
- Show source email if available

**Validation**:
1. Navigate to /lists
2. Add entry to blacklist
3. Remove entry → soft deleted

### Step 8.3: Create RowContextMenu

**File**: `correction-ui/src/components/RowContextMenu.vue`

- 3-dot button on each row
- Options: "Add sender to junk", "Add domain to junk"
- If action=JUNK: "Mark as not junk"

**Validation**:
1. Click 3-dot menu
2. Select "Add sender to junk" → entry added
3. For JUNK row: Select "Mark as not junk" → action changes to IGNORE

---

## Testing Checklist

### User Story 1: Action Dropdown
- [ ] 6 actions visible in dropdown
- [ ] Actions grouped by risk level
- [ ] Tooltips appear on hover
- [ ] SHIPMENT disabled for non-shipment emails
- [ ] Status icons display correctly

### User Story 2: IGNORE Action
- [ ] Promotional email → IGNORE (>85% confidence)
- [ ] Email marked as read
- [ ] No notification sent
- [ ] Uncertain email → IGNORE fallback

### User Story 3: NOTIFY Action
- [ ] HIGH urgency → NOTIFY
- [ ] KIDS/ROBYN/FINANCIAL category → NOTIFY
- [ ] Telegram message received <60s
- [ ] Message contains summary, urgency, category

### User Story 4: SHIPMENT Action
- [ ] Tracking email → SHIPMENT (>90% confidence)
- [ ] Tracking number extracted
- [ ] Carrier identified
- [ ] ETA extracted
- [ ] Shipment notification sent

### User Story 5: DRAFT_REPLY Action
- [ ] Question email → DRAFT_REPLY (>75% confidence)
- [ ] Draft generated
- [ ] Telegram buttons work: Send, Re-write, Discard
- [ ] Re-write accepts instructions
- [ ] Email sent on approval

### User Story 6: CALENDAR Action
- [ ] Date email + priority category → CALENDAR (>=85%)
- [ ] Google Calendar event created
- [ ] Event status is "tentative"
- [ ] Telegram notification with event link

### User Story 7: JUNK Action
- [ ] Blacklisted domain → JUNK (>=99% confidence)
- [ ] Protected categories never auto-JUNK
- [ ] Safelisted senders never JUNK
- [ ] Email archived to junk

### User Story 8: List Management
- [ ] List management page loads
- [ ] Can add to safelist/blacklist
- [ ] Can remove entries
- [ ] Row context menu works
- [ ] "Mark as not junk" adds to safelist

---

## Rollback Plan

If issues are found:

### Database Rollback

```sql
-- Remove new columns from classifications
ALTER TABLE classifications
DROP COLUMN IF EXISTS action_v2,
DROP COLUMN IF EXISTS action_confidence,
DROP COLUMN IF EXISTS action_auto_assigned,
DROP COLUMN IF EXISTS has_tracking_info,
DROP COLUMN IF EXISTS has_date_info;

-- Drop new tables (in reverse order)
DROP TABLE IF EXISTS action_logs;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS drafts;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS sender_lists;
```

### Workflow Rollback

1. Deactivate Action-Processor-Workflow
2. Deactivate Draft-Reply-Handler-Workflow
3. Revert Classification-Workflow to previous version
4. Revert Notification-Workflow to previous version

### Frontend Rollback

```bash
git checkout main -- correction-ui/src/types/enums.ts
git checkout main -- correction-ui/src/components/ClassificationList.vue
# Remove new components
rm correction-ui/src/components/ActionDropdown.vue
rm correction-ui/src/components/ActionStatusIndicator.vue
rm correction-ui/src/components/RowContextMenu.vue
rm correction-ui/src/views/ListManagementPage.vue
rm correction-ui/src/services/senderListService.ts
rm correction-ui/src/services/shipmentService.ts
rm correction-ui/src/services/draftService.ts
rm correction-ui/src/services/calendarEventService.ts
```

---

## Success Metrics Validation

After full implementation, verify:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| SC-001 | <5s action selection | Time user task |
| SC-002 | 90% IGNORE automation | Query action_logs |
| SC-003 | 100% NOTIFY <60s | Telegram timestamp vs email |
| SC-004 | 95% shipment accuracy | Manual review sample |
| SC-005 | Zero auto-sent emails | Query drafts.status |
| SC-006 | Zero auto-confirmed events | Query calendar_events.status |
| SC-007 | <0.1% JUNK false positive | Review junked emails |
| SC-008 | 100% reversible actions | Query action_logs history |

```sql
-- SC-002: IGNORE automation rate
SELECT
  COUNT(*) FILTER (WHERE action = 'IGNORE' AND auto_assigned = true) * 100.0 /
  COUNT(*) as ignore_auto_rate
FROM action_logs;

-- SC-005: No auto-sent emails
SELECT COUNT(*) FROM drafts
WHERE status = 'sent' AND source = 'workflow';
-- Expected: 0

-- SC-006: No auto-confirmed events
SELECT COUNT(*) FROM calendar_events
WHERE status = 'confirmed' AND created_at = updated_at;
-- Expected: 0
```
