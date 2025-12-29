# Coretent Newsletter Backend

A backend service that allows users to subscribe to email newsletters and view them in the Coretent iOS app, similar to services like Matter and Readwise Reader.

## 📖 Table of Contents

- [What Does This Do?](#what-does-this-do)
- [How It Works](#how-it-works)
- [What You'll Need](#what-youll-need)
- [Deployment Guide](#deployment-guide)
  - [Step 1: Set Up Mailgun](#step-1-set-up-mailgun)
  - [Step 2: Deploy to Railway](#step-2-deploy-to-railway)
  - [Step 3: Configure Mailgun Route](#step-3-configure-mailgun-route)
  - [Step 4: Update iOS App](#step-4-update-ios-app)
- [Testing Your Setup](#testing-your-setup)
- [Troubleshooting](#troubleshooting)
- [Cost Breakdown](#cost-breakdown)
- [Technical Details](#technical-details)
- [FAQ](#faq)

---

## What Does This Do?

This backend service gives each Coretent app user a **unique email address** for subscribing to newsletters. When newsletters arrive at that email, the backend:

1. **Receives** the email from Mailgun
2. **Parses** the content to extract the article
3. **Stores** it in a database
4. **Sends** it to the iOS app when requested

**Example:**
- User opens Coretent app → Gets email `u-abc123@newsletters.coretent.app`
- User subscribes to "Morning Brew" using that email
- Morning Brew sends newsletter → Backend receives it
- User opens Coretent app → Newsletter appears in their feed!

---

## How It Works

```
┌─────────────────┐
│   Newsletter    │
│   (e.g. Morning │
│      Brew)      │
└────────┬────────┘
         │ Sends email to
         │ u-abc123@newsletters.coretent.app
         ↓
┌─────────────────┐
│     Mailgun     │  ← Email service provider
│  (Email Router) │     (receives all emails)
└────────┬────────┘
         │ Forwards to
         │ webhook
         ↓
┌─────────────────┐
│  Railway Server │  ← Your backend
│   (This Code)   │     (processes emails)
└────────┬────────┘
         │ Stores newsletter
         │ in database
         ↓
┌─────────────────┐
│   PostgreSQL    │  ← Database
│    Database     │
└────────┬────────┘
         │ Fetched by
         ↓
┌─────────────────┐
│  Coretent iOS   │  ← User's iPhone
│       App       │
└─────────────────┘
```

---

## What You'll Need

### Required Accounts (All Free to Start)

1. **Mailgun Account** (Free tier: 5,000 emails/month)
   - Website: https://www.mailgun.com
   - What it does: Receives emails sent to your newsletter addresses
   - Cost: FREE for up to 5,000 emails/month

2. **Railway Account** (Hobby plan: $5/month)
   - Website: https://railway.app
   - What it does: Hosts your backend server
   - Cost: $5/month (includes database and everything needed)

3. **GitHub Account** (Free)
   - Website: https://github.com
   - What it does: Stores your code and connects to Railway
   - Cost: FREE

### Optional: A Custom Domain

- You can use `newsletters.coretent.app` (if you own `coretent.app`)
- Or use Mailgun's free subdomain: `newsletters.mailgun.org`
- For this guide, we'll use `newsletters.coretent.app`

---

## Deployment Guide

### Step 1: Set Up Mailgun

Mailgun is the service that receives emails sent to your newsletter addresses.

#### 1.1 Create Mailgun Account

1. Go to https://www.mailgun.com
2. Click **"Sign Up"**
3. Fill in your information
4. Verify your email address
5. You'll land on the Mailgun dashboard

#### 1.2 Add Your Domain

1. Click **"Sending"** in the left sidebar
2. Click **"Domains"**
3. Click **"Add New Domain"**
4. Enter: `newsletters.coretent.app`
5. Click **"Add Domain"**

#### 1.3 Configure DNS Records

Mailgun will show you DNS records to add. You need to add these to your domain provider (e.g., Cloudflare, Namecheap, GoDaddy).

**Example DNS Records** (yours will be different):

| Type | Name | Value |
|------|------|-------|
| TXT | @ | `v=spf1 include:mailgun.org ~all` |
| TXT | k1._domainkey | `k=rsa; p=MIGfMA0GCS...` (long string) |
| TXT | _dmarc | `v=DMARC1; p=none;` |
| MX | @ | `mxa.mailgun.org` (priority: 10) |
| MX | @ | `mxb.mailgun.org` (priority: 10) |
| CNAME | email | `mailgun.org` |

**How to add these:**

**If using Cloudflare:**
1. Log in to Cloudflare
2. Select your domain (`coretent.app`)
3. Click **"DNS"** tab
4. Click **"Add record"** for each DNS record
5. Copy-paste exactly as shown in Mailgun

**If using Namecheap/GoDaddy:**
1. Log in to your domain provider
2. Find "DNS Management" or "Advanced DNS"
3. Add each record exactly as shown

**⏰ Wait Time:** DNS changes take 24-48 hours to propagate worldwide.

#### 1.4 Verify Domain

1. In Mailgun dashboard, go to **"Domains"**
2. Click **"Verify DNS Settings"**
3. If all checks are green ✅, you're ready!
4. If red ❌, wait longer or check your DNS records

#### 1.5 Get Your Mailgun API Keys

You'll need these for Railway:

1. In Mailgun dashboard, click **"Settings"** → **"API Keys"**
2. Copy your **"Private API key"** (starts with `key-...`)
   - Save this somewhere safe! You'll need it later.
3. Go to **"Sending"** → **"Webhooks"**
4. Click **"Add webhook"**
5. Copy the **"HTTP webhook signing key"**
   - Save this too!

---

### Step 2: Deploy to Railway

Railway will host your backend server. It's like renting a computer in the cloud that runs 24/7.

#### 2.1 Push Code to GitHub

First, we need to upload your code to GitHub:

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to your backend folder:
   ```bash
   cd /Users/issertor/Documents/CODE/coretent-backend
   ```

3. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial backend implementation"
   ```

4. Create a new repository on GitHub:
   - Go to https://github.com
   - Click the **"+"** icon (top right) → **"New repository"**
   - Name: `coretent-backend`
   - Keep it **Private** (recommended)
   - **DO NOT** initialize with README
   - Click **"Create repository"**

5. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/coretent-backend.git
   git branch -M main
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` with your GitHub username.

#### 2.2 Create Railway Project

1. Go to https://railway.app
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Click **"Configure GitHub App"**
6. Grant Railway access to your repositories
7. Select **"coretent-backend"**
8. Railway will automatically detect your `Dockerfile` and start building

**⏰ Wait Time:** First build takes 3-5 minutes.

#### 2.3 Add PostgreSQL Database

Your backend needs a database to store newsletters:

1. In your Railway project, click **"+ New"**
2. Click **"Database"**
3. Select **"PostgreSQL"**
4. Railway automatically creates the database and sets the connection URL

#### 2.4 Add Redis Database

Redis stores temporary data (caching, job queues):

1. Click **"+ New"** again
2. Click **"Database"**
3. Select **"Redis"**
4. Railway automatically sets the connection URL

#### 2.5 Set Environment Variables

These are like secret settings for your backend:

1. Click on your **backend service** (the one with your code)
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Add each of these:

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `MAILGUN_API_KEY` | `key-your-actual-key` | From Step 1.5 (Mailgun → API Keys) |
| `MAILGUN_DOMAIN` | `newsletters.coretent.app` | Your domain from Step 1.2 |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | `your-signing-key` | From Step 1.5 (Mailgun → Webhooks) |
| `NODE_ENV` | `production` | Just type this exactly |
| `PORT` | `3000` | Just type this number |
| `LOG_LEVEL` | `info` | Just type this exactly |
| `CORS_ORIGIN` | `coretent://,https://coretent.app` | Allows iOS app to connect |
| `JWT_SECRET` | Generate random string | See instructions below |

**How to generate JWT_SECRET:**

On Mac/Linux Terminal:
```bash
openssl rand -base64 32
```

On Windows Command Prompt:
```bash
powershell -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))"
```

Copy the output and paste it as the `JWT_SECRET` value.

#### 2.6 Get Your Railway URL

1. Click on your backend service
2. Click **"Settings"** tab
3. Scroll to **"Domains"**
4. Click **"Generate Domain"**
5. You'll get a URL like: `https://coretent-backend-production-xyz.up.railway.app`

**✅ Save this URL!** You'll need it for Step 3 and Step 4.

---

### Step 3: Configure Mailgun Route

Now we connect Mailgun to your Railway backend so emails get forwarded.

1. Go to Mailgun dashboard
2. Click **"Sending"** → **"Routes"**
3. Click **"Create Route"**
4. Fill in:
   - **Priority:** `0` (highest priority)
   - **Filter Expression:**
     ```
     match_recipient(".*@newsletters.coretent.app")
     ```
     (This means: forward ALL emails sent to any address @newsletters.coretent.app)

   - **Actions:** Click **"Forward"**
     - Destination: `https://YOUR-RAILWAY-URL.railway.app/webhooks/mailgun`
     - Replace `YOUR-RAILWAY-URL` with your actual Railway URL from Step 2.6
     - Example: `https://coretent-backend-production-xyz.up.railway.app/webhooks/mailgun`

   - **Description:** `Forward newsletters to backend`

5. Click **"Create Route"**

**✅ Test the Route:**

1. Click **"Routes"** to see all routes
2. Your new route should appear
3. Click the **"Test"** button next to it
4. Mailgun will send a test webhook to your backend
5. If successful, you'll see a green checkmark ✅

---

### Step 4: Update iOS App

The last step is to point your iOS app to the Railway backend.

#### 4.1 Update NewsletterService.swift

1. Open Xcode
2. Navigate to: `coretent/Services/NewsletterService.swift`
3. Find line 24 (around there):
   ```swift
   private let baseURL = "https://coretent-backend.railway.app/api/v1"
   ```

4. Replace with YOUR Railway URL:
   ```swift
   private let baseURL = "https://YOUR-RAILWAY-URL.railway.app/api/v1"
   ```

   Example:
   ```swift
   private let baseURL = "https://coretent-backend-production-xyz.up.railway.app/api/v1"
   ```

5. Save the file

#### 4.2 Build and Run

1. Select your target device (simulator or real iPhone)
2. Click **"Build and Run"** (▶️ button)
3. Wait for app to launch

---

## Testing Your Setup

Let's make sure everything works end-to-end!

### Test 1: Register for Newsletter Email

1. **Open Coretent app** on your iPhone/Simulator
2. **Go to Settings** tab (bottom navigation)
3. **Scroll to "Newsletters" section**
4. **Click "Get Newsletter Email"**
   - App will register you with the backend
   - A loading spinner appears
5. **Wait 2-3 seconds**
6. **You should see your email address!**
   - Example: `u-abc123-def456@newsletters.coretent.app`
7. **Tap the copy icon** (📋) to copy it

**✅ What this tests:**
- iOS app can connect to Railway backend
- Backend can create user records
- Keychain storage works

**❌ If it fails:**
- Check Railway logs (Railway → Your Service → "Deployments" → Click latest → "View Logs")
- Verify all environment variables are set correctly
- Make sure Railway URL in iOS app is correct

### Test 2: Subscribe to a Real Newsletter

Now let's subscribe to an actual newsletter:

1. **Choose a newsletter** that sends daily/weekly (recommendations below)
2. **Go to their website** and find "Subscribe"
3. **Enter your Coretent email** (the one you copied)
   - Example: `u-abc123-def456@newsletters.coretent.app`
4. **Confirm subscription** (check their confirmation email if needed)
5. **Wait for next newsletter** (could be hours or days depending on schedule)

**Good newsletters for testing:**
- **TLDR Newsletter** (daily tech news): https://tldr.tech
- **Morning Brew** (daily business): https://www.morningbrew.com
- **Dense Discovery** (weekly design): https://www.densediscovery.com
- **The Browser** (weekly curiosities): https://thebrowser.com

### Test 3: Check if Email Arrives

After the newsletter sends (wait 1-24 hours depending on schedule):

1. **Go to Mailgun dashboard** → "Logs"
2. **Look for emails** to your address
   - Should show "Delivered" or "Accepted"
3. **Check Railway logs** for email processing
   - Railway → Your Service → "Deployments" → "View Logs"
   - Search for: `Processing incoming email`
   - Should also see: `Email parsed successfully`

### Test 4: View Newsletter in App

1. **Open Coretent app**
2. **Pull down to refresh** the feed (drag from top)
3. **Wait 2-3 seconds** for loading
4. **Newsletter should appear!**
   - Look for the publication name
   - Should have "📧" or newsletter icon

**✅ What this tests:**
- Complete end-to-end flow
- Email receiving works
- Mailgun forwarding works
- Backend parsing works
- iOS app fetching works

**❌ If newsletter doesn't appear:**
- Check Mailgun logs (did email arrive?)
- Check Railway logs (did backend process it?)
- Try manually refreshing iOS app
- Wait 5 minutes and try again (caching delay)

---

## Troubleshooting

### Problem: "Get Newsletter Email" button does nothing

**Possible Causes:**
1. Railway URL not updated in iOS app
2. Backend not running
3. Network connectivity issue

**Solutions:**
1. Double-check `NewsletterService.swift` line 24 has correct Railway URL
2. Go to Railway → Check if service is "Active" (green dot)
3. Check Xcode console for error messages
4. Verify iPhone/simulator has internet connection

---

### Problem: Newsletter arrives at Mailgun but not in app

**Possible Causes:**
1. Mailgun route not configured correctly
2. Webhook signing key mismatch
3. Backend parsing failed

**Solutions:**
1. Check Mailgun → Routes → Verify webhook URL is correct
2. Check Railway environment variables → `MAILGUN_WEBHOOK_SIGNING_KEY` matches Mailgun
3. Check Railway logs for error messages:
   ```
   Railway → Service → Deployments → View Logs
   Search for: "Email parsing failed" or "Webhook signature verification failed"
   ```

---

### Problem: Railway deployment failed

**Possible Causes:**
1. Build error in code
2. Missing environment variables
3. Database connection issue

**Solutions:**
1. Check build logs:
   ```
   Railway → Service → Deployments → Click failed deployment → View Logs
   ```
2. Look for error messages (usually in red)
3. Common issues:
   - Missing `DATABASE_URL` → Make sure PostgreSQL is added
   - Missing `REDIS_URL` → Make sure Redis is added
   - TypeScript errors → Check build logs for specific errors

---

### Problem: DNS records not verifying in Mailgun

**Possible Causes:**
1. DNS hasn't propagated yet (takes 24-48 hours)
2. Records entered incorrectly
3. Domain provider issues

**Solutions:**
1. **Wait 24-48 hours** → DNS changes are slow
2. **Double-check records:**
   - Go to your domain provider (Cloudflare, Namecheap, etc.)
   - Compare each record with Mailgun's instructions
   - Common mistakes:
     - Adding extra spaces
     - Wrong record type (TXT vs CNAME)
     - Wrong subdomain (@ vs email vs _dmarc)
3. **Use DNS checker:**
   - Go to https://mxtoolbox.com
   - Enter: `newsletters.coretent.app`
   - Check MX records, SPF, DKIM

---

### Problem: App shows "Rate limit exceeded"

**Cause:**
Too many API requests too quickly (60 per minute limit)

**Solution:**
Wait 1 minute before trying again. This is normal if you're testing rapidly.

---

### How to View Logs

**Railway Logs:**
1. Go to Railway dashboard
2. Click your backend service
3. Click **"Deployments"** tab
4. Click the most recent deployment
5. Click **"View Logs"**
6. Logs update in real-time

**Mailgun Logs:**
1. Go to Mailgun dashboard
2. Click **"Logs"** in sidebar
3. Filter by recipient email (your `u-*@newsletters.coretent.app` address)
4. See all emails sent/received

**iOS Logs (Xcode Console):**
1. Run app from Xcode
2. Open Console (bottom panel)
3. Look for error messages in red
4. Search for: `NewsletterService` or `Newsletter`

---

## Cost Breakdown

### Development/MVP (Small Scale)

| Service | Plan | Cost | What You Get |
|---------|------|------|--------------|
| **Railway** | Hobby | **$5/month** | PostgreSQL + Redis + Hosting (unlimited) |
| **Mailgun** | Free Tier | **$0/month** | 5,000 emails/month |
| **GitHub** | Free | **$0/month** | Unlimited private repos |
| **TOTAL** | — | **$5/month** | Everything you need for MVP |

### Growth Phase (1,000 users, ~30k emails/month)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Railway** | Pro | **$20/month** | More resources, better performance |
| **Mailgun** | Free/Foundation | **$0-35/month** | Still free under 5k, $35 for 50k |
| **TOTAL** | — | **$20-55/month** | $0.02-0.055 per user |

### Scale (10,000 users, ~300k emails/month)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Railway** | Scale | **$50-100/month** | Multiple servers, load balancing |
| **Mailgun** | Growth | **$90/month** | 1M emails/month included |
| **TOTAL** | — | **$140-190/month** | $0.014-0.019 per user |

**💡 Key Insight:** Costs per user actually **decrease** as you scale due to economies of scale!

---

## Technical Details

For developers who want to understand what's under the hood.

### Tech Stack

**Backend:**
- **Runtime:** Node.js 20
- **Framework:** Express 4.x
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL 15+ (via Prisma ORM)
- **Cache:** Redis 7
- **Job Queue:** BullMQ
- **Logging:** Pino (5-10x faster than Winston)
- **Validation:** Zod (TypeScript-first)
- **Email Parsing:** @mozilla/readability + jsdom
- **Sanitization:** DOMPurify

**iOS Integration:**
- **Service Pattern:** Singleton with NSCache (5-min TTL)
- **Authentication:** Bearer token (userId)
- **Networking:** URLSession with async/await
- **Storage:** Keychain for credentials
- **Models:** Codable structs matching backend DTOs

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mailgun Webhook                      │
│                         ↓                               │
│              POST /webhooks/mailgun                     │
│                         ↓                               │
│         [Signature Verification Middleware]             │
│          - Timestamp validation (5-min window)          │
│          - Token uniqueness (Redis check)               │
│          - HMAC SHA256 verification                     │
│          - Timing-safe comparison                       │
│                         ↓                               │
│              [Webhook Controller]                       │
│          - Extract email metadata                       │
│          - Create newsletter record                     │
│          - Queue parsing job                            │
│          - Return 200 OK (<5s)                          │
│                         ↓                               │
│               [BullMQ Background Job]                   │
│          - Parse HTML with Readability                  │
│          - Sanitize with DOMPurify                      │
│          - Extract metadata                             │
│          - Calculate read time                          │
│          - Update newsletter record                     │
│                         ↓                               │
│                  [PostgreSQL]                           │
│              Newsletters stored                         │
│                         ↓                               │
│          [iOS App Fetches via REST API]                 │
│         GET /api/v1/newsletters?limit=30                │
│                         ↓                               │
│              [Content Service]                          │
│       Merges with YouTube, Twitch, RSS                  │
│                         ↓                               │
│              [Unified Feed Display]                     │
└─────────────────────────────────────────────────────────┘
```

### Security Features

1. **HMAC Signature Verification** (4-layer)
   - Timestamp validation (prevents replay attacks beyond 5 minutes)
   - Token uniqueness check (Redis-backed, 10-min TTL)
   - HMAC SHA256 signature generation
   - Timing-safe comparison (prevents timing attacks)

2. **Rate Limiting** (Redis-backed)
   - API endpoints: 60 requests/minute per user
   - Auth endpoints: 5 requests/minute per IP
   - Webhooks: No limit (signature verified instead)

3. **Input Validation** (Zod schemas)
   - Request body validation
   - Query parameter validation
   - URL parameter validation
   - Automatic error messages

4. **HTML Sanitization** (DOMPurify)
   - Removes scripts, iframes, dangerous tags
   - Strips event handlers (onclick, onerror, etc.)
   - Allows safe HTML for display

5. **Authentication** (Bearer tokens)
   - User ID as token (simple for MVP)
   - TODO: Migrate to JWT for production
   - Stored securely in iOS Keychain

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT UNIQUE NOT NULL,  -- From iOS app
  email_alias   TEXT UNIQUE NOT NULL,  -- u-{uuid}@newsletters.coretent.app
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Newsletters table
CREATE TABLE newsletters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  message_id          TEXT UNIQUE NOT NULL,
  from_email          TEXT NOT NULL,
  from_name           TEXT,
  subject             TEXT NOT NULL,
  received_at         TIMESTAMP DEFAULT NOW(),

  -- Content fields
  html_content        TEXT NOT NULL,
  clean_content       TEXT NOT NULL,
  text_content        TEXT,

  -- Parsed metadata
  title               TEXT,
  author              TEXT,
  publication         TEXT,
  estimated_read_time INT,
  excerpt             TEXT,

  -- Processing status
  parsed_at           TIMESTAMP,
  parse_status        TEXT DEFAULT 'pending',
  parse_error         TEXT,

  -- User interaction
  is_read             BOOLEAN DEFAULT FALSE,
  is_archived         BOOLEAN DEFAULT FALSE,

  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  newsletter_name  TEXT NOT NULL,
  sender_email     TEXT NOT NULL,
  sender_domain    TEXT NOT NULL,
  subscribed_at    TIMESTAMP DEFAULT NOW(),
  last_received_at TIMESTAMP,
  email_count      INT DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, sender_email)
);

-- Indexes for performance
CREATE INDEX idx_newsletters_user_received ON newsletters(user_id, received_at DESC);
CREATE INDEX idx_newsletters_parse_status ON newsletters(parse_status);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
```

### API Endpoints

All endpoints use JSON request/response bodies.

#### User Management

**Register User**
```http
POST /api/v1/users/register
Content-Type: application/json
Authorization: Bearer {userId}

{
  "userId": "abc-123-def-456"
}

Response 201:
{
  "userId": "abc-123-def-456",
  "emailAlias": "u-abc-123-def-456@newsletters.coretent.app"
}
```

**Get Email Alias**
```http
GET /api/v1/users/{userId}/alias
Authorization: Bearer {userId}

Response 200:
{
  "emailAlias": "u-abc-123-def-456@newsletters.coretent.app"
}
```

#### Newsletters

**Fetch Newsletters** (Cursor-based pagination)
```http
GET /api/v1/newsletters?limit=30&status=all&cursor={id}
Authorization: Bearer {userId}

Response 200:
{
  "newsletters": [
    {
      "id": "newsletter-uuid",
      "messageId": "email-message-id",
      "fromEmail": "newsletter@example.com",
      "fromName": "Example Newsletter",
      "subject": "This week's updates",
      "receivedAt": "2025-12-29T12:00:00Z",
      "title": "Parsed Article Title",
      "author": "John Doe",
      "publication": "Example Pub",
      "estimatedReadTime": 5,
      "excerpt": "First 200 characters...",
      "parseStatus": "success",
      "isRead": false,
      "isArchived": false,
      "createdAt": "2025-12-29T12:00:00Z",
      "updatedAt": "2025-12-29T12:05:00Z"
    }
  ],
  "nextCursor": "next-newsletter-id",
  "hasMore": true
}
```

**Update Newsletter**
```http
PATCH /api/v1/newsletters/{id}
Authorization: Bearer {userId}
Content-Type: application/json

{
  "isRead": true,
  "isArchived": false
}

Response 200:
{
  "id": "newsletter-uuid",
  ...updated newsletter
}
```

**Delete Newsletter**
```http
DELETE /api/v1/newsletters/{id}
Authorization: Bearer {userId}

Response 200:
{
  "success": true
}
```

#### Subscriptions

**Track Subscription**
```http
POST /api/v1/subscriptions
Authorization: Bearer {userId}
Content-Type: application/json

{
  "newsletterName": "Morning Brew",
  "senderEmail": "crew@morningbrew.com"
}

Response 201:
{
  "id": "subscription-uuid",
  "userId": "abc-123",
  "newsletterName": "Morning Brew",
  "senderEmail": "crew@morningbrew.com",
  "senderDomain": "morningbrew.com",
  "subscribedAt": "2025-12-29T12:00:00Z",
  "isActive": true
}
```

---

## FAQ

### Q: Do I need a custom domain?

**A:** No! You can use Mailgun's free subdomain like `newsletters.mg0.mailgun.org`. However, custom domains look more professional and have better deliverability.

### Q: How many newsletters can one user subscribe to?

**A:** Unlimited! Each user gets one email address that can receive emails from any number of newsletters.

### Q: What happens if I exceed Mailgun's free tier (5,000 emails/month)?

**A:** Mailgun will hold your emails and notify you. You can upgrade to their Foundation plan ($35/month for 50,000 emails) or wait until next month's reset.

### Q: Can I use a different email provider instead of Mailgun?

**A:** Yes, but you'd need to modify the webhook handling code. Mailgun is recommended because it has excellent incoming email routing and webhooks.

### Q: Is my data secure?

**A:** Yes! All communications use HTTPS encryption. Passwords/tokens are stored as environment variables (not in code). User emails are unique random IDs (not real email addresses). The backend uses industry-standard security practices.

### Q: Can users reply to newsletters?

**A:** Not currently. The email addresses are receive-only. This is intentional to prevent spam and keep the system simple.

### Q: What happens if a newsletter is spam or phishing?

**A:** The HTML sanitization removes malicious scripts, but users should still be cautious about clicking links in newsletters. Consider adding a "Report Spam" button in a future version.

### Q: Can I self-host instead of using Railway?

**A:** Yes! The Docker setup works anywhere. You could use:
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run
- Your own server with Docker Compose

Just make sure to set the environment variables correctly.

### Q: How do I backup my database?

**Railway automatic backups:**
1. Go to Railway → Your PostgreSQL database
2. Click **"Backups"** tab
3. Railway automatically creates daily backups (retained for 7 days on Hobby plan)

**Manual backup:**
```bash
# Get database URL from Railway
railway variables

# Dump database
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Q: How do I update the backend code?

**Simple method (recommended):**
1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. Railway automatically detects the push and redeploys (takes 3-5 minutes)

**Manual method:**
1. Railway → Your service → **"Deployments"** tab
2. Click **"Deploy"** button
3. Select the latest GitHub commit

### Q: Can I test locally before deploying?

**A:** Yes! Use Docker Compose:

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

Access at `http://localhost:3000`

---

## Need Help?

- **GitHub Issues:** https://github.com/YOUR-USERNAME/coretent-backend/issues
- **Railway Support:** https://railway.app/help
- **Mailgun Support:** https://help.mailgun.com

---

## License

MIT License - See LICENSE file for details.

---

## Acknowledgments

Built with:
- [Express](https://expressjs.com) - Web framework
- [Prisma](https://www.prisma.io) - Database ORM
- [BullMQ](https://docs.bullmq.io) - Job queue
- [Pino](https://getpino.io) - Fast logging
- [Readability](https://github.com/mozilla/readability) - Content extraction
- [Mailgun](https://www.mailgun.com) - Email infrastructure
- [Railway](https://railway.app) - Hosting platform

---

**Built with ❤️ for calm, intentional content consumption.**
