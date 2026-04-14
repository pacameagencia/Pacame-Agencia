// Email enrichment — extracts emails from business websites
// Used by leadgen pipeline to find contact emails for outbound outreach

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common spam/system emails to ignore
const IGNORED_EMAILS = new Set([
  "example@example.com", "email@example.com", "info@w3.org",
  "noreply@", "no-reply@", "mailer-daemon@", "postmaster@",
  "webmaster@", "hostmaster@", "abuse@", "security@",
]);

function isValidBusinessEmail(email: string, domain?: string): boolean {
  const lower = email.toLowerCase();

  // Skip image files and common false positives
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".svg")) return false;
  if (lower.includes("@sentry") || lower.includes("@wixpress")) return false;
  if (lower.length > 60) return false;

  // Skip system emails
  for (const ignored of IGNORED_EMAILS) {
    if (lower.startsWith(ignored) || lower === ignored) return false;
  }

  // Prefer emails from the same domain as the business website
  if (domain) {
    const emailDomain = lower.split("@")[1];
    if (emailDomain === domain) return true;
  }

  // Accept common contact patterns from any domain
  const prefix = lower.split("@")[0];
  const contactPrefixes = ["info", "hola", "contacto", "contact", "admin", "hello", "ventas", "sales"];
  return contactPrefixes.some((p) => prefix.startsWith(p));
}

/**
 * Extract email addresses from a website's HTML
 * Checks main page + /contacto, /contact, /about pages
 */
export async function findEmailsFromWebsite(websiteUrl: string): Promise<string[]> {
  if (!websiteUrl) return [];

  const baseUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  const domain = new URL(baseUrl).hostname.replace("www.", "");

  const pagesToCheck = [
    baseUrl,
    baseUrl.replace(/\/$/, "") + "/contacto",
    baseUrl.replace(/\/$/, "") + "/contact",
    baseUrl.replace(/\/$/, "") + "/sobre-nosotros",
    baseUrl.replace(/\/$/, "") + "/about",
  ];

  const allEmails = new Set<string>();

  for (const pageUrl of pagesToCheck) {
    try {
      const res = await fetch(pageUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PACAME-Enrichment/1.0)" },
        redirect: "follow",
      });
      if (!res.ok) continue;

      const html = await res.text();

      // Extract emails from HTML
      const matches = html.match(EMAIL_REGEX) || [];
      for (const email of matches) {
        if (isValidBusinessEmail(email, domain)) {
          allEmails.add(email.toLowerCase());
        }
      }

      // Also check mailto: links specifically
      const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
      for (const mailto of mailtoMatches) {
        const email = mailto.replace("mailto:", "");
        if (isValidBusinessEmail(email, domain)) {
          allEmails.add(email.toLowerCase());
        }
      }

      // Stop once we have a good email from the business domain
      const domainEmails = [...allEmails].filter((e) => e.includes(domain));
      if (domainEmails.length > 0) break;
    } catch {
      // Skip unreachable pages
      continue;
    }
  }

  // Sort: same-domain emails first, then by contact-likeness
  const sorted = [...allEmails].sort((a, b) => {
    const aDomain = a.includes(domain) ? 0 : 1;
    const bDomain = b.includes(domain) ? 0 : 1;
    if (aDomain !== bDomain) return aDomain - bDomain;
    // Prefer info@ hola@ contacto@ over personal emails
    const contactScore = (e: string) => {
      const prefix = e.split("@")[0];
      if (prefix === "info" || prefix === "hola" || prefix === "contacto") return 0;
      if (prefix === "contact" || prefix === "hello") return 1;
      return 2;
    };
    return contactScore(a) - contactScore(b);
  });

  return sorted.slice(0, 3); // Return top 3 candidates
}

/**
 * Enrich a batch of leads with email addresses
 * Returns enrichment results with stats
 */
export async function enrichLeadsWithEmails(
  leads: Array<{ name: string; website?: string; email?: string }>
): Promise<{
  enriched: Array<{ name: string; email: string; source: string }>;
  total: number;
  found: number;
}> {
  const enriched: Array<{ name: string; email: string; source: string }> = [];

  for (const lead of leads) {
    // Skip if already has email
    if (lead.email) continue;
    if (!lead.website) continue;

    const emails = await findEmailsFromWebsite(lead.website);
    if (emails.length > 0) {
      enriched.push({
        name: lead.name,
        email: emails[0],
        source: "website_scrape",
      });
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 300));
  }

  return {
    enriched,
    total: leads.length,
    found: enriched.length,
  };
}
