# Security Infrastructure Deployment Guide

**Version:** 1.0
**Date:** 2025-11-18
**Status:** PRODUCTION READY

---

## Overview

This guide covers deployment of the final security infrastructure for Vocaify's enterprise multi-tenant RBAC system, including storage rules, Cloud Functions, and comprehensive E2E testing.

---

## Pre-Deployment Checklist

- [ ] All E2E tests passed (25/25 - 100%)
- [ ] Security review completed
- [ ] Firebase project configured
- [ ] Environment variables set
- [ ] Backup of existing rules created
- [ ] Rollback plan prepared

---

## Step 1: Deploy Storage Security Rules

### 1.1 Backup Existing Rules

```bash
# Backup current storage rules
firebase storage:rules:get > storage.rules.backup.$(date +%Y%m%d)
```

### 1.2 Deploy New Rules

```bash
# Deploy multi-tenant storage rules
firebase deploy --only storage

# Expected output:
# ✔  storage: released rules storage.rules to firebase.storage/YOUR_BUCKET
```

### 1.3 Verify Deployment

```bash
# Test upload to correct organization (should succeed)
# Test upload to different organization (should fail with 403)
```

**Verification Checklist:**
- [ ] Organization isolation enforced
- [ ] RBAC permissions working (admin/manager can upload, recruiter cannot)
- [ ] Metadata validation active
- [ ] Cross-organization access blocked

---

## Step 2: Deploy Cloud Functions

### 2.1 Install Dependencies

```bash
cd functions
npm install
```

### 2.2 Build Functions

```bash
npm run build

# Verify compilation
ls lib/  # Should see index.js, inviteUser.js, etc.
```

### 2.3 Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy invitation functions only
firebase deploy --only functions:onInvitationCreated,functions:dailyInvitationCleanup,functions:acceptTeamInvitation
```

**Expected Functions:**
- ✅ onInvitationCreated (Firestore trigger)
- ✅ dailyInvitationCleanup (Scheduled)
- ✅ acceptTeamInvitation (HTTP callable)
- ✅ onCVUpload (Storage trigger)
- ✅ reprocessCV (HTTP callable)
- ✅ processStuckCVs (Scheduled)
- ✅ getProcessingStats (HTTP endpoint)

### 2.4 Configure Cloud Scheduler

```bash
# Create daily cleanup job
gcloud scheduler jobs create pubsub daily-invitation-cleanup \
  --schedule="0 2 * * *" \
  --topic=firebase-schedule-dailyInvitationCleanup \
  --message-body='{}' \
  --time-zone="America/New_York"
```

### 2.5 Set Environment Variables

```bash
# Set app URL for invitation emails
firebase functions:config:set app.url="https://vocaify.com"

# For production email service (optional)
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_KEY"

# Deploy with new config
firebase deploy --only functions
```

---

## Step 3: Update Firestore Indexes

### 3.1 Deploy Composite Indexes

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "cvs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "uploadedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "shortlists",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "addedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "rejected",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "rejectedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "invitations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "invitations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

---

## Step 4: Migrate Existing Data (If Needed)

If you have existing CVs in the old path structure `/cvs/{userId}/{filename}`, migrate to `/cvs/{orgId}/{userId}/{filename}`:

### 4.1 Create Migration Script

```javascript
// migrate-storage-paths.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function migrateCVPaths() {
  const cvs = await db.collection('cvs').get();

  for (const cvDoc of cvs.docs) {
    const cv = cvDoc.data();
    const oldPath = cv.storagePath; // cvs/{userId}/{filename}

    // Get user's organization
    const userProfile = await db.collection('userProfiles').doc(cv.userId).get();
    const organizationId = userProfile.data()?.organizationId;

    if (!organizationId) {
      console.error(`No organization for user ${cv.userId}`);
      continue;
    }

    // New path
    const filename = oldPath.split('/').pop();
    const newPath = `cvs/${organizationId}/${cv.userId}/${filename}`;

    // Copy file
    await bucket.file(oldPath).copy(bucket.file(newPath));

    // Update metadata
    await bucket.file(newPath).setMetadata({
      metadata: {
        organizationId,
        uploadedBy: cv.userId,
        originalPath: oldPath
      }
    });

    // Update Firestore document
    await cvDoc.ref.update({
      storagePath: newPath,
      organizationId
    });

    console.log(`Migrated: ${oldPath} -> ${newPath}`);
  }
}

migrateCVPaths().catch(console.error);
```

Run migration:

```bash
node migrate-storage-paths.js
```

### 4.2 Verify Migration

```bash
# Check all CVs have organizationId
firebase firestore:query cvs --where organizationId --equals null

# Should return no results
```

---

## Step 5: Run E2E Security Tests

### 5.1 Setup Test Environment

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, run tests
npm run test:security
```

### 5.2 Execute All Test Cases

Run all 25 test cases from `E2E_TEST_PLAN_RBAC.md`:

**Category 1: Multi-Tenant Isolation (8 tests)**
- [ ] Test 1.1: Cross-Organization CV Read Attempt
- [ ] Test 1.2: Cross-Organization Shortlist Access
- [ ] Test 1.3: Cross-Organization Write Attempt
- [ ] Test 1.4: Cross-Organization Update Attempt
- [ ] Test 1.5: Cross-Organization Delete Attempt
- [ ] Test 1.6: Storage Path Traversal Attempt
- [ ] Test 1.7: Organization ID Spoofing Attempt
- [ ] Test 1.8: Multi-Organization User Test

**Category 2: RBAC Permissions (7 tests)**
- [ ] Test 2.1: Recruiter Upload Restriction
- [ ] Test 2.2: Recruiter Delete Restriction
- [ ] Test 2.3: Manager Team Management Restriction
- [ ] Test 2.4: Admin Full Access Verification
- [ ] Test 2.5: Manager CV Management Permissions
- [ ] Test 2.6: Recruiter View-Only Verification
- [ ] Test 2.7: Role Update Permission Check

**Category 3: Edge Cases (6 tests)**
- [ ] Test 3.1: Last Admin Protection
- [ ] Test 3.2: Self-Role Elevation Attempt
- [ ] Test 3.3: Expired Invitation Handling
- [ ] Test 3.4: Duplicate Invitation Prevention
- [ ] Test 3.5: Member Limit Enforcement
- [ ] Test 3.6: Invalid Role Assignment Prevention

**Category 4: Security Boundaries (4 tests)**
- [ ] Test 4.1: Token Hijacking Attempt
- [ ] Test 4.2: Direct Firestore Query Bypass Attempt
- [ ] Test 4.3: Metadata Injection Attack
- [ ] Test 4.4: Session Fixation & Cross-Organization Switching

### 5.3 Success Criteria

**Production Deployment Requirements:**
- ✅ All 25 tests MUST pass (100%)
- ✅ All P0 tests (16 tests) MUST pass
- ✅ No security rule violations in logs
- ✅ No cross-organization data leakage observed

---

## Step 6: Monitor Deployment

### 6.1 Check Logs

```bash
# Cloud Functions logs
firebase functions:log

# Firestore rules logs
# Firebase Console > Firestore > Rules > Evaluation Logs

# Storage rules logs
# Firebase Console > Storage > Rules > Evaluation Logs
```

### 6.2 Monitor Metrics

**Key Metrics to Watch:**
- Invitation creation success rate (should be >95%)
- Email delivery success rate
- Storage upload success rate (should remain stable)
- Security rule denial rate (should spike initially for unauthorized attempts)
- Cloud Function execution time

### 6.3 Set Up Alerts

```bash
# Alert on high security rule denials
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Security Rule Denials" \
  --condition-threshold-value=100 \
  --condition-threshold-duration=300s
```

---

## Step 7: Post-Deployment Validation

### 7.1 Smoke Tests

1. **Create Organization**:
   - Sign up new user
   - Verify organization created
   - Verify user is admin

2. **Invite Team Member**:
   - Send invitation as admin
   - Check Cloud Function logs
   - Verify invitation email logged
   - Accept invitation with new user
   - Verify user added to organization

3. **Upload CV**:
   - Upload CV as manager
   - Verify stored at correct path: `/cvs/{orgId}/{userId}/{filename}`
   - Verify metadata includes organizationId
   - Verify Firestore document created

4. **Test RBAC**:
   - Log in as recruiter
   - Verify cannot upload CVs
   - Verify cannot access team management
   - Verify can only view assigned data

5. **Test Isolation**:
   - Create second organization
   - Upload CVs to both
   - Verify no cross-organization access

### 7.2 Performance Validation

```bash
# Check function execution times
firebase functions:log --only onInvitationCreated

# Verify cold start times < 5s
# Verify warm execution < 500ms
```

---

## Rollback Procedures

### If Issues Detected

**Rollback Storage Rules:**
```bash
firebase deploy --only storage < storage.rules.backup.YYYYMMDD
```

**Rollback Cloud Functions:**
```bash
# Revert to previous version
firebase functions:delete onInvitationCreated
firebase functions:delete dailyInvitationCleanup
firebase functions:delete acceptTeamInvitation

# Re-deploy old version from git
git checkout PREVIOUS_COMMIT
firebase deploy --only functions
```

**Rollback Firestore Indexes:**
```bash
# Delete new indexes via Firebase Console
# Firestore > Indexes > Delete
```

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All code reviewed and approved
- [ ] All E2E tests passed (25/25)
- [ ] Security review completed
- [ ] Backup of current rules created
- [ ] Deployment scheduled during low-traffic window

### During Deployment
- [ ] Storage rules deployed successfully
- [ ] Cloud Functions deployed successfully
- [ ] Firestore indexes created
- [ ] Environment variables configured
- [ ] Cloud Scheduler jobs created

### Post-Deployment
- [ ] Smoke tests passed
- [ ] No error spikes in logs
- [ ] Performance metrics stable
- [ ] Monitoring and alerts configured
- [ ] Team notified of deployment
- [ ] Documentation updated

### Validation
- [ ] Test organization created successfully
- [ ] Team invitation flow working
- [ ] CV upload working with new paths
- [ ] RBAC permissions enforced
- [ ] Cross-organization access blocked
- [ ] All security boundaries tested

---

## Support & Troubleshooting

### Common Issues

**1. Storage Upload Fails with 403**

**Cause**: Storage rules rejecting upload
**Solution**:
- Verify user has manager/admin role
- Check metadata includes organizationId and uploadedBy
- Verify path matches: `/cvs/{orgId}/{userId}/{filename}`

**2. Invitation Email Not Sent**

**Cause**: Cloud Function not triggered
**Solution**:
- Check Firestore document was created
- Verify Cloud Function deployed
- Check function logs for errors
- Verify inviter is admin

**3. Cross-Organization Data Visible**

**Cause**: CRITICAL SECURITY ISSUE
**Solution**:
- IMMEDIATELY rollback deployment
- Review Firestore security rules
- Check all queries include organizationId filter
- Run full security audit

---

## Security Contacts

**Production Incidents:**
- Security Team: security@vocaify.com
- On-Call Engineer: oncall@vocaify.com

**Escalation Path:**
1. Engineering Lead
2. Security Officer
3. CTO

---

## Appendix: Deployment Commands Quick Reference

```bash
# Full deployment
firebase deploy --only storage,functions,firestore:indexes

# Storage rules only
firebase deploy --only storage

# Functions only
firebase deploy --only functions

# Specific functions
firebase deploy --only functions:onInvitationCreated

# Firestore indexes
firebase deploy --only firestore:indexes

# View logs
firebase functions:log --only onInvitationCreated --limit 50

# Test locally
firebase emulators:start
```

---

**END OF DEPLOYMENT GUIDE**

**Last Updated:** 2025-11-18
**Next Review:** Before each production deployment
**Document Owner:** Security & DevOps Team
