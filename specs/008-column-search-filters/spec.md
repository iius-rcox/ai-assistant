# Feature Specification: Column Search Filters

**Feature Branch**: `008-column-search-filters`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Add text search bars at the top of each column of the table for quick filtering. Also increase the default rows per page to 50"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Column Filtering (Priority: P1)

As a user reviewing email classifications, I want to type into search fields at the top of each column so that I can quickly filter the table to show only rows matching my criteria without navigating away from the table.

**Why this priority**: This is the core feature request. Column-level filtering is essential for users managing large datasets who need to quickly narrow down results by specific field values (e.g., finding all emails from a particular sender or with a specific category).

**Independent Test**: Can be fully tested by entering text in a column search field and verifying that only matching rows appear. Delivers immediate value for data filtering workflows.

**Acceptance Scenarios**:

1. **Given** the classifications table is displayed with data, **When** the user types "john" in the Sender column search field, **Then** only rows where the sender contains "john" (case-insensitive) are displayed.
2. **Given** the user has entered search text in the Subject column, **When** the user clears the search field, **Then** all rows (respecting other active filters) are displayed again.
3. **Given** the user is viewing the table on a mobile device, **When** the column headers display, **Then** search fields are appropriately sized for touch interaction.

---

### User Story 2 - Multi-Column Filtering (Priority: P1)

As a user with complex filtering needs, I want to filter by multiple columns simultaneously so that I can combine criteria (e.g., emails from "amazon" with category "SHOPPING").

**Why this priority**: Multi-column filtering significantly increases the utility of column search. Without it, users would have to filter one column at a time, reducing productivity.

**Independent Test**: Can be fully tested by entering search terms in two or more column search fields and verifying the combined filter effect. Delivers compound filtering capability.

**Acceptance Scenarios**:

1. **Given** the classifications table is displayed, **When** the user types "amazon" in Sender and "SHOPPING" in Category search fields, **Then** only rows matching BOTH criteria are displayed.
2. **Given** multiple column filters are active, **When** the user clears one column filter, **Then** the remaining column filters continue to apply.
3. **Given** multiple column filters result in zero matches, **When** the table updates, **Then** an appropriate empty state message is displayed with an option to clear all column filters.

---

### User Story 3 - Increased Default Pagination (Priority: P2)

As a user reviewing classifications, I want the table to display 50 rows by default instead of 20 so that I can see more data without changing pagination settings.

**Why this priority**: This is a simple configuration change that improves the default user experience. Lower priority than filtering functionality since it doesn't add new capabilities.

**Independent Test**: Can be tested by loading the classifications page fresh and verifying 50 rows display by default. Delivers improved data visibility.

**Acceptance Scenarios**:

1. **Given** a user opens the classifications table for the first time, **When** the table loads, **Then** 50 rows are displayed by default (if sufficient data exists).
2. **Given** a user has previously changed the page size to 100, **When** the user returns to the page, **Then** their preference of 100 is preserved.
3. **Given** fewer than 50 classifications exist, **When** the table loads, **Then** all available rows are shown without pagination issues.

---

### User Story 4 - Visual Filter Feedback (Priority: P2)

As a user filtering the table, I want clear visual indicators showing which columns have active filters so that I can understand the current filter state at a glance.

**Why this priority**: Visual feedback enhances usability but isn't strictly required for the filtering to function. Users can still filter effectively without indicators.

**Independent Test**: Can be tested by entering search text and verifying visual indicators appear. Delivers improved filter state awareness.

**Acceptance Scenarios**:

1. **Given** the user has entered text in the Subject column search field, **When** the filter is active, **Then** the search field displays a visual indicator (e.g., highlighted border or clear button).
2. **Given** multiple columns have active filters, **When** the user views the table header, **Then** a summary indicator shows the number of active column filters.
3. **Given** all column filters are cleared, **When** the user views the table header, **Then** no filter indicators are displayed.

---

### Edge Cases

- What happens when the user types very rapidly in search fields? Debouncing prevents excessive filtering operations (see FR-013).
- How does the system handle special characters in search queries? Special characters are treated literally, not as regex patterns.
- What happens when a column search conflicts with the existing global search? Both apply together - column search narrows results within global search results.
- How does the system behave when the user pastes a long text string? Input is truncated to 100 characters maximum (COLUMN_FILTER_CONFIG.MAX_FILTER_LENGTH) without performance issues.
- What happens if a user enters text while data is still loading? Search applies once data finishes loading.
- How does column search interact with existing sidebar filters? Both work together (AND logic) - column search further narrows sidebar-filtered results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a text input field below each filterable column header (Subject, Sender, Category, Urgency, Action)
- **FR-002**: System MUST filter table rows in real-time as the user types in column search fields
- **FR-003**: System MUST apply case-insensitive substring matching for text searches
- **FR-004**: System MUST support filtering multiple columns simultaneously with AND logic between columns
- **FR-005**: System MUST preserve column filter state when switching pages within the table
- **FR-006**: System MUST provide a clear/reset mechanism for each column search field when text is present
- **FR-007**: System MUST display the default page size of 50 rows for new users
- **FR-008**: System MUST preserve user's page size preference if previously changed (via localStorage)
- **FR-009**: Users MUST be able to see a visual indicator when a column filter is active (highlighted border or icon)
- **FR-010**: System MUST display appropriate empty state when no rows match the combined filters with a "Clear Column Filters" action
- **FR-011**: System MUST support keyboard navigation (Tab) to/from column search fields
- **FR-012**: System MUST compound column filters with existing global search (both apply together)
- **FR-013**: System MUST debounce rapid keystrokes (300ms delay) to prevent excessive filtering operations
- **FR-014**: System MUST provide appropriately sized touch targets (minimum 44x44 pixels) on mobile devices
- **FR-015**: System MUST provide a mobile-specific filter interface (bottom sheet modal) when screen width is below 768px, with filter row hidden from the main table view

### Key Entities

- **Column Filter State**: Current search text for each filterable column (Subject, Sender, Category, Urgency, Action); empty string means no filter
- **Filter Configuration**: Defines which columns support text search filtering; columns: Subject (text), Sender (text), Category (exact or contains), Urgency (exact or contains), Action (exact or contains)
- **User Preferences**: Default page size setting (50); stored in localStorage for persistence across sessions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can filter the table by any combination of columns within 500 milliseconds of stopping typing
- **SC-002**: Default page size displays 50 rows on first visit when sufficient data exists
- **SC-003**: Column search fields are discoverable and usable within 10 seconds of viewing the table (positioned in clear, expected location under headers)
- **SC-004**: Column filtering works correctly on displays from mobile (320px width) to desktop (2560px width)
- **SC-005**: System maintains responsive performance (<100ms render time per filter application) when filtering datasets of 1000+ loaded rows
- **SC-006**: Search input fields meet accessibility standards including proper labels, focus indicators, and screen reader compatibility

## Assumptions

- Column search filters apply client-side filtering on already-loaded/paginated data, consistent with existing global search behavior
- The existing SearchInput component pattern can be adapted or a new ColumnSearchInput component can be created
- Non-text columns (Confidence, Classified timestamp) are better served by existing range/date filter controls in the sidebar, so they won't have column search
- The Checkbox and Status columns are not data columns and won't have search filters
- Mobile view may display column search fields in a row below column headers or as expandable fields due to limited horizontal space
- The 50-row default page size applies only to new users; existing users retain their previously selected preference
