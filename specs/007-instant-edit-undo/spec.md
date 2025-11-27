# Feature Specification: Instant Edit with Undo

**Feature Branch**: `007-instant-edit-undo`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Refactor the front end UI changes. I do not want a confirmation step, once I make the change it should make the change immediately with an undo button"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Save on Selection (Priority: P1)

When a user changes a classification field (category, urgency, or action) from a dropdown, the change saves immediately to the database without requiring a confirmation step or "Save" button click.

**Why this priority**: This is the core behavior change requested - removing friction from the editing workflow. Users expect modern applications to auto-save changes instantly.

**Independent Test**: Can be fully tested by selecting a new value from any classification dropdown and verifying the database updates immediately without additional user action.

**Acceptance Scenarios**:

1. **Given** a classification row is displayed, **When** the user selects a different category from the dropdown, **Then** the change saves to the database immediately without showing a confirmation dialog or requiring a save button click
2. **Given** a classification row is displayed, **When** the user selects a different urgency level, **Then** the change saves immediately and a brief visual indicator confirms the save succeeded
3. **Given** multiple fields need changing, **When** the user changes each field in sequence, **Then** each change saves independently and immediately upon selection

---

### User Story 2 - Undo Recent Changes (Priority: P1)

After an instant save completes, users can undo the change using a clearly visible undo button or action. The undo option remains available for a reasonable time window.

**Why this priority**: Equal priority with instant save since undo is the safety net that makes instant save acceptable. Without undo, users would be anxious about accidental changes.

**Independent Test**: Can be tested by making a change, then clicking the undo button and verifying the original value is restored in both the UI and database.

**Acceptance Scenarios**:

1. **Given** a change was just saved, **When** the user clicks the undo button within the undo window, **Then** the previous value is restored in the database and UI
2. **Given** a change was saved 30 seconds ago, **When** the undo window has not expired, **Then** the undo option is still available
3. **Given** the undo window has expired, **When** the user looks for the undo option, **Then** the undo option is no longer available for that change

---

### User Story 3 - Visual Feedback During Save (Priority: P2)

Users receive clear visual feedback showing that their change is being saved, has saved successfully, or encountered an error.

**Why this priority**: Important for user confidence but secondary to the core save/undo functionality. Users need to know the system is responding.

**Independent Test**: Can be tested by making changes and observing visual feedback states (saving, saved, error).

**Acceptance Scenarios**:

1. **Given** a user selects a new value, **When** the save is in progress, **Then** a brief loading indicator appears on the field
2. **Given** the save completes successfully, **When** the save finishes, **Then** a success indicator briefly appears (checkmark or highlight)
3. **Given** the save fails, **When** an error occurs, **Then** an error message displays with option to retry

---

### User Story 4 - Keyboard Shortcuts for Undo (Priority: P3)

Power users can undo changes using standard keyboard shortcuts (Ctrl+Z / Cmd+Z).

**Why this priority**: Enhancement for power users after core functionality is complete.

**Independent Test**: Can be tested by making a change, pressing Ctrl+Z, and verifying the undo occurs.

**Acceptance Scenarios**:

1. **Given** a change was just made, **When** the user presses Ctrl+Z (Windows) or Cmd+Z (Mac), **Then** the change is undone
2. **Given** no recent changes exist, **When** the user presses the undo shortcut, **Then** nothing happens (no error)

---

### Edge Cases

- What happens when the network is unavailable during save? System should retry and show error if retry fails, keeping the undo option until resolution.
- What happens when another user modified the same record? System should detect the conflict and offer resolution options (keep mine, use theirs, or merge).
- What happens when the user makes multiple rapid changes? Each change should queue and save in order, with undo available for the most recent change.
- What happens if undo fails? System should show error message and allow retry of the undo operation.
- What happens when user navigates away before undo window expires? Pending undo state should be cleared.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST save classification changes immediately when a dropdown value is selected
- **FR-002**: System MUST NOT show confirmation dialogs before saving field changes
- **FR-003**: System MUST provide an undo button/action after each successful save
- **FR-004**: System MUST maintain undo capability for a configurable time window (default: 30 seconds)
- **FR-005**: System MUST show a brief saving indicator while the save is in progress
- **FR-006**: System MUST show a success indicator when save completes
- **FR-007**: System MUST show error message with retry option if save fails
- **FR-008**: System MUST restore the previous value when undo is triggered
- **FR-009**: System MUST save the undo (restore operation) to the database immediately
- **FR-010**: System MUST support standard keyboard shortcuts for undo (Ctrl+Z / Cmd+Z)
- **FR-011**: System MUST handle concurrent edits using existing optimistic locking mechanism
- **FR-012**: System MUST clear undo state when user navigates away from the page
- **FR-013**: System MUST show undo option in a toast notification with "Change saved" message and Undo button; toast auto-dismisses after 30 seconds
- **FR-014**: System MUST support undo for bulk operations (when multiple rows are changed at once)

### Key Entities

- **UndoEntry**: Represents a single undoable action containing the record ID(s), field(s) changed, previous value(s), new value(s), and timestamp. Only one UndoEntry exists at a time (single-level undo); a new change replaces the previous entry.
- **UndoState**: Manages the current UndoEntry and its expiration timer (30-second window)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a single field change in under 2 seconds (down from current 5+ seconds with confirmation)
- **SC-002**: Undo success rate is 99%+ when triggered within the undo window
- **SC-003**: Visual feedback appears within 100ms of user action
- **SC-004**: 90% of users can successfully undo a change on first attempt without help
- **SC-005**: Zero data loss from accidental changes due to undo availability
- **SC-006**: Page interactions remain smooth with no perceptible lag during save operations

## Clarifications

### Session 2025-11-25

- Q: Should undo support multiple sequential changes, or strictly only the most recent single change? → A: Single-level only: undo reverts only the most recent change (bulk counts as one)
- Q: Where should the undo action appear after a successful save? → A: Toast notification with Undo button, auto-dismisses after 30s

## Assumptions

- The existing toast notification system can be extended to include action buttons (for undo)
- The existing optimistic locking mechanism is sufficient for conflict detection
- Network latency is typically under 500ms for database operations
- Users are familiar with standard undo patterns (Ctrl+Z, undo buttons)
- The 30-second undo window provides adequate time for users to recognize mistakes
- Single-level undo (most recent change only) is acceptable for MVP; a new change replaces the previous undo entry
