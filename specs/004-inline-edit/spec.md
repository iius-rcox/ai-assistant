# Feature Specification: Inline Table Editing for Corrections

**Feature Branch**: `004-inline-edit`
**Created**: 2025-11-23
**Status**: Draft
**Input**: User description: "Update the corrections UI. I want to be able to update the corrections without opening a separate screen, I'd like to make changes to the table itself rather than clicking on the item and making changes in the next screen"

## Clarifications

### Session 2025-11-23

- Q: How should the system handle concurrent edits if the same classification is updated by another user or system process? → A: Optimistic locking - detect conflicts on save, notify user, show diff, let user decide (recommended for UX)
- Q: How does the system behave if network connectivity is lost while editing? → A: Auto-save to local storage, retry on reconnect - preserve edits locally, auto-sync when online (best UX)
- Q: What happens when the user's session expires during inline editing? → A: Preserve edits, redirect to login, restore on return - save to local storage before redirect (best balance)
- Q: How does inline editing work on mobile/tablet devices with limited screen space? → A: Modal overlay on mobile, inline on desktop - show edit form in modal on small screens (best UX, responsive)
- Q: What happens when a user navigates away from the page (browser back button, bookmark, etc.) with unsaved changes? → A: beforeunload warning, preserve to storage - show browser warning, save edits locally (standard web practice)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Inline Correction (Priority: P1)

A user reviewing the classification list notices an incorrectly classified email and wants to fix it immediately without navigating away from the table view.

**Why this priority**: This is the core value proposition - reducing friction in the correction workflow by eliminating navigation steps. Users can review and correct classifications in a single view, dramatically improving efficiency.

**Independent Test**: Can be fully tested by clicking on a table row to enter edit mode, changing dropdown values, and saving - all while remaining on the table view. Delivers immediate value by allowing corrections without page navigation.

**Acceptance Scenarios**:

1. **Given** the user is viewing the classification list, **When** they click on any row, **Then** that row enters edit mode with editable dropdown fields for category, urgency, and action
2. **Given** a row is in edit mode, **When** the user changes any classification field, **Then** the changes are immediately visible in the table row
3. **Given** a row has unsaved changes, **When** the user clicks "Save", **Then** the correction is persisted to the database and the row exits edit mode
4. **Given** a row is in edit mode, **When** the user clicks "Cancel" or presses Escape, **Then** the row reverts to display mode without saving changes
5. **Given** a row is in edit mode, **When** the user clicks on a different row, **Then** the system prompts to save or discard unsaved changes before switching rows

---

### User Story 2 - Visual Edit State Feedback (Priority: P2)

A user needs clear visual feedback to understand which row is being edited and what the current state of their changes is.

**Why this priority**: Clear visual feedback prevents confusion and errors during the editing process. Users need to know what's editable, what's changed, and what actions are available.

**Independent Test**: Can be tested by entering edit mode on any row and observing visual changes - highlighted row, visible form controls, and disabled save button until changes are made.

**Acceptance Scenarios**:

1. **Given** a row is in edit mode, **When** the user views the table, **Then** the edited row is visually distinct with highlighting or border emphasis
2. **Given** a row is in edit mode, **When** form fields have unsaved changes, **Then** the Save button is enabled and visually indicates action is required
3. **Given** a row is in edit mode with no changes, **When** the user views the row, **Then** the Save button is disabled to prevent unnecessary saves
4. **Given** the system is saving changes, **When** the save operation is in progress, **Then** a loading indicator is displayed and form controls are disabled
5. **Given** a save operation completes successfully, **When** the row exits edit mode, **Then** a brief success indicator is displayed

---

### User Story 3 - Keyboard-Driven Editing (Priority: P3)

A power user wants to make corrections quickly using keyboard shortcuts without relying on mouse clicks.

**Why this priority**: Keyboard shortcuts significantly improve efficiency for users making multiple corrections. This enhances the experience for frequent users but isn't critical for basic functionality.

**Independent Test**: Can be tested by using Tab/Shift+Tab to navigate between fields, Enter to save, and Escape to cancel - all without using the mouse.

**Acceptance Scenarios**:

1. **Given** a row is in edit mode, **When** the user presses Tab, **Then** focus moves to the next editable field in sequence
2. **Given** a row is in edit mode with valid changes, **When** the user presses Enter, **Then** the changes are saved and the row exits edit mode
3. **Given** a row is in edit mode, **When** the user presses Escape, **Then** the row cancels editing and reverts to display mode
4. **Given** the user is on any row in display mode, **When** they press Enter or Space, **Then** that row enters edit mode

---

### User Story 4 - Batch View Context Retention (Priority: P3)

A user reviewing multiple classifications wants to maintain their current filter, sort, and pagination context while making corrections.

**Why this priority**: Maintaining context prevents frustration from losing one's place when making corrections. However, this is a quality-of-life improvement rather than core functionality.

**Independent Test**: Can be tested by applying filters/sorting, making an inline correction, and verifying that the table view remains unchanged (same page, same sort order, same filters).

**Acceptance Scenarios**:

1. **Given** the user has applied filters and sorting, **When** they save an inline correction, **Then** the current filter and sort state is preserved
2. **Given** the user is on page 3 of results, **When** they make and save a correction, **Then** they remain on page 3 unless the corrected item no longer matches the filter
3. **Given** a corrected item no longer matches active filters, **When** the save completes, **Then** the item is removed from view with a brief notification explaining why

---

### Edge Cases

- What happens when a user tries to edit a row while another row is being saved (pending API call)?
- Concurrent edits are handled via optimistic locking: system detects conflicts on save, notifies user with a diff showing both versions, and lets user choose to overwrite or cancel
- Session expiration is handled by preserving unsaved edits to local storage, redirecting to login, then restoring the edit state after successful re-authentication
- Network connectivity loss is handled by auto-saving edits to local storage and automatically retrying the save when connectivity is restored
- Browser navigation with unsaved changes triggers a beforeunload warning dialog and automatically preserves edits to local storage for recovery if user proceeds
- Mobile and small tablet devices display edit form in a modal overlay for better touch interaction; desktop and large tablets use inline editing within the table row
- What happens when validation fails on save (e.g., database constraint violation)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST convert any classification table row into an editable form when clicked
- **FR-002**: System MUST display dropdown controls for category, urgency, and action fields in edit mode
- **FR-003**: System MUST preserve the table layout and column structure when switching between display and edit modes
- **FR-004**: System MUST provide Save and Cancel buttons/actions for rows in edit mode
- **FR-005**: System MUST validate changes before allowing save (all required fields must have valid values)
- **FR-006**: System MUST persist corrections to the database when Save is triggered
- **FR-007**: System MUST track correction metadata (corrected_timestamp, corrected_by) when saving inline edits
- **FR-008**: System MUST prevent editing multiple rows simultaneously - only one row can be in edit mode at a time
- **FR-009**: System MUST prompt users to save or discard changes when attempting to edit a different row with unsaved changes
- **FR-010**: System MUST display visual feedback for edit state (highlighting, borders, or background color change)
- **FR-011**: System MUST disable Save button when no changes have been made in edit mode
- **FR-012**: System MUST show loading state during save operations and prevent additional edits
- **FR-013**: System MUST display success feedback after successful save
- **FR-014**: System MUST display error feedback if save fails with user-friendly error message
- **FR-015**: System MUST allow users to cancel editing and revert to original values
- **FR-016**: System MUST preserve current pagination, sorting, and filter state when saving inline edits
- **FR-017**: Users MUST be able to use Enter key to save changes and Escape key to cancel editing
- **FR-018**: Users MUST be able to use Tab/Shift+Tab to navigate between form fields in edit mode
- **FR-019**: System MUST attach beforeunload event handler when unsaved changes exist to warn users attempting to navigate away
- **FR-020**: System MUST maintain consistent email data display (subject, sender, timestamp) in both display and edit modes
- **FR-021**: System MUST detect concurrent modification conflicts using optimistic locking (version checking)
- **FR-022**: System MUST notify users when a save conflict occurs and display a comparison of their changes versus the current database state
- **FR-023**: System MUST allow users to choose whether to overwrite conflicting changes or cancel their edit when conflicts are detected
- **FR-024**: System MUST automatically save unsaved edits to local storage when network connectivity is lost
- **FR-025**: System MUST detect when network connectivity is restored and automatically retry failed save operations
- **FR-026**: System MUST display offline status indicator when network connectivity is unavailable
- **FR-027**: System MUST restore locally-stored edits when user returns to the page after network interruption
- **FR-028**: System MUST preserve unsaved edits to local storage when session expiration is detected
- **FR-029**: System MUST redirect users to authentication when session expires
- **FR-030**: System MUST restore edit state and unsaved changes after successful re-authentication
- **FR-031**: System MUST detect screen size and display mode (mobile vs desktop)
- **FR-032**: System MUST show edit form in modal overlay on mobile devices (screen width < 768px)
- **FR-033**: System MUST show inline editing within table row on desktop and large tablets (screen width >= 768px)
- **FR-034**: System MUST adapt touch targets for mobile to minimum 44x44px tap area
- **FR-035**: System MUST save unsaved changes to local storage before beforeunload event completes
- **FR-036**: System MUST restore edits from local storage when user returns after navigating away

### Key Entities

- **Classification Row**: Represents a single classification in the table with two states:
  - **Display Mode**: Read-only view showing all classification data with click-to-edit interaction
  - **Edit Mode**: Editable form with dropdown controls, save/cancel actions, and validation feedback (inline on desktop, modal on mobile)

- **Inline Edit State**: Tracks the current editing session:
  - Active row ID (which row is being edited)
  - Original values (for revert on cancel)
  - Original version identifier (for conflict detection)
  - Modified values (current form state)
  - Unsaved changes flag
  - Validation status
  - Save operation status (idle, saving, success, error, conflict, offline)
  - Local storage backup (for offline resilience and session recovery)
  - Return URL (for post-authentication redirect)
  - Display mode (inline vs modal based on screen size)
  - beforeunload handler status (attached/detached)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a correction in under 5 seconds from clicking a row to saving changes (vs. 15+ seconds with the current navigation-based flow)
- **SC-002**: 90% reduction in clicks required to make a correction (from 3+ clicks to 1 click to enter edit mode + 1 click to save)
- **SC-003**: Zero page navigations required to make a single correction
- **SC-004**: Users can review and correct 10 classifications within 2 minutes
- **SC-005**: Save operations complete in under 2 seconds with visual feedback
- **SC-006**: Zero data loss from unsaved changes due to accidental navigation (beforeunload + local storage prevents all data loss)
- **SC-007**: 100% of corrections maintain current table context (filters, sorting, pagination preserved)
- **SC-008**: Keyboard-only users can complete full correction workflow without mouse interaction
- **SC-009**: Zero data loss from concurrent edits (all conflicts detected and resolved explicitly by users)
- **SC-010**: Zero data loss from network interruptions (all edits preserved locally and auto-synced on reconnect)
- **SC-011**: Zero data loss from session expiration (all edits preserved and restored after re-authentication)
- **SC-012**: Mobile users can complete corrections with same functionality as desktop (modal provides equivalent editing experience)
