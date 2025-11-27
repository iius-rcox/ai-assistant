# Data Model: Material Design 3 Theme Tokens

**Feature**: 006-material-design-themes
**Date**: 2025-11-25
**Status**: Complete

## Overview

This document defines the CSS token architecture for the Material Design 3 theme implementation. Unlike traditional data models with database entities, this feature's "data" consists of design tokens - named values representing visual design attributes.

---

## Token Categories

### 1. Color Role Tokens

Core M3 color system tokens that define the semantic meaning of colors.

| Token Name | Type | Description | Validation |
|------------|------|-------------|------------|
| `--md-sys-color-primary` | color (hex) | Primary brand color for key UI elements | Valid hex, WCAG AA with on-primary |
| `--md-sys-color-on-primary` | color (hex) | Text/icon color on primary surfaces | Valid hex, ≥4.5:1 contrast with primary |
| `--md-sys-color-primary-container` | color (hex) | Background for primary-emphasized containers | Valid hex |
| `--md-sys-color-on-primary-container` | color (hex) | Text on primary containers | Valid hex, ≥4.5:1 contrast |
| `--md-sys-color-secondary` | color (hex) | Secondary accent color | Valid hex |
| `--md-sys-color-on-secondary` | color (hex) | Text on secondary | Valid hex, ≥4.5:1 contrast |
| `--md-sys-color-secondary-container` | color (hex) | Secondary container background | Valid hex |
| `--md-sys-color-on-secondary-container` | color (hex) | Text on secondary container | Valid hex, ≥4.5:1 contrast |
| `--md-sys-color-tertiary` | color (hex) | Tertiary accent color | Valid hex |
| `--md-sys-color-on-tertiary` | color (hex) | Text on tertiary | Valid hex, ≥4.5:1 contrast |
| `--md-sys-color-tertiary-container` | color (hex) | Tertiary container background | Valid hex |
| `--md-sys-color-on-tertiary-container` | color (hex) | Text on tertiary container | Valid hex, ≥4.5:1 contrast |
| `--md-sys-color-error` | color (hex) | Error state color | Valid hex |
| `--md-sys-color-on-error` | color (hex) | Text on error | Valid hex, ≥4.5:1 contrast |
| `--md-sys-color-error-container` | color (hex) | Error container background | Valid hex |
| `--md-sys-color-on-error-container` | color (hex) | Text on error container | Valid hex, ≥4.5:1 contrast |

### 2. Surface Tokens

Tokens defining background surfaces at different elevation levels.

| Token Name | Type | Description | Elevation Level |
|------------|------|-------------|-----------------|
| `--md-sys-color-surface` | color (hex) | Base surface color | 0 |
| `--md-sys-color-on-surface` | color (hex) | Primary text on surface | - |
| `--md-sys-color-surface-variant` | color (hex) | Alternative surface | - |
| `--md-sys-color-on-surface-variant` | color (hex) | Secondary text | - |
| `--md-sys-color-surface-container-lowest` | color (hex) | Lowest container | -1 |
| `--md-sys-color-surface-container-low` | color (hex) | Low container | 1 |
| `--md-sys-color-surface-container` | color (hex) | Default container | 2 |
| `--md-sys-color-surface-container-high` | color (hex) | High container | 3 |
| `--md-sys-color-surface-container-highest` | color (hex) | Highest container | 4+ |
| `--md-sys-color-surface-dim` | color (hex) | Dimmed surface | - |
| `--md-sys-color-surface-bright` | color (hex) | Bright surface | - |

### 3. Utility Tokens

Supporting tokens for borders, backgrounds, and special states.

| Token Name | Type | Description |
|------------|------|-------------|
| `--md-sys-color-outline` | color (hex) | Border and divider color |
| `--md-sys-color-outline-variant` | color (hex) | Subtle border color |
| `--md-sys-color-inverse-surface` | color (hex) | Inverse surface for tooltips/snackbars |
| `--md-sys-color-inverse-on-surface` | color (hex) | Text on inverse surface |
| `--md-sys-color-inverse-primary` | color (hex) | Primary on inverse surface |
| `--md-sys-color-scrim` | color (hex) | Modal overlay background |
| `--md-sys-color-shadow` | color (hex) | Shadow color |

### 4. Extended Color Tokens (Application-Specific)

Custom tokens for application-specific needs beyond M3 baseline.

| Token Name | Type | Description | Usage |
|------------|------|-------------|-------|
| `--md-ext-color-success` | color (hex) | Success state | Confirmations, positive feedback |
| `--md-ext-color-on-success` | color (hex) | Text on success | - |
| `--md-ext-color-warning` | color (hex) | Warning state | Caution indicators |
| `--md-ext-color-on-warning` | color (hex) | Text on warning | - |

### 5. Category Badge Tokens

Tokens for email classification category badges.

| Token Name | Type | Light Value | Dark Value |
|------------|------|-------------|------------|
| `--md-ext-color-badge-kids` | color (hex) | #7E57C2 | #B39DDB |
| `--md-ext-color-badge-robyn` | color (hex) | #D81B60 | #F48FB1 |
| `--md-ext-color-badge-work` | color (hex) | #1976D2 | #64B5F6 |
| `--md-ext-color-badge-financial` | color (hex) | #388E3C | #81C784 |
| `--md-ext-color-badge-shopping` | color (hex) | #F57C00 | #FFB74D |
| `--md-ext-color-badge-other` | color (hex) | #78909C | #B0BEC5 |

### 6. Shape Tokens

Border radius values for consistent component shapes.

| Token Name | Type | Value | Usage |
|------------|------|-------|-------|
| `--md-sys-shape-corner-none` | length | 0px | No rounding |
| `--md-sys-shape-corner-extra-small` | length | 4px | Small chips, icons |
| `--md-sys-shape-corner-small` | length | 8px | Buttons, inputs |
| `--md-sys-shape-corner-medium` | length | 12px | Cards, dialogs |
| `--md-sys-shape-corner-large` | length | 16px | Large containers |
| `--md-sys-shape-corner-extra-large` | length | 28px | FABs, navigation |
| `--md-sys-shape-corner-full` | length | 9999px | Pills, circular |

### 7. Typography Tokens

Font size values for consistent text hierarchy.

| Token Name | Type | Value | Usage |
|------------|------|-------|-------|
| `--md-sys-typescale-display-large-size` | length | 57px | Hero text |
| `--md-sys-typescale-headline-large-size` | length | 32px | Page titles |
| `--md-sys-typescale-headline-medium-size` | length | 28px | Section headers |
| `--md-sys-typescale-title-large-size` | length | 22px | Card titles |
| `--md-sys-typescale-title-medium-size` | length | 16px | List items |
| `--md-sys-typescale-body-large-size` | length | 16px | Body copy |
| `--md-sys-typescale-body-medium-size` | length | 14px | Secondary text |
| `--md-sys-typescale-label-large-size` | length | 14px | Buttons |
| `--md-sys-typescale-label-medium-size` | length | 12px | Captions |

### 8. State Layer Tokens

Opacity values for interactive state overlays.

| Token Name | Type | Value | Usage |
|------------|------|-------|-------|
| `--md-sys-state-hover-opacity` | percentage | 0.08 | Hover state |
| `--md-sys-state-focus-opacity` | percentage | 0.12 | Focus state |
| `--md-sys-state-pressed-opacity` | percentage | 0.12 | Active/pressed |
| `--md-sys-state-dragged-opacity` | percentage | 0.16 | Drag state |
| `--md-sys-state-disabled-opacity` | percentage | 0.38 | Disabled content |
| `--md-sys-state-disabled-container-opacity` | percentage | 0.12 | Disabled container |

### 9. Motion Tokens

Animation timing for consistent motion.

| Token Name | Type | Value | Usage |
|------------|------|-------|-------|
| `--md-sys-motion-duration-short` | duration | 100ms | Micro-interactions |
| `--md-sys-motion-duration-medium` | duration | 300ms | Theme transitions |
| `--md-sys-motion-duration-long` | duration | 500ms | Complex animations |
| `--md-sys-motion-easing-standard` | easing | cubic-bezier(0.2, 0, 0, 1) | Standard curve |

---

## Entity Relationships

```
ThemeConfiguration (light/dark)
├── ColorRoleTokens (29 tokens)
│   ├── Primary family (4)
│   ├── Secondary family (4)
│   ├── Tertiary family (4)
│   ├── Error family (4)
│   └── Surface family (13)
├── ExtendedColorTokens (10+ tokens)
│   ├── Success/Warning (4)
│   └── Category badges (6)
├── ShapeTokens (7 tokens)
├── TypographyTokens (9 tokens)
├── StateLayerTokens (6 tokens)
└── MotionTokens (4 tokens)
```

---

## State Transitions

### Theme State Machine

```
┌─────────────┐    toggle    ┌─────────────┐
│    LIGHT    │◄────────────►│    DARK     │
└──────┬──────┘              └──────┬──────┘
       │                            │
       │    system preference       │
       │         change             │
       ▼                            ▼
┌─────────────────────────────────────────┐
│               SYSTEM                     │
│  (resolves to light or dark based on    │
│   prefers-color-scheme media query)     │
└─────────────────────────────────────────┘
```

### State Persistence

| State | Storage | Key | Values |
|-------|---------|-----|--------|
| Theme Preference | localStorage | `app-theme-preference` | `light`, `dark`, `system` |

---

## Validation Rules

### Contrast Requirements (WCAG AA)

| Pair | Minimum Ratio |
|------|---------------|
| `on-primary` / `primary` | 4.5:1 |
| `on-secondary` / `secondary` | 4.5:1 |
| `on-tertiary` / `tertiary` | 4.5:1 |
| `on-error` / `error` | 4.5:1 |
| `on-surface` / `surface` | 4.5:1 |
| `on-surface-variant` / `surface-variant` | 4.5:1 |
| Badge text / Badge background | 4.5:1 |

### Token Naming Rules

1. All tokens MUST start with `--md-sys-` for M3 system tokens
2. Extended tokens MUST start with `--md-ext-` for application-specific tokens
3. Color tokens MUST use kebab-case naming
4. All hex values MUST be 6-digit format (#RRGGBB)

---

## Migration Mapping

| Legacy Token | New M3 Token |
|--------------|--------------|
| `--bg-primary` | `--md-sys-color-surface` |
| `--bg-secondary` | `--md-sys-color-surface-container` |
| `--bg-tertiary` | `--md-sys-color-surface-container-high` |
| `--bg-hover` | `--md-sys-color-surface-container-high` |
| `--text-primary` | `--md-sys-color-on-surface` |
| `--text-secondary` | `--md-sys-color-on-surface-variant` |
| `--text-muted` | `--md-sys-color-outline` |
| `--color-primary` | `--md-sys-color-primary` |
| `--color-primary-hover` | Computed via state layer |
| `--color-success` | `--md-ext-color-success` |
| `--color-warning` | `--md-sys-color-tertiary` |
| `--color-danger` | `--md-sys-color-error` |
| `--color-info` | `--md-sys-color-primary` |
| `--border-primary` | `--md-sys-color-outline` |
| `--border-secondary` | `--md-sys-color-outline-variant` |
| `--shadow-sm/md/lg` | `--md-sys-color-shadow` + elevation |
| `--table-header-bg` | `--md-sys-color-surface-container` |
| `--table-row-hover` | `--md-sys-color-surface-container-high` |
| `--input-bg` | `--md-sys-color-surface-container-low` |
| `--input-border` | `--md-sys-color-outline` |
| `--modal-bg` | `--md-sys-color-surface-container-high` |
