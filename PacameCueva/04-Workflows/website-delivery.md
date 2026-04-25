---
type: workflow
title: website-delivery
tags:
  - type/workflow
created: '2026-04-25T21:44:19.295Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/workflows/website-delivery.md'
neural_id: 5885dde5-0599-4f2e-889c-d5d1d1f74419
---
# Workflow: Website Delivery Pipeline

## Objective
Build and deliver a client website from brief to launch.

## Trigger
Proposal accepted + first payment received

## Agents Involved
- **Pixel** (lead): Builds the website
- **Nova** (support): Brand direction and visual QA
- **Atlas** (support): SEO optimization
- **Core** (support): Backend if needed (forms, APIs, DB)
- **Copy** (support): All website copy

## Steps

### Step 1: Brand Assets Collection
- Nova reviews client's existing brand (logo, colors, fonts)
- If no brand: run `.claude/skills/branding.md` first
- Define: color palette, typography, image style, tone

### Step 2: Content Writing (Copy)
- Write all page copy using `.claude/skills/copywriting.md`
- Pages: Home, About, Services, Contact (minimum)
- Each page: H1, body copy, CTAs, meta description

### Step 3: Design & Build (Pixel)
- Use `.claude/skills/web-development.md`
- Mobile-first implementation
- Component architecture: header, footer, hero, services, CTA, testimonials
- Integrate client branding throughout

### Step 4: SEO Implementation (Atlas)
- Title tags, meta descriptions for every page
- Schema markup: LocalBusiness + Service + FAQPage
- Open Graph tags for social sharing
- Sitemap.xml and robots.txt
- Internal linking

### Step 5: Backend (Core, if needed)
- Contact form → Supabase or client's system
- Payment integration (Stripe if e-commerce)
- CMS setup if client needs to edit content
- Email notifications

### Step 6: QA (all agents)
- **Pixel**: responsive test (5 breakpoints), Lighthouse 90+, no console errors
- **Nova**: brand consistency check across all pages
- **Atlas**: SEO checklist (meta, schema, speed, mobile)
- **Core**: forms work, APIs respond, no security issues
- Review with code-reviewer subagent

### Step 7: Client Review
- Share preview link (Vercel preview deployment)
- Collect feedback (max 2 revision rounds included)
- Apply changes

### Step 8: Launch
- Connect custom domain
- SSL certificate verification
- Google Search Console submission
- Google Analytics / GA4 setup
- 50% final payment collected

### Step 9: Post-Launch
- 7-day bug watch period
- Submit sitemap to GSC
- First performance report at 30 days

## Timelines
| Type | Duration |
|------|----------|
| Landing page | 2-3 days |
| Web corporativa | 5-7 days |
| Web premium | 2-3 weeks |
| E-commerce | 3-6 weeks |

## Quality Gates
Every website must pass before delivery:
- [ ] Lighthouse 90+ (all 4 categories)
- [ ] Mobile responsive (320px to 1440px)
- [ ] All forms submit successfully
- [ ] SSL active
- [ ] No broken links
- [ ] Schema markup validated
- [ ] Cookie consent (RGPD)
- [ ] Privacy policy page exists
