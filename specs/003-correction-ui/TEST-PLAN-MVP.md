# Test Plan: Email Classification Correction UI (MVP)

**Feature**: 003-correction-ui
**Phase**: MVP (Phases 1-3 - User Story 1)
**Date**: 2025-11-22
**Status**: Ready for Testing

---

## Test Scope

This test plan validates the MVP implementation (Phases 1-3) covering:
- Phase 1: Project setup and dependencies
- Phase 2: Foundational infrastructure
- Phase 3: Core correction workflow (User Story 1)

**Out of Scope** (Future phases):
- Filters and search (Phase 4)
- Analytics dashboard (Phase 5)
- Docker deployment (Phase 6)
- Polish features (Phase 7)

---

## Test Environment

### Prerequisites

- [x] Node.js 18+ installed
- [x] Dev server running at http://localhost:5173
- [x] Supabase database accessible (project: xmziovusqlmgygcrgyqt)
- [x] .env file configured with valid credentials
- [x] Browser with DevTools (Chrome/Firefox recommended)
- [x] At least 5-10 classifications in database for testing

### Environment Verification

```bash
# Verify dev server is running
curl -s http://localhost:5173 | grep -q "html" && echo "✓ Server running" || echo "✗ Server down"

# Verify environment variables loaded
cat correction-ui/.env | grep VITE_SUPABASE_URL && echo "✓ .env configured"

# Check database has data
# Open: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/editor
# Verify classifications table has rows
```

---

## Test Categories

1. **Setup Tests (T1)** - Verify project configuration
2. **Component Tests (T2)** - Individual component functionality
3. **Integration Tests (T3)** - Supabase database operations
4. **E2E Workflow Tests (T4)** - Complete user journeys
5. **Acceptance Scenario Tests (T5)** - Validate spec requirements
6. **Edge Case Tests (T6)** - Error handling and boundaries
7. **Performance Tests (T7)** - Success criteria validation
8. **Keyboard Navigation Tests (T8)** - Accessibility validation

---

## T1: Setup Tests (Phase 1 Validation)

### T1.1: Project Structure

**Objective**: Verify all directories and files exist

**Steps**:
```bash
cd /Users/rogercox/ai-assistant/correction-ui

# Check key directories
test -d src/components/shared && echo "✓ Components directory exists"
test -d src/services && echo "✓ Services directory exists"
test -d src/stores && echo "✓ Stores directory exists"
test -d src/types && echo "✓ Types directory exists"
test -d src/utils && echo "✓ Utils directory exists"

# Check key files
test -f .env && echo "✓ .env exists"
test -f .env.template && echo "✓ .env.template exists"
test -f src/types/database.types.ts && echo "✓ Database types exist"
```

**Expected Result**: All directories and files exist ✓

### T1.2: Dependencies Installed

**Objective**: Verify all npm packages are present

**Steps**:
```bash
# Check production dependencies
npm list @supabase/supabase-js | grep @supabase && echo "✓ Supabase client installed"
npm list vue | grep vue@ && echo "✓ Vue 3 installed"
npm list pinia | grep pinia && echo "✓ Pinia installed"
npm list apexcharts | grep apexcharts && echo "✓ ApexCharts installed"

# Check dev dependencies
npm list vitest | grep vitest && echo "✓ Vitest installed"
npm list @playwright/test | grep playwright && echo "✓ Playwright installed"
npm list @testing-library/vue | grep testing-library && echo "✓ Testing Library installed"
```

**Expected Result**: All dependencies present ✓

### T1.3: Environment Configuration

**Objective**: Verify .env file is properly configured

**Steps**:
```bash
# Check environment variables
grep VITE_SUPABASE_URL .env
grep VITE_SUPABASE_SERVICE_KEY .env

# Verify .env is git-ignored
grep "^\.env$" .gitignore && echo "✓ .env is git-ignored"
```

**Expected Result**:
- VITE_SUPABASE_URL=https://xmziovusqlmgygcrgyqt.supabase.co ✓
- VITE_SUPABASE_SERVICE_KEY present (not empty) ✓
- .env excluded from git ✓

### T1.4: TypeScript Compilation

**Objective**: Verify no TypeScript errors

**Steps**:
```bash
npm run type-check
```

**Expected Result**: Exit code 0, no type errors ✓

---

## T2: Component Tests (Phase 2 Validation)

### T2.1: Shared Components Render

**Objective**: Verify all shared components exist and can be imported

**Test File**: Create `src/components/shared/__tests__/SharedComponents.spec.ts`

```typescript
import { mount } from '@vue/test-utils'
import Dropdown from '../Dropdown.vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import CorrectionBadge from '../CorrectionBadge.vue'

describe('Shared Components', () => {
  test('Dropdown renders', () => {
    const wrapper = mount(Dropdown, {
      props: {
        modelValue: 'WORK',
        options: ['WORK', 'KIDS', 'OTHER']
      }
    })
    expect(wrapper.find('select').exists()).toBe(true)
  })

  test('ConfirmDialog renders when open', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message'
      }
    })
    expect(wrapper.text()).toContain('Test')
  })

  test('CorrectionBadge shows for corrected items', () => {
    const wrapper = mount(CorrectionBadge, {
      props: {
        correctedTimestamp: '2025-11-22T10:00:00Z'
      }
    })
    expect(wrapper.text()).toContain('Corrected')
  })
})
```

**Run**: `npm run test:unit`

**Expected Result**: All 3 tests pass ✓

### T2.2: Dropdown Component Functionality

**Objective**: Verify dropdown emits value changes

**Manual Test**:
1. Open http://localhost:5173/classification/[any-id]
2. Click category dropdown
3. Select different category
4. Verify dropdown updates to show new value

**Expected Result**: Dropdown value changes ✓

### T2.3: ConfirmDialog Interaction

**Objective**: Verify unsaved changes warning works

**Manual Test**:
1. Open http://localhost:5173/classification/[any-id]
2. Edit category (make a change)
3. Press **Escape** key
4. Verify confirm dialog appears
5. Click "Leave Without Saving"
6. Verify navigation to home page

**Expected Result**: Dialog appears, navigation works ✓

### T2.4: CorrectionBadge Display

**Objective**: Verify badge shows for corrected classifications

**Manual Test**:
1. Correct a classification (save it)
2. Return to list
3. Find the corrected item
4. Verify green "Corrected" badge appears
5. Hover over badge
6. Verify tooltip shows "Corrected [time] ago by [user]"

**Expected Result**: Badge visible with tooltip ✓

---

## T3: Integration Tests (Supabase Operations)

### T3.1: List Classifications Query

**Objective**: Verify listClassifications service method works

**Test**:
```typescript
// src/services/__tests__/classificationService.spec.ts
import { describe, test, expect, vi } from 'vitest'
import { listClassifications } from '../classificationService'

describe('listClassifications', () => {
  test('fetches paginated data from Supabase', async () => {
    const result = await listClassifications({
      page: 1,
      pageSize: 20
    })

    expect(result.data).toBeInstanceOf(Array)
    expect(result.totalCount).toBeGreaterThanOrEqual(0)
    expect(result.pageCount).toBeGreaterThanOrEqual(0)
    expect(result.currentPage).toBe(1)
  })

  test('applies pagination correctly', async () => {
    const page1 = await listClassifications({ page: 1, pageSize: 10 })
    const page2 = await listClassifications({ page: 2, pageSize: 10 })

    // Different data on different pages (if enough records exist)
    if (page1.totalCount > 10) {
      expect(page1.data[0].id).not.toBe(page2.data[0].id)
    }
  })
})
```

**Expected Result**: Queries return data with correct pagination ✓

### T3.2: Get Single Classification

**Objective**: Verify getClassification retrieves one record with joined email

**Manual Test**:
1. Note a classification ID from the list (e.g., ID: 5)
2. Open http://localhost:5173/classification/5
3. Verify email content displays (subject, sender, body)
4. Verify classification fields display (category, urgency, action)

**Expected Result**: Full data loads with email join ✓

### T3.3: Update Classification

**Objective**: Verify updateClassification saves to database

**Manual Test**:
1. Open Supabase editor: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/editor
2. Note original values for a classification (e.g., ID: 5, category: SHOPPING)
3. Open http://localhost:5173/classification/5
4. Change category to WORK
5. Click "Save Correction"
6. Refresh Supabase editor
7. Verify category changed to WORK
8. Check correction_logs table
9. Verify new entry with original_value=SHOPPING, corrected_value=WORK

**Expected Result**:
- Classification updated in database ✓
- Correction log entry created ✓
- original_category field populated ✓

---

## T4: End-to-End Workflow Tests

### T4.1: Complete Correction Workflow

**Objective**: Validate entire user journey from list to save and back

**Steps**:
1. Open http://localhost:5173/
2. Verify list loads with classifications
3. Note a classification to correct (e.g., row 3, currently SHOPPING)
4. Click row 3
5. Verify detail page loads
6. Verify email content displays
7. Change category from SHOPPING to WORK
8. Change urgency from LOW to MEDIUM
9. Add correction note: "Test correction from UI"
10. Click "Save Correction"
11. Verify success message appears
12. Wait for auto-navigation (1.5 seconds)
13. Verify back on list page
14. Verify row 3 now shows WORK category
15. Verify row 3 has green "Corrected" badge
16. Press F12 (open console)
17. Verify console logs show actions

**Expected Result**: Complete workflow successful ✓

**Time**: Should complete in <30 seconds (SC-001)

### T4.2: Pagination Navigation

**Objective**: Verify page navigation works correctly

**Steps**:
1. Open http://localhost:5173/
2. Note first classification subject on page 1
3. Click "Next" button
4. Verify page 2 loads
5. Verify different classifications shown
6. Verify page indicator shows "Page 2 of X"
7. Click "Previous" button
8. Verify back on page 1
9. Verify first classification matches original

**Expected Result**: Pagination navigates correctly ✓

### T4.3: Sorting Functionality

**Objective**: Verify column sorting works

**Steps**:
1. Open http://localhost:5173/
2. Click "Confidence" column header
3. Verify list re-sorts (ascending by confidence)
4. Verify arrow indicator (↑) appears on Confidence header
5. Click "Confidence" header again
6. Verify list re-sorts (descending by confidence)
7. Verify arrow indicator changes to (↓)
8. Click "Classified" column header
9. Verify list re-sorts by timestamp

**Expected Result**: All sortable columns work ✓

### T4.4: Page Size Change

**Objective**: Verify page size selector works

**Steps**:
1. Open http://localhost:5173/
2. Note default shows 20 per page
3. Click page size dropdown
4. Select "50 per page"
5. Verify list updates to show 50 items (if available)
6. Verify pagination info updates ("Showing 1-50 of X")
7. Select "100 per page"
8. Verify list shows up to 100 items

**Expected Result**: Page size changes correctly ✓

---

## T5: Acceptance Scenario Tests (Spec Validation)

### T5.1: AS-1 - Paginated List Display

**Spec**: "Given 20 recent email classifications exist in the database, When I open the correction UI homepage, Then I see a paginated list showing subject, sender, category, urgency, action, confidence score, and timestamp for each email"

**Test Steps**:
1. Open http://localhost:5173/
2. Verify page loads without errors
3. Verify table appears with columns:
   - [x] Subject
   - [x] Sender
   - [x] Category
   - [x] Urgency
   - [x] Action
   - [x] Confidence
   - [x] Classified (timestamp)
   - [x] Status
4. Verify at least one row displays
5. Verify data in all columns

**Expected Result**: ✅ All columns present with data

### T5.2: AS-2 - Detail View with Edit Controls

**Spec**: "Given I'm viewing the classification list, When I click on an email entry, Then I see the full email content (subject, sender, body preview), current classification fields (category/urgency/action), confidence score, and inline edit controls"

**Test Steps**:
1. From list page, click any row
2. Verify navigation to /classification/[id]
3. Verify Email Content section shows:
   - [x] Subject
   - [x] Sender (From)
   - [x] Received timestamp
   - [x] Body (text content)
4. Verify Classification section shows:
   - [x] Category dropdown
   - [x] Urgency dropdown
   - [x] Action dropdown
   - [x] Confidence bar/percentage
   - [x] Correction notes textarea
5. Verify buttons present:
   - [x] Save Correction
   - [x] Cancel

**Expected Result**: ✅ All email and edit controls displayed

### T5.3: AS-3 - Save Correction

**Spec**: "Given I'm viewing an email's classification detail, When I change the category from SHOPPING to WORK and click Save, Then the classification is updated in the database, a correction log entry is created, and I see a success confirmation"

**Test Steps**:
1. Navigate to a SHOPPING classification detail page
2. Change category dropdown from SHOPPING to WORK
3. Click "Save Correction" button
4. Verify success message appears: "✓ Correction saved successfully!"
5. Open Supabase dashboard in new tab
6. Navigate to classifications table
7. Find the edited record
8. Verify category = WORK
9. Verify original_category = SHOPPING
10. Verify corrected_timestamp is populated
11. Navigate to correction_logs table
12. Verify new entry exists with:
    - field_name = CATEGORY
    - original_value = SHOPPING
    - corrected_value = WORK

**Expected Result**: ✅ Database updated, correction logged, success shown

### T5.4: AS-4 - Return to List with Badge

**Spec**: "Given I just corrected a classification, When I return to the list view, Then the updated classification is reflected and the entry is visually marked as 'corrected' with a timestamp"

**Test Steps**:
1. After saving correction (from T5.3)
2. Wait for auto-navigation (1.5 seconds)
3. Verify returned to list page (/)
4. Find the corrected classification row
5. Verify category column shows WORK (not SHOPPING)
6. Verify Status column shows green "Corrected" badge
7. Hover over badge
8. Verify tooltip shows timestamp

**Expected Result**: ✅ List shows updated values with corrected badge

---

## T6: Edge Case Tests

### T6.1: Database Connection Failure

**Spec Edge Case**: "What happens when the database connection fails or is unavailable? UI shows a clear error message to the user, logs the error details to browser console, and allows retry without losing any unsaved corrections"

**Test Steps**:
1. Stop internet connection or block Supabase domain
2. Open http://localhost:5173/ (or refresh)
3. Verify error banner appears with message
4. Verify "Retry" button is present
5. Press F12 → Console tab
6. Verify error logged with [ERROR] prefix
7. Restore internet connection
8. Click "Retry" button
9. Verify list loads successfully

**Expected Result**: ✅ Error displayed, retry works

**Alternative Test** (without breaking connection):
1. Edit .env to use invalid SUPABASE_SERVICE_KEY
2. Restart dev server
3. Verify authentication error message appears
4. Restore correct key, restart, verify works

### T6.2: Long Email Body Truncation

**Spec Edge Case**: "How does the UI handle very long email bodies (>10,000 characters)? Display first 2,000 characters with 'Show More' expansion control"

**Test Steps**:
1. Find an email with body >2,000 characters (or create one in Supabase)
2. Navigate to that classification's detail page
3. Verify body shows approximately 2,000 characters
4. Verify "Show More (X characters total)" button appears
5. Click "Show More"
6. Verify full body displays
7. Verify "Show Less" button appears
8. Click "Show Less"
9. Verify body truncates again

**Expected Result**: ✅ Truncation and expansion work (FR-013)

### T6.3: Missing/Null Values

**Spec Edge Case**: "How does the UI handle missing or null values in email or classification data? Display 'N/A' or empty state gracefully without breaking layout"

**Test Steps**:
1. In Supabase, find or create a classification with:
   - subject = NULL
   - sender = NULL
   - body = NULL
2. Navigate to that classification in UI
3. Verify fields show "N/A" instead of crashing
4. Verify layout remains intact
5. Verify form is still editable

**Expected Result**: ✅ Graceful null handling, no crashes

### T6.4: Invalid Enum Values Prevention

**Spec Edge Case**: "What happens when a user tries to set an invalid category value? Use dropdown/select controls with only valid enum values - free text input not allowed"

**Test Steps**:
1. Open detail page
2. Inspect category dropdown (F12 → Elements)
3. Verify dropdown is `<select>` element (not text input)
4. Verify options limited to: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
5. Attempt to manually edit DOM to add invalid value
6. Try to save
7. Verify validation error appears

**Expected Result**: ✅ Only valid enums allowed (FR-014)

### T6.5: Unsaved Changes Warning

**Spec**: FR-020 - "UI MUST require confirmation dialog when user navigates away from unsaved changes in the edit view"

**Test Steps**:
1. Navigate to classification detail page
2. Change category (don't save)
3. Press Escape key
4. Verify confirm dialog appears
5. Verify message: "You have unsaved changes..."
6. Click "Stay and Continue Editing"
7. Verify stays on page, changes preserved
8. Press Escape again
9. Click "Leave Without Saving"
10. Verify navigation to home page

**Expected Result**: ✅ Confirmation required for unsaved changes

---

## T7: Performance Tests (Success Criteria)

### T7.1: SC-001 - Correction Time <30 Seconds

**Objective**: Validate user can complete correction in under 30 seconds

**Test Steps**:
1. Start timer
2. Open http://localhost:5173/
3. Click a classification row
4. Change category dropdown
5. Add correction note: "Test"
6. Click "Save Correction"
7. Wait for success message
8. Stop timer

**Expected Result**: ✅ Total time <30 seconds (target met)
**Actual**: Should be 10-15 seconds

### T7.2: SC-005 - List Load Time <2 Seconds

**Objective**: Verify list loads quickly with 1,000+ records

**Test Steps**:
1. Clear browser cache
2. Open http://localhost:5173/
3. Open DevTools → Network tab
4. Record page load time
5. Verify list appears in <2 seconds

**Expected Result**: ✅ List loads in <2 seconds

**Note**: If database has <1,000 records, this validates current data set. For 1,000+ validation, would need to add test data.

### T7.3: SC-006 - 100% Corrections Logged

**Objective**: Verify every correction creates correction_log entry

**Test Steps**:
1. Note correction_logs table count in Supabase
2. Make 5 corrections via UI (change category each time)
3. Refresh correction_logs table in Supabase
4. Verify count increased by 5 (or 15 if changing all 3 fields)

**Expected Result**: ✅ All corrections logged

### T7.4: SC-007 - Startup Time <30 Seconds

**Objective**: Verify server starts quickly

**Test Steps**:
1. Stop dev server (Ctrl+C)
2. Start timer
3. Run `npm run dev`
4. Wait for "ready in X ms" message
5. Open http://localhost:5173/
6. Wait for page to load
7. Stop timer

**Expected Result**: ✅ Total time <30 seconds
**Actual**: Should be <5 seconds

### T7.5: SC-008 - 95% First-Attempt Success

**Objective**: Verify UI is intuitive without training

**Test Steps**:
1. Give UI to someone who hasn't seen it
2. Ask them to: "Correct a classification from SHOPPING to WORK"
3. Don't provide instructions
4. Observe if they:
   - Find the classification list
   - Click a row to edit
   - Change the category
   - Save successfully
5. Record success/failure

**Expected Result**: ✅ User completes task without help

### T7.6: SC-009 - Zero Database Corruption

**Objective**: Verify no integrity violations from UI operations

**Test Steps**:
1. Make 20 corrections via UI
2. Check Supabase logs: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/logs
3. Verify no constraint violation errors
4. Verify no foreign key errors
5. Run database integrity check:
   ```sql
   -- Check for orphaned corrections
   SELECT COUNT(*) FROM correction_logs cl
   LEFT JOIN emails e ON cl.email_id = e.id
   WHERE e.id IS NULL;
   -- Should return 0
   ```

**Expected Result**: ✅ Zero integrity violations

### T7.7: SC-010 - Keyboard-Only Navigation

**Objective**: Verify complete workflow possible without mouse

**Test Steps** (keyboard only, no mouse):
1. Open http://localhost:5173/
2. Press **Tab** repeatedly to focus on classification row
3. Press **Enter** to navigate to detail
4. Press **Tab** to cycle through: category → urgency → action → notes → buttons
5. Press **Enter** on category dropdown to open
6. Press **Arrow Down** to select different category
7. Press **Enter** to confirm
8. Press **Tab** to reach "Save Correction" button
9. Press **Enter** to save
10. Verify success message appears
11. Press **Escape** after auto-navigation completes
12. Verify no issues

**Expected Result**: ✅ All workflows accessible via keyboard

---

## T8: Keyboard Navigation Tests (FR-022)

### T8.1: Tab Navigation

**Objective**: Verify Tab key moves focus through interactive elements

**Test Steps**:
1. Open classification detail page
2. Press Tab key repeatedly
3. Verify focus moves through: category → urgency → action → notes → Cancel → Save
4. Verify visible focus indicators on each element

**Expected Result**: ✅ Tab cycles through all form fields

### T8.2: Enter to Submit

**Objective**: Verify Enter key saves form when focused on dropdown

**Test Steps**:
1. Open classification detail page
2. Tab to category dropdown
3. Press Space or Arrow to open dropdown
4. Select different value
5. Press Enter
6. Verify form submits and saves

**Expected Result**: ✅ Enter triggers save

### T8.3: Escape to Cancel

**Objective**: Verify Escape key cancels editing

**Test Steps**:
1. Open classification detail page
2. Make any edit
3. Press Escape key
4. Verify confirm dialog appears
5. Press Escape again (or click Leave)
6. Verify navigation to home

**Expected Result**: ✅ Escape triggers cancel flow

---

## T9: Logging Tests (FR-021)

### T9.1: Action Logging

**Objective**: Verify all user actions logged to console

**Test Steps**:
1. Open http://localhost:5173/
2. Open DevTools (F12) → Console tab
3. Clear console
4. Perform actions:
   - Load list page
   - Click a row
   - Change dropdown value
   - Click save
5. Check console for logs

**Expected Logs**:
```
[ACTION] Fetching classifications { page: 1, pageSize: 20, filters: {} }
[ACTION] Classifications fetched { count: 20, total: 47 }
[ACTION] Classification clicked { id: 5 }
[ACTION] Classification detail mounted { id: 5 }
[ACTION] Saving classification correction { id: 5, changes: {...} }
[ACTION] Classification correction saved successfully { id: 5 }
```

**Expected Result**: ✅ All actions logged with context

### T9.2: Error Logging

**Objective**: Verify errors logged to console

**Test Steps**:
1. Temporarily break .env (invalid service key)
2. Restart dev server
3. Open http://localhost:5173/
4. Open console (F12)
5. Verify error logged:
   ```
   [ERROR] Failed to fetch classifications { error: {...}, context: {...}, timestamp: ... }
   ```
6. Verify user-friendly error message shown in UI
7. Restore .env and retry

**Expected Result**: ✅ Errors logged with full context

---

## T10: Cross-Browser Compatibility

### T10.1: Chrome/Chromium

**Test Steps**:
1. Open http://localhost:5173/ in Chrome
2. Complete full correction workflow
3. Verify all features work

**Expected Result**: ✅ Fully functional

### T10.2: Firefox

**Test Steps**:
1. Open http://localhost:5173/ in Firefox
2. Complete full correction workflow
3. Test keyboard navigation
4. Verify all features work

**Expected Result**: ✅ Fully functional

### T10.3: Safari

**Test Steps**:
1. Open http://localhost:5173/ in Safari
2. Complete basic workflow (list, detail, edit, save)
3. Verify no visual glitches

**Expected Result**: ✅ Fully functional

---

## Test Execution Summary

### Quick Smoke Test (5 minutes)

Run these critical tests to verify MVP works:

1. ✅ T1.4 - TypeScript compiles without errors
2. ✅ T3.2 - Detail page loads classification
3. ✅ T4.1 - Complete correction workflow end-to-end
4. ✅ T5.3 - Save creates database entry and correction log
5. ✅ T7.7 - Keyboard-only navigation works

### Full Test Suite (30-45 minutes)

Run all tests (T1 through T10) for comprehensive validation.

### Automated Test Suite

```bash
# Run unit tests
npm run test:unit

# Run E2E tests (when created)
npm run test:e2e

# Type check
npm run type-check
```

---

## Test Results Template

| Test ID | Test Name | Result | Notes |
|---------|-----------|--------|-------|
| T1.1 | Project Structure | ✅ PASS | All directories exist |
| T1.2 | Dependencies | ✅ PASS | All packages installed |
| T1.3 | Environment Config | ✅ PASS | .env configured correctly |
| T1.4 | TypeScript Compilation | ⏳ PENDING | Run `npm run type-check` |
| T2.1 | Shared Components | ⏳ PENDING | Create test file |
| T3.1 | List Classifications | ⏳ PENDING | Test with Supabase |
| T3.3 | Update Classification | ⏳ PENDING | Save and verify DB |
| T4.1 | Complete Workflow | ⏳ PENDING | End-to-end test |
| T5.1 | AS-1 Paginated List | ⏳ PENDING | Open UI and verify |
| T5.2 | AS-2 Detail View | ⏳ PENDING | Click row and verify |
| T5.3 | AS-3 Save Correction | ⏳ PENDING | Edit and save |
| T5.4 | AS-4 Corrected Badge | ⏳ PENDING | Return to list |
| T6.1 | Connection Failure | ⏳ PENDING | Test error handling |
| T6.2 | Long Body Truncation | ⏳ PENDING | Test >2000 chars |
| T6.5 | Unsaved Changes | ⏳ PENDING | Press Esc with edits |
| T7.1 | Correction Time | ⏳ PENDING | Time workflow |
| T7.7 | Keyboard Navigation | ⏳ PENDING | Test keyboard-only |
| T9.1 | Action Logging | ⏳ PENDING | Check console logs |

---

## Test Data Requirements

### Minimum Test Data

For effective testing, database should have:

- **At least 25 classifications** (to test pagination)
- **Mix of categories** (KIDS, WORK, SHOPPING, etc.)
- **Mix of confidence scores** (0.6-0.99)
- **At least 1 long email** (body >2,000 characters)
- **At least 1 already corrected** (to test badge display)

### Creating Test Data (If Needed)

If classifications table is empty:

```sql
-- This should already exist from 001-email-classification-mvp
-- If not, you need to run the email classification workflows first
SELECT COUNT(*) FROM classifications;
-- Should return > 0
```

---

## Defect Reporting Template

If issues found during testing:

### Defect Report

**ID**: DEF-001
**Severity**: Critical / High / Medium / Low
**Component**: [e.g., ClassificationList.vue]
**Test**: [e.g., T4.1 - Complete Workflow]

**Description**:
[What went wrong]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**:
[What should happen]

**Actual**:
[What actually happened]

**Console Errors** (if any):
```
[Paste console errors]
```

**Screenshot/Video**:
[Attach if helpful]

---

## Success Criteria

### MVP Test Completion Criteria

MVP testing is complete when:

- [x] All T1 setup tests pass (project configured correctly)
- [ ] All T5 acceptance scenario tests pass (spec requirements met)
- [ ] At least one complete T4 E2E workflow test passes
- [ ] At least 3 edge case tests (T6) pass
- [ ] At least 3 success criteria performance tests (T7) pass
- [ ] Keyboard navigation test (T7.7) passes
- [ ] Action logging test (T9.1) passes
- [ ] Zero critical defects
- [ ] All Medium/Low defects documented with workarounds

### Acceptance

**Ready for daily use** when:
- ✅ All 4 acceptance scenarios (T5.1-T5.4) validated
- ✅ Complete workflow (T4.1) works end-to-end
- ✅ Database operations confirmed (corrections saved and logged)
- ✅ No critical bugs preventing core functionality

---

## Next Steps After Testing

### If All Tests Pass

1. **Start using for daily corrections** ✅
2. **Gather feedback** after 1 week of use
3. **Decide on Phase 4** (filters) - is it needed?
4. **Plan Phase 5** (analytics) - after collecting correction data

### If Tests Fail

1. **Document defects** using template above
2. **Prioritize fixes**: Critical first, then High, Medium, Low
3. **Fix and retest** affected test cases
4. **Regression test** after fixes

### Future Test Planning

**Phase 4 (Filters)**: Will need tests for:
- Confidence slider filtering
- Date range filtering
- Category multi-select
- Filter combinations
- Clear filters button

**Phase 5 (Analytics)**: Will need tests for:
- Statistics accuracy
- Chart rendering
- Pattern aggregation
- Timeline data

**Phase 6 (Docker)**: Will need tests for:
- Docker build success
- Container starts
- Environment variables passed correctly
- Nginx serves files properly

---

## Appendix: Manual Test Script

### Quick 10-Minute Validation

Use this script for rapid MVP validation:

```
1. Open http://localhost:5173/
   ✓ List loads

2. Click first row
   ✓ Detail page loads

3. Change category to different value
   ✓ Dropdown updates

4. Click "Save Correction"
   ✓ Success message appears

5. Wait for auto-return to list
   ✓ Back on home page

6. Find edited row
   ✓ Green "Corrected" badge visible

7. Open Supabase dashboard
   ✓ Classification updated in DB

8. Check correction_logs table
   ✓ New entry exists

9. Press F12 → Console
   ✓ Action logs visible

10. Press Escape on detail page (after editing)
    ✓ Confirm dialog appears
```

**All 10 checks pass** = MVP is working! ✅

---

**Test Plan Complete**: Ready for MVP validation and daily use! 🧪
