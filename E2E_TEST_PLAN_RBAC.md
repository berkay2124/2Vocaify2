# End-to-End Security Test Plan: Multi-Tenant RBAC System

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Status:** Production-Ready
**Security Level:** CRITICAL

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Categories](#test-categories)
4. [Test Cases](#test-cases)
5. [Execution Guidelines](#execution-guidelines)
6. [Success Criteria](#success-criteria)
7. [Reporting](#reporting)

---

## Overview

This document defines comprehensive End-to-End (E2E) security tests for Vocaify's Multi-Tenant RBAC system. The tests are designed to prove **zero data leakage** between organizations and strict role-based access control enforcement.

### Critical Security Requirements

1. **Data Isolation**: Users from Organization A MUST NOT access Organization B's data
2. **RBAC Enforcement**: Users can only perform actions allowed by their role
3. **No Privilege Escalation**: Users cannot elevate their own permissions
4. **Admin Safeguards**: Last admin cannot be removed or demoted

### Test Coverage

- **Multi-Tenancy**: 8 test cases
- **RBAC Permissions**: 7 test cases
- **Edge Cases**: 6 test cases
- **Security Boundary Tests**: 4 test cases
- **Total**: 25+ comprehensive test cases

---

## Test Environment Setup

### Prerequisites

1. **Test Organizations**:
   - Organization A: "TechCorp" (ID: org_test_a)
   - Organization B: "FinanceHub" (ID: org_test_b)
   - Organization C: "HealthCare Inc" (ID: org_test_c)

2. **Test Users**:

   **Organization A (TechCorp)**:
   - admin_a@test.com (Admin)
   - manager_a@test.com (Manager)
   - recruiter_a@test.com (Recruiter)

   **Organization B (FinanceHub)**:
   - admin_b@test.com (Admin)
   - manager_b@test.com (Manager)
   - recruiter_b@test.com (Recruiter)

   **Organization C (HealthCare Inc)**:
   - admin_c@test.com (Admin)
   - manager_c@test.com (Manager)
   - recruiter_c@test.com (Recruiter)

3. **Test Data**:
   - 5 CVs uploaded to Organization A
   - 5 CVs uploaded to Organization B
   - 3 CVs uploaded to Organization C
   - 2 shortlisted candidates per organization
   - 1 rejected candidate per organization

### Environment Variables

```bash
# Set in .env.test
FIRESTORE_EMULATOR_HOST="localhost:8080"
FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"
FIREBASE_STORAGE_EMULATOR_HOST="localhost:9199"
```

### Test Execution Tools

- **Manual Testing**: Browser + Dev Tools
- **Automated Testing**: Cypress/Playwright
- **API Testing**: Postman/Thunder Client
- **Security Testing**: Firebase Emulator with rule validation

---

## Test Categories

### Category 1: Multi-Tenant Data Isolation (CRITICAL)

Tests that verify complete data segregation between organizations.

**Security Risk**: CRITICAL - Data breach, privacy violation
**Priority**: P0 (Must Pass)

### Category 2: RBAC Permission Enforcement

Tests that verify role-based permissions are correctly enforced.

**Security Risk**: HIGH - Unauthorized actions
**Priority**: P0 (Must Pass)

### Category 3: Edge Cases & Boundary Conditions

Tests for unusual scenarios and edge cases.

**Security Risk**: MEDIUM-HIGH
**Priority**: P1 (Should Pass)

### Category 4: Security Boundary Tests

Tests specifically designed to attempt security breaches.

**Security Risk**: CRITICAL
**Priority**: P0 (Must Pass)

---

## Test Cases

---

## CATEGORY 1: MULTI-TENANT DATA ISOLATION

---

### Test Case 1.1: Cross-Organization CV Read Attempt

**Objective**: Verify Organization B users cannot read Organization A's CVs

**Preconditions**:
- Organization A has 5 CVs uploaded
- Organization B user (manager_b@test.com) is logged in

**Steps**:
1. Log in as `manager_b@test.com`
2. Navigate to CV list page (`/dashboard`)
3. Observe displayed CVs
4. Attempt direct Firestore read: `db.collection('cvs').doc(CV_ID_FROM_ORG_A).get()`
5. Attempt Storage read: Download URL for Organization A CV

**Expected Results**:
- ✅ Dashboard shows ONLY Organization B CVs (5 CVs)
- ✅ Firestore query returns `permission-denied` error
- ✅ Storage download returns 403 Forbidden
- ✅ No Organization A data visible in UI
- ✅ No Organization A data in network responses

**Failure Impact**: CRITICAL - Data breach

---

### Test Case 1.2: Cross-Organization Shortlist Access

**Objective**: Verify users cannot access other organization's shortlists

**Preconditions**:
- Organization A has 2 shortlisted candidates
- Organization B user (recruiter_b@test.com) is logged in

**Steps**:
1. Log in as `recruiter_b@test.com`
2. Navigate to shortlist page (`/dashboard/shortlist`)
3. Observe displayed candidates
4. Attempt Firestore query: `db.collection('shortlists').where('organizationId', '==', 'org_test_a').get()`
5. Try to construct direct link: `/dashboard/shortlist?orgId=org_test_a`

**Expected Results**:
- ✅ Shortlist page shows ONLY Organization B candidates
- ✅ Firestore query returns `permission-denied` error
- ✅ Direct link with different orgId returns empty results or error
- ✅ No cross-organization data visible

**Failure Impact**: CRITICAL - Data leak

---

### Test Case 1.3: Cross-Organization Write Attempt

**Objective**: Verify users cannot write to other organization's collections

**Preconditions**:
- Organization A exists
- Organization B admin (admin_b@test.com) is logged in

**Steps**:
1. Log in as `admin_b@test.com`
2. Attempt to create CV document in Organization A:
   ```javascript
   db.collection('cvs').add({
     organizationId: 'org_test_a',
     userId: 'user_b',
     filename: 'malicious.pdf',
     status: 'indexed'
   })
   ```
3. Attempt to add shortlist entry to Organization A:
   ```javascript
   db.collection('shortlists').add({
     organizationId: 'org_test_a',
     cvId: 'some_cv_id',
     userId: 'user_b'
   })
   ```

**Expected Results**:
- ✅ Both write operations return `permission-denied` error
- ✅ No documents created in Organization A
- ✅ Firestore rules block the writes
- ✅ Console shows clear error message

**Failure Impact**: CRITICAL - Data corruption, unauthorized access

---

### Test Case 1.4: Cross-Organization Update Attempt

**Objective**: Verify users cannot update other organization's data

**Preconditions**:
- Organization A has existing CV document (cv_id_a_001)
- Organization B manager (manager_b@test.com) is logged in

**Steps**:
1. Log in as `manager_b@test.com`
2. Get Organization A CV ID from database
3. Attempt to update Organization A CV:
   ```javascript
   db.collection('cvs').doc('cv_id_a_001').update({
     status: 'error',
     errorMessage: 'Malicious update'
   })
   ```
4. Attempt to update Organization A shortlist:
   ```javascript
   db.collection('shortlists').doc('shortlist_a_001').update({
     notes: 'Modified by Org B'
   })
   ```

**Expected Results**:
- ✅ Update operations return `permission-denied` error
- ✅ No data modified in Organization A
- ✅ Original values remain unchanged
- ✅ Audit logs (if enabled) capture attempted violation

**Failure Impact**: CRITICAL - Data integrity breach

---

### Test Case 1.5: Cross-Organization Delete Attempt

**Objective**: Verify users cannot delete other organization's data

**Preconditions**:
- Organization A has CV documents and shortlists
- Organization B admin (admin_b@test.com) is logged in

**Steps**:
1. Log in as `admin_b@test.com`
2. Attempt to delete Organization A CV:
   ```javascript
   db.collection('cvs').doc('cv_id_a_001').delete()
   ```
3. Attempt to delete Organization A shortlist:
   ```javascript
   db.collection('shortlists').doc('shortlist_a_001').delete()
   ```
4. Attempt to delete Organization A rejected candidate:
   ```javascript
   db.collection('rejected').doc('rejected_a_001').delete()
   ```

**Expected Results**:
- ✅ All delete operations return `permission-denied` error
- ✅ Documents still exist in Organization A
- ✅ Storage files remain intact
- ✅ No data loss in Organization A

**Failure Impact**: CRITICAL - Data loss, sabotage

---

### Test Case 1.6: Storage Path Traversal Attempt

**Objective**: Verify storage rules prevent cross-organization file access via path manipulation

**Preconditions**:
- Organization A has CV at path: `/cvs/org_test_a/user_a/resume.pdf`
- Organization B manager (manager_b@test.com) is logged in

**Steps**:
1. Log in as `manager_b@test.com`
2. Attempt to access Organization A file using path traversal:
   ```javascript
   storage.ref('/cvs/org_test_a/user_a/resume.pdf').getDownloadURL()
   ```
3. Attempt to upload file to Organization A path:
   ```javascript
   storage.ref('/cvs/org_test_a/user_b/malicious.pdf').put(file)
   ```
4. Attempt to list Organization A files:
   ```javascript
   storage.ref('/cvs/org_test_a').listAll()
   ```

**Expected Results**:
- ✅ getDownloadURL() returns permission denied
- ✅ Upload to Organization A path fails
- ✅ List operation fails
- ✅ Only own organization path accessible

**Failure Impact**: CRITICAL - File access breach

---

### Test Case 1.7: Organization ID Spoofing Attempt

**Objective**: Verify backend validates organizationId from user profile, not client request

**Preconditions**:
- Organization B user (manager_b@test.com) is logged in
- User's actual organizationId is `org_test_b`

**Steps**:
1. Log in as `manager_b@test.com`
2. Intercept upload request in browser DevTools
3. Modify request body to include `organizationId: 'org_test_a'`
4. Send modified request
5. Check which organization received the CV

**Expected Results**:
- ✅ CV is created in Organization B (user's actual org)
- ✅ organizationId from request body is ignored
- ✅ Server uses organizationId from authenticated user profile
- ✅ No cross-organization pollution

**Failure Impact**: CRITICAL - Authorization bypass

---

### Test Case 1.8: Multi-Organization User Test

**Objective**: Verify a user in multiple organizations can only access one at a time

**Preconditions**:
- User `multi_user@test.com` is member of both Organization A and Organization B
- User has separate profiles for each organization

**Steps**:
1. Log in as `multi_user@test.com`
2. Verify active organization (should be one, not both)
3. Access CV list
4. Verify CVs are from active organization only
5. Attempt to switch organization (if feature exists)
6. Verify context switches completely

**Expected Results**:
- ✅ Only one organization active at a time
- ✅ CVs from active organization displayed
- ✅ No data mixing between organizations
- ✅ Clear organization indicator in UI
- ✅ Organization switch requires re-authentication or explicit action

**Failure Impact**: HIGH - Data confusion, potential leak

---

## CATEGORY 2: RBAC PERMISSION ENFORCEMENT

---

### Test Case 2.1: Recruiter Upload Restriction

**Objective**: Verify recruiters cannot upload CVs

**Preconditions**:
- recruiter_a@test.com is logged in
- User has recruiter role in Organization A

**Steps**:
1. Log in as `recruiter_a@test.com`
2. Navigate to upload page (`/dashboard/upload`)
3. Observe page access
4. If page is accessible, attempt to upload a CV
5. Attempt direct Storage upload via API

**Expected Results**:
- ✅ Upload page redirects to dashboard with error message
- ✅ OR Upload button is disabled/hidden
- ✅ Direct API upload returns 403 Forbidden
- ✅ Storage rules block recruiter uploads
- ✅ Firestore document creation fails

**Failure Impact**: MEDIUM - Unauthorized data modification

---

### Test Case 2.2: Recruiter Delete Restriction

**Objective**: Verify recruiters cannot delete CVs

**Preconditions**:
- recruiter_a@test.com is logged in
- Organization A has 5 CVs

**Steps**:
1. Log in as `recruiter_a@test.com`
2. Navigate to CV list
3. Observe delete button visibility
4. Attempt direct Firestore delete:
   ```javascript
   db.collection('cvs').doc('cv_id_a_001').delete()
   ```
5. Attempt direct Storage delete:
   ```javascript
   storage.ref('/cvs/org_test_a/user_a/resume.pdf').delete()
   ```

**Expected Results**:
- ✅ No delete buttons visible in UI
- ✅ Firestore delete returns `permission-denied`
- ✅ Storage delete returns 403 Forbidden
- ✅ CVs remain intact

**Failure Impact**: HIGH - Data loss

---

### Test Case 2.3: Manager Team Management Restriction

**Objective**: Verify managers cannot access team management features

**Preconditions**:
- manager_a@test.com is logged in
- User has manager role in Organization A

**Steps**:
1. Log in as `manager_a@test.com`
2. Attempt to access team management page (`/settings/team`)
3. Observe page access
4. Attempt to send invitation via Firestore:
   ```javascript
   db.collection('invitations').add({
     organizationId: 'org_test_a',
     email: 'new@test.com',
     role: 'recruiter'
   })
   ```

**Expected Results**:
- ✅ Team management page redirects to dashboard
- ✅ Error message: "Admin privileges required"
- ✅ Invitation creation returns `permission-denied`
- ✅ No team management options visible in navigation

**Failure Impact**: MEDIUM - Unauthorized user management

---

### Test Case 2.4: Admin Full Access Verification

**Objective**: Verify admins have complete access to all features

**Preconditions**:
- admin_a@test.com is logged in

**Steps**:
1. Log in as `admin_a@test.com`
2. Access team management page
3. Upload a CV
4. Delete a CV
5. Update user roles
6. View all analytics
7. Access billing (if available)

**Expected Results**:
- ✅ All pages accessible
- ✅ All operations succeed
- ✅ No permission errors
- ✅ Full feature set available

**Failure Impact**: HIGH - Admin cannot manage organization

---

### Test Case 2.5: Manager CV Management Permissions

**Objective**: Verify managers can upload and delete CVs but not manage team

**Preconditions**:
- manager_a@test.com is logged in

**Steps**:
1. Log in as `manager_a@test.com`
2. Upload a new CV
3. View all organization CVs
4. Delete a CV
5. Assign recruiter to CV (if feature exists)
6. Attempt to access team management
7. Attempt to change own role

**Expected Results**:
- ✅ CV upload succeeds
- ✅ All organization CVs visible
- ✅ CV deletion succeeds
- ✅ Recruiter assignment succeeds
- ✅ Team management page access denied
- ✅ Role change operation fails

**Failure Impact**: MEDIUM - Permission boundary violation

---

### Test Case 2.6: Recruiter View-Only Verification

**Objective**: Verify recruiters can only view assigned data, cannot modify

**Preconditions**:
- recruiter_a@test.com is logged in
- Recruiter is assigned to shortlist_001

**Steps**:
1. Log in as `recruiter_a@test.com`
2. Navigate to shortlist page
3. Verify visible candidates (should only see assigned)
4. Attempt to delete shortlist entry
5. Attempt to upload CV
6. Attempt to view all organization CVs

**Expected Results**:
- ✅ Only assigned shortlists visible
- ✅ Delete operation fails or button hidden
- ✅ Upload page access denied
- ✅ Full CV list not accessible (or shows assigned only)
- ✅ Read-only mode enforced

**Failure Impact**: MEDIUM - Unauthorized modifications

---

### Test Case 2.7: Role Update Permission Check

**Objective**: Verify only admins can update user roles

**Preconditions**:
- manager_a@test.com is logged in
- recruiter_a@test.com exists in same organization

**Steps**:
1. Log in as `manager_a@test.com`
2. Attempt to update recruiter_a's role to manager:
   ```javascript
   db.collection('userProfiles').doc('recruiter_a_uid').update({
     role: 'manager'
   })
   ```
3. Attempt via team management UI (if accessible)

**Expected Results**:
- ✅ Update operation returns `permission-denied`
- ✅ Recruiter role remains unchanged
- ✅ Only admins can modify roles (verified by checking admin_a can update)

**Failure Impact**: HIGH - Privilege escalation

---

## CATEGORY 3: EDGE CASES & BOUNDARY CONDITIONS

---

### Test Case 3.1: Last Admin Protection

**Objective**: Verify system prevents removal/demotion of last admin

**Preconditions**:
- Organization A has exactly ONE admin (admin_a@test.com)
- admin_a@test.com is logged in

**Steps**:
1. Log in as `admin_a@test.com`
2. Navigate to team management page
3. Attempt to change own role from admin to manager
4. Attempt to deactivate own account
5. Verify system prevents action

**Expected Results**:
- ✅ Role change operation fails with error message
- ✅ Error: "Cannot change role. Organization must have at least one admin"
- ✅ Deactivation fails with similar error
- ✅ Admin role preserved
- ✅ Organization remains manageable

**Failure Impact**: CRITICAL - Organization becomes unmanageable

---

### Test Case 3.2: Self-Role Elevation Attempt

**Objective**: Verify users cannot elevate their own role

**Preconditions**:
- recruiter_a@test.com is logged in

**Steps**:
1. Log in as `recruiter_a@test.com`
2. Attempt to update own profile:
   ```javascript
   db.collection('userProfiles').doc('recruiter_a_uid').update({
     role: 'admin'
   })
   ```
3. Attempt via profile settings UI
4. Attempt to modify client-side state

**Expected Results**:
- ✅ Update operation returns `permission-denied`
- ✅ Role remains recruiter
- ✅ Client-side changes don't affect backend
- ✅ Security rules prevent self-elevation

**Failure Impact**: CRITICAL - Privilege escalation

---

### Test Case 3.3: Expired Invitation Handling

**Objective**: Verify expired invitations cannot be accepted

**Preconditions**:
- Invitation sent to `expired@test.com` 8 days ago (expired)

**Steps**:
1. Access invitation link from email
2. Attempt to accept invitation
3. Check invitation status in Firestore

**Expected Results**:
- ✅ Acceptance page shows "Invitation expired" error
- ✅ Backend rejects acceptance with deadline-exceeded error
- ✅ Invitation status updated to 'expired'
- ✅ User not added to organization

**Failure Impact**: LOW - Invalid user addition

---

### Test Case 3.4: Duplicate Invitation Prevention

**Objective**: Verify system prevents sending duplicate invitations

**Preconditions**:
- admin_a@test.com is logged in
- Invitation already sent to `pending@test.com` (status: pending)

**Steps**:
1. Log in as `admin_a@test.com`
2. Navigate to team management page
3. Enter `pending@test.com` in invitation form
4. Attempt to send invitation
5. Check Firestore for duplicate invitations

**Expected Results**:
- ✅ UI shows error: "Invitation already sent to this email"
- ✅ No duplicate invitation created
- ✅ Original invitation remains pending
- ✅ Cloud Function cancels old invitation if new one sent

**Failure Impact**: LOW - Duplicate invitations spam

---

### Test Case 3.5: Member Limit Enforcement

**Objective**: Verify organization member limits are enforced

**Preconditions**:
- Organization A has starter plan (max 5 members)
- Organization A currently has 5 members
- admin_a@test.com is logged in

**Steps**:
1. Log in as `admin_a@test.com`
2. Navigate to team management page
3. Observe member count display (5/5)
4. Attempt to send invitation to `sixth@test.com`
5. Verify invitation creation is blocked

**Expected Results**:
- ✅ UI shows "Member limit reached" error
- ✅ Invitation form disabled or shows warning
- ✅ Backend rejects invitation creation
- ✅ Error message suggests upgrading plan
- ✅ No invitation created

**Failure Impact**: MEDIUM - Plan limits not enforced

---

### Test Case 3.6: Invalid Role Assignment Prevention

**Objective**: Verify system prevents assignment of invalid roles

**Preconditions**:
- admin_a@test.com is logged in
- Team management page is open

**Steps**:
1. Log in as `admin_a@test.com`
2. Send invitation with invalid role via API:
   ```javascript
   db.collection('invitations').add({
     organizationId: 'org_test_a',
     email: 'test@test.com',
     role: 'superadmin', // Invalid role
     invitedBy: 'admin_a_uid'
   })
   ```
3. Attempt via UI with manipulated dropdown
4. Check Firestore validation

**Expected Results**:
- ✅ Firestore write fails with validation error
- ✅ Only valid roles (admin, manager, recruiter) accepted
- ✅ UI dropdown only shows valid roles
- ✅ Backend validates role before processing

**Failure Impact**: HIGH - Invalid permission states

---

## CATEGORY 4: SECURITY BOUNDARY TESTS

---

### Test Case 4.1: Token Hijacking Attempt

**Objective**: Verify stolen invitation token cannot be used by wrong user

**Preconditions**:
- Invitation sent to `alice@test.com` with token ABC123
- attacker@test.com is logged in

**Steps**:
1. Log in as `attacker@test.com` (different email)
2. Access invitation link with token ABC123
3. Attempt to accept invitation
4. Verify email validation

**Expected Results**:
- ✅ Acceptance fails with permission-denied error
- ✅ Error: "Invitation was sent to a different email address"
- ✅ Backend compares authenticated user email with invitation email
- ✅ No profile created for attacker

**Failure Impact**: CRITICAL - Account takeover

---

### Test Case 4.2: Direct Firestore Query Bypass Attempt

**Objective**: Verify client-side queries are properly restricted by security rules

**Preconditions**:
- recruiter_b@test.com is logged in

**Steps**:
1. Log in as `recruiter_b@test.com`
2. Open browser console
3. Execute queries bypassing UI logic:
   ```javascript
   // Attempt to read all CVs (should be restricted)
   db.collection('cvs').get()

   // Attempt to read all users
   db.collection('userProfiles').get()

   // Attempt to read all organizations
   db.collection('organizations').get()
   ```

**Expected Results**:
- ✅ All queries return `permission-denied` or empty results
- ✅ Only organizationId-scoped queries succeed
- ✅ Security rules enforce data access restrictions
- ✅ No unauthorized data visible

**Failure Impact**: CRITICAL - Information disclosure

---

### Test Case 4.3: Metadata Injection Attack

**Objective**: Verify file upload metadata cannot be manipulated for privilege escalation

**Preconditions**:
- manager_a@test.com is logged in

**Steps**:
1. Log in as `manager_a@test.com`
2. Upload CV with malicious metadata:
   ```javascript
   storage.ref(path).put(file, {
     customMetadata: {
       organizationId: 'org_test_b', // Different org
       uploadedBy: 'admin_a_uid', // Different user
       __proto__: { isAdmin: true } // Prototype pollution
     }
   })
   ```
3. Check if upload succeeds with malicious metadata
4. Verify metadata is sanitized

**Expected Results**:
- ✅ Upload fails due to metadata validation
- ✅ Storage rules reject mismatched organizationId
- ✅ Prototype pollution fields blocked
- ✅ Only trusted metadata accepted

**Failure Impact**: HIGH - Metadata-based attacks

---

### Test Case 4.4: Session Fixation & Cross-Organization Switching

**Objective**: Verify user cannot maintain session across organization boundaries

**Preconditions**:
- User has accounts in both Organization A and Organization B
- User is logged into Organization A

**Steps**:
1. Log in as `user@test.com` (Organization A context)
2. Copy session token/cookies
3. Attempt to access Organization B resources using saved session
4. Modify organizationId in localStorage/sessionStorage
5. Refresh page and check active organization

**Expected Results**:
- ✅ Session remains tied to Organization A
- ✅ Organization B resources not accessible
- ✅ Client-side organizationId modification ignored
- ✅ Server validates organizationId from backend user profile
- ✅ No session fixation vulnerability

**Failure Impact**: CRITICAL - Unauthorized access

---

## EXECUTION GUIDELINES

### Manual Testing Workflow

1. **Setup** (30 minutes):
   - Create test organizations and users
   - Upload test CV data
   - Configure Firebase emulators

2. **Execution** (4-6 hours):
   - Run tests sequentially by category
   - Document all results in test tracking sheet
   - Screenshot all failures

3. **Validation** (1-2 hours):
   - Review Firestore rules logs
   - Check Storage access logs
   - Verify no security rule violations

### Automated Testing (Recommended)

Example Cypress test:

```javascript
describe('Cross-Organization Access Tests', () => {
  it('should deny cross-org CV access', () => {
    // Log in as Org B user
    cy.login('manager_b@test.com');

    // Attempt to access Org A CV
    cy.request({
      method: 'GET',
      url: '/api/cvs/cv_id_org_a_001',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403);
    });
  });
});
```

### Security Rule Testing

Use Firebase Emulator Suite:

```bash
# Start emulators
firebase emulators:start

# Run security rule tests
firebase emulators:exec --only firestore "npm run test:rules"
```

Example test:

```javascript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

it('should deny cross-organization CV read', async () => {
  const env = await initializeTestEnvironment({
    projectId: 'vocaify-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  const orgBUser = env.authenticatedContext('user_b', {
    organizationId: 'org_test_b',
    role: 'manager',
  });

  // Attempt to read Org A CV
  await assertFails(
    orgBUser.firestore().collection('cvs').doc('cv_org_a_001').get()
  );
});
```

---

## SUCCESS CRITERIA

### P0 (Must Pass) - Zero Tolerance

All tests in these categories MUST pass with 100% success rate:

- ✅ Category 1: Multi-Tenant Data Isolation (8/8 tests)
- ✅ Category 4: Security Boundary Tests (4/4 tests)
- ✅ Test Case 2.1: Recruiter Upload Restriction
- ✅ Test Case 2.2: Recruiter Delete Restriction
- ✅ Test Case 3.1: Last Admin Protection
- ✅ Test Case 3.2: Self-Role Elevation Attempt

**Total P0 Tests: 16/25 (64%)**

### P1 (Should Pass) - High Priority

- ✅ All remaining Category 2 tests (RBAC)
- ✅ Test Cases 3.3 - 3.6 (Edge Cases)

**Total P1 Tests: 9/25 (36%)**

### Overall Pass Threshold

- **Production Release**: 25/25 tests (100%) must pass
- **Staging Release**: 24/25 tests (96%) minimum
- **Development**: 20/25 tests (80%) minimum

### Failure Handling

If any P0 test fails:

1. **STOP** all deployment activities
2. **DOCUMENT** the failure with screenshots and logs
3. **FIX** the security vulnerability immediately
4. **RE-RUN** all tests from beginning
5. **SECURITY REVIEW** with team lead before proceeding

---

## REPORTING

### Test Report Template

```markdown
# Multi-Tenant RBAC Test Report

**Date**: YYYY-MM-DD
**Tester**: Name
**Environment**: Production/Staging/Local
**Build Version**: vX.X.X

## Summary

- Total Tests: 25
- Passed: XX
- Failed: XX
- Skipped: XX
- Pass Rate: XX%

## Category Results

| Category | Tests | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Multi-Tenant Isolation | 8 | X | X | XX% |
| RBAC Permissions | 7 | X | X | XX% |
| Edge Cases | 6 | X | X | XX% |
| Security Boundaries | 4 | X | X | XX% |

## Critical Failures (P0)

[List any P0 failures with details]

## Recommendations

[List recommended actions]

## Sign-Off

- [ ] All P0 tests passed
- [ ] Security review completed
- [ ] Ready for production deployment

Approved by: __________________
Date: __________________
```

---

## APPENDIX A: Quick Reference

### Role Permission Matrix

| Action | Admin | Manager | Recruiter |
|--------|-------|---------|-----------|
| Upload CVs | ✅ | ✅ | ❌ |
| View All CVs | ✅ | ✅ | ❌ |
| View Assigned CVs | ✅ | ✅ | ✅ |
| Delete CVs | ✅ | ✅ | ❌ |
| Manage Team | ✅ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ |
| Send Invitations | ✅ | ❌ | ❌ |
| Manage Billing | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ |

### Organization Isolation Checklist

- [ ] CVs collection has organizationId filter
- [ ] Shortlists collection has organizationId filter
- [ ] Rejected collection has organizationId filter
- [ ] Storage path includes organizationId
- [ ] All queries validate organizationId
- [ ] Cross-organization reads blocked
- [ ] Cross-organization writes blocked
- [ ] Cross-organization deletes blocked

---

## APPENDIX B: Security Test Automation Script

```javascript
/**
 * Automated Security Test Suite
 * Run with: node test-rbac-security.js
 */

const admin = require('firebase-admin');
const { expect } = require('chai');

// Test Case: Cross-Organization Access
async function testCrossOrgAccess() {
  const db = admin.firestore();

  // Create test context for Org B user
  const orgBUserContext = { uid: 'user_b', organizationId: 'org_test_b' };

  try {
    // Attempt to read Org A CV (should fail)
    await db.collection('cvs').doc('cv_org_a_001').get();
    throw new Error('SECURITY BREACH: Cross-org read succeeded!');
  } catch (error) {
    expect(error.code).to.equal('permission-denied');
    console.log('✅ Cross-organization access blocked');
  }
}

// Test Case: Recruiter Upload Restriction
async function testRecruiterUpload() {
  // Login as recruiter
  // Attempt CV upload
  // Verify fails with 403
}

// Run all tests
async function runTests() {
  await testCrossOrgAccess();
  await testRecruiterUpload();
  // ... more tests
}

runTests().catch(console.error);
```

---

## DOCUMENT CHANGELOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-18 | Security Team | Initial comprehensive test plan created |

---

**END OF DOCUMENT**

---

**CRITICAL REMINDER**: All P0 tests MUST pass before production deployment. No exceptions.
