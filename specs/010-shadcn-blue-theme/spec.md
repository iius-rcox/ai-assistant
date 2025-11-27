# Feature Specification: Shadcn Blue Theme and Pagination Refactor

**Feature Branch**: `010-shadcn-blue-theme`
**Created**: 2025-11-26
**Status**: Draft
**Input**: User description: "Refactor the frontend to use the shadcn blue theme with specific CSS custom properties for light and dark modes, and refactor pagination to use shadcn Pagination component pattern"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Application in Light Mode (Priority: P1)

Users viewing the email classification application in light mode see a clean, professional blue-themed interface that replaces the current purple Material Design palette.

**Why this priority**: The light theme is the default viewing experience for most users and establishes the primary visual identity of the application.

**Independent Test**: Can be fully tested by loading the application in a browser with light theme selected and verifying all UI elements display with the new blue color palette.

**Acceptance Scenarios**:

1. **Given** a user opens the application in light mode, **When** the page loads, **Then** the primary color is blue (hsl(221.2, 83.2%, 53.3%)) and background is white
2. **Given** a user views buttons and interactive elements, **When** they hover over them, **Then** the hover states use the blue accent color appropriately
3. **Given** a user views form inputs, **When** they focus on an input, **Then** the focus ring uses the primary blue color

---

### User Story 2 - View Application in Dark Mode (Priority: P1)

Users viewing the email classification application in dark mode see a cohesive dark interface with the blue accent that maintains readability and reduces eye strain.

**Why this priority**: Dark mode is essential for user comfort and is used by a significant portion of users, especially for email management tools.

**Independent Test**: Can be fully tested by toggling to dark theme and verifying all UI elements display with appropriate dark mode colors while maintaining the blue accent.

**Acceptance Scenarios**:

1. **Given** a user switches to dark mode, **When** the theme transitions, **Then** the background changes to dark blue (hsl(222.2, 84%, 4.9%)) and text becomes light
2. **Given** a user views data tables in dark mode, **When** they scan email classifications, **Then** text contrast meets readability standards
3. **Given** a user views category badges in dark mode, **When** they identify email categories, **Then** badges remain distinguishable with appropriate contrast

---

### User Story 3 - Navigate Email Classifications with Pagination (Priority: P1)

Users navigating large lists of email classifications can move between pages using an intuitive pagination component with previous/next navigation and page number links.

**Why this priority**: Pagination is essential for usability when managing large volumes of emails. Users need efficient navigation to find and review classifications.

**Independent Test**: Can be tested by loading a dataset with more than one page of results and verifying all pagination controls function correctly.

**Acceptance Scenarios**:

1. **Given** a user views a list with multiple pages, **When** they look at the pagination controls, **Then** they see Previous button, page number links, and Next button in a consistent layout
2. **Given** a user is on page 1, **When** they click the Next button, **Then** the next page of results loads and the page indicator updates
3. **Given** a user is on the last page, **When** they view the Next button, **Then** it is visually disabled and non-interactive
4. **Given** a user views a list with many pages, **When** they see the pagination, **Then** an ellipsis indicates hidden page numbers between visible page links
5. **Given** a user clicks a specific page number link, **When** the page loads, **Then** that page number is visually highlighted as the current page

---

### User Story 4 - Smooth Theme Transition (Priority: P2)

Users experience smooth visual transitions when switching between light and dark modes without jarring color changes.

**Why this priority**: Smooth transitions enhance the perceived quality of the application and prevent disorientation when switching themes.

**Independent Test**: Can be tested by toggling the theme toggle button and observing the transition animation between themes.

**Acceptance Scenarios**:

1. **Given** a user is viewing the application in light mode, **When** they click the theme toggle, **Then** colors transition smoothly over the configured duration
2. **Given** a user has motion preferences set to "reduce motion", **When** they switch themes, **Then** the transition happens instantly without animation

---

### User Story 5 - View Charts with Theme-Appropriate Colors (Priority: P2)

Users viewing analytics charts see data visualizations that use the new theme-consistent chart colors and remain readable in both light and dark modes.

**Why this priority**: Charts are a key feature for understanding email classification patterns and must be visually consistent with the theme.

**Independent Test**: Can be tested by navigating to the analytics page and verifying chart colors match the theme specification.

**Acceptance Scenarios**:

1. **Given** a user views the analytics dashboard in light mode, **When** charts render, **Then** they use the specified chart color palette (chart-1 through chart-5)
2. **Given** a user views the analytics dashboard in dark mode, **When** charts render, **Then** they use the dark mode chart color palette with appropriate contrast

---

### Edge Cases

- What happens when a user has a browser that doesn't support CSS custom properties? Fallback colors should be provided.
- How does the system handle users who have system-level theme preferences? The application should respect prefers-color-scheme when no explicit preference is set.
- What happens to saved theme preferences during the migration? Existing localStorage theme preferences should continue to work.
- What happens when there is only one page of results? Pagination controls should either be hidden or show a minimal state.
- What happens when results span many pages (e.g., 50+ pages)? Ellipsis should appear to truncate page numbers while showing first, last, and nearby pages.
- How does pagination behave during page transitions? Loading states should be communicated visually.

## Requirements *(mandatory)*

### Functional Requirements - Theme

- **FR-001**: System MUST replace all Material Design 3 color tokens with shadcn blue theme equivalents
- **FR-002**: System MUST provide complete light mode color definitions matching the shadcn blue specification
- **FR-003**: System MUST provide complete dark mode color definitions matching the shadcn blue specification
- **FR-004**: System MUST maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text) for all color combinations
- **FR-005**: System MUST preserve the existing theme toggle functionality
- **FR-006**: System MUST preserve the existing theme transition animation behavior
- **FR-007**: System MUST update chart colors (chart-1 through chart-5) for both light and dark modes
- **FR-008**: System MUST maintain visual distinction between email category badges (KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, CHURCH, OTHER)
- **FR-009**: System MUST maintain visual distinction between urgency levels (HIGH, MEDIUM, LOW)
- **FR-010**: System MUST preserve all existing legacy token aliases for backward compatibility

### Functional Requirements - Pagination

- **FR-011**: System MUST provide a reusable Pagination component following the shadcn component pattern
- **FR-012**: Pagination component MUST include PaginationPrevious control for navigating to the previous page
- **FR-013**: Pagination component MUST include PaginationNext control for navigating to the next page
- **FR-014**: Pagination component MUST include PaginationLink elements for direct page navigation
- **FR-015**: Pagination component MUST include PaginationEllipsis to indicate truncated page ranges
- **FR-016**: Pagination component MUST visually indicate the current/active page
- **FR-017**: Previous control MUST be disabled when on the first page
- **FR-018**: Next control MUST be disabled when on the last page
- **FR-019**: Pagination component MUST display page count information (e.g., "Showing 1-25 of 100")
- **FR-020**: Pagination component MUST support keyboard navigation for accessibility
- **FR-021**: Pagination component MUST adapt to the current theme (light/dark mode)

### Key Entities

- **CSS Custom Properties**: Design tokens that define colors, including background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, and chart colors
- **Theme Files**: Separate CSS files for light and dark theme definitions
- **Token Contract**: The interface defining all required CSS custom properties that themes must implement
- **Pagination Component**: A reusable component with sub-components (PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis)
- **Page State**: Current page number, total pages, items per page, total item count

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All text content maintains a minimum 4.5:1 contrast ratio against backgrounds in both themes
- **SC-002**: Users can complete the light/dark theme toggle with visual feedback within 300ms
- **SC-003**: 100% of existing UI components render correctly with the new color palette (no visual regressions)
- **SC-004**: Category and urgency badges remain distinguishable at a glance (users can identify categories within 1 second)
- **SC-005**: Charts display with theme-appropriate colors that differentiate all 5 data series
- **SC-006**: Users can navigate to any page within 2 clicks (previous/next or direct page link)
- **SC-007**: Pagination controls are fully keyboard accessible (Tab, Enter, Arrow keys work as expected)
- **SC-008**: Pagination state persists correctly when switching between themes

## Assumptions

- The existing theme architecture (tokens.css, light.css, dark.css, base.css) will be preserved and updated rather than replaced
- The application-specific extended colors (category badges, urgency indicators) will be adapted to complement the new blue palette
- All components currently using CSS custom properties will automatically adopt the new colors
- The shadcn blue theme values provided by the user are the definitive specification
- The Pagination component will be implemented as a Vue 3 component following shadcn patterns, not installed via shadcn CLI (since shadcn/ui is React-based)
- Existing pagination functionality (page size selection, page navigation) will be preserved and enhanced
- The Pagination component will use Vue Router or emit events rather than href-based navigation for SPA behavior

## Out of Scope

- Adding new theme options beyond light and dark
- Modifying the theme toggle component behavior (beyond style updates)
- Changes to data fetching logic for pagination
- Server-side pagination implementation changes
- Adding infinite scroll as an alternative to pagination
- Installing shadcn/ui library directly (will implement Vue-compatible equivalents)
