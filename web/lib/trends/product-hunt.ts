/**
 * Product Hunt launches recientes via GraphQL API.
 * Requiere PRODUCT_HUNT_TOKEN. Si no existe, degradación graceful.
 */

const PH_TOKEN = process.env.PRODUCT_HUNT_TOKEN || '';

export interface ProductHuntLaunch {
  name: string;
  tagline: string;
  votesCount: number;
  url: string;
  topics: string[];
  createdAt: string;
}

export async function fetchProductHuntLaunches(limit = 30): Promise<ProductHuntLaunch[]> {
  if (!PH_TOKEN) {
    return [];
  }

  const query = `
    query {
      posts(order: VOTES, first: ${Math.min(50, limit)}) {
        edges {
          node {
            name
            tagline
            votesCount
            url
            createdAt
            topics(first: 5) { edges { node { name } } }
          }
        }
      }
    }
  `;

  try {
    const r = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return [];
    const json = await r.json() as { data?: { posts?: { edges?: Array<{ node: any }> } } };
    const edges = json?.data?.posts?.edges ?? [];
    return edges.map(e => ({
      name: e.node.name,
      tagline: e.node.tagline,
      votesCount: e.node.votesCount,
      url: e.node.url,
      topics: (e.node.topics?.edges ?? []).map((t: any) => t.node.name),
      createdAt: e.node.createdAt,
    }));
  } catch {
    return [];
  }
}
