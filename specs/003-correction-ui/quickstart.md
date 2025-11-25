# Quickstart Guide: Email Classification Correction UI

**Feature**: 003-correction-ui
**Date**: 2025-11-22
**Prerequisites**: 001-email-classification-mvp feature complete with Supabase database operational

---

## Overview

This guide walks you through setting up and running the Email Classification Correction UI locally. The UI connects to your existing Supabase database to review and correct email classifications.

**Estimated Setup Time**: 10-15 minutes

---

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **Supabase Credentials** from 001-email-classification-mvp:
   - Supabase URL: `https://xmziovusqlmgygcrgyqt.supabase.co`
   - Supabase Service Key: (from your .env file or Supabase dashboard)

3. **Database Schema** already created:
   - `emails` table
   - `classifications` table
   - `correction_logs` table
   - Database trigger `log_classification_correction` active

---

## Step 1: Create Project

Navigate to the repository root and create the Vue project:

```bash
cd /Users/rogercox/ai-assistant

# Create Vue 3 + TypeScript project
npm create vue@latest correction-ui -- --typescript --router --pinia --vitest

# Confirm prompts:
# ✔ Add TypeScript? Yes
# ✔ Add JSX Support? No
# ✔ Add Vue Router? Yes
# ✔ Add Pinia? Yes
# ✔ Add Vitest? Yes
# ✔ Add an End-to-End Testing Solution? Playwright
# ✔ Add ESLint? Yes (optional)
# ✔ Add Prettier? Yes (optional)
```

---

## Step 2: Install Dependencies

```bash
cd correction-ui

# Install production dependencies
npm install @supabase/supabase-js apexcharts vue3-apexcharts

# Install additional dev dependencies
npm install -D @testing-library/vue msw

# Verify installation
npm list --depth=0
```

**Expected dependencies**:
- `vue@^3.4`
- `@supabase/supabase-js@^2.45`
- `apexcharts@^3.54`
- `vue3-apexcharts@^1.6`
- `vite@^5.4`
- `vitest@^2.1`
- `@playwright/test@^1.48`

---

## Step 3: Configure Environment

Create `.env` file in the `correction-ui/` directory:

```bash
# Create .env from template
cat > .env << 'EOF'
# Supabase Configuration (from 001-email-classification-mvp)
VITE_SUPABASE_URL=https://xmziovusqlmgygcrgyqt.supabase.co
VITE_SUPABASE_SERVICE_KEY=your_service_key_here
EOF
```

**Get your Supabase Service Key**:
1. Open: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/settings/api
2. Copy "service_role" key under "Project API keys"
3. Paste into `.env` file replacing `your_service_key_here`

**Verify .env is gitignored**:
```bash
# Check .gitignore includes .env
grep "^\.env$" .gitignore || echo ".env" >> .gitignore
```

---

## Step 4: Generate Supabase Types

Generate TypeScript types from your Supabase database schema:

```bash
# Install Supabase CLI (if not already installed)
npm install -D supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref xmziovusqlmgygcrgyqt

# Generate TypeScript types
npx supabase gen types typescript --linked > src/types/database.types.ts
```

This creates type-safe interfaces for all database tables.

---

## Step 5: Project Structure Setup

Create the recommended directory structure:

```bash
# Create directories
mkdir -p src/{components/shared,services,types,utils,stores}

# Create placeholder files
touch src/services/{supabase,classificationService,analyticsService}.ts
touch src/types/{models,enums}.ts
touch src/utils/{logger,formatters}.ts
touch src/stores/classificationStore.ts
```

---

## Step 6: Start Development Server

```bash
# Start Vite dev server
npm run dev
```

**Expected output**:
```
VITE v5.4.8  ready in 245 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open http://localhost:5173/ in your browser to see the default Vue welcome page.

---

## Step 7: Verify Supabase Connection

Create a test component to verify database connectivity:

```bash
# Create test page
cat > src/views/TestConnection.vue << 'EOF'
<template>
  <div>
    <h1>Supabase Connection Test</h1>
    <button @click="testConnection">Test Connection</button>
    <pre v-if="result">{{ result }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

const result = ref('')

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('classifications')
      .select('count')
      .limit(1)

    if (error) throw error

    result.value = `✅ Connected! Database accessible.`
  } catch (e) {
    result.value = `❌ Error: ${e.message}`
  }
}
</script>
EOF
```

Add route in `src/router/index.ts` and navigate to `/test` to verify connection.

---

## Step 8: Run Tests

```bash
# Run component unit tests
npm run test:unit

# Run E2E tests (requires dev server running)
npm run test:e2e
```

---

## Development Workflow

### Daily Usage

1. **Start server**: `npm run dev`
2. **Open browser**: http://localhost:5173/
3. **Make changes**: Edit files in `src/`
4. **Auto-reload**: Vite hot-reloads changes instantly
5. **Check console**: Press F12 to see logs (FR-021)

### Testing Workflow

1. **Write component**: Create Vue component in `src/components/`
2. **Write test**: Create test file `src/components/__tests__/ComponentName.spec.ts`
3. **Run tests**: `npm run test:unit` (watch mode for instant feedback)
4. **Verify behavior**: Test assertions validate functionality

### Debugging

1. **Browser DevTools**: F12 → Console tab shows all errors and actions logged
2. **Vue DevTools**: Install Vue.js devtools extension for component inspection
3. **Network Tab**: Monitor Supabase REST API calls
4. **Supabase Dashboard**: Verify database changes at https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt

---

## Common Issues

### Issue 1: "Missing Supabase environment variables"

**Cause**: `.env` file not found or variables not set

**Solution**:
```bash
# Verify .env exists
ls -la correction-ui/.env

# Check variables are set
grep VITE_SUPABASE .env
```

### Issue 2: "Failed to fetch" or CORS errors

**Cause**: Supabase URL incorrect or service key invalid

**Solution**:
1. Verify URL matches your project: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/settings/api
2. Regenerate service key if expired
3. Check CORS settings (should allow localhost by default)

### Issue 3: TypeScript errors for database types

**Cause**: `database.types.ts` not generated or out of sync

**Solution**:
```bash
# Regenerate types
npx supabase gen types typescript --linked > src/types/database.types.ts

# Restart TypeScript server in IDE
# VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue 4: Port 5173 already in use

**Cause**: Another Vite dev server running

**Solution**:
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 5174
```

---

## Next Steps

After setup is complete:

1. **Implement P1 (MVP)**: ClassificationList and ClassificationDetail components
2. **Test correction workflow**: Edit a classification and verify it saves
3. **Implement P2**: Filter components
4. **Implement P3**: Analytics dashboard

See `tasks.md` (generated by `/speckit.tasks`) for detailed implementation steps.

---

## Quick Reference

**Start development**: `npm run dev`
**Run tests**: `npm run test:unit`
**Build for production**: `npm run build` (optional, not required for local use)
**Type check**: `npm run type-check`
**Lint**: `npm run lint`

**Supabase Dashboard**: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt
**Database Editor**: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/editor
**API Logs**: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/logs/edge-logs

---

## Performance Targets

- **Initial load**: <30 seconds (SC-007)
- **List page load**: <2 seconds with 1,000+ classifications (SC-005)
- **Correction save**: <1 second (database update + UI update)
- **Filter application**: Instant (<100ms)

---

## Security Checklist

- [ ] `.env` file excluded from git (check `.gitignore`)
- [ ] Service key never committed to repository
- [ ] Supabase RLS policies active (verify in Supabase dashboard)
- [ ] localhost-only access (no external exposure)

---

**Setup complete!** You're ready to build the correction UI. 🚀
