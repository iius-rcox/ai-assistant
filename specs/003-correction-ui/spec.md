# Feature Specification: Email Classification Correction UI

**Feature Branch**: `003-correction-ui`
**Created**: 2025-11-22
**Status**: Draft
**Input**: User description: "Build a locally hosted UI for corrections"

## Clarifications

### Session 2025-11-22

- Q: How should the UI securely store and access Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY)? → A: Environment variables with .env file (ignored from git)
- Q: Should the UI log errors and user actions for debugging purposes? → A: Browser console logging only (development-friendly, no infrastructure)
- Q: Should the UI support keyboard-only navigation (tab, arrow keys, enter/escape)? → A: Basic keyboard support (tab navigation, enter to submit, escape to cancel)
- Q: How should the UI be hosted and deployed for persistent access? → A: Package as Docker container for deployment to Unraid server on local network (added as P4 user story)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review and Correct Classifications (Priority: P1)

As a system operator reviewing email classifications, I need a simple web interface where I can see recent classifications with the original email content, so I can quickly identify and correct any misclassifications by changing the category, urgency, or action fields. The corrections are immediately saved to the database and logged for AI learning.

**Why this priority**: This replaces the current Supabase dashboard workflow with a purpose-built interface optimized for correction tasks. Reduces friction in the feedback loop and enables faster AI improvement.

**Independent Test**: Can be fully tested by launching the local web UI, viewing a list of recent classifications with email preview, editing any field, and verifying the correction is saved to the database and logged in correction_logs table. Delivers immediate value by making corrections 3-5x faster than using Supabase UI.

**Acceptance Scenarios**:

1. **Given** 20 recent email classifications exist in the database, **When** I open the correction UI homepage, **Then** I see a paginated list showing subject, sender, category, urgency, action, confidence score, and timestamp for each email
2. **Given** I'm viewing the classification list, **When** I click on an email entry, **Then** I see the full email content (subject, sender, body preview), current classification fields (category/urgency/action), confidence score, and inline edit controls
3. **Given** I'm viewing an email's classification detail, **When** I change the category from SHOPPING to WORK and click Save, **Then** the classification is updated in the database, a correction log entry is created, and I see a success confirmation
4. **Given** I just corrected a classification, **When** I return to the list view, **Then** the updated classification is reflected and the entry is visually marked as "corrected" with a timestamp

---

### User Story 2 - Filter and Search Classifications (Priority: P2)

As a system operator performing weekly reviews, I need to filter classifications by confidence score, date range, category, and correction status, so I can focus my review efforts on low-confidence classifications, recent emails, or specific categories that need attention.

**Why this priority**: Improves review efficiency by enabling targeted correction sessions. Without filters, users must review all emails sequentially which wastes time on high-confidence, correctly classified emails.

**Independent Test**: Can be tested by applying filters (e.g., "confidence < 0.7", "category = OTHER", "corrected = false") and verifying only matching classifications appear in the list. Delivers value by reducing review time by 50-70%.

**Acceptance Scenarios**:

1. **Given** 100 classifications exist with varying confidence scores, **When** I filter by "confidence < 0.7", **Then** I see only classifications with confidence scores below 0.7, sorted by confidence ascending
2. **Given** classifications exist across all 6 categories, **When** I filter by "category = OTHER", **Then** I see only emails classified as OTHER (catch-all category most likely to need correction)
3. **Given** some classifications have been corrected and others haven't, **When** I filter by "corrected = false", **Then** I see only classifications that haven't been manually reviewed and corrected
4. **Given** I'm viewing filtered results, **When** I clear all filters, **Then** I see the full unfiltered list of recent classifications

---

### User Story 3 - View Correction History (Priority: P3)

As a system operator monitoring AI improvement, I need to view correction history and statistics (most frequently corrected categories, correction rate over time, common correction patterns) so I can identify systematic classification issues and update the AI prompt accordingly.

**Why this priority**: Enables data-driven AI improvement by surfacing patterns in corrections. Nice-to-have analytics that support long-term learning but not required for basic correction workflow.

**Independent Test**: Can be tested by navigating to an analytics/history page and verifying it displays correction statistics (e.g., "15 corrections from SHOPPING to WORK", "correction rate: 8%", "most corrected category: OTHER"). Delivers value by eliminating need to write SQL queries for correction analysis.

**Acceptance Scenarios**:

1. **Given** correction logs exist in the database, **When** I navigate to the History page, **Then** I see summary statistics: total corrections, correction rate %, most frequently corrected category, and corrections over time (last 30 days)
2. **Given** multiple corrections exist with the same original→corrected pattern, **When** I view the correction patterns table, **Then** I see rows like "SHOPPING → WORK (15 occurrences)" sorted by frequency descending
3. **Given** corrections have been made across different time periods, **When** I view the correction timeline chart, **Then** I see a line or bar chart showing corrections per week for the last 8 weeks
4. **Given** I identify a pattern (e.g., 15 SHOPPING→WORK corrections), **When** I click on the pattern, **Then** I see a list of specific emails involved with sender addresses and subjects to inform prompt updates

---

### User Story 4 - Package and Deploy to Unraid Server (Priority: P4)

As a system operator who wants persistent access to the correction UI, I need the application packaged as a Docker container that can be deployed to my Unraid server, so I can access the correction interface from any device on my network without manually starting a development server each time.

**Why this priority**: Provides convenient always-on access to correction UI from multiple devices (laptop, phone, tablet) on the local network. Builds on P1-P3 functionality without changing core features. Lower priority than core correction workflow but valuable for daily usage.

**Independent Test**: Can be tested by building Docker image, deploying to Unraid server as a container, accessing UI via http://unraid-server-ip:PORT from browser on local network, and verifying all correction workflows (list, edit, save, filter, analytics) function identically to local development mode. Delivers value by eliminating need to run npm dev server manually for each correction session.

**Acceptance Scenarios**:

1. **Given** the correction UI application is ready, **When** I build the Docker image with npm run build and docker build commands, **Then** a Docker image is created with production-optimized static files served via a web server
2. **Given** a Docker image exists, **When** I deploy it to my Unraid server with environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY) configured, **Then** the container starts successfully and exposes the UI on the configured port
3. **Given** the container is running on Unraid, **When** I access http://unraid-server-ip:3000 from my laptop browser, **Then** I see the classification list page and can perform all correction workflows
4. **Given** the container is running, **When** I restart the Unraid server or redeploy the container, **Then** the application starts automatically without manual intervention and all corrections are persisted in the Supabase database

---

### Edge Cases

- What happens when the database connection fails or is unavailable? UI shows a clear error message to the user, logs the error details to browser console, and allows retry without losing any unsaved corrections (corrections should save immediately, not be batched).
- How does the UI handle very long email bodies (>10,000 characters)? Display first 2,000 characters with "Show More" expansion control to prevent UI performance issues.
- What happens when two users correct the same classification simultaneously? Last write wins (database-level locking not required for MVP since this is single-user tool).
- How does the UI handle missing or null values in email or classification data? Display "N/A" or empty state gracefully without breaking layout.
- What happens when a user tries to set an invalid category value (typo or custom value)? Use dropdown/select controls with only valid enum values - free text input not allowed for category/urgency/action.
- How does pagination work with filters applied? Pagination respects active filters - counts and page numbers reflect filtered results only.
- What happens when the Docker container is deployed without environment variables? Container startup fails with clear error message indicating missing SUPABASE_URL or SUPABASE_SERVICE_KEY, preventing misconfigured deployment.
- What happens when the Unraid server IP address changes? User must update bookmarks or use hostname-based URL if Unraid hostname is configured (e.g., http://unraid-server:3000 instead of IP).
- How does the UI behave when accessed from a mobile device on the local network? Responsive layout adapts to smaller screens while maintaining full functionality (all correction workflows work on mobile).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: UI MUST display a paginated list of recent email classifications with columns: subject, sender, category, urgency, action, confidence score, timestamp (default: 20 per page, sortable by any column)
- **FR-002**: UI MUST provide a detail view for each classification showing full email content (subject, sender, body preview), current classification fields, confidence score, and edit controls
- **FR-003**: UI MUST allow inline editing of category (dropdown with 6 options: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER), urgency (dropdown: HIGH, MEDIUM, LOW), and action (dropdown: FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE)
- **FR-004**: UI MUST save corrections immediately when user clicks Save button, updating the classifications table and creating entries in correction_logs table via database trigger
- **FR-005**: UI MUST display visual feedback after successful correction (success message, updated field values, "corrected" badge on list view)
- **FR-006**: UI MUST provide filtering controls for confidence score (slider or input: 0.0-1.0), date range (date pickers: from/to), category (multi-select dropdown), and correction status (checkbox: show only uncorrected)
- **FR-007**: UI MUST apply filters dynamically without full page reload, updating the classification list to show only matching entries
- **FR-008**: UI MUST provide a History/Analytics page showing correction statistics: total corrections, correction rate percentage, most frequently corrected category, corrections per week chart (last 8 weeks)
- **FR-009**: UI MUST display a correction patterns table showing frequency of specific original→corrected transitions (e.g., "SHOPPING → WORK: 15 times")
- **FR-010**: UI MUST connect to the existing Supabase PostgreSQL database (project: xmziovusqlmgygcrgyqt) using connection credentials loaded from environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY) via .env file that is excluded from version control
- **FR-011**: UI MUST run locally on the user's machine without requiring external hosting or cloud deployment (localhost web server)
- **FR-012**: UI MUST handle database connection errors gracefully with clear error messages and retry capability
- **FR-013**: UI MUST truncate long email bodies to first 2,000 characters with "Show More" button to expand full content
- **FR-014**: UI MUST prevent invalid enum values by using dropdown/select controls (no free text input for category/urgency/action)
- **FR-015**: UI MUST display visual indicator (badge, icon, or highlight) for classifications that have been manually corrected
- **FR-016**: UI MUST support pagination for large result sets with page size selector (20/50/100 per page) and page navigation (previous/next, jump to page)
- **FR-017**: UI MUST provide sortable columns in the list view (click column header to sort ascending/descending)
- **FR-018**: UI MUST display timestamp in user's local timezone
- **FR-019**: UI MUST allow user to add optional correction notes/reason when making corrections (free text field, stored in classifications.correction_reason)
- **FR-020**: UI MUST require confirmation dialog when user navigates away from unsaved changes in the edit view
- **FR-021**: UI MUST log all errors, warnings, and key user actions (corrections saved, filters applied, page navigation) to the browser console for debugging and troubleshooting purposes
- **FR-022**: UI MUST support basic keyboard navigation including tab key to move between form fields and interactive elements, enter key to submit forms and activate buttons, and escape key to cancel editing and close dialogs
- **FR-023**: Application MUST provide a Dockerfile that builds a production-optimized Docker image with static files served via a lightweight web server
- **FR-024**: Docker image MUST accept Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY) as environment variables at container runtime
- **FR-025**: Docker container MUST expose the web UI on a configurable port (default: 3000) that can be mapped to any host port on the Unraid server
- **FR-026**: Docker container MUST start automatically when the Unraid server boots and restart automatically if the container crashes
- **FR-027**: Application MUST provide docker-compose.yml configuration for easy Unraid deployment with environment variable templates and port mapping
- **FR-028**: Production build MUST be optimized for size and performance with code splitting, minification, and tree shaking (target bundle <200KB gzipped)

### Key Entities

- **Classification**: Represents an email's AI classification with attributes: email_id (foreign key), category (enum), urgency (enum), action (enum), confidence_score (0.0-1.0), classified_timestamp, original_category (preserved on first correction), original_urgency, original_action, corrected_timestamp, corrected_by, correction_reason (optional text note)
- **Email**: Represents the email content with attributes: message_id (Gmail ID), subject, sender, body, received_at timestamp
- **CorrectionLog**: Represents individual field corrections with attributes: email_id, field_name (CATEGORY/URGENCY/ACTION), original_value, corrected_value, correction_timestamp, corrected_by
- **CorrectionPattern**: Derived view/aggregation showing correction frequency with attributes: original_value, corrected_value, field_name, occurrence_count

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can review and correct a classification in under 30 seconds on average (vs 60-90 seconds with Supabase UI)
- **SC-002**: UI reduces time to review 20 classifications from 20-30 minutes to 10-15 minutes (50% improvement)
- **SC-003**: 90% of correction sessions use filters to focus on specific subsets (low confidence, specific categories) rather than reviewing all emails sequentially
- **SC-004**: Users can identify the top 3 correction patterns within 2 minutes using the History page (vs 10+ minutes writing SQL queries)
- **SC-005**: UI handles 1,000+ classifications in the database without performance degradation (list loads in under 2 seconds)
- **SC-006**: 100% of corrections are successfully saved to the database and logged in correction_logs table (no data loss)
- **SC-007**: UI is accessible on localhost within 30 seconds of starting the local server (fast startup)
- **SC-008**: Users successfully complete correction workflow on first attempt 95% of the time (intuitive UI, no training required)
- **SC-009**: Zero database corruption or integrity violations caused by UI operations (proper transaction handling)
- **SC-010**: Users can complete all primary workflows (review list, open detail, edit classification, save, return to list) using keyboard-only navigation without requiring mouse interaction
- **SC-011**: Docker image builds successfully in under 5 minutes and results in container image size under 500MB
- **SC-012**: Container deploys to Unraid server and becomes accessible on local network within 60 seconds of docker run command
- **SC-013**: UI remains accessible and functional after Unraid server restarts (container auto-restart working)
- **SC-014**: Users can access correction UI from multiple devices (laptop, phone, tablet) on the same local network with identical functionality

### Assumptions

- UI will be used by a single user (system operator) on a local network - no multi-user authentication or access control required for MVP
- User has Supabase connection credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY) and can provide them as Docker environment variables
- User has Unraid server available on local network with Docker support and can deploy Docker containers
- User's network devices (laptop, phone, tablet) can access Unraid server via local network (no internet exposure required)
- Database schema (emails, classifications, correction_logs tables) already exists from 001-email-classification-mvp feature
- User reviews classifications intermittently (daily or weekly) - UI does not need to support continuous real-time monitoring
- Corrections are saved immediately (no "draft" state or batch save) - each correction is an independent transaction
- Database connection is reasonably stable (UI doesn't need sophisticated offline/retry queue for MVP)
- User is technical enough to build Docker images and deploy containers to Unraid via web UI or Docker Compose
- Classification count will grow over time but remain under 10,000 records for first year (pagination handles scale)
- User's browser supports modern web standards (ES6+, fetch API, CSS Grid) - no IE11 support required
- Container runs on local network only (no public internet exposure, service key security acceptable)
