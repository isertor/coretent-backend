# Coretent Backend Deployment Status

**Last Updated:** December 30, 2025
**Status:** 🔴 BLOCKED - Railway deployment failing
**Current Issue:** Prisma trying to connect to `localhost:5432` instead of Railway's PostgreSQL

---

## 🎯 What We've Accomplished

### ✅ Backend Development (COMPLETE)
- **Repository:** `https://github.com/isertor/coretent-backend` (PUBLIC)
- **Tech Stack:** Node.js 20, TypeScript, Express, Prisma 5, PostgreSQL, Redis, BullMQ
- **Code Status:** All modules implemented and working locally
  - User registration and management
  - Newsletter CRUD operations
  - Subscription management
  - Webhook handlers (SendGrid + Mailgun support)
  - Email parsing with Readability
  - Background job processing with BullMQ
  - Security middleware (rate limiting, CORS, Helmet)

### ✅ Railway Setup (COMPLETE)
- **Project:** Created on Railway
- **Services:**
  - ✅ PostgreSQL database (provisioned and linked)
  - ✅ Redis database (provisioned and linked)
  - ⚠️ coretent-backend service (failing to connect to database)

### ✅ Environment Variables (CONFIGURED)
All variables set in Railway Variables tab:
- `DATABASE_URL` - Auto-injected by Railway from PostgreSQL service
- `REDIS_URL` - Auto-injected by Railway from Redis service
- `NODE_ENV=production`
- `PORT=3000`
- `LOG_LEVEL=info`
- `CORS_ORIGIN=coretent://`
- `API_VERSION=v1`
- `JWT_SECRET` - Set
- `MAILGUN_API_KEY` - Set (legacy, not used with SendGrid)
- `MAILGUN_DOMAIN` - Set (legacy, not used with SendGrid)
- `MAILGUN_WEBHOOK_SIGNING_KEY` - Set (legacy, not used with SendGrid)

### ✅ SendGrid Account (READY)
- Account created with FREE plan (100 emails/day)
- Waiting for backend deployment to get URL for inbound parse configuration

---

## 🔴 Current Blocker: DATABASE_URL Issue

### Problem
Deployment logs show Prisma trying to connect to `localhost:5432` instead of Railway's PostgreSQL:

```
Datasource "db": PostgreSQL database "newsletters", schema "public" at "localhost:5432"
Error: P1001: Can't reach database server at `localhost:5432`
```

### What We've Tried

1. **✅ Linked PostgreSQL to backend service** - Railway shows DATABASE_URL in Variables tab
2. **✅ Added .dockerignore** - Prevents local `.env` from being copied to Docker
3. **✅ Deleted local .env file** - Removed from repository completely
4. **✅ Moved Prisma generation to runtime** - Changed Dockerfile to run `npx prisma generate` at startup (not build time)
5. **✅ Fixed TypeScript strict mode errors** - Added type annotations to Prisma event handlers
6. **✅ Switched to Debian-based image** - Changed from `node:20-alpine` to `node:20-slim` for OpenSSL compatibility
7. **✅ Downgraded Prisma** - Using Prisma 5.22.0 instead of Prisma 7 (compatibility)

### Why It's Still Failing

**Root Cause Hypothesis:** The Dockerfile's `COPY` commands or Prisma's schema caching is still using a cached version that points to localhost. Even though Railway injects `DATABASE_URL` at runtime, Prisma might be using a pre-generated client or cached schema.

---

## 🔧 Next Steps to Fix

### Option 1: Verify Railway Environment Variables Are Injected (RECOMMENDED)

**Add debug logging to Dockerfile to confirm DATABASE_URL:**

```dockerfile
# At the end of CMD, before running Prisma
CMD ["sh", "-c", "echo 'DATABASE_URL is:' && echo $DATABASE_URL && npx prisma generate && npx prisma db push --accept-data-loss && node dist/server.js"]
```

This will print the actual DATABASE_URL Railway is providing. Check if:
- It's empty/undefined → Railway linking issue
- It contains localhost → Something is overriding it
- It contains Railway's internal URL → Prisma issue

### Option 2: Force Prisma to Use Runtime DATABASE_URL

**Modify `src/config/database.ts` to explicitly log the DATABASE_URL:**

```typescript
// Add at the top of the file
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set!');
}
```

This will crash early if DATABASE_URL isn't available, making the issue obvious.

### Option 3: Completely Remove Prisma Schema URL (Nuclear Option)

**Edit `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  // Remove url line completely
  // Prisma will ONLY use DATABASE_URL env var
}
```

Then update Dockerfile to make DATABASE_URL available during build:

```dockerfile
# Add ARG in both stages
ARG DATABASE_URL

# Make it available as ENV
ENV DATABASE_URL=$DATABASE_URL
```

### Option 4: Use Railway's Native Prisma Support

**Check if Railway has native Prisma migration support:**

1. In Railway dashboard, look for "Deploy" settings
2. Check if there's a "Run Command" option for migrations
3. Instead of running migrations in Dockerfile CMD, let Railway handle it

---

## 📋 Once Deployment Succeeds, Continue With:

### 1. Get Railway URL
- Railway dashboard → `coretent-backend` service → Settings → Networking
- Click "Generate Domain"
- Copy URL (e.g., `https://coretent-backend-production-xxxx.up.railway.app`)

### 2. Test Backend Health
```bash
curl https://YOUR-RAILWAY-URL/health
# Should return: {"status":"ok","timestamp":"...","uptime":123}
```

### 3. Configure SendGrid Inbound Parse
1. Go to: https://app.sendgrid.com
2. Navigate to: **Settings → Inbound Parse → Add Host & URL**
3. Fill in:
   - **Subdomain:** `coretent` (or any name)
   - **Domain:** `sendgrid.net` (use SendGrid's free domain)
   - **Destination URL:** `https://YOUR-RAILWAY-URL/webhooks/sendgrid`
   - **Checkboxes:**
     - ✅ POST the raw, full MIME message
     - ✅ Check SPF
4. Click **"Add"**

Your inbound email will be: `anything@coretent.sendgrid.net`

### 4. Test Email Flow
1. **Send test email** to `test@coretent.sendgrid.net`
2. **Check Railway logs:**
   ```
   railway logs --service coretent-backend
   ```
   Look for: `"SendGrid webhook received"`
3. **Verify database** (optional):
   - Railway → PostgreSQL → Connect
   - Run: `SELECT * FROM newsletters;`

### 5. Update iOS App
**File:** `coretent/Services/NewsletterService.swift` (line 24)

```swift
// Change from localhost to Railway URL
private let baseURL = "https://YOUR-RAILWAY-URL/api/v1"
```

### 6. Test iOS Integration
1. Build and run iOS app
2. Go to Settings → Register for newsletters
3. Copy email alias (e.g., `u-abc123@coretent.sendgrid.net`)
4. Subscribe to a real newsletter
5. Check if newsletter appears in app feed

---

## 📂 Key Files Reference

### Backend Repository
- **Location:** `/Users/issertor/Documents/CODE/coretent-backend`
- **GitHub:** `https://github.com/isertor/coretent-backend`

### Critical Files
1. **Dockerfile** - Multi-stage build with Prisma runtime generation
2. **prisma/schema.prisma** - Database schema (currently has `url = env("DATABASE_URL")`)
3. **src/config/database.ts** - Prisma client configuration
4. **src/modules/webhooks/** - SendGrid/Mailgun webhook handlers
5. **.dockerignore** - Excludes .env from Docker builds

### Railway Project
- **Project Name:** proactive-curiosity
- **Environment:** production
- **Region:** us-west-2 (assumed)

---

## 🐛 Debugging Commands

### Check Railway Deployment Logs
```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs --service coretent-backend
```

### Test Locally with Docker
```bash
cd /Users/issertor/Documents/CODE/coretent-backend

# Build Docker image
docker build -t coretent-backend .

# Run with Railway DATABASE_URL (get from Railway Variables tab)
docker run -e DATABASE_URL="postgresql://..." -p 3000:3000 coretent-backend

# Check if it connects properly
curl http://localhost:3000/health
```

### Force Railway Rebuild
```bash
# Make a trivial change and push
echo "# Force rebuild" >> README.md
git add README.md
git commit -m "Force Railway rebuild"
git push
```

---

## 🎯 Success Criteria

- [ ] Railway deployment shows "Deployed" (green)
- [ ] Health endpoint returns 200 OK
- [ ] Prisma connects to Railway PostgreSQL (not localhost)
- [ ] SendGrid webhook receives test emails
- [ ] Emails are parsed and stored in database
- [ ] iOS app can register users
- [ ] iOS app displays received newsletters

---

## 📞 Support Resources

- **Railway Docs:** https://docs.railway.app/
- **Prisma Docs:** https://www.prisma.io/docs
- **SendGrid Inbound Parse:** https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
- **Issue Tracker:** Create issues in GitHub if needed

---

## 💡 Alternative Approaches (If All Else Fails)

### Option A: Use Render Instead of Railway
- Render has more straightforward PostgreSQL integration
- Free tier available
- Better documented Prisma support

### Option B: Split Migrations from Deployment
- Run `prisma migrate deploy` as a separate Railway service
- Let backend service only run the app (no DB setup)

### Option C: Use Railway's Database URL Format Directly
- Get the DATABASE_URL from Railway dashboard
- Hardcode it temporarily in Dockerfile to test
- Once working, switch back to env vars

---

**🔴 PRIORITY:** Fix the DATABASE_URL localhost issue before proceeding with SendGrid configuration.
