# Vocaify Testing Checklist

## Pre-Deployment Testing Checklist

Use this checklist before deploying to production. Test on staging environment first, then verify in production.

---

## 1. Authentication & Authorization

### Email/Password Authentication
- [ ] Sign up with valid email creates account
- [ ] Sign up with existing email shows error
- [ ] Sign up with weak password shows validation error
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong password shows error
- [ ] Login with non-existent email shows error
- [ ] Logout redirects to landing page
- [ ] Password reset email is sent successfully
- [ ] Password reset link works and allows password change
- [ ] Email verification link works (if enabled)

### Google OAuth
- [ ] Google sign-in button appears and is clickable
- [ ] Clicking Google sign-in opens Google popup
- [ ] Successful Google auth creates account
- [ ] Subsequent Google sign-ins log in existing user
- [ ] Canceling Google popup shows appropriate message
- [ ] Google auth failure shows error message

### Route Protection
- [ ] Accessing /dashboard without auth redirects to /auth/login
- [ ] Accessing /dashboard/upload without auth redirects
- [ ] Accessing /dashboard/search without auth redirects
- [ ] After login, user is redirected to intended page
- [ ] Logged-in user can access all dashboard routes
- [ ] Middleware correctly identifies auth state

### Session Management
- [ ] Auth state persists after page refresh
- [ ] Auth state persists across browser tabs
- [ ] Token refresh works automatically
- [ ] Logout clears all auth state
- [ ] Session expires after inactivity (if configured)

---

## 2. CV Upload System

### File Selection
- [ ] Drag & drop zone appears and is clickable
- [ ] Dragging file over zone shows visual feedback
- [ ] Dropping valid file (PDF) adds to list
- [ ] Dropping valid file (DOCX) adds to list
- [ ] Clicking "Browse files" opens file picker
- [ ] Selecting files via picker adds to list
- [ ] Multiple files can be selected at once
- [ ] File list shows all selected files

### File Validation
- [ ] Uploading PDF file succeeds
- [ ] Uploading DOCX file succeeds
- [ ] Uploading DOC file succeeds
- [ ] Uploading invalid file type (e.g., .txt, .jpg) shows error
- [ ] Uploading file >10MB shows error
- [ ] Uploading file <100 bytes shows error
- [ ] Uploading duplicate filename shows warning or renames

### Upload Progress
- [ ] Upload starts when "Upload All" is clicked
- [ ] Individual progress bars show for each file
- [ ] Overall progress shows total completion
- [ ] File status changes: pending → uploading → success
- [ ] Success files show green checkmark
- [ ] Failed files show red error icon
- [ ] Cancel button works during upload

### Batch Processing
- [ ] Uploading 1 file works
- [ ] Uploading 10 files works (batch size)
- [ ] Uploading 50 files works (5 batches)
- [ ] Uploading 100+ files works without crashing
- [ ] Batches process sequentially (10 at a time)
- [ ] Can upload more files after batch completes

### Error Handling
- [ ] Network error during upload shows retry option
- [ ] Retrying failed upload works
- [ ] Clearing failed files removes from list
- [ ] Upload continues after single file failure
- [ ] Quota exceeded error shows helpful message
- [ ] Storage permission error shows helpful message

### Firestore Integration
- [ ] CV document created in Firestore on upload
- [ ] Document contains all required fields
- [ ] userId matches authenticated user
- [ ] status field initially set to "pending"
- [ ] uploadedAt timestamp is correct
- [ ] fileSize and fileType are accurate

---

## 3. CV Processing (Cloud Functions)

### Automatic Processing
- [ ] onCVUpload function triggers on file upload
- [ ] Function downloads file successfully
- [ ] Text extraction works for PDF files
- [ ] Text extraction works for DOCX files
- [ ] OpenAI API call succeeds
- [ ] Structured data is extracted correctly
- [ ] Embedding generation succeeds
- [ ] Vector is uploaded to Pinecone
- [ ] Firestore document updated with extracted data
- [ ] Status changes from "pending" to "indexed"

### Data Extraction Quality
- [ ] Name is extracted correctly
- [ ] Email is extracted (if present)
- [ ] Phone number is extracted (if present)
- [ ] Skills list is accurate and relevant
- [ ] Years of experience calculated correctly
- [ ] Education history is extracted
- [ ] Work history is extracted
- [ ] Summary is meaningful and relevant
- [ ] Location is extracted (if present)

### Error Handling
- [ ] Corrupted PDF shows error status
- [ ] Invalid CV content shows error with message
- [ ] OpenAI API failure triggers retry
- [ ] After 3 retries, CV marked as "error"
- [ ] Error message stored in Firestore
- [ ] processStuckCVs finds stuck CVs
- [ ] Stuck CVs are reprocessed automatically

### Performance
- [ ] Average CV processes in <30 seconds
- [ ] No memory leaks during batch processing
- [ ] Function doesn't timeout (9 min limit)
- [ ] Concurrent processing works (multiple CVs)

---

## 4. Search Functionality

### Basic Search
- [ ] Search bar accepts text input
- [ ] Pressing Enter triggers search
- [ ] Search button triggers search
- [ ] Search with empty query shows validation error
- [ ] Search debounces (waits 300ms after typing stops)
- [ ] Search results appear after query
- [ ] Search results are relevant to query
- [ ] Result count is displayed
- [ ] Search duration is displayed

### Natural Language Queries
- [ ] "React developer" finds React developers
- [ ] "5 years experience" finds candidates with 5+ years
- [ ] "Senior Python engineer" finds senior Python roles
- [ ] "Full-stack developer San Francisco" applies location filter
- [ ] "ML engineer with TensorFlow" finds specific skills
- [ ] Query with multiple skills finds matching candidates

### Filters
- [ ] Min experience slider works (0-20+)
- [ ] Max experience slider works
- [ ] Setting experience range filters results
- [ ] Skills multi-select works
- [ ] Selecting skills filters results correctly
- [ ] Location filter works
- [ ] Education filter works
- [ ] Combining filters (AND logic) works
- [ ] Clear filters button resets all filters
- [ ] Filters persist during pagination

### Search Results
- [ ] Results show candidate name
- [ ] Results show years of experience
- [ ] Results show current role
- [ ] Results show skills (first 6 + "more")
- [ ] Results show match score (0-100)
- [ ] Results show "why matched" reasoning
- [ ] Results are sorted by relevance (score)
- [ ] No results message appears when no matches

### Result Actions
- [ ] "View CV" button downloads PDF
- [ ] "Shortlist" button adds to shortlist
- [ ] "Reject" button adds to rejected
- [ ] Shortlisted candidates show indicator
- [ ] Rejected candidates show indicator
- [ ] Actions work without page reload (optimistic UI)
- [ ] Action failures revert UI state

### Performance
- [ ] Search completes in <2 seconds (with re-rank)
- [ ] Search completes in <1 second (without re-rank)
- [ ] Large result sets don't crash browser
- [ ] Pagination works smoothly
- [ ] No memory leaks with many searches

---

## 5. Real-time Updates

### CV Processing Status
- [ ] CVProcessingStatus component appears on dashboard
- [ ] Status shows: "Processing X/Y CVs..."
- [ ] Status updates in real-time (no refresh needed)
- [ ] Progress percentage calculates correctly
- [ ] Progress bar animates smoothly
- [ ] Color changes based on status (blue/yellow/green)
- [ ] Icon changes based on status (spinner/warning/check)
- [ ] Component hides when no CVs
- [ ] Component shows error count if failures

### Search Page Status
- [ ] Status appears on search page
- [ ] Status shows while CVs are processing
- [ ] Status message is informative
- [ ] Status updates without page refresh

---

## 6. User Interface & UX

### Landing Page
- [ ] Hero section loads and displays correctly
- [ ] CTA buttons are clickable and navigate correctly
- [ ] Features section displays all 6 features
- [ ] Stats section shows accurate numbers
- [ ] Scroll animations trigger on viewport entry
- [ ] Footer links work
- [ ] Navigation menu works
- [ ] Mobile menu opens and closes correctly

### Responsive Design
- [ ] Landing page looks good on mobile (320px-768px)
- [ ] Landing page looks good on tablet (768px-1024px)
- [ ] Landing page looks good on desktop (1024px+)
- [ ] Dashboard is responsive on mobile
- [ ] Upload page is responsive on mobile
- [ ] Search page is responsive on mobile
- [ ] Touch interactions work on mobile
- [ ] Buttons are appropriately sized for touch

### Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] ARIA labels present on icon buttons
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Color contrast meets WCAG AA standards
- [ ] Images have alt text

### Performance
- [ ] Page load time <3 seconds
- [ ] First Contentful Paint <1.5 seconds
- [ ] Largest Contentful Paint <2.5 seconds
- [ ] Time to Interactive <3 seconds
- [ ] Cumulative Layout Shift <0.1
- [ ] No console errors in production
- [ ] No console warnings in production

---

## 7. Error Handling & Edge Cases

### Network Errors
- [ ] Loss of internet shows error message
- [ ] Reconnection allows retry
- [ ] Failed API calls show user-friendly errors
- [ ] Timeout errors show retry option
- [ ] Rate limit errors show helpful message

### Empty States
- [ ] Dashboard with 0 CVs shows helpful message
- [ ] Search with 0 results shows empty state
- [ ] Upload page before files selected shows placeholder
- [ ] No shortlisted candidates shows empty state

### Validation
- [ ] Form validation shows inline errors
- [ ] Invalid email format shows error
- [ ] Password strength indicator works
- [ ] Required fields are validated
- [ ] File size limits are enforced
- [ ] File type restrictions are enforced

### Edge Cases
- [ ] Special characters in search queries work
- [ ] Very long search queries (500+ chars) work
- [ ] Rapid clicking doesn't cause duplicate actions
- [ ] Concurrent uploads don't interfere
- [ ] Multiple browser tabs work independently
- [ ] Logging out in one tab logs out all tabs

---

## 8. Security

### Authentication Security
- [ ] Passwords are hashed (not stored in plain text)
- [ ] Session tokens are secure (httpOnly cookies)
- [ ] Auth tokens expire appropriately
- [ ] CORS is configured correctly
- [ ] No auth tokens in URL parameters
- [ ] No sensitive data in localStorage

### Authorization
- [ ] Users can only see their own CVs
- [ ] Users can only upload to their own storage
- [ ] API endpoints verify user ownership
- [ ] Direct Firestore access blocked by security rules
- [ ] Direct Storage access blocked by security rules
- [ ] Cloud Functions verify authentication

### Data Protection
- [ ] XSS prevention (React auto-escaping works)
- [ ] No SQL injection vectors (using NoSQL)
- [ ] File uploads are virus-scanned (if implemented)
- [ ] Sensitive API keys not exposed client-side
- [ ] Environment variables properly secured
- [ ] HTTPS enforced (no HTTP fallback)

### Security Headers
- [ ] X-Content-Type-Options: nosniff present
- [ ] X-Frame-Options: DENY present
- [ ] X-XSS-Protection present
- [ ] Strict-Transport-Security present
- [ ] Referrer-Policy present
- [ ] Permissions-Policy present

---

## 9. Integration Testing

### Firebase Services
- [ ] Auth creates user in Firebase Console
- [ ] Storage shows uploaded files in Console
- [ ] Firestore documents appear in Console
- [ ] Cloud Functions show in Console
- [ ] Function logs appear in Logs Explorer

### OpenAI Integration
- [ ] API calls show in OpenAI dashboard
- [ ] Token usage is logged correctly
- [ ] Cost estimates are accurate
- [ ] Rate limits are respected
- [ ] Errors are handled gracefully

### Pinecone Integration
- [ ] Vectors appear in Pinecone index
- [ ] Vector count matches CV count
- [ ] Search queries work in Pinecone
- [ ] Metadata filtering works
- [ ] Index stats are accurate

---

## 10. Performance & Load Testing

### Database Performance
- [ ] Firestore queries complete in <500ms
- [ ] Firestore handles 100+ concurrent reads
- [ ] Composite indexes are used
- [ ] No missing index warnings

### Function Performance
- [ ] Cold start time <3 seconds
- [ ] Warm function execution <1 second
- [ ] Functions handle concurrent invocations
- [ ] No memory leaks in long-running functions
- [ ] Function costs are within budget

### Search Performance
- [ ] Search with 100 CVs completes in <2s
- [ ] Search with 1,000 CVs completes in <2s
- [ ] Search with 10,000 CVs completes in <3s
- [ ] Concurrent searches don't slow down system
- [ ] Cache hit rate >50% for popular queries

---

## 11. Deployment & DevOps

### Build Process
- [ ] `npm run build` succeeds without errors
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] Build output size is reasonable (<5MB)
- [ ] Environment variables load correctly

### GitHub Actions
- [ ] Push to main triggers workflow
- [ ] Lint job passes
- [ ] Type check job passes
- [ ] Build job passes
- [ ] Deploy jobs succeed
- [ ] Preview deploys work for PRs

### Firebase Deployment
- [ ] Hosting deployment succeeds
- [ ] Functions deployment succeeds
- [ ] Security rules deployment succeeds
- [ ] Deployed site loads correctly
- [ ] Custom domain works (if configured)
- [ ] SSL certificate is valid

### Rollback
- [ ] Can rollback hosting to previous version
- [ ] Can rollback functions to previous version
- [ ] Rollback process is documented
- [ ] Rollback completes in <5 minutes

---

## 12. Monitoring & Observability

### Logging
- [ ] Function logs appear in Firebase Console
- [ ] Error logs show stack traces
- [ ] Log levels are appropriate
- [ ] Sensitive data not logged

### Metrics
- [ ] Function invocation count tracked
- [ ] Error rate tracked
- [ ] Search latency tracked
- [ ] User activity tracked (if analytics enabled)

### Alerts
- [ ] High error rate triggers alert (if configured)
- [ ] Cost threshold triggers alert (if configured)
- [ ] Quota warnings show in console

---

## 13. Documentation

### Code Documentation
- [ ] README is up-to-date
- [ ] ARCHITECTURE.md is accurate
- [ ] API endpoints are documented
- [ ] Environment variables documented
- [ ] Setup instructions are clear

### User Documentation
- [ ] How to upload CVs documented
- [ ] How to search documented
- [ ] How to use filters documented
- [ ] FAQ section exists (if needed)

---

## 14. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest) works fully
- [ ] Firefox (latest) works fully
- [ ] Safari (latest) works fully
- [ ] Edge (latest) works fully
- [ ] Opera (latest) works fully

### Mobile Browsers
- [ ] Chrome Mobile (Android) works
- [ ] Safari Mobile (iOS) works
- [ ] Firefox Mobile works
- [ ] Samsung Internet works

---

## 15. Final Production Checks

### Pre-Launch
- [ ] All environment variables set correctly
- [ ] Production API keys configured
- [ ] Firebase project in Blaze plan (if needed)
- [ ] OpenAI billing configured
- [ ] Pinecone index created
- [ ] Security rules deployed
- [ ] CORS configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid

### Post-Launch
- [ ] Site is accessible at production URL
- [ ] All features work in production
- [ ] No console errors
- [ ] Analytics tracking (if configured)
- [ ] Error monitoring active (if configured)
- [ ] Backup strategy in place
- [ ] Team has access to Firebase Console
- [ ] Documentation shared with team

---

## Testing Sign-off

### Tested By

| Test Category | Tester | Date | Status | Notes |
|--------------|--------|------|--------|-------|
| Authentication | | | ⬜ | |
| CV Upload | | | ⬜ | |
| CV Processing | | | ⬜ | |
| Search | | | ⬜ | |
| UI/UX | | | ⬜ | |
| Security | | | ⬜ | |
| Performance | | | ⬜ | |
| Deployment | | | ⬜ | |

### Status Key
- ✅ Passed
- ❌ Failed
- ⚠️ Passed with issues
- ⬜ Not tested

---

## Issue Tracking

Use this section to track issues found during testing:

| # | Issue | Severity | Status | Assigned To | Notes |
|---|-------|----------|--------|-------------|-------|
| 1 | | High/Medium/Low | Open/In Progress/Resolved | | |
| 2 | | | | | |
| 3 | | | | | |

---

## Automated Testing (Future)

### Unit Tests (TODO)
- [ ] Set up Jest
- [ ] Test utility functions
- [ ] Test React components
- [ ] Test API routes
- [ ] Test Cloud Functions

### Integration Tests (TODO)
- [ ] Set up Cypress
- [ ] Test authentication flow
- [ ] Test upload flow
- [ ] Test search flow
- [ ] Test error scenarios

### E2E Tests (TODO)
- [ ] Test complete user journey
- [ ] Test edge cases
- [ ] Test performance benchmarks

---

## Notes

- Test on staging environment before production
- Use real data samples for testing (anonymized)
- Test with different user roles/permissions
- Test peak load scenarios
- Keep this checklist updated as features are added

Last Updated: 2025-01-18
