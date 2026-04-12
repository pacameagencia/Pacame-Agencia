# Workflow: Outbound Lead Generation Pipeline

## Objective
Automatically find, qualify, and reach out to potential PACAME clients with hyper-personalized outreach.

## Trigger
Manual: Pablo requests lead gen for a specific niche/location
Scheduled: Weekly automated pipeline for target niches

## Agents Involved
- **Atlas** (lead): Finds businesses via search/scraping
- **Sage** (support): Scores and qualifies leads
- **Copy** (support): Writes personalized outreach
- **Lens** (support): Tracks pipeline metrics

## Target Niches (ICP)
1. Restaurants without modern websites (Madrid, Barcelona, Valencia)
2. Dental/medical clinics with outdated web presence
3. Fitness studios and personal trainers
4. Real estate agencies without SEO
5. Law firms with no digital strategy
6. E-commerce stores with poor conversion

## Steps

### Step 1: Scrape Businesses by Location
- Use Apify Google Maps scraper (by zip code, not city — max volume)
- Extract: business name, website, phone, email, Google rating, reviews count
- Target: 100-200 businesses per niche per city
- Tool: `tools/scrape_google_maps.py`

### Step 2: Website Audit (automated)
- For each business with a website:
  - Check if site is mobile-responsive
  - Check SSL certificate
  - Check page load speed
  - Check basic SEO (title, meta, H1)
  - Screenshot the homepage
- Tool: `tools/audit_website.py`

### Step 3: ICP Scoring
- Score each lead 1-100 based on:
  - Website quality (worse = higher opportunity)
  - Google rating (4+ = established business)
  - Reviews count (10+ = active business)
  - Industry fit with PACAME services
- Filter: only leads scoring 60+ proceed
- Tool: `tools/score_lead.py`

### Step 4: Find Decision Maker
- Search for owner/manager email via:
  - Website contact page
  - LinkedIn company page
  - WHOIS data
- Verify email with BounceBan or MillionVerifier
- Tool: `tools/find_email.py`

### Step 5: Personalize Outreach (Copy)
- For each qualified lead, Copy generates:
  - Personalized hook referencing their specific website issues
  - 2-3 specific improvements PACAME would make
  - Social proof (similar business results)
  - Clear CTA (free diagnosis call)
- Email sequence: Day 1, Day 3, Day 7
- Tool: `tools/generate_outreach.py`

### Step 6: Send Campaign
- Load leads + personalized emails into campaign
- Domain warming: start with 20 emails/day, scale to 50
- Track: open rate, reply rate, bounce rate
- Tool: `tools/send_campaign.py` (via Instantly API or manual)

### Step 7: Process Replies
- Positive reply → create lead in Supabase, notify Pablo
- Objection → auto-follow-up with relevant content
- Unsubscribe → remove from list immediately
- No reply after sequence → move to monthly newsletter

## Volume Targets
- Week 1: 50 leads scraped, 30 qualified, 30 emails sent
- Week 2-4: 200 leads/week, 100 qualified, 100 emails sent
- Month 2+: 500 leads/week, 250 qualified, 250 emails sent

## Pipeline Metrics (Lens tracks)
- Scrape → Qualified rate: target 50%+
- Email → Open rate: target 40%+
- Open → Reply rate: target 5%+
- Reply → Call booked: target 30%+
- Call → Close: target 30%+

## Anti-Spam Rules
- Never send > 50 emails/day from one domain
- Always include unsubscribe link
- Never misrepresent sender
- Verify every email before sending
- Respect GDPR: legitimate interest basis for B2B outreach

## Tools Used
- `tools/scrape_google_maps.py` — Apify integration
- `tools/audit_website.py` — Firecrawl/Playwright audit
- `tools/score_lead.py` — ICP scoring algorithm
- `tools/find_email.py` — email discovery + verification
- `tools/generate_outreach.py` — personalized email generation
- `tools/send_campaign.py` — email dispatch
