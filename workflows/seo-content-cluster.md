# Workflow: SEO Content Cluster Generator

## Objective
Generate a complete content cluster strategy: pillar page + supporting articles + internal linking map.

## Trigger
New SEO client onboarded, or Atlas identifies content gap

## Agents Involved
- **Atlas** (lead): Keyword research, competitor analysis, cluster design
- **Copy** (support): Writes the actual articles
- **Pixel** (support): Publishes to client's website

## Steps

### Step 1: Keyword Universe
- Scrape client's current sitemap (Firecrawl)
- Extract existing indexed pages and their target keywords
- Use web search to find: "[niche] + [city]" keyword variations
- Build universe of 100+ keywords
- Tool: `tools/keyword_research.py`

### Step 2: Competitor Gap Analysis
- Identify top 3 ranking competitors
- Extract their keyword profile
- Find keywords they rank for that client doesn't
- Document content types winning in SERPs (listicles, how-tos, guides)

### Step 3: Cluster Design
- Group keywords into 3-5 topic clusters
- Each cluster has:
  - 1 Pillar page (2,000+ words, comprehensive)
  - 4-6 Supporting articles (800-1,500 words each)
  - Internal linking map (spoke → hub → spoke)
- Assign search intent to each piece

### Step 4: Content Briefs
- For each article, Atlas creates a brief:
  - Target keyword (primary + 2-3 secondary)
  - Search intent
  - Recommended H1, H2, H3 structure
  - Competing URLs to outperform
  - Word count target
  - Schema markup type
  - Internal links to include

### Step 5: Content Writing (Copy)
- Copy writes articles following the briefs
- Rules: keyword density natural (1-2%), headers optimized,
  meta description < 160 chars, featured snippet optimization
- Each article reviewed by Atlas for SEO compliance

### Step 6: Publication (Pixel)
- Format articles for the client's CMS
- Add schema markup (Article, FAQPage, HowTo)
- Set canonical URLs
- Create internal links
- Submit to Google Search Console for indexing

## Output
- `content-cluster-[client].md` — full strategy document
- Individual article files ready for publication
- Internal linking map diagram

## Timeline
- Days 1-3: Keyword research + cluster design
- Days 4-10: Content writing (2 articles/day)
- Days 11-14: Review, formatting, publication
- Total: 2 weeks per cluster
