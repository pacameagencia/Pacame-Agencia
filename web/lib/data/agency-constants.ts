// Lightweight constants extracted from agency-agents.ts
// to avoid shipping 127 agent objects to the client bundle

export type Division = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  count: number;
};

export const divisions: Division[] = [
  { id: "engineering", label: "Engineering", emoji: "\u{1F4BB}", color: "#06B6D4", count: 23 },
  { id: "design", label: "Design", emoji: "\u{1F3A8}", color: "#7C3AED", count: 8 },
  { id: "marketing", label: "Marketing", emoji: "\u{1F4E2}", color: "#EC4899", count: 16 },
  { id: "paid-media", label: "Paid Media", emoji: "\u{1F4B0}", color: "#EA580C", count: 7 },
  { id: "analytics", label: "Analytics", emoji: "\u{1F4CA}", color: "#2563EB", count: 8 },
  { id: "content", label: "Content", emoji: "\u{270D}\uFE0F", color: "#D97706", count: 5 },
  { id: "social", label: "Social Media", emoji: "\u{1F4F1}", color: "#EC4899", count: 6 },
  { id: "automation", label: "Automation", emoji: "\u{2699}\uFE0F", color: "#16A34A", count: 8 },
  { id: "strategy", label: "Strategy", emoji: "\u{1F9ED}", color: "#D97706", count: 6 },
  { id: "ecommerce", label: "E-commerce", emoji: "\u{1F6D2}", color: "#EA580C", count: 20 },
  { id: "security", label: "Security", emoji: "\u{1F512}", color: "#EF4444", count: 5 },
  { id: "ai-ml", label: "AI & ML", emoji: "\u{1F916}", color: "#7C3AED", count: 15 },
];

export const TOTAL_AGENTS = divisions.reduce((sum, d) => sum + d.count, 0) + 7;
