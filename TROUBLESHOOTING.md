# Troubleshooting Guide

Comprehensive guide for diagnosing and fixing common issues with the newsletter backend.

## Table of Contents

- [Diagnostic Tools](#diagnostic-tools)
- [Common Issues](#common-issues)
  - [iOS App Issues](#ios-app-issues)
  - [Backend/Railway Issues](#backendrailway-issues)
  - [Mailgun Issues](#mailgun-issues)
  - [Email Processing Issues](#email-processing-issues)
- [How to Read Logs](#how-to-read-logs)
- [Emergency Procedures](#emergency-procedures)

---

## Diagnostic Tools

### Check System Health

Run through this checklist when something goes wrong:

**1. Railway Backend Status**
```
✓ Go to: Railway → Your Service
✓ Look for: Green "Active" indicator
✗ If red: Service crashed, check logs
```

**2. Database Connections**
```
✓ Go to: Railway → PostgreSQL
✓ Look for: Green "Active" indicator
✓ Go to: Railway → Redis
✓ Look for: Green "Active" indicator
✗ If red: Database down, wait or restart
```

**3. Mailgun Domain Verification**
```
✓ Go to: Mailgun → Domains
✓ Look for: Green checkmarks on all DNS records
✗ If red: DNS not propagated yet (wait 24-48 hours)
```

**4. iOS App Network**
```
✓ Settings → Wi-Fi → Connected
✓ Open Safari → Load any website
✗ If fails: Check internet connection
```

---

## Common Issues

### iOS App Issues

#### Issue 1: "Get Newsletter Email" button does nothing

**Symptoms:**
- Tap button, nothing happens
- No loading spinner
- No error message

**Diagnosis:**
```swift
// Open Xcode Console while running app
// Look for error messages when you tap the button
```

**Possible Causes & Fixes:**

**Cause A: Wrong Railway URL**
```swift
// Check: coretent/Services/NewsletterService.swift line ~24
private let baseURL = "https://YOUR-URL.railway.app/api/v1"

// Should NOT be:
"https://coretent-backend.railway.app/api/v1"  // ❌ This is a placeholder

// Should BE:
"https://coretent-backend-production-a1b2c3.up.railway.app/api/v1"  // ✓ Your actual URL
```

**Fix:**
1. Get your real Railway URL: Railway → Service → Settings → Domains
2. Update line 24 in `NewsletterService.swift`
3. Build and run again

**Cause B: Railway backend not running**

**Fix:**
1. Check Railway → Service → Look for green "Active"
2. If red, click "Restart"
3. Wait 30 seconds
4. Try again in app

**Cause C: Network request failing**

**Fix:**
```swift
// In Xcode Console, look for:
"Error Domain=NSURLErrorDomain Code=-1009"  // No internet
"Error Domain=NSURLErrorDomain Code=-1004"  // Server not reachable
"Error Domain=NSURLErrorDomain Code=-1001"  // Request timeout

// Solutions:
// -1009: Check iPhone/simulator internet connection
// -1004: Check Railway URL is correct
// -1001: Railway might be slow, try again
```

---

#### Issue 2: Email address appears but doesn't copy

**Symptoms:**
- Email shows in Settings
- Tap copy button, nothing happens
- No checkmark appears

**Diagnosis:**
```swift
// Check Xcode Console for errors
// Should see: "Email copied to clipboard" or similar
```

**Fix:**

**On Simulator:**
```
1. Edit → Automatically Sync Pasteboard (should be checked)
2. Try copy again
3. Cmd+V in any Mac app to verify
```

**On Device:**
```
1. Tap and hold on email text
2. Select "Copy" from context menu
3. Paste in Notes app to verify
```

**Code Fix (if broken):**
```swift
// In SettingsView.swift, copyEmailAlias function should have:
UIPasteboard.general.string = email  // ✓ Correct
```

---

#### Issue 3: App crashes when opening Settings

**Symptoms:**
- App opens fine
- Tap Settings tab → Crash
- Xcode shows error

**Diagnosis:**
```swift
// Xcode Console shows:
Thread 1: Fatal error: Unexpectedly found nil while unwrapping...
```

**Possible Causes:**

**Cause A: KeychainHelper error**
```swift
// If you see:
Fatal error in KeychainHelper.readNewsletterCredentials()

// Fix: Clear Keychain (simulator only)
Device → Erase All Content and Settings
```

**Cause B: Missing environment variable in iOS**
```swift
// Check Info.plist for required keys
// Should have:
- NSAppTransportSecurity
  - NSAllowsArbitraryLoads = YES (for development only)
```

---

### Backend/Railway Issues

#### Issue 4: Railway deployment failed

**Symptoms:**
- Railway shows red "Failed" status
- "View Logs" shows build errors

**Diagnosis:**
```bash
# In Railway logs, look for:
"ERROR" or "Failed" lines
Build error messages in red
```

**Common Build Errors:**

**Error A: TypeScript compilation error**
```
src/file.ts(42,5): error TS2322: Type 'string' is not assignable to type 'number'
```

**Fix:**
```bash
# Test locally first:
cd coretent-backend
npm run build

# Fix TypeScript errors shown
# Commit and push:
git add .
git commit -m "Fix TypeScript errors"
git push
```

**Error B: Missing dependencies**
```
Error: Cannot find module '@prisma/client'
```

**Fix:**
```bash
# Check package.json includes all dependencies
# Run locally:
npm install

# If it works locally, Railway should work too
# Redeploy:
Railway → Deployments → Latest → Redeploy
```

**Error C: Database connection failed**
```
Error: P1001: Can't reach database server at `localhost`:`5432`
```

**Fix:**
```
1. Check PostgreSQL is added to Railway project
2. Look for DATABASE_URL in environment variables
3. If missing: Add PostgreSQL database
4. Railway auto-sets DATABASE_URL
5. Redeploy
```

---

#### Issue 5: Backend running but not responding

**Symptoms:**
- Railway shows green "Active"
- iOS app can't connect
- Logs show "Server started"

**Diagnosis:**
```bash
# Test backend directly:
curl https://YOUR-RAILWAY-URL.railway.app/health

# Should return:
{"status":"ok","timestamp":"2025-12-29T...","uptime":123}

# If you get:
# - Timeout: Backend crashed, check logs
# - 404: URL wrong, verify Railway domain
# - 503: Backend starting, wait 30 seconds
```

**Fix A: Backend crashed after starting**
```bash
# Railway logs show:
Server started successfully
... (some time later)
Error: ECONNREFUSED
Process exited

# Solutions:
1. Check DATABASE_URL is set correctly
2. Check REDIS_URL is set correctly
3. Verify both databases are running (green Active)
4. Restart service
```

**Fix B: Port configuration wrong**
```bash
# Railway logs show:
Error: listen EADDRINUSE: address already in use :::3000

# Fix:
1. Railway → Service → Variables
2. Ensure PORT = 3000
3. Redeploy
```

---

#### Issue 6: "Rate limit exceeded" error

**Symptoms:**
- iOS app shows error: "Too many requests"
- Happens after using app extensively

**This is NORMAL:**
- API limit: 60 requests/minute per user
- Auth limit: 5 requests/minute for registration

**Fix:**
```
1. Wait 1 minute
2. Try again
3. If persistent, check for infinite retry loop in iOS app
```

**Prevention:**
```swift
// In iOS app, implement exponential backoff:
let retryDelay = pow(2.0, Double(attemptCount))  // 1s, 2s, 4s, 8s...
try await Task.sleep(nanoseconds: UInt64(retryDelay * 1_000_000_000))
```

---

### Mailgun Issues

#### Issue 7: DNS records not verifying

**Symptoms:**
- Mailgun shows red ❌ on DNS records
- Been waiting >48 hours
- Domain status: "Unverified"

**Diagnosis:**
```bash
# Use external DNS checker:
# Visit: https://mxtoolbox.com/SuperTool.aspx
# Enter: newsletters.coretent.app

# Check each record:
# - MX records (should show mailgun servers)
# - SPF record (TXT with v=spf1)
# - DKIM record (TXT at k1._domainkey subdomain)
```

**Common DNS Mistakes:**

**Mistake A: Extra spaces in TXT records**
```
Wrong: "v=spf1 include:mailgun.org ~all "  ← Space at end
Right: "v=spf1 include:mailgun.org ~all"   ← No space
```

**Mistake B: Wrong subdomain**
```
Wrong: _domainkey.newsletters.coretent.app
Right: k1._domainkey.newsletters.coretent.app  ← Note the "k1."
```

**Mistake C: Record type mismatch**
```
Wrong: CNAME for SPF record
Right: TXT for SPF record
```

**Fix:**
1. Log in to domain provider (Cloudflare, Namecheap, etc.)
2. Go to DNS management
3. Delete incorrect records
4. Add correct records (copy EXACTLY from Mailgun)
5. Wait 2-4 hours
6. Check with MXToolbox
7. Click "Verify DNS Settings" in Mailgun

---

#### Issue 8: Mailgun route not forwarding

**Symptoms:**
- Email arrives at Mailgun (visible in logs)
- Mailgun shows "Delivered"
- Backend never receives it (no Railway logs)
- Newsletter doesn't appear in app

**Diagnosis:**
```
1. Mailgun → Logs → Find the email
2. Click on it
3. Look for "Route matched" section
4. Should show: "Forwarded to https://your-backend..."
```

**Possible Causes:**

**Cause A: Route not created**
```
Fix:
1. Mailgun → Sending → Routes
2. Look for your route
3. If missing: Create it (see DEPLOYMENT.md Step 3.1)
```

**Cause B: Route filter wrong**
```
Wrong filter:
match_recipient("newsletters.coretent.app")  ❌

Right filter:
match_recipient(".*@newsletters.coretent.app")  ✓

# The .* means "anything before @"
```

**Cause C: Route priority wrong**
```
# If you have multiple routes, check priority
# Lower number = higher priority
# Your route should be: Priority 0
```

**Cause D: Webhook URL wrong**
```
Wrong:
https://coretent-backend.railway.app/webhooks/mailgun  ❌
(This is a placeholder, not your actual URL)

Right:
https://coretent-backend-production-a1b2c3.up.railway.app/webhooks/mailgun  ✓
(Your actual Railway URL)

Fix:
1. Railway → Service → Settings → Domains
2. Copy your URL
3. Mailgun → Routes → Edit your route
4. Update webhook URL
5. Add /webhooks/mailgun at the end
```

---

### Email Processing Issues

#### Issue 9: Email arrives but parsing fails

**Symptoms:**
- Railway logs show "Processing incoming email"
- Then shows "Email parsing failed"
- Newsletter doesn't appear in app

**Diagnosis:**
```bash
# Railway logs show one of these errors:

# Error 1: Signature verification
"Webhook signature verification failed"

# Error 2: Parsing error
"Failed to parse email content with Readability"

# Error 3: Database error
"P2002: Unique constraint failed"
```

**Fix for Error 1: Signature verification failed**
```
Cause: MAILGUN_WEBHOOK_SIGNING_KEY doesn't match Mailgun

Fix:
1. Mailgun → Settings → Webhooks
2. Copy "HTTP webhook signing key"
3. Railway → Service → Variables
4. Update MAILGUN_WEBHOOK_SIGNING_KEY
5. Paste the correct key
6. Redeploy
```

**Fix for Error 2: Readability parsing failed**
```
Cause: Email HTML is malformed or has no text content

This is OK for:
- Image-only newsletters
- Heavily formatted marketing emails

Fix:
- Newsletter will be stored but with minimal content
- Consider skipping these newsletters
- Or implement platform-specific parsers (future enhancement)
```

**Fix for Error 3: Duplicate message**
```
Cause: Same email processed twice (rare)

This is OK:
- Backend prevents duplicates
- Second attempt is ignored
- Check logs for "Duplicate email detected, skipping"
```

---

#### Issue 10: Email processed but not appearing in app

**Symptoms:**
- Railway logs show "Email parsed successfully"
- Mailgun shows delivered
- Newsletter still doesn't appear in iOS app

**Diagnosis:**
```swift
// In iOS app:
1. Pull to refresh feed (drag down)
2. Check Xcode Console for errors
3. Look for: "Failed to fetch newsletters"
```

**Possible Causes:**

**Cause A: Cache issue (most common)**
```
Fix:
1. Force quit app (swipe up from app switcher)
2. Reopen app
3. Pull to refresh

Or:

1. Settings → Force clear cache (if implemented)
2. Pull to refresh
```

**Cause B: Parse status still "pending"**
```
# Check Railway logs:
"Email queued for parsing"  ← Should see this
"Email parsed successfully" ← Should see this within 30 seconds

# If you only see "queued" but not "parsed":
Cause: Background job worker not running

Fix:
1. Railway → Check Redis is Active
2. Check logs for BullMQ errors
3. Restart service
```

**Cause C: User ID mismatch**
```
# Newsletter was saved for different user

Check Railway logs for:
"userId": "abc-123"  ← From webhook

Then check iOS app Keychain:
NewsletterCredentials.userId

# If different:
1. User likely registered twice
2. Delete old credentials:
   - iOS Settings → Reset Keychain (if implemented)
   - Or reinstall app
3. Register again
```

---

## How to Read Logs

### Railway Log Format

```
2025-12-29T12:00:00.123Z [INFO] Server started successfully
│          │              │      │
│          │              │      └─ Message
│          │              └─ Log level
│          └─ ISO 8601 timestamp
└─ Date
```

**Log Levels:**
- `INFO` - Normal operation (green)
- `WARN` - Warning, but working (yellow)
- `ERROR` - Something failed (red)
- `FATAL` - Critical failure, server crashed (red)

**What to look for:**

**Successful email flow:**
```
[INFO] Processing incoming email {"recipient":"u-abc@newsletters.coretent.app"}
[INFO] Newsletter record created {"newsletterId":"uuid-123"}
[INFO] Email queued for parsing {"newsletterId":"uuid-123"}
[INFO] Email parsing job started {"newsletterId":"uuid-123"}
[INFO] Email parsed successfully {"newsletterId":"uuid-123","title":"..."}
```

**Failed email flow:**
```
[INFO] Processing incoming email {"recipient":"u-abc@newsletters.coretent.app"}
[ERROR] Email parsing failed {"error":"Failed to parse email content"}
```

**Auth flow:**
```
[INFO] User registration {"userId":"abc-123"}
[INFO] Email alias generated {"emailAlias":"u-abc-123@newsletters.coretent.app"}
[INFO] User registered successfully
```

---

### Mailgun Log Format

**Email delivered to webhook:**
```
Status: Delivered
Recipient: u-abc-123@newsletters.coretent.app
From: newsletter@example.com
Subject: This week's newsletter
Route matched: Forward to https://...
Webhook status: 200 OK
```

**What each status means:**
- `Accepted` - Mailgun received the email
- `Delivered` - Forwarded to your backend
- `Failed` - Backend didn't accept it (check Railway logs)
- `Bounced` - Email address doesn't exist (shouldn't happen)
- `Complained` - Marked as spam (user action needed)

---

## Emergency Procedures

### Emergency 1: Backend completely down

**Symptoms:**
- Railway shows red "Failed"
- No logs appearing
- Health check fails
- All users can't access

**Immediate action:**
```
1. Railway → Service → Click "Restart"
2. Wait 30 seconds
3. Check health: curl https://your-url.railway.app/health
4. If still down, check logs for errors
5. If database error, restart databases too
```

**If restart doesn't work:**
```
1. Railway → Service → Settings → Restart Policy
2. Change to "Never" temporarily
3. Check environment variables (all 8 present?)
4. Check databases are Active
5. Change restart policy back to "On Failure"
6. Click "Restart"
```

---

### Emergency 2: All users getting errors

**Symptoms:**
- Multiple users report issues
- Working fine before
- Sudden surge in errors

**Possible causes:**
- Mailgun API quota exceeded
- Railway out of resources
- Database connection pool exhausted

**Diagnosis:**
```
1. Railway → Metrics → Check CPU/Memory
   - If >90%: Service overloaded

2. Mailgun → Billing → Check email quota
   - If exceeded: Emails paused

3. Railway logs → Search for:
   "ECONNREFUSED"  ← Database connection lost
   "Too many connections" ← Database pool exhausted
```

**Fix:**
```
# If overloaded:
Railway → Service → Settings → Increase resources
(May require upgrading plan)

# If Mailgun quota exceeded:
Mailgun → Upgrade plan or wait for monthly reset

# If database connections:
Railway → PostgreSQL → Restart
Railway → Redis → Restart
```

---

### Emergency 3: Emails not arriving at all

**Complete system check:**

**1. Test Mailgun receiving:**
```
# Send test email manually:
echo "Test" | mail -s "Test" u-test@newsletters.coretent.app

# Check Mailgun → Logs
# Should see the email within 1 minute
```

**2. Test Mailgun route:**
```
Mailgun → Routes → Your route → Test
Should return: 200 OK
```

**3. Test backend directly:**
```bash
# Send fake webhook:
curl -X POST https://your-url.railway.app/webhooks/mailgun \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "u-test@newsletters.coretent.app",
    "sender": "test@example.com",
    "subject": "Test",
    "body-html": "<p>Test content</p>"
  }'

# Check Railway logs for processing
```

**4. Check DNS still valid:**
```
# MXToolbox: https://mxtoolbox.com
# Enter: newsletters.coretent.app
# Verify MX records still point to Mailgun
```

---

## Getting Help

If you've tried everything above and still have issues:

### Gather diagnostic information:

**1. Railway logs (last 100 lines):**
```
Railway → Service → Deployments → View Logs
Copy last 100 lines
```

**2. Mailgun event:**
```
Mailgun → Logs → Find the email
Click Details → Copy entire event JSON
```

**3. iOS app logs:**
```
Xcode → Run app → Console
Filter for "Newsletter" or "Error"
Copy relevant lines
```

**4. Environment variables (WITHOUT VALUES):**
```
Railway → Service → Variables
List variable names only (don't share actual values!)
```

### Where to ask for help:

- **GitHub Issues:** Create issue with diagnostic info
- **Railway Discord:** https://discord.gg/railway
- **Mailgun Support:** https://help.mailgun.com

### What to include:

```
**Issue:** Brief description

**Expected:** What should happen

**Actual:** What actually happens

**Steps to reproduce:**
1. Step one
2. Step two
3. Error occurs

**Logs:** (paste relevant logs)

**Environment:**
- iOS version:
- Railway region:
- Mailgun domain status:
```

---

## Preventive Maintenance

### Weekly checks:

- [ ] Railway → Check service is Active
- [ ] Mailgun → Check email quota usage
- [ ] Railway → Metrics → Check for resource spikes
- [ ] Test: Send email to your newsletter address, verify it appears in app

### Monthly checks:

- [ ] Update dependencies: `npm update`
- [ ] Check Railway bill for unexpected charges
- [ ] Review Mailgun logs for bounces/spam reports
- [ ] Backup database: `pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql`

### When updating code:

- [ ] Test locally first: `npm run build`
- [ ] Check TypeScript errors: `npm run lint`
- [ ] Commit and push to GitHub
- [ ] Watch Railway deployment logs
- [ ] Test in iOS app after deployment
- [ ] Monitor logs for 5 minutes after deployment

---

**Remember:** Most issues resolve themselves with a simple restart. When in doubt, restart Railway service and try again!
