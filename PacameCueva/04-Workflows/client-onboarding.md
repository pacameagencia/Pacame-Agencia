---
type: workflow
title: client-onboarding
tags:
  - type/workflow
created: '2026-04-19T14:25:38.042Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/workflows/client-onboarding.md'
neural_id: 36f3e8f9-6c1d-46c5-a843-e7f1fffe3705
---
# Workflow: Client Onboarding

## Objective
Take a new lead from first contact to active client with a signed proposal and first payment.

## Trigger
New lead arrives via web form (/api/leads) or email (hola@pacameagencia.com)

## Agents Involved
- **Sage** (lead): Qualifies, diagnoses, creates proposal
- **DIOS** (orchestrator): Coordinates the flow
- **Copy** (support): Writes personalized follow-up emails

## Steps

### Step 1: Lead Capture (automated)
- Lead saved to Supabase `leads` table via /api/leads
- Notification created for Pablo in `notifications` table
- n8n webhook triggered as backup

### Step 2: Lead Qualification (Sage)
- Run ICP scoring (see `.claude/skills/lead-qualification.md`)
- If score >= 20: HOT → proceed to Step 3 immediately
- If score 14-19: WARM → send nurture email, follow up in 3 days
- If score < 14: COLD → auto-reply with resources

### Step 3: Discovery (Sage + Pablo)
- Review lead's website (if provided) using Firecrawl
- Identify top 3 pain points
- Prepare discovery questions for Pablo's call
- Use LRP Framework: Listen → Repeat → Poke

### Step 4: Proposal Generation (Sage)
- Run `.claude/skills/client-proposal.md`
- Generate 3-act narrative proposal
- Price based on PACAME pricing table
- Save to `proposals` pipeline in dashboard

### Step 5: Proposal Delivery (Copy)
- Write personalized email with proposal summary
- Include: problem understood, solution overview, price, next step
- Send via Resend or manually by Pablo

### Step 6: Follow-Up (automated)
- Day 0: Proposal sent
- Day 2: "Did you have a chance to review?" email
- Day 5: Value-add email (case study or relevant blog post)
- Day 7: Final follow-up with urgency

### Step 7: Close & Payment (Core)
- Generate Stripe checkout link via /api/stripe/checkout
- 50% upfront for one-time projects
- First month for recurring services
- Update lead status to "client" in Supabase

### Step 8: Project Kickoff (DIOS)
- Create client record in `clients` table
- Assign lead agent based on service type
- Create onboarding checklist in dashboard
- Schedule kickoff call with Pablo

## Success Metrics
- Lead to qualified: < 2 hours
- Qualified to proposal: < 24 hours
- Proposal to close: < 7 days average
- Close rate target: 30%+

## Tools Used
- `tools/score_lead.py` — automated ICP scoring
- `tools/scrape_website.py` — website audit for discovery
- `tools/send_email.py` — email dispatch via Resend
