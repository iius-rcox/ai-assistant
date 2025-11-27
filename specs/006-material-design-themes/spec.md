# Feature Specification: Material Design Theme Update

**Feature Branch**: `006-material-design-themes`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Use material design guidelines to update both the light and dark themes to better comply with modern UI"

## Clarifications

### Session 2025-11-25

- Q: Primary color strategy - keep existing brand blue, adopt M3 baseline purple, or configurable? → A: Adopt M3 baseline purple (#6750A4) for authentic Material Design look
- Q: CSS variable naming convention - keep existing, adopt M3 naming, or hybrid? → A: Adopt full M3 naming convention (--md-sys-color-*) and refactor all components

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Light Mode Experience (Priority: P1)

As a user working in well-lit environments, I want the light theme to follow Material Design 3 guidelines so that the interface feels modern, professional, and consistent with contemporary web applications.

**Why this priority**: Light mode is the default theme and most commonly used during daytime work. Ensuring it follows Material Design guidelines provides the foundation for a consistent, accessible user experience.

**Independent Test**: Can be fully tested by viewing the application in light mode across all pages (home, classification list, analytics) and verifying color relationships, contrast ratios, and elevation patterns match Material Design 3 specifications.

**Acceptance Scenarios**:

1. **Given** the application is in light theme, **When** I view any page, **Then** background colors follow M3 surface hierarchy (surface, surface-container, surface-container-high)
2. **Given** the application is in light theme, **When** I view text elements, **Then** primary text uses on-surface color (#1D1B20) and secondary text uses on-surface-variant color
3. **Given** the application is in light theme, **When** I interact with buttons and controls, **Then** they use M3 baseline primary color (#6750A4) with proper state layers
4. **Given** the application is in light theme, **When** I view elements with elevation, **Then** they display appropriate M3 tonal surface colors rather than drop shadows

---

### User Story 2 - Comfortable Dark Mode Experience (Priority: P1)

As a user working in low-light environments or with preference for dark interfaces, I want the dark theme to follow Material Design 3 dark mode guidelines so that the interface reduces eye strain while maintaining visual hierarchy and readability.

**Why this priority**: Dark mode is increasingly popular and essential for accessibility. Proper M3 dark mode implementation ensures reduced eye strain, proper contrast, and visual consistency with the light theme.

**Independent Test**: Can be fully tested by enabling dark mode and verifying all pages display correct surface colors, text contrast meets WCAG AA standards, and elevation is represented through tonal variations rather than shadows.

**Acceptance Scenarios**:

1. **Given** the application is in dark theme, **When** I view any page, **Then** background colors use M3 dark surface hierarchy (#1C1B1F for surface, elevated surfaces use lighter tones)
2. **Given** the application is in dark theme, **When** I view text elements, **Then** primary text uses on-surface color (#E6E1E5) and meets WCAG AA contrast ratio (4.5:1)
3. **Given** the application is in dark theme, **When** I view colored badges (category, urgency), **Then** colors are adjusted for dark mode with sufficient contrast while maintaining category recognition
4. **Given** the application is in dark theme, **When** I view elevated components (modals, dropdowns, cards), **Then** they use M3 tonal surface elevation (lighter backgrounds instead of shadows)

---

### User Story 3 - Smooth Theme Transitions (Priority: P2)

As a user switching between light and dark themes, I want the transition to be smooth and immediate so that the mode change feels polished and doesn't disrupt my workflow.

**Why this priority**: While functional theme switching already exists, ensuring transitions follow Material Design motion guidelines enhances the perceived quality of the application.

**Independent Test**: Can be tested by toggling themes via the theme toggle button and verifying smooth color transitions without jarring flashes or layout shifts.

**Acceptance Scenarios**:

1. **Given** I am using the application, **When** I click the theme toggle, **Then** colors transition smoothly using appropriate easing (300ms duration)
2. **Given** I toggle the theme, **When** the transition completes, **Then** there is no flash of unstyled content (FOUC)
3. **Given** I have system theme preference enabled, **When** my OS changes from light to dark mode, **Then** the application smoothly transitions to match

---

### User Story 4 - Consistent Component Styling (Priority: P2)

As a user interacting with form elements, I want all interactive components (buttons, dropdowns, inputs, checkboxes) to follow Material Design 3 component styling so that the application feels cohesive and modern.

**Why this priority**: Consistent component styling builds trust and improves usability. Users should recognize interactive elements and understand their states.

**Independent Test**: Can be tested by interacting with all form controls in both themes and verifying they display correct M3 states (hover, focus, active, disabled).

**Acceptance Scenarios**:

1. **Given** any interactive element (button, dropdown, input), **When** I hover over it, **Then** it displays M3 state layer (8% primary color overlay)
2. **Given** any interactive element, **When** I focus it via keyboard, **Then** it displays M3 focus indicator (3dp outline, primary color)
3. **Given** any button, **When** I view it, **Then** it follows M3 button specifications (filled, outlined, or text variants with correct padding and corner radius)
4. **Given** the badge dropdowns (category, urgency), **When** I view them in either theme, **Then** colors meet M3 color harmony guidelines with proper contrast

---

### User Story 5 - Accessible Color Palette (Priority: P3)

As a user with visual impairments, I want the color palette to meet accessibility standards so that I can effectively use the application regardless of my vision capabilities.

**Why this priority**: Accessibility is essential for inclusive design. Material Design 3's color system is built on accessibility principles, ensuring all users can use the application effectively.

**Independent Test**: Can be tested using automated accessibility tools (Lighthouse, axe) to verify all color combinations meet WCAG AA contrast requirements.

**Acceptance Scenarios**:

1. **Given** any text on a background, **When** I check contrast ratio, **Then** it meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
2. **Given** any interactive element, **When** I view it against its background, **Then** it meets WCAG AA contrast requirements
3. **Given** status/category badges, **When** I view them in either theme, **Then** text is readable with sufficient contrast against badge backgrounds

---

### Edge Cases

- What happens when a user has reduced motion preferences enabled? Disable/minimize theme transitions
- How does the system handle browsers that don't support CSS custom properties? Provide reasonable fallback colors
- What happens when saved theme preference conflicts with system preference? Saved preference takes precedence (existing behavior preserved)
- How do charts and data visualizations adapt to theme changes? Charts use theme-appropriate colors from the M3 palette

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement Material Design 3 color roles (primary, secondary, tertiary, surface, error) using official M3 CSS custom property naming convention (--md-sys-color-*)
- **FR-002**: System MUST provide M3-compliant light theme with proper surface hierarchy (surface, surface-container-low, surface-container, surface-container-high, surface-container-highest)
- **FR-003**: System MUST provide M3-compliant dark theme using M3 dark surface color specifications
- **FR-004**: System MUST ensure all text/background combinations meet WCAG AA contrast ratio (4.5:1 minimum for normal text)
- **FR-005**: System MUST update badge colors (category badges: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER) to use M3 tonal color system while maintaining distinctiveness
- **FR-006**: System MUST update urgency badge colors (HIGH, MEDIUM, LOW) to use M3 semantic colors (error, warning/tertiary, neutral)
- **FR-007**: System MUST implement M3 elevation system using tonal surface colors instead of shadows in dark mode
- **FR-008**: System MUST update interactive elements (buttons, inputs, dropdowns) to use M3 state layers (hover: 8%, focus: 12%, pressed: 12%)
- **FR-009**: System MUST implement M3 typography scale for consistent text hierarchy
- **FR-010**: System MUST transition between themes smoothly (300ms, standard easing) respecting user's reduced-motion preferences
- **FR-011**: System MUST maintain existing theme persistence mechanism (localStorage)
- **FR-012**: System MUST preserve existing system theme detection functionality
- **FR-013**: System MUST update chart/graph colors to theme-aware variants that maintain data readability
- **FR-014**: System MUST define M3 corner radius tokens (extra-small: 4dp, small: 8dp, medium: 12dp, large: 16dp, extra-large: 28dp)
- **FR-015**: System MUST provide CSS custom property fallback values for browser compatibility

### Key Entities

- **Color Role**: M3 color role (primary, on-primary, primary-container, on-primary-container, etc.) mapped to CSS custom property
- **Surface Level**: M3 surface elevation level (0-5) with corresponding tonal values for light and dark themes
- **Theme Configuration**: Collection of all color roles and tokens constituting a complete theme mode (light/dark)
- **Component State**: Interactive element state (enabled, hover, focus, active, disabled) with corresponding style modifications

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of text/background color combinations pass WCAG AA contrast requirements (verified via automated testing)
- **SC-002**: Theme switching completes within 300ms without layout shift or FOUC
- **SC-003**: All 6 category badges remain visually distinguishable from each other in both themes
- **SC-004**: Lighthouse accessibility audit scores 100 for color contrast
- **SC-005**: All interactive elements display visible state changes on hover, focus, and active states
- **SC-006**: Dark mode background uses M3 surface colors that reduce eye strain compared to current implementation

## Assumptions

- Material Design 3 (M3) is the target specification, not Material Design 2
- The application will adopt the M3 baseline primary color (#6750A4 purple) and its full tonal palette for an authentic Material Design look
- Existing category badge colors will be updated to harmonize with M3 while maintaining recognizability through hue
- No new UI components will be added; this is a theme/styling update to existing components only
- The existing theme toggle component and useTheme composable architecture will be preserved
- Charts will leverage ApexCharts theme capabilities already present in the codebase
- The existing CSS custom property naming convention (--bg-primary, --text-primary, etc.) will be fully refactored to use official M3 naming (--md-sys-color-*), requiring updates across all components
