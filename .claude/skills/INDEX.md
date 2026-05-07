# .claude/skills/INDEX — autogenerado

> Generado: `2026-05-07T19:10:10.449Z`
>
> **Total skills únicos:** 131 | Archivos escaneados: 133 | Duplicados saltados: 1 | Sin frontmatter: 1
>
> **Regenerar:** `node tools/scripts/build-skills-index.mjs`

---

## Tabla de contenidos

- [Audio / Voice](#audio-voice) — 2 skills
- [CMS / Ecommerce](#cms-ecommerce) — 6 skills
- [DevOps / Infra](#devops-infra) — 9 skills
- [Engineering](#engineering) — 13 skills
- [Git / Release](#git-release) — 1 skills
- [Integraciones](#integraciones) — 39 skills
- [Meta / Tooling](#meta-tooling) — 1 skills
- [PACAME Custom](#pacame-custom) — 25 skills
- [Research / Content](#research-content) — 1 skills
- [Social / Content](#social-content) — 9 skills
- [Testing / QA](#testing-qa) — 1 skills
- [Visual / Design](#visual-design) — 24 skills

---

## Audio / Voice

| Skill | Descripción | Path |
|-------|-------------|------|
| `elevenlabs` | Generate AI voiceovers, sound effects, and music using ElevenLabs APIs. Use when creating audio content for videos, podcasts, or games. Trig | `.claude/skills/video-toolkit/.claude/skills/elevenlabs/SKILL.md` |
| `elevenlabs-agents` | > Build conversational AI voice agents with ElevenLabs Platform. Workflow: configure agent, add tools and knowledge base, integrate SDK, tes | `.claude/skills/jezweb-skills/plugins/integrations/skills/elevenlabs-agents/SKILL.md` |

## CMS / Ecommerce

| Skill | Descripción | Path |
|-------|-------------|------|
| `shopify-content` | > Create and manage Shopify pages, blog posts, navigation, and SEO metadata. Workflow: determine content type, generate content, create via  | `.claude/skills/jezweb-skills/plugins/shopify/skills/shopify-content/SKILL.md` |
| `shopify-products` | > Create and manage Shopify products via the Admin API. Workflow: gather product data, choose method (API or CSV), execute, verify. Use when | `.claude/skills/jezweb-skills/plugins/shopify/skills/shopify-products/SKILL.md` |
| `shopify-setup` | > Set up Shopify CLI auth and Admin API access for a store. Workflow: install CLI, authenticate, create custom app, store access token, veri | `.claude/skills/jezweb-skills/plugins/shopify/skills/shopify-setup/SKILL.md` |
| `wordpress-content` | > Create and manage WordPress posts, pages, media, categories, and menus. Workflow: determine content type, choose method (WP-CLI or REST AP | `.claude/skills/jezweb-skills/plugins/wordpress/skills/wordpress-content/SKILL.md` |
| `wordpress-elementor` | > Edit Elementor pages and manage templates on WordPress sites. Workflow: identify page, choose editing method (browser or WP-CLI), execute, | `.claude/skills/jezweb-skills/plugins/wordpress/skills/wordpress-elementor/SKILL.md` |
| `wordpress-setup` | > Connect to a WordPress site via WP-CLI over SSH or REST API. Workflow: check CLI, test SSH connection, set up auth, verify access, save co | `.claude/skills/jezweb-skills/plugins/wordpress/skills/wordpress-setup/SKILL.md` |

## DevOps / Infra

| Skill | Descripción | Path |
|-------|-------------|------|
| `cloudflare-api` | Hit the Cloudflare REST API directly for operations that wrangler and MCP can't handle well. Bulk DNS, custom hostnames, email routing, cach | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/cloudflare-api/SKILL.md` |
| `cloudflare-worker-builder` | > Scaffold and deploy Cloudflare Workers with Hono routing, Vite plugin, and Static Assets. Workflow: describe project, scaffold structure,  | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/cloudflare-worker-builder/SKILL.md` |
| `d1-drizzle-schema` | Generate Drizzle ORM schemas for Cloudflare D1 databases with correct D1-specific patterns. Produces schema files, migration commands, type  | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/d1-drizzle-schema/SKILL.md` |
| `d1-migration` | Cloudflare D1 migration workflow: generate with Drizzle, inspect SQL for gotchas, apply to local and remote, fix stuck migrations, handle pa | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/d1-migration/SKILL.md` |
| `db-seed` | Generate database seed scripts with realistic sample data. Reads Drizzle schemas or SQL migrations, respects foreign key ordering, produces  | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/db-seed/SKILL.md` |
| `hono-api-scaffolder` | Scaffold Hono API routes for Cloudflare Workers. Produces route files, middleware, typed bindings, Zod validation, error handling, and API_E | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/hono-api-scaffolder/SKILL.md` |
| `runpod` | Cloud GPU processing via RunPod serverless. Use when setting up RunPod endpoints, deploying Docker images, managing GPU resources, troublesh | `.claude/skills/video-toolkit/.claude/skills/runpod/SKILL.md` |
| `tanstack-start` | Build a full-stack TanStack Start app on Cloudflare Workers from scratch — SSR, file-based routing, server functions, D1+Drizzle, better-aut | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/tanstack-start/SKILL.md` |
| `vite-flare-starter` | Scaffold a full-stack Cloudflare app from vite-flare-starter — React 19, Hono, D1+Drizzle, better-auth, Tailwind v4+shadcn/ui, TanStack Quer | `.claude/skills/jezweb-skills/plugins/cloudflare/skills/vite-flare-starter/SKILL.md` |

## Engineering

| Skill | Descripción | Path |
|-------|-------------|------|
| `app-docs` | Generate complete user documentation for a web app with screenshots. Browses the app via browser automation, screenshots every screen, and p | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/app-docs/SKILL.md` |
| `brains-trust` | > Get a second opinion from leading AI models on code, architecture, strategy, prompting, or anything. Queries models via OpenRouter, Gemini | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/brains-trust/SKILL.md` |
| `fork-discipline` | Audit and enforce the core/client boundary in multi-client projects. Detects where shared platform code is tangled with client-specific code | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/fork-discipline/SKILL.md` |
| `git-workflow` | Guided git workflows: prepare PRs, clean up branches, resolve merge conflicts, handle monorepo tags, squash-and-merge patterns. Use when ask | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/git-workflow/SKILL.md` |
| `onboarding-ux` | Audit and generate in-app user guidance — onboarding flows, empty states, tooltips, feature tours, contextual help, defaults, and inline hin | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/onboarding-ux/SKILL.md` |
| `project-docs` | Generate project documentation from codebase analysis — ARCHITECTURE.md, API_ENDPOINTS.md, DATABASE_SCHEMA.md. Reads source code, schema fil | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/project-docs/SKILL.md` |
| `project-health` | All-in-one project configuration and health management. Sets up new projects (settings.local.json, CLAUDE.md, .gitignore), audits existing p | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/project-health/SKILL.md` |
| `react-native` | React Native and Expo patterns for building performant mobile apps. Covers list performance, animations with Reanimated, navigation, UI patt | `.claude/skills/jezweb-skills/plugins/frontend/skills/react-native/SKILL.md` |
| `react-patterns` | React 19 performance patterns and composition architecture for Vite + Cloudflare projects. 50+ rules ranked by impact — eliminating waterfal | `.claude/skills/jezweb-skills/plugins/frontend/skills/react-patterns/SKILL.md` |
| `responsiveness-check` | Test website responsiveness across viewport widths using browser automation. Resizes a single session through breakpoints, screenshots each  | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/responsiveness-check/SKILL.md` |
| `roadmap` | Plan and execute entire application builds. Generates phased delivery roadmaps, then executes them autonomously — phase by phase, committing | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/roadmap/SKILL.md` |
| `team-update` | Post project updates to team chat, gather feedback, triage responses, and plan next steps. Adapts to available tools (chat, git, issues, tas | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/team-update/SKILL.md` |
| `ux-audit` | Dogfood web apps — browse as a real user, notice friction, document findings. Adopts a user persona, tracks emotional friction (trust, anxie | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/ux-audit/SKILL.md` |

## Git / Release

| Skill | Descripción | Path |
|-------|-------------|------|
| `github-release` | Prepare and publish GitHub releases. Sanitizes code for public release (secrets scan, personal artifacts, LICENSE/README validation), create | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/github-release/SKILL.md` |

## Integraciones

| Skill | Descripción | Path |
|-------|-------------|------|
| `artifacts-builder` | Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, | `.claude/skills/composio-skills/artifacts-builder/SKILL.md` |
| `brand-guidelines` | Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use | `.claude/skills/composio-skills/brand-guidelines/SKILL.md` |
| `canvas-design` | Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a pos | `.claude/skills/composio-skills/canvas-design/SKILL.md` |
| `changelog-generator` | Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical  | `.claude/skills/composio-skills/changelog-generator/SKILL.md` |
| `competitive-ads-extractor` | Extracts and analyzes competitors' ads from ad libraries (Facebook, LinkedIn, etc.) to understand what messaging, problems, and creative app | `.claude/skills/composio-skills/competitive-ads-extractor/SKILL.md` |
| `connect` | Connect Claude to any app. Send emails, create issues, post messages, update databases - take real actions across Gmail, Slack, GitHub, Noti | `.claude/skills/composio-skills/connect/SKILL.md` |
| `connect-apps` | Connect Claude to external apps like Gmail, Slack, GitHub. Use this skill when the user wants to send emails, create issues, post messages,  | `.claude/skills/composio-skills/connect-apps/SKILL.md` |
| `content-research-writer` | Assists in writing high-quality content by conducting research, adding citations, improving hooks, iterating on outlines, and providing real | `.claude/skills/composio-skills/content-research-writer/SKILL.md` |
| `developer-growth-analysis` | Analyzes your recent Claude Code chat history to identify coding patterns, development gaps, and areas for improvement, curates relevant lea | `.claude/skills/composio-skills/developer-growth-analysis/SKILL.md` |
| `docx` | Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extract | `.claude/skills/composio-skills/document-skills/docx/SKILL.md` |
| `domain-name-brainstormer` | Generates creative domain name ideas for your project and checks availability across multiple TLDs (.com, .io, .dev, .ai, etc.). Saves hours | `.claude/skills/composio-skills/domain-name-brainstormer/SKILL.md` |
| `file-organizer` | Intelligently organizes your files and folders across your computer by understanding context, finding duplicates, suggesting better structur | `.claude/skills/composio-skills/file-organizer/SKILL.md` |
| `google-apps-script` | Build Google Apps Script automation for Sheets and Workspace apps. Produces scripts with custom menus, triggers, dialogs, email automation,  | `.claude/skills/jezweb-skills/plugins/integrations/skills/google-apps-script/SKILL.md` |
| `google-chat-messages` | Send Google Chat messages via webhook — text, rich cards (cardsV2), threaded replies. Includes TypeScript types, card builder utility, and w | `.claude/skills/jezweb-skills/plugins/integrations/skills/google-chat-messages/SKILL.md` |
| `gws-install` | > Quick install of the Google Workspace CLI (gws) on an additional machine using existing OAuth credentials. Requires client_secret.json fro | `.claude/skills/jezweb-skills/plugins/integrations/skills/gws-install/SKILL.md` |
| `gws-setup` | > Set up the Google Workspace CLI (gws) from scratch. Guides through GCP project creation, OAuth credentials, authentication, and installing | `.claude/skills/jezweb-skills/plugins/integrations/skills/gws-setup/SKILL.md` |
| `image-enhancer` | Improves the quality of images, especially screenshots, by enhancing resolution, sharpness, and clarity. Perfect for preparing images for pr | `.claude/skills/composio-skills/image-enhancer/SKILL.md` |
| `internal-comms` | A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use  | `.claude/skills/composio-skills/internal-comms/SKILL.md` |
| `invoice-organizer` | Automatically organizes invoices and receipts for tax preparation by reading messy files, extracting key information, renaming them consiste | `.claude/skills/composio-skills/invoice-organizer/SKILL.md` |
| `langsmith-fetch` | Debug LangChain and LangGraph agents by fetching execution traces from LangSmith Studio. Use when debugging agent behavior, investigating er | `.claude/skills/composio-skills/langsmith-fetch/SKILL.md` |
| `lead-research-assistant` | Identifies high-quality leads for your product or service by analyzing your business, searching for target companies, and providing actionab | `.claude/skills/composio-skills/lead-research-assistant/SKILL.md` |
| `mcp-builder` | Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-design | `.claude/skills/composio-skills/mcp-builder/SKILL.md` |
| `meeting-insights-analyzer` | Analyzes meeting transcripts and recordings to uncover behavioral patterns, communication insights, and actionable feedback. Identifies when | `.claude/skills/composio-skills/meeting-insights-analyzer/SKILL.md` |
| `nemoclaw-setup` | > Install and configure NVIDIA NemoClaw (sandboxed OpenClaw agent platform) on Linux. Handles cloudflared tunnels, Docker cgroup fixes, Open | `.claude/skills/jezweb-skills/plugins/integrations/skills/nemoclaw-setup/SKILL.md` |
| `parcel-tracking` | Track parcels and check delivery status for Australian and international couriers. Searches Gmail for dispatch/shipping emails and provides  | `.claude/skills/jezweb-skills/plugins/integrations/skills/parcel-tracking/SKILL.md` |
| `pdf` | Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms. W | `.claude/skills/composio-skills/document-skills/pdf/SKILL.md` |
| `pptx` | Presentation creation, editing, and analysis. When Claude needs to work with presentations (.pptx files) for: (1) Creating new presentations | `.claude/skills/composio-skills/document-skills/pptx/SKILL.md` |
| `raffle-winner-picker` | Picks random winners from lists, spreadsheets, or Google Sheets for giveaways, raffles, and contests. Ensures fair, unbiased selection with  | `.claude/skills/composio-skills/raffle-winner-picker/SKILL.md` |
| `skill-creator` | Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that exte | `.claude/skills/composio-skills/skill-creator/SKILL.md` |
| `skill-share` | A skill that creates new Claude skills and automatically shares them on Slack using Rube for seamless team collaboration and skill discovery | `.claude/skills/composio-skills/skill-share/SKILL.md` |
| `slack-gif-creator` | Toolkit for creating animated GIFs optimized for Slack, with validators for size constraints and composable animation primitives. This skill | `.claude/skills/composio-skills/slack-gif-creator/SKILL.md` |
| `stripe-payments` | Add Stripe payments to a web app — Checkout Sessions, Payment Intents, subscriptions, webhooks, customer portal, and pricing pages. Covers t | `.claude/skills/jezweb-skills/plugins/integrations/skills/stripe-payments/SKILL.md` |
| `tailored-resume-generator` | Analyzes job descriptions and generates tailored resumes that highlight relevant experience, skills, and achievements to maximize interview  | `.claude/skills/composio-skills/tailored-resume-generator/SKILL.md` |
| `template-skill` | Replace with description of the skill and when Claude should use it. | `.claude/skills/composio-skills/template-skill/SKILL.md` |
| `theme-factory` | Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set t | `.claude/skills/composio-skills/theme-factory/SKILL.md` |
| `twitter-algorithm-optimizer` | Analyze and optimize tweets for maximum reach using Twitter's open-source algorithm insights. Rewrite and edit user tweets to improve engage | `.claude/skills/composio-skills/twitter-algorithm-optimizer/SKILL.md` |
| `webapp-testing` | Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI be | `.claude/skills/composio-skills/webapp-testing/SKILL.md` |
| `xlsx` | Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When Clau | `.claude/skills/composio-skills/document-skills/xlsx/SKILL.md` |
| `youtube-downloader` | Download YouTube videos with customizable quality and format options. Use this skill when the user asks to download, save, or grab YouTube v | `.claude/skills/composio-skills/video-downloader/SKILL.md` |

## Meta / Tooling

| Skill | Descripción | Path |
|-------|-------------|------|
| `career-ops` | AI job search command center -- evaluate offers, generate CVs, scan portals, track applications | `.claude/skills/career-ops/.claude/skills/career-ops/SKILL.md` |

## PACAME Custom

| Skill | Descripción | Path |
|-------|-------------|------|
| `Ads_Campaign_Manager` | Use when creating, analyzing, or optimizing paid advertising campaigns on Meta (Facebook/Instagram), Google Ads, or TikTok. | `.claude/skills/ads-campaign.md` |
| `Analytics_Report_Generator` | Use when creating analytics reports, setting up tracking, analyzing metrics, or building dashboards for PACAME or clients. | `.claude/skills/analytics-report.md` |
| `auto-aprende` | Sistema de aprendizaje autónomo PACAME. Investiga conocimiento de oro (técnicas, herramientas, tendencias) para uno de los 10 agentes, lo pe | `.claude/skills/auto-aprende.md` |
| `auto-brain` | Activa el cerebro PACAME automáticamente ANTES de responder. Se dispara para cualquier petición creativa o estratégica: 'crea una web', 'haz | `.claude/skills/auto-brain/SKILL.md` |
| `Brand_Identity_Builder` | Use when creating brand identity, visual systems, logos, color palettes, typography, or brand guidelines for clients. | `.claude/skills/branding.md` |
| `Client_Proposal_Generator` | Use when creating a client proposal, pricing a project, qualifying a lead, or preparing a sales pitch for PACAME services. | `.claude/skills/client-proposal.md` |
| `Copywriting_Engine` | Use when writing sales copy, landing page text, email sequences, ad copy, social media captions, or brand messaging. | `.claude/skills/copywriting.md` |
| `Deploy_Workflow` | Use when deploying client projects to production. Covers GitHub setup, Vercel deployment, custom domains, environment variables, and Supabas | `.claude/skills/deploy-workflow.md` |
| `Design_System` | Use when creating or maintaining design systems for clients. Covers token definition, component libraries, Storybook, and consistency rules. | `.claude/skills/design-system.md` |
| `Figma_To_Code` | Use when converting Figma designs into production code. Covers Figma MCP integration, design token extraction, and pixel-perfect implementat | `.claude/skills/figma-to-code.md` |
| `higgsfield-generate` | \| Generate images and videos via Higgsfield AI through 30+ models including Nano Banana 2, Soul V2, Veo 3.1, Kling 3.0, Seedance 2.0, Flux  | `.claude/skills/higgsfield-generate/SKILL.md` |
| `higgsfield-marketplace-cards` | \| Generate marketplace product image cards through Higgsfield: compliant main image, secondary product images, and A+ style content modules | `.claude/skills/higgsfield-marketplace-cards/SKILL.md` |
| `higgsfield-product-photoshoot` | \| Generate brand-quality product images via mode-specific prompt enhancement on Higgsfield's gpt_image_2 model. The single entry point for  | `.claude/skills/higgsfield-product-photoshoot/SKILL.md` |
| `higgsfield-soul-id` | \| Train a Soul Character — a personalized model on a person's face that Higgsfield uses for identity-faithful image and video generation. U | `.claude/skills/higgsfield-soul-id/SKILL.md` |
| `Interactive_Prototyping` | Use when building interactive prototypes with real data, sound, animations, and API connections for client presentations or user testing. | `.claude/skills/interactive-prototyping.md` |
| `Lead_Qualification_Scorer` | Use when a new lead comes in to score, qualify, and determine next steps. Analyzes the lead's website, business, and fit with PACAME service | `.claude/skills/lead-qualification.md` |
| `nano-banana` | REQUIRED for all image generation requests. Generate and edit images using Nano Banana (Gemini CLI). Handles blog featured images, YouTube t | `.claude/skills/nano-banana/SKILL.md` |
| `pacame-contenido` | Skill maestra PACAME para producción de contenido para Dark Room (capa 3) y PACAME (capa 1) — carruseles, stories, reels, posts, WhatsApp me | `.claude/skills/pacame-contenido/SKILL.md` |
| `pacame-viral-visuals` | Skill PACAME para generar fotos, carruseles y vídeos virales inspirados en lo que está rompiendo en Instagram AHORA MISMO. Antes de generar  | `.claude/skills/pacame-viral-visuals/SKILL.md` |
| `pacame-web` | Meta-orquestador PACAME para construir CUALQUIER tipo de web, desde una landing de conversión de una sola página hasta un SaaS complejo con  | `.claude/skills/pacame-web/SKILL.md` |
| `SEO_Audit_Generator` | Use when asked to audit SEO, generate content clusters, analyze keywords, or create SEO strategy for a client website. | `.claude/skills/seo-audit.md` |
| `Social_Media_Strategy` | Use when creating social media calendars, content plans, Instagram/LinkedIn/TikTok strategy, or community management plans. | `.claude/skills/social-media.md` |
| `Vibe_Coding` | Use when building rapid prototypes or MVPs for clients by describing features in natural language. Covers the full vibe-coding workflow from | `.claude/skills/vibe-coding.md` |
| `Visual_Design_Exploration` | Use when exploring multiple visual design directions rapidly for a client. Covers aesthetic exploration, style comparisons, and design itera | `.claude/skills/visual-design-exploration.md` |
| `Web_Development` | Use when building websites, landing pages, or web applications for PACAME clients. Covers Next.js, React, Tailwind, Supabase integration. | `.claude/skills/web-development.md` |

## Research / Content

| Skill | Descripción | Path |
|-------|-------------|------|
| `deep-research` | Deep research and discovery before building something new. Explores local projects for reusable code, researches competitors, reads forums a | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/deep-research/SKILL.md` |

## Social / Content

| Skill | Descripción | Path |
|-------|-------------|------|
| `aussie-business-english` | > Australian business English writing style for professional communications. Warm, direct, EN-AU spelling. Use when writing emails, chat mes | `.claude/skills/jezweb-skills/plugins/writing/skills/aussie-business-english/SKILL.md` |
| `award-application` | > Write compelling award submissions, grant applications, and competition entries. Maps achievements to selection criteria using evidence-ba | `.claude/skills/jezweb-skills/plugins/writing/skills/award-application/SKILL.md` |
| `nz-business-english` | > New Zealand business English writing style for professional communications. Warm, inclusive, EN-NZ spelling. Use when writing emails, chat | `.claude/skills/jezweb-skills/plugins/writing/skills/nz-business-english/SKILL.md` |
| `proposal-writer` | > Write a client proposal or quote for a service business. Covers project understanding, scope, timeline, pricing presentation, and terms. W | `.claude/skills/jezweb-skills/plugins/writing/skills/proposal-writer/SKILL.md` |
| `resume-cover-letter` | > Write a resume/CV or cover letter tailored to a specific role. Handles regional format differences (AU/NZ, US, UK), ATS-friendly formattin | `.claude/skills/jezweb-skills/plugins/writing/skills/resume-cover-letter/SKILL.md` |
| `social-media-posts` | Create platform-specific social media posts for LinkedIn, Facebook, Instagram, and Reddit. Handles character limits, hashtag strategies, hoo | `.claude/skills/jezweb-skills/plugins/social-media/skills/social-media-posts/SKILL.md` |
| `strategy-document` | > Write structured strategic documents for small and medium businesses. Produces SWOT analyses, lean business plans, OKRs, and competitive a | `.claude/skills/jezweb-skills/plugins/writing/skills/strategy-document/SKILL.md` |
| `uk-business-english` | > British business English writing style for professional communications. Polished, understated, EN-GB spelling. Use when writing emails, ch | `.claude/skills/jezweb-skills/plugins/writing/skills/uk-business-english/SKILL.md` |
| `us-business-english` | > American business English writing style for professional communications. Direct, action-oriented, EN-US spelling. Use when writing emails, | `.claude/skills/jezweb-skills/plugins/writing/skills/us-business-english/SKILL.md` |

## Testing / QA

| Skill | Descripción | Path |
|-------|-------------|------|
| `vitest` | Set up Vitest testing in any project — detects project type (Cloudflare Workers, React, Node), generates vitest.config.ts, test setup, utili | `.claude/skills/jezweb-skills/plugins/dev-tools/skills/vitest/SKILL.md` |

## Visual / Design

| Skill | Descripción | Path |
|-------|-------------|------|
| `acestep` | AI music generation with ACE-Step 1.5 — background music, vocal tracks, covers, stem extraction, audio repainting, and continuation for vide | `.claude/skills/video-toolkit/.claude/skills/acestep/SKILL.md` |
| `ai-image-generator` | Generate AI images using Gemini or GPT APIs directly. Covers model selection (Gemini for scenes, GPT for transparent icons), the 5-part prom | `.claude/skills/jezweb-skills/plugins/design-assets/skills/ai-image-generator/SKILL.md` |
| `color-palette` | > Generate complete, accessible colour palettes from a single brand hex. Produces 11-shade scale (50-950), semantic tokens, dark mode varian | `.claude/skills/jezweb-skills/plugins/design-assets/skills/color-palette/SKILL.md` |
| `design-loop` | Autonomous multi-page site builder using a baton-passing loop pattern. Each iteration reads a task from .design/next-prompt.md, generates a  | `.claude/skills/jezweb-skills/plugins/frontend/skills/design-loop/SKILL.md` |
| `design-review` | Review a web app or page for visual design quality — layout, typography, spacing, colour, hierarchy, consistency, interaction patterns, and  | `.claude/skills/jezweb-skills/plugins/frontend/skills/design-review/SKILL.md` |
| `design-system` | Extract a complete design system from an existing website or screenshot into a DESIGN.md file. Analyses colours, typography, component style | `.claude/skills/jezweb-skills/plugins/frontend/skills/design-system/SKILL.md` |
| `favicon-gen` | > Generate custom favicons from logos, text, or brand colours. Produces all required formats: favicon.svg, favicon.ico, apple-touch-icon.png | `.claude/skills/jezweb-skills/plugins/design-assets/skills/favicon-gen/SKILL.md` |
| `ffmpeg` | Video and audio processing with FFmpeg. Use for format conversion, resizing, compression, audio extraction, and preparing assets for Remotio | `.claude/skills/video-toolkit/.claude/skills/ffmpeg/SKILL.md` |
| `frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components | `.claude/skills/video-toolkit/.claude/skills/frontend-design/SKILL.md` |
| `icon-set-generator` | > Generate cohesive, project-specific SVG icon sets for websites and applications. Use this skill whenever the user needs custom icons, an i | `.claude/skills/jezweb-skills/plugins/design-assets/skills/icon-set-generator/SKILL.md` |
| `image-processing` | Process images for web development — resize, crop, trim whitespace, convert formats (PNG/WebP/JPG), optimise file size, generate thumbnails, | `.claude/skills/jezweb-skills/plugins/design-assets/skills/image-processing/SKILL.md` |
| `landing-page` | Generate a complete, deployable landing page from a brief. Produces a single self-contained HTML file with Tailwind CSS (via CDN), responsiv | `.claude/skills/jezweb-skills/plugins/frontend/skills/landing-page/SKILL.md` |
| `ltx2` | AI video generation with LTX-2.3 22B — text-to-video, image-to-video clips for video production. Use when generating video clips, animating  | `.claude/skills/video-toolkit/.claude/skills/ltx2/SKILL.md` |
| `moviepy` | Python video composition with moviepy 2.x — overlaying deterministic text on AI-generated video (LTX-2, SadTalker), compositing clips, singl | `.claude/skills/video-toolkit/.claude/skills/moviepy/SKILL.md` |
| `playwright-recording` | Record browser interactions as video using Playwright. Use for capturing demo videos, app walkthroughs, and UI flows for Remotion videos. Tr | `.claude/skills/video-toolkit/.claude/skills/playwright-recording/SKILL.md` |
| `product-showcase` | Generate a comprehensive marketing website for a web app — multi-page with real screenshots, animated GIF walkthroughs, feature deep-dives,  | `.claude/skills/jezweb-skills/plugins/frontend/skills/product-showcase/SKILL.md` |
| `qwen-edit` | AI image editing prompting patterns for Qwen-Image-Edit. Use when editing photos while preserving identity, reframing cropped images, changi | `.claude/skills/video-toolkit/.claude/skills/qwen-edit/SKILL.md` |
| `remotion` | Toolkit-specific Remotion patterns — custom transitions, shared components, and project conventions. For core Remotion framework knowledge ( | `.claude/skills/video-toolkit/.claude/skills/remotion/SKILL.md` |
| `remotion-best-practices` | Best practices for Remotion - Video creation in React | `.claude/skills/video-toolkit/.claude/skills/remotion-official/SKILL.md` |
| `seo-local-business` | Generate complete SEO setup for local business websites — HTML head tags, JSON-LD LocalBusiness schema, robots.txt, sitemap.xml. Australian- | `.claude/skills/jezweb-skills/plugins/web-design/skills/seo-local-business/SKILL.md` |
| `shadcn-ui` | Install and configure shadcn/ui components for React projects. Guides component selection, installation order, dependency management, custom | `.claude/skills/jezweb-skills/plugins/frontend/skills/shadcn-ui/SKILL.md` |
| `tailwind-theme-builder` | > Set up Tailwind v4 with shadcn/ui themed UI. Workflow: install dependencies, configure CSS variables with @theme inline, set up dark mode, | `.claude/skills/jezweb-skills/plugins/frontend/skills/tailwind-theme-builder/SKILL.md` |
| `video_toolkit` | Create professional videos autonomously using claude-code-video-toolkit — AI voiceovers, image generation, music, talking heads, and Remotio | `.claude/skills/video-toolkit/skills/openclaw-video-toolkit/SKILL.md` |
| `walkthrough-video` | Generate professional walkthrough videos from app screenshots or live sites using Remotion. Smooth transitions, zoom effects, text overlays, | `.claude/skills/jezweb-skills/plugins/frontend/skills/walkthrough-video/SKILL.md` |

