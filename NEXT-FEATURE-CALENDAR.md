# Next Feature: Calendar Integration (FR-2.2)

**Priority**: Phase 2 Feature
**Estimated Timeline**: 2-3 hours
**Complexity**: Medium

---

## Feature Overview

Automatically create Google Calendar events when emails are classified with `action=CALENDAR`.

**User Story**: As an email user, when I receive meeting invites or event notifications via email, the system automatically creates tentative calendar events with event details, saving me from manual calendar entry.

---

## Prerequisites (Already Available)

✅ **AI Classification** - Detects action=CALENDAR
✅ **Google Calendar Node** - Native n8n node available
✅ **Gmail OAuth** - Already configured for email access
✅ **Event extraction** - AI already extracts dates (extracted_dates field)

---

## Implementation Plan

### 1. Create New Feature Branch (5 min)

```bash
/speckit.specify "Create Google Calendar events automatically when emails are classified with action=CALENDAR"
```

This will:
- Create branch: `002-calendar-integration`
- Generate specification
- Run through planning workflow

### 2. Enhance AI Event Extraction (30 min)

Update Classification-Workflow AI Agent prompt to extract:
- Event date and time (more structured format)
- Event duration (default to 1 hour if not specified)
- Location (if mentioned)
- Meeting type (in-person, virtual, phone)
- Attendees (email addresses in body)

**Enhanced JSON schema**:
```json
{
  "category": "KIDS",
  "urgency": "HIGH",
  "action": "CALENDAR",
  "confidence": 0.95,
  "extracted_names": ["Teacher Name"],
  "extracted_dates": ["November 17, 2025 3:00pm"],
  "extracted_amounts": [],
  "event_details": {
    "start_datetime": "2025-11-17T15:00:00",
    "end_datetime": "2025-11-17T16:00:00",
    "location": "School auditorium",
    "meeting_type": "in-person"
  }
}
```

### 3. Create Calendar-Creation-Workflow (1 hour)

**Workflow**: Triggered when action=CALENDAR

```
When called by another workflow
  ↓
Check if action=CALENDAR (If node)
  ↓
Parse Event Details (Code node)
  ├─ Convert extracted_dates to ISO datetime
  ├─ Default duration: 1 hour
  ├─ Extract location from body
  └─ Build event description with Gmail link
  ↓
Create Calendar Event (Google Calendar node)
  ├─ Calendar: Primary
  ├─ Summary: Email subject
  ├─ Start: Parsed datetime
  ├─ End: Start + duration
  ├─ Description: Email body preview + Gmail link
  ├─ Location: Extracted or "TBD"
  └─ Status: Tentative
  ↓
Log to Supabase (Optional - can use existing audit log)
```

### 4. Integrate with Main Workflow (15 min)

Add Calendar workflow call to Email-Processing-Main:
```
Call Classification Workflow
  ↓
Call Organization Workflow (parallel)
Call Notification Workflow (parallel)
Call Calendar-Creation Workflow (parallel) ← NEW
```

### 5. Test Scenarios (30 min)

**Test Email 1**: School Event
```
Subject: PTA Meeting Wednesday at 3pm
Body: Don't forget - PTA meeting this Wednesday, November 20th at 3:00pm in the school auditorium.
```
Expected: KIDS/MEDIUM/CALENDAR → Event created with start=3pm, location=school auditorium

**Test Email 2**: Work Meeting
```
Subject: Quarterly Review Meeting - Nov 21 at 2pm
Body: Join us for Q4 review on Thursday, Nov 21st at 2:00pm via Zoom. Link: https://zoom.us/j/123456
```
Expected: WORK/MEDIUM/CALENDAR → Event created with start=2pm, location=Zoom link

**Test Email 3**: Doctor Appointment
```
Subject: Appointment Reminder - Dr. Smith on Friday 10am
Body: This is a reminder of your appointment with Dr. Smith on Friday, November 22nd at 10:00am. Office address: 123 Main St.
```
Expected: OTHER/MEDIUM/CALENDAR → Event created with location

---

## Technical Details

### Google Calendar Node Configuration

**Required fields**:
- `calendar`: Primary calendar (use resource locator)
- `start`: ISO datetime (e.g., "2025-11-20T15:00:00")
- `end`: ISO datetime (e.g., "2025-11-20T16:00:00")

**Optional fields** (recommended):
- `summary`: Event title (use email subject)
- `description`: Email preview + Gmail link
- `location`: Extracted from email or "TBD"
- `visibility`: "default" or "private"
- `sendUpdates`: "none" (don't send invites for tentative events)

### Date Parsing Strategy

**Simple approach** (MVP):
```javascript
// Use AI's extracted_dates and parse with standard formats
const dateStr = extracted_dates[0]; // e.g., "November 20, 2025 3:00pm"
const parsed = new Date(dateStr);
const start = parsed.toISOString();
const end = new Date(parsed.getTime() + 3600000).toISOString(); // +1 hour
```

**Advanced approach** (Phase 3):
- Use Luxon/date-fns for robust parsing
- Handle relative dates ("tomorrow", "next Wednesday")
- Parse duration hints ("1 hour meeting", "30 minute call")
- Timezone handling

---

## Success Criteria (FR-2.2)

From PRD Phase 2:
- ✅ Event extraction accuracy >= 90%
- ✅ Calendar events created with correct datetime
- ✅ Gmail link included in event description
- ✅ Location extracted when present
- ✅ Works for common formats (explicit dates/times)

---

## Native n8n Compliance

✅ **Google Calendar node**: n8n-nodes-base.googleCalendar (native)
✅ **OAuth2 authentication**: Uses existing Gmail credentials
✅ **Code nodes**: Only for date parsing (data transformation)
✅ **No Execute Command**: Maintains 100% native architecture

---

## Estimated Effort

**Specification**: 15 minutes (`/speckit.specify`)
**Planning**: 20 minutes (`/speckit.plan`)
**Implementation**: 1-2 hours (workflow creation via MCP + testing)
**Testing**: 30 minutes (3 test scenarios)
**Documentation**: 15 minutes

**Total**: 2-3 hours

---

## Commands to Run

```bash
# Start calendar integration feature
/speckit.specify "Create Google Calendar events automatically when emails are classified with action=CALENDAR. Extract event date, time, location from email content. Create tentative calendar events with Gmail link in description."

# After spec is created
/speckit.plan

# Generate tasks
/speckit.tasks

# Implement
/speckit.implement
```

---

## Related PRD Sections

**FR-2.2: Google Calendar Integration** (PRD.md lines 106-111):
- Extract event details
- Create tentative events
- Add email reference links
- Handle updates

**Phase 2 Acceptance Criteria**: Calendar extraction >= 90%

---

**Ready to start when you are!** Run `/speckit.specify` with the feature description above to begin.
