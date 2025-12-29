# Quick Deployment Checklist

Use this checklist to deploy the newsletter backend. For detailed explanations, see [README.md](README.md).

## Pre-Deployment Checklist

- [ ] Mailgun account created
- [ ] Railway account created
- [ ] GitHub account created
- [ ] Code pushed to GitHub

---

## Step 1: Mailgun Setup (20 minutes + 24-48 hours DNS)

### 1.1 Add Domain
- [ ] Log in to Mailgun
- [ ] Sending → Domains → Add New Domain
- [ ] Enter: `newsletters.coretent.app` (or your domain)

### 1.2 Configure DNS
- [ ] Copy DNS records from Mailgun
- [ ] Add to domain provider (Cloudflare/Namecheap/etc):
  - [ ] TXT record (SPF)
  - [ ] TXT record (DKIM)
  - [ ] TXT record (DMARC)
  - [ ] MX records (2 total)
  - [ ] CNAME record
- [ ] Wait 24-48 hours for propagation
- [ ] Verify in Mailgun (green checkmarks)

### 1.3 Get API Keys
- [ ] Settings → API Keys → Copy "Private API key"
- [ ] Sending → Webhooks → Copy "HTTP webhook signing key"
- [ ] Save both somewhere safe

**✅ Checkpoint:** Domain verified in Mailgun

---

## Step 2: Railway Deployment (15 minutes)

### 2.1 Push to GitHub
```bash
cd /Users/issertor/Documents/CODE/coretent-backend
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/YOUR-USERNAME/coretent-backend.git
git push -u origin main
```

- [ ] Code pushed to GitHub

### 2.2 Deploy to Railway
- [ ] Visit railway.app
- [ ] New Project → Deploy from GitHub
- [ ] Select `coretent-backend` repo
- [ ] Wait for initial build (3-5 min)

### 2.3 Add Databases
- [ ] Click "+ New" → Database → PostgreSQL
- [ ] Click "+ New" → Database → Redis
- [ ] Wait for databases to provision (1-2 min)

### 2.4 Set Environment Variables

Go to: Backend Service → Variables → Add each:

| Variable | Value |
|----------|-------|
| `MAILGUN_API_KEY` | `key-...` (from Mailgun) |
| `MAILGUN_DOMAIN` | `newsletters.coretent.app` |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | `...` (from Mailgun) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `LOG_LEVEL` | `info` |
| `CORS_ORIGIN` | `coretent://,https://coretent.app` |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |

- [ ] All 8 environment variables set

### 2.5 Get Railway URL
- [ ] Click Service → Settings → Domains → Generate Domain
- [ ] Copy URL (e.g., `https://coretent-backend-production-xyz.up.railway.app`)
- [ ] Save URL for next steps

**✅ Checkpoint:** Backend deployed and running on Railway

---

## Step 3: Connect Mailgun to Railway (5 minutes)

### 3.1 Create Mailgun Route
- [ ] Mailgun → Sending → Routes → Create Route
- [ ] Priority: `0`
- [ ] Filter Expression: `match_recipient(".*@newsletters.coretent.app")`
- [ ] Actions → Forward: `https://YOUR-RAILWAY-URL.railway.app/webhooks/mailgun`
- [ ] Description: `Forward newsletters to backend`
- [ ] Create Route

### 3.2 Test Route
- [ ] Routes → Click "Test" on your new route
- [ ] Should see green checkmark ✅

**✅ Checkpoint:** Mailgun connected to Railway

---

## Step 4: Update iOS App (5 minutes)

### 4.1 Update Backend URL
```swift
// File: coretent/Services/NewsletterService.swift
// Line ~24

private let baseURL = "https://YOUR-RAILWAY-URL.railway.app/api/v1"
```

- [ ] Replace `YOUR-RAILWAY-URL` with actual Railway URL
- [ ] Save file

### 4.2 Build & Run
- [ ] Build in Xcode
- [ ] Run on device/simulator

**✅ Checkpoint:** iOS app pointing to Railway backend

---

## Step 5: End-to-End Test (10 minutes + wait time)

### 5.1 Register in App
- [ ] Open Coretent app
- [ ] Go to Settings
- [ ] Tap "Get Newsletter Email"
- [ ] Email address appears (e.g., `u-abc123@newsletters.coretent.app`)
- [ ] Tap copy button

### 5.2 Subscribe to Test Newsletter
- [ ] Visit https://tldr.tech (or other newsletter)
- [ ] Subscribe using your coretent email
- [ ] Confirm subscription (check confirmation email if needed)

### 5.3 Wait for Newsletter
- [ ] Wait for newsletter to send (could be hours/days depending on schedule)

### 5.4 Verify in Mailgun
- [ ] Mailgun → Logs
- [ ] Look for email to your address
- [ ] Should show "Delivered" or "Accepted"

### 5.5 Verify in Railway
- [ ] Railway → Service → Deployments → View Logs
- [ ] Search for: `Processing incoming email`
- [ ] Should see: `Email parsed successfully`

### 5.6 View in App
- [ ] Open Coretent app
- [ ] Pull to refresh feed
- [ ] Newsletter appears! 🎉

**✅ Complete!** Your newsletter system is live.

---

## Troubleshooting Quick Fixes

### Issue: Can't get newsletter email in app

**Fix:**
1. Check Railway logs for errors
2. Verify Railway URL in `NewsletterService.swift`
3. Check all environment variables are set

### Issue: Email arrives at Mailgun but not in app

**Fix:**
1. Verify Mailgun route webhook URL is correct
2. Check `MAILGUN_WEBHOOK_SIGNING_KEY` matches Mailgun
3. Check Railway logs for "Webhook signature verification failed"

### Issue: Railway deployment failed

**Fix:**
1. Check Railway build logs for errors
2. Verify both databases (PostgreSQL + Redis) are added
3. Ensure all environment variables are set

### Issue: DNS not verifying

**Fix:**
1. Wait 24-48 hours (DNS is slow)
2. Use https://mxtoolbox.com to check DNS records
3. Verify records match Mailgun's instructions exactly

---

## Monitoring

### Check Railway Logs
```
Railway → Service → Deployments → Latest → View Logs
```

Look for:
- `Server started successfully` ← Backend is running
- `Processing incoming email` ← Email received
- `Email parsed successfully` ← Email processed
- Errors in red

### Check Mailgun Logs
```
Mailgun → Logs → Filter by recipient
```

Look for:
- "Accepted" or "Delivered" status
- Errors or bounces

### Check App Logs (Xcode)
```
Xcode → Run App → Console (bottom panel)
```

Search for:
- `NewsletterService`
- Errors in red

---

## Costs Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Railway | Hobby | $5 |
| Mailgun | Free (5k emails) | $0 |
| GitHub | Free | $0 |
| **TOTAL** | | **$5/month** |

Upgrade when you hit:
- 5,000 emails/month → Mailgun Foundation ($35/month)
- 1,000+ active users → Railway Pro ($20/month)

---

## Maintenance

### Update Backend Code
```bash
# Make changes locally
git add .
git commit -m "Description"
git push

# Railway auto-deploys in 3-5 minutes
```

### View Database
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Open database GUI
railway run npx prisma studio
```

### Backup Database
```bash
# Get database URL
railway variables

# Export
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Support Resources

- **Documentation:** See [README.md](README.md) for detailed guide
- **Railway Docs:** https://docs.railway.app
- **Mailgun Docs:** https://documentation.mailgun.com
- **Prisma Docs:** https://www.prisma.io/docs

---

## Success Criteria

You know it's working when:

- ✅ iOS app shows newsletter email in Settings
- ✅ You can copy the email address
- ✅ Newsletters arrive at Mailgun
- ✅ Railway logs show "Email parsed successfully"
- ✅ Newsletters appear in iOS app feed
- ✅ No errors in Railway logs
- ✅ Pull to refresh updates feed

**Congratulations! Your newsletter backend is live! 🚀**
