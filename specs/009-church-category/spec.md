# Feature Specification: Add Church Category

**Feature Branch**: `009-church-category`
**Created**: 2025-11-26
**Status**: Implemented
**Input**: User description: "Add Church as a category to the frontend and backend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classify Church-Related Emails (Priority: P1)

As a user receiving church-related emails (service times, ministry updates, volunteer schedules, donation receipts), I want the system to classify these emails under a dedicated "CHURCH" category so they are properly organized and easily identifiable.

**Why this priority**: Church communications are a distinct category of personal emails that don't fit well into existing categories (KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER). Having a dedicated category improves classification accuracy and user experience.

**Independent Test**: Can be fully tested by sending a church-related email through the classification workflow and verifying it receives the CHURCH category.

**Acceptance Scenarios**:

1. **Given** an email from a church organization (e.g., announcements, ministry updates), **When** the AI classification workflow processes it, **Then** it can be classified as CHURCH category
2. **Given** the classification list view, **When** a user views emails categorized as CHURCH, **Then** they see the appropriate purple badge color
3. **Given** the category dropdown in the UI, **When** a user clicks to edit a classification, **Then** CHURCH appears as a selectable option

---

### User Story 2 - Manually Correct to Church Category (Priority: P2)

As a user reviewing email classifications, I want to be able to manually change any email's category to CHURCH so I can correct misclassified church-related emails.

**Why this priority**: Users need the ability to correct AI classifications when church emails are miscategorized.

**Independent Test**: Can be tested by selecting any email and changing its category to CHURCH using the inline dropdown.

**Acceptance Scenarios**:

1. **Given** an email incorrectly classified as OTHER, **When** I click the category dropdown and select CHURCH, **Then** the classification is updated immediately
2. **Given** the mobile edit modal, **When** I edit an email's category, **Then** CHURCH is available in the dropdown options

---

### User Story 3 - Filter by Church Category (Priority: P3)

As a user, I want to filter the classification list to show only CHURCH emails so I can quickly review all church-related communications.

**Why this priority**: Filtering capability allows users to focus on specific categories.

**Independent Test**: Can be tested by selecting CHURCH in the category filter and verifying only CHURCH emails appear.

**Acceptance Scenarios**:

1. **Given** multiple emails with various categories including CHURCH, **When** I filter by CHURCH category, **Then** only CHURCH-categorized emails are displayed
2. **Given** the bulk action toolbar, **When** I select multiple emails and apply CHURCH category, **Then** all selected emails are updated to CHURCH

---

### Edge Cases

- What happens when searching for "CHURCH" in the category filter? The search should match the category.
- How does the system display CHURCH in analytics/charts? It should have a distinct purple color (#7B1FA2 light / #CE93D8 dark).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST include CHURCH as a valid email classification category
- **FR-002**: System MUST display CHURCH in all category dropdowns (inline edit, mobile modal, bulk actions)
- **FR-003**: System MUST apply consistent badge styling for CHURCH category (purple theme)
- **FR-004**: System MUST allow filtering by CHURCH category in the classification list
- **FR-005**: System MUST validate CHURCH as a valid category value in form submissions
- **FR-006**: System MUST include CHURCH in analytics charts and pie chart color schemes
- **FR-007**: Backend AI classification workflow MUST recognize and assign CHURCH category to relevant emails

### Key Entities

- **Category Enum**: Extended to include CHURCH value alongside KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
- **Classification**: Database type definitions updated to accept CHURCH as valid category value

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: CHURCH category appears in all 7 category dropdown locations in the UI
- **SC-002**: Users can successfully save CHURCH as a category without validation errors
- **SC-003**: CHURCH badge displays with correct purple color in both light and dark themes
- **SC-004**: AI classification workflow can assign CHURCH category to church-related emails
- **SC-005**: Application builds successfully with no TypeScript errors after category addition

## Implementation Notes

This feature has been **fully implemented** across the following files:

### Frontend (correction-ui)
- `src/types/enums.ts` - Added CHURCH to CATEGORIES array and CATEGORY_LABELS
- `src/constants/enums.ts` - Added CHURCH to CATEGORIES array
- `src/types/database.types.ts` - Added CHURCH to Row, Insert, Update category types
- `src/components/ClassificationList.vue` - Added CHURCH option and badge styles
- `src/components/MobileEditModal.vue` - Added CHURCH option
- `src/components/BulkActionToolbar.vue` - Added badge-church CSS class
- `src/composables/useChartTheme.ts` - Added CHURCH chart color
- `src/assets/themes/light.css` - Added CHURCH badge CSS variables
- `src/assets/themes/dark.css` - Added CHURCH badge CSS variables
- `src/assets/themes/tokens.css` - Added CHURCH CSS variable declarations

### Backend (n8n Classification-Workflow)
- AI Agent system prompt updated to include CHURCH as valid category
- Structured Output Parser schema includes CHURCH in category enum

### Assumptions

- CHURCH category is positioned before OTHER in dropdown lists (alphabetical by convention, OTHER always last)
- Purple color scheme (#7B1FA2 light, #CE93D8 dark) chosen to differentiate from other categories
- Label displays as "Church & Faith" in full label format
