# Telegram Message Templates: Email Actions V2

**Feature**: 011-email-actions-v2
**Date**: 2025-11-27

This document defines the Telegram message formats for each action type.

---

## 1. NOTIFY Action - Important Email Alert

### Message Format

```
🔔 IMPORTANT EMAIL

From: {sender_name} <{sender_email}>
Subject: {subject}

━━━━━━━━━━━━━━━━━━━━━━━━

📝 Summary:
{summary}

━━━━━━━━━━━━━━━━━━━━━━━━

📁 Category: {category}
⚡ Urgency: {urgency}
🎯 Confidence: {confidence}%

💡 Recommended: {action_recommendation}

🔗 View in Gmail
```

### Variables

| Variable | Source | Example |
|----------|--------|---------|
| sender_name | Email From header | "John Smith" |
| sender_email | Email From header | "john@example.com" |
| subject | Email subject | "Meeting Tomorrow" |
| summary | AI classification.summary | "John is asking about tomorrow's 2pm meeting..." |
| category | classification.category | "WORK" |
| urgency | classification.urgency | "HIGH" |
| confidence | classification.confidence * 100 | "92" |
| action_recommendation | Generated based on content | "Reply within 24 hours" |

### Example

```
🔔 IMPORTANT EMAIL

From: Riverside Elementary <office@riverside.edu>
Subject: School Closure Tomorrow

━━━━━━━━━━━━━━━━━━━━━━━━

📝 Summary:
Due to weather conditions, Riverside Elementary will be closed tomorrow (Nov 28). All after-school activities are cancelled.

━━━━━━━━━━━━━━━━━━━━━━━━

📁 Category: KIDS
⚡ Urgency: HIGH
🎯 Confidence: 96%

💡 Recommended: Arrange childcare for tomorrow

🔗 View in Gmail
```

---

## 2. DRAFT_REPLY Action - Reply Approval

### Message Format

```
📝 DRAFT REPLY READY

━━━━━━━━━━━━━━━━━━━━━━━━

📨 Original Email:
From: {sender_name}
Subject: {subject}

━━━━━━━━━━━━━━━━━━━━━━━━

✏️ Suggested Reply:

{draft_content}

━━━━━━━━━━━━━━━━━━━━━━━━

📁 {category} | ⚡ {urgency}

[Send] [Re-write] [Discard]
```

### Inline Keyboard Buttons

```json
{
  "inline_keyboard": [
    [
      {"text": "✅ Send", "callback_data": "send:{draft_id}"},
      {"text": "✏️ Re-write", "callback_data": "rewrite:{draft_id}"},
      {"text": "🗑️ Discard", "callback_data": "discard:{draft_id}"}
    ]
  ]
}
```

### Variables

| Variable | Source | Example |
|----------|--------|---------|
| sender_name | Email From header | "Jane Doe" |
| subject | Email subject | "Question about project" |
| draft_content | AI-generated reply | "Hi Jane,\n\nThanks for reaching out..." |
| category | classification.category | "WORK" |
| urgency | classification.urgency | "MEDIUM" |
| draft_id | drafts.id | "123" |

### Example

```
📝 DRAFT REPLY READY

━━━━━━━━━━━━━━━━━━━━━━━━

📨 Original Email:
From: Jane Doe
Subject: Question about Q4 report

━━━━━━━━━━━━━━━━━━━━━━━━

✏️ Suggested Reply:

Hi Jane,

Thanks for your question about the Q4 report. The deadline is December 15th, and I'll have the first draft ready by December 10th for your review.

Let me know if you need anything else!

Best,
Roger

━━━━━━━━━━━━━━━━━━━━━━━━

📁 WORK | ⚡ MEDIUM

[✅ Send] [✏️ Re-write] [🗑️ Discard]
```

---

## 3. DRAFT_REPLY - Re-write Request

### Follow-up Message (after user clicks Re-write)

```
✏️ REWRITE REQUESTED

How would you like me to change the draft?

Examples:
• "Make it more formal"
• "Add that I'll call them tomorrow"
• "Shorter, just confirm the meeting"

Reply with your instructions:
```

### After Receiving Instructions

```
🔄 REGENERATING DRAFT...

Your instructions: "{instructions}"

Please wait while I create a new version...
```

### New Draft Ready

```
📝 REVISED DRAFT (v{version})

━━━━━━━━━━━━━━━━━━━━━━━━

📨 Original Email:
From: {sender_name}
Subject: {subject}

━━━━━━━━━━━━━━━━━━━━━━━━

✏️ Revised Reply:

{new_draft_content}

━━━━━━━━━━━━━━━━━━━━━━━━

Changes: {change_summary}

[✅ Send] [✏️ Re-write] [🗑️ Discard]
```

---

## 4. DRAFT_REPLY - Confirmation Messages

### Send Confirmation

```
✅ EMAIL SENT

Your reply to "{subject}" has been sent successfully.

━━━━━━━━━━━━━━━━━━━━━━━━

📤 Sent to: {recipient}
⏰ Sent at: {timestamp}

🔗 View in Sent folder
```

### Discard Confirmation

```
🗑️ DRAFT DISCARDED

The draft reply to "{subject}" has been discarded.

No email was sent.
```

---

## 5. CALENDAR Action - Event Created

### Message Format

```
📅 CALENDAR EVENT CREATED

━━━━━━━━━━━━━━━━━━━━━━━━

📌 {event_title}

📆 Date: {event_date}
⏰ Time: {event_time}
📍 Location: {event_location}

━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Status: TENTATIVE

Please confirm in Google Calendar:
🔗 View Event

━━━━━━━━━━━━━━━━━━━━━━━━

Source: {email_subject}
From: {sender_name}
```

### Variables

| Variable | Source | Example |
|----------|--------|---------|
| event_title | calendar_events.event_title | "Parent-Teacher Conference" |
| event_date | calendar_events.event_start (formatted) | "Thursday, Dec 5, 2025" |
| event_time | calendar_events.event_start (formatted) | "3:00 PM - 4:00 PM" |
| event_location | calendar_events.event_location | "Room 204, Main Building" |
| email_subject | Email subject | "Conference Schedule" |
| sender_name | Email From header | "Riverside Elementary" |

### Example

```
📅 CALENDAR EVENT CREATED

━━━━━━━━━━━━━━━━━━━━━━━━

📌 Parent-Teacher Conference

📆 Date: Thursday, Dec 5, 2025
⏰ Time: 3:00 PM - 4:00 PM
📍 Location: Room 204, Main Building

━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Status: TENTATIVE

Please confirm in Google Calendar:
🔗 View Event

━━━━━━━━━━━━━━━━━━━━━━━━

Source: Conference Schedule
From: Riverside Elementary
```

---

## 6. SHIPMENT Action - Tracking Added

### Message Format

```
📦 SHIPMENT TRACKED

━━━━━━━━━━━━━━━━━━━━━━━━

🚚 Carrier: {carrier}
📋 Tracking: {tracking_number}

📦 Items:
{items_list}

━━━━━━━━━━━━━━━━━━━━━━━━

📅 Expected: {estimated_delivery}
📊 Status: {delivery_status}

🔗 Track on {carrier}
```

### Variables

| Variable | Source | Example |
|----------|--------|---------|
| carrier | shipments.carrier | "UPS" |
| tracking_number | shipments.tracking_number | "1Z999AA10123456784" |
| items_list | shipments.items (formatted) | "• iPhone 15 Pro Case\n• Screen Protector" |
| estimated_delivery | shipments.estimated_delivery | "Nov 30, 2025" |
| delivery_status | shipments.delivery_status | "In Transit" |

### Example

```
📦 SHIPMENT TRACKED

━━━━━━━━━━━━━━━━━━━━━━━━

🚚 Carrier: UPS
📋 Tracking: 1Z999AA10123456784

📦 Items:
• iPhone 15 Pro Case
• Screen Protector (2-pack)

━━━━━━━━━━━━━━━━━━━━━━━━

📅 Expected: Saturday, Nov 30
📊 Status: In Transit

🔗 Track on UPS
```

---

## 7. Error Messages

### Draft Send Failed

```
❌ SEND FAILED

Unable to send your reply to "{subject}".

Error: {error_message}

The draft has been saved. You can try again:
[🔄 Retry] [🗑️ Discard]
```

### Calendar Event Failed

```
❌ CALENDAR SYNC FAILED

Unable to create calendar event for:
📧 {email_subject}

Error: {error_message}

The event details have been saved. You can create it manually:
📌 {event_title}
📆 {event_date}
```

### Shipment Extraction Failed

```
⚠️ TRACKING NOT FOUND

Unable to extract tracking information from:
📧 {email_subject}

The email has been marked as IGNORE instead.

If you have the tracking number, you can add it manually.
```

---

## Message Formatting Guidelines

### Emoji Usage

| Emoji | Meaning |
|-------|---------|
| 🔔 | Important notification (NOTIFY) |
| 📝 | Draft reply |
| 📅 | Calendar event |
| 📦 | Shipment/package |
| ✅ | Success/confirmed |
| ❌ | Error/failed |
| ⚠️ | Warning/tentative |
| 🗑️ | Discard/delete |
| ✏️ | Edit/re-write |
| 🔗 | Link |
| 📁 | Category |
| ⚡ | Urgency |
| 🎯 | Confidence |
| 💡 | Recommendation |

### Line Separators

Use `━━━━━━━━━━━━━━━━━━━━━━━━` (24 characters) for visual separation.

### Text Length Limits

| Field | Max Length | Truncation |
|-------|------------|------------|
| Summary | 200 chars | Add "..." |
| Draft content | 1000 chars | Add "... (truncated)" |
| Subject | 100 chars | Add "..." |
| Items list | 5 items | Add "• +{n} more items" |
