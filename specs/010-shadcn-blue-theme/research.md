# Research: Shadcn Blue Theme and Pagination Refactor

**Feature**: 010-shadcn-blue-theme
**Date**: 2025-11-26
**Status**: Complete

## Executive Summary

This research consolidates findings for migrating the correction-ui frontend from Material Design 3 purple theme to shadcn blue theme, and implementing a shadcn-style pagination component in Vue 3.

## Research Topics

### 1. Shadcn CSS Variable Architecture

**Decision**: Adopt shadcn's HSL-based CSS custom property naming convention alongside existing M3 tokens.

**Rationale**:
- Shadcn uses a consistent pattern: `--{role}: H S% L%` without `hsl()` wrapper, applied as `hsl(var(--role))`
- This allows easy manipulation of individual HSL values (e.g., adjusting lightness for hover states)
- The existing M3 architecture uses hex colors which will need to be converted or aliased

**Alternatives Considered**:
1. **Full replacement of M3 tokens** - Rejected because it would break existing component styles and require extensive refactoring
2. **Parallel token systems** - Selected approach: add shadcn tokens while maintaining M3 aliases for backward compatibility
3. **Hex-based implementation** - Rejected because shadcn's HSL approach enables more flexible theming

**Implementation Approach**:
- Add shadcn CSS variables to `:root` and `.dark` selectors
- Map legacy M3 tokens to new shadcn values via CSS variable aliases
- Use CSS `hsl()` function with variable references

### 2. Shadcn Blue Theme Color Values

**Decision**: Use the exact HSL values provided in the user specification.

**Light Theme (`:root`)**:
| Token | HSL Value | Purpose |
|-------|-----------|---------|
| --background | 0 0% 100% | Page background |
| --foreground | 222.2 84% 4.9% | Primary text |
| --card | 0 0% 100% | Card backgrounds |
| --primary | 221.2 83.2% 53.3% | Primary blue |
| --primary-foreground | 210 40% 98% | Text on primary |
| --secondary | 210 40% 96.1% | Secondary elements |
| --muted | 210 40% 96.1% | Muted backgrounds |
| --accent | 210 40% 96.1% | Accent elements |
| --destructive | 0 84.2% 60.2% | Error/danger |
| --border | 214.3 31.8% 91.4% | Border color |
| --ring | 221.2 83.2% 53.3% | Focus ring |

**Dark Theme (`.dark`)**:
| Token | HSL Value | Purpose |
|-------|-----------|---------|
| --background | 222.2 84% 4.9% | Page background |
| --foreground | 210 40% 98% | Primary text |
| --card | 222.2 84% 4.9% | Card backgrounds |
| --primary | 217.2 91.2% 59.8% | Primary blue |
| --primary-foreground | 222.2 47.4% 11.2% | Text on primary |
| --secondary | 217.2 32.6% 17.5% | Secondary elements |
| --muted | 217.2 32.6% 17.5% | Muted backgrounds |
| --accent | 217.2 32.6% 17.5% | Accent elements |
| --destructive | 0 62.8% 30.6% | Error/danger |
| --border | 217.2 32.6% 17.5% | Border color |
| --ring | 224.3 76.3% 48% | Focus ring |

**Rationale**: User-provided values are the definitive specification, ensuring the implementation matches expectations exactly.

### 3. Chart Color Strategy

**Decision**: Map shadcn chart variables to existing chart theme composable.

**Light Theme Chart Colors**:
- --chart-1: 12 76% 61% (Orange-coral)
- --chart-2: 173 58% 39% (Teal)
- --chart-3: 197 37% 24% (Dark teal)
- --chart-4: 43 74% 66% (Gold)
- --chart-5: 27 87% 67% (Orange)

**Dark Theme Chart Colors**:
- --chart-1: 220 70% 50% (Blue)
- --chart-2: 160 60% 45% (Green)
- --chart-3: 30 80% 55% (Orange)
- --chart-4: 280 65% 60% (Purple)
- --chart-5: 340 75% 55% (Pink)

**Implementation**: Update `useChartTheme.ts` to read from new CSS variables with fallback to computed values.

### 4. Category Badge Color Adaptation

**Decision**: Maintain existing category badge colors but update to harmonize with blue primary.

**Rationale**:
- Category badges need to remain visually distinct from each other
- Current colors (purple for KIDS, pink for ROBYN, blue for WORK, green for FINANCIAL, orange for SHOPPING, purple for CHURCH, gray for OTHER) are already well-chosen
- Minor adjustments may be needed to ensure they complement the blue primary rather than purple

**Recommended Adjustments**:
- KIDS: Shift from deep purple (#5E35B1) to indigo (#4F46E5) to differentiate from primary blue
- Other categories remain largely unchanged as they already work with a blue palette

### 5. Vue 3 Pagination Component Pattern

**Decision**: Create a headless, composable pagination component following shadcn patterns adapted for Vue 3.

**Component Structure**:
```
components/ui/pagination/
├── Pagination.vue           # Root container with nav element
├── PaginationContent.vue    # ul wrapper for items
├── PaginationItem.vue       # li wrapper for individual items
├── PaginationLink.vue       # Button/anchor for page numbers
├── PaginationPrevious.vue   # Previous page button with icon
├── PaginationNext.vue       # Next page button with icon
├── PaginationEllipsis.vue   # "..." indicator for truncated ranges
└── index.ts                 # Barrel export
```

**Rationale**:
- Shadcn/ui is React-based; direct installation not possible
- Vue 3 equivalents like shadcn-vue exist but add dependency overhead
- Custom implementation provides full control and matches existing component patterns
- Compound component pattern enables flexible composition

**Alternatives Considered**:
1. **shadcn-vue library** - Rejected to avoid new dependency and maintain consistency with existing components
2. **Single monolithic component** - Rejected for lack of flexibility and customization
3. **Render-function approach** - Rejected for readability; SFC approach preferred

### 6. Pagination Logic Algorithm

**Decision**: Implement smart page range calculation with ellipsis.

**Algorithm**:
```
Given: currentPage, totalPages, siblingCount = 1

1. Always show: first page, last page, current page
2. Show siblings: currentPage ± siblingCount
3. Show ellipsis when gap > 1 between:
   - First page and first sibling
   - Last sibling and last page

Example (totalPages=10, currentPage=5, siblingCount=1):
[1] [...] [4] [5] [6] [...] [10]

Example (totalPages=10, currentPage=2):
[1] [2] [3] [...] [10]
```

**Implementation**: Create `usePagination` composable for page range calculation.

### 7. Accessibility Requirements

**Decision**: Full WCAG 2.1 AA compliance for pagination.

**Requirements**:
- `nav` element with `aria-label="pagination"`
- Current page: `aria-current="page"`
- Previous/Next: Include screen reader text (e.g., "Go to previous page")
- Disabled states: `aria-disabled="true"`
- Focus management: Visible focus ring matching theme
- Keyboard navigation: Tab between items, Enter/Space to activate

**Rationale**: WCAG compliance is non-negotiable for professional applications.

### 8. Token Migration Strategy

**Decision**: Layer shadcn tokens over M3 tokens with aliases.

**Migration Approach**:
1. Add shadcn tokens to `tokens.css` (new variables)
2. Update `light.css` and `dark.css` with shadcn values
3. Create alias layer mapping M3 tokens → shadcn tokens
4. Preserve legacy token names for backward compatibility

**Order of Changes**:
1. tokens.css - Add new CSS variable declarations
2. light.css - Update values for light theme
3. dark.css - Update values for dark theme
4. base.css - Update any direct references
5. Component files - No changes needed (use existing tokens)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Color contrast violations | Medium | High | Verify WCAG contrast ratios before deployment |
| Breaking existing components | Low | Medium | Preserve legacy token aliases |
| Chart colors not updating | Low | Medium | Test theme switching with charts visible |
| Pagination accessibility gaps | Low | High | Test with screen reader before deployment |

## Dependencies

- No new npm packages required
- Existing dependencies sufficient:
  - Vue 3.5.22
  - @vueuse/core 11.3.0 (for composable utilities)
  - ApexCharts 5.3.6 (for chart theming)

## Verification Checklist

- [ ] Light theme renders with blue primary (#3B82F6 equivalent)
- [ ] Dark theme renders with appropriate dark blue background
- [ ] Theme toggle transitions smoothly
- [ ] Charts update colors when theme changes
- [ ] Category badges remain distinguishable
- [ ] Pagination component navigates correctly
- [ ] Pagination ellipsis appears for large page counts
- [ ] Keyboard navigation works for pagination
- [ ] Screen reader announces pagination correctly
- [ ] No WCAG contrast violations
