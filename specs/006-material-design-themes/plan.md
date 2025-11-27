# Implementation Plan: Material Design Theme Update

**Branch**: `006-material-design-themes` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-material-design-themes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Update the correction-ui application's light and dark themes to comply with Material Design 3 (M3) guidelines. This involves adopting the M3 baseline primary color (#6750A4), implementing the full M3 color system using official CSS custom property naming (--md-sys-color-*), and refactoring all Vue components to use the new token system. The update ensures WCAG AA accessibility compliance and provides smooth theme transitions.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5, CSS3
**Primary Dependencies**: Vue 3.5, Vite 7.1, ApexCharts 5.3, VueUse 11.3, Pinia 3.0
**Storage**: localStorage (theme preference persistence - existing)
**Testing**: Vitest (unit), Playwright (e2e), Lighthouse (accessibility)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - CSS custom properties required)
**Project Type**: Web application (frontend only for this feature)
**Performance Goals**: Theme switch < 300ms, no layout shift (CLS = 0)
**Constraints**: WCAG AA contrast (4.5:1), reduced-motion preference support
**Scale/Scope**: ~40 Vue components, 2 theme files, 1 composable to update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value with clear acceptance criteria
  - Improves visual consistency, reduces eye strain in dark mode, ensures accessibility
  - Success criteria: WCAG AA compliance, 300ms transition, Lighthouse 100 for contrast
- [x] **Test-Driven Development**: Test strategy defined with test-first approach planned
  - Visual regression tests for both themes
  - Accessibility audit via Lighthouse/axe
  - Unit tests for theme composable
- [x] **Modular Architecture**: Components properly separated with clear interfaces
  - CSS tokens centralized in theme files
  - useTheme composable provides theme API
  - Components consume tokens via CSS custom properties
- [x] **Progressive Enhancement**: MVP defined with incremental delivery path
  - MVP: Core M3 color tokens for light/dark themes
  - Enhancement: Component state layers, typography scale, corner radius tokens
- [x] **Observable Systems**: Logging and monitoring strategy defined
  - Theme preference changes logged via existing logger utility
  - Lighthouse CI for accessibility monitoring
- [x] **Security by Design**: Security considerations identified and addressed
  - No sensitive data involved; theme preference stored in localStorage (existing pattern)
- [x] **Documentation as Code**: Documentation plan included in implementation
  - Theme token reference in quickstart.md
  - Component update guide in implementation tasks

## Project Structure

### Documentation (this feature)

```text
specs/006-material-design-themes/
├── plan.md              # This file
├── research.md          # Phase 0: M3 color system research
├── data-model.md        # Phase 1: Token definitions
├── quickstart.md        # Phase 1: Theme implementation guide
├── contracts/           # Phase 1: CSS token interface definitions
│   └── tokens.css       # M3 token contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
correction-ui/
├── src/
│   ├── assets/
│   │   ├── base.css              # Base styles (update imports)
│   │   ├── main.css              # Main styles (update imports)
│   │   └── themes/
│   │       ├── tokens.css        # NEW: M3 token definitions (shared)
│   │       ├── light.css         # UPDATE: M3 light theme values
│   │       └── dark.css          # UPDATE: M3 dark theme values
│   ├── composables/
│   │   └── useTheme.ts           # UPDATE: Apply M3 class names
│   ├── components/               # UPDATE: ~40 components to refactor CSS vars
│   │   ├── ThemeToggle.vue
│   │   ├── ClassificationList.vue
│   │   ├── shared/
│   │   │   └── *.vue             # Dropdown, Toast, Badge components
│   │   └── analytics/
│   │       └── *.vue             # Chart components
│   └── views/
│       └── *.vue                 # Page components
└── tests/
    └── e2e/
        └── theme.spec.ts         # NEW: Theme visual regression tests
```

**Structure Decision**: Frontend-only web application. Theme files are centralized in `src/assets/themes/`. A new `tokens.css` file will define the M3 token contract, imported by both `light.css` and `dark.css` which provide theme-specific values.

## Complexity Tracking

> No Constitution violations. All checks pass.

---

## Phase 0 Output: Research

**File**: [research.md](./research.md)

Key decisions from research phase:

| Area | Decision |
|------|----------|
| Primary Color | M3 Baseline Purple #6750A4 |
| Naming Convention | `--md-sys-color-*` (official M3) |
| Surface Hierarchy | 5 container levels + dim/bright |
| Dark Mode Elevation | Tonal (no shadows) |
| State Layers | 8%/12%/12% with color-mix() |
| Transitions | 300ms, reduced-motion aware |
| Typography | M3 type scale (9 levels) |
| Border Radius | M3 shape tokens (7 levels) |
| Charts | JS bridge to CSS variables |

---

## Phase 1 Output: Design Artifacts

### Data Model

**File**: [data-model.md](./data-model.md)

Token categories defined:
- Color Role Tokens (29 per theme)
- Surface Tokens (11 per theme)
- Extended Color Tokens (16+ application-specific)
- Shape Tokens (7)
- Typography Tokens (27)
- State Layer Tokens (6)
- Motion Tokens (7)

### Contracts

**Directory**: [contracts/](./contracts/)

- `tokens.css` - CSS custom property interface contract defining all token names and types

### Quickstart Guide

**File**: [quickstart.md](./quickstart.md)

Contents:
- Token usage reference
- Migration cheatsheet (old → new tokens)
- ApexCharts integration pattern
- Testing strategies
- Common component patterns

---

## Implementation Roadmap

### MVP (Priority 1)

1. **Core Token System**
   - Create `tokens.css` with all M3 token definitions
   - Update `light.css` with M3 baseline light theme values
   - Update `dark.css` with M3 baseline dark theme values

2. **Theme Infrastructure**
   - Update `useTheme.ts` composable for M3 class names
   - Add FOUC prevention script to index.html
   - Implement reduced-motion support

### Enhancement (Priority 2)

3. **Component Migration**
   - Refactor all ~40 Vue components to use new tokens
   - Update badge colors (category, urgency)
   - Implement state layer patterns

4. **Testing & Validation**
   - Add visual regression tests
   - Run Lighthouse accessibility audit
   - Verify WCAG AA compliance

### Polish (Priority 3)

5. **Chart Integration**
   - Create useChartTheme composable
   - Update ApexCharts color bindings

6. **Documentation**
   - Update component style guides
   - Document token usage patterns

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Component migration breaks existing styles | Medium | High | Incremental migration with visual regression tests |
| Contrast issues with new colors | Low | Medium | Use pre-tested M3 baseline palette |
| Browser compatibility (color-mix) | Low | Low | Provide fallback values |
| Chart colors not updating | Medium | Medium | Use computed properties with watcher |

---

## Next Steps

Run `/speckit.tasks` to generate the dependency-ordered task list for implementation.
