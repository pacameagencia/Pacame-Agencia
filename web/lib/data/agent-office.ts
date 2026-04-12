// Agent Office — types and constants for the PACAME command center

export type AgentStatus = "working" | "idle" | "reviewing" | "waiting" | "offline";

export interface AgentActivity {
  id: string;
  agent_id: string;
  type: "task_started" | "task_completed" | "insight" | "alert" | "update" | "delivery";
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AgentTask {
  id: string;
  agent_id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  client?: string;
  due_date?: string;
  created_at: string;
  completed_at?: string;
}

export interface AgentState {
  id: string;
  name: string;
  role: string;
  color: string;
  icon: string;
  status: AgentStatus;
  currentTask: string | null;
  tasksToday: number;
  tasksCompleted: number;
  lastActivity: string;
  activeHours: number;
}

// Map agent IDs to their metadata
export const AGENT_META: Record<string, { name: string; role: string; color: string; icon: string; model: string }> = {
  nova:  { name: "Nova",  role: "Directora Creativa",   color: "#7C3AED", icon: "Sparkles",    model: "sonnet" },
  atlas: { name: "Atlas", role: "Estratega SEO",        color: "#2563EB", icon: "Globe",       model: "haiku" },
  nexus: { name: "Nexus", role: "Head of Growth",       color: "#EA580C", icon: "TrendingUp",  model: "sonnet" },
  pixel: { name: "Pixel", role: "Lead Frontend",        color: "#06B6D4", icon: "Layout",      model: "sonnet" },
  core:  { name: "Core",  role: "Backend Architect",    color: "#16A34A", icon: "Terminal",     model: "sonnet" },
  pulse: { name: "Pulse", role: "Head of Social Media", color: "#EC4899", icon: "Heart",       model: "haiku" },
  sage:  { name: "Sage",  role: "Chief Strategy Officer",color: "#D97706", icon: "Compass",    model: "sonnet" },
  copy:  { name: "Copy",  role: "Head of Copywriting",  color: "#F59E0B", icon: "Pencil",      model: "sonnet" },
  lens:  { name: "Lens",  role: "Head of Analytics",    color: "#8B5CF6", icon: "BarChart3",   model: "haiku" },
  dios:  { name: "DIOS",  role: "Orquestador",          color: "#FFFFFF", icon: "Brain",       model: "sonnet" },
};

export const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; pulse: boolean }> = {
  working:   { label: "Trabajando",    color: "#84CC16", pulse: true },
  idle:      { label: "Disponible",    color: "#06B6D4", pulse: false },
  reviewing: { label: "Revisando",     color: "#F59E0B", pulse: true },
  waiting:   { label: "En espera",     color: "#D97706", pulse: false },
  offline:   { label: "Offline",       color: "#6B7280", pulse: false },
};
