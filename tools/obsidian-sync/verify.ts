#!/usr/bin/env tsx
import { supabase } from './lib/supabase.ts';

const { count: nodes } = await supabase
  .from('knowledge_nodes')
  .select('*', { count: 'exact', head: true });
const { count: edges } = await supabase
  .from('knowledge_edges')
  .select('*', { count: 'exact', head: true });
const { data: rows } = await supabase
  .from('knowledge_nodes')
  .select('node_type, tags')
  .limit(10000);

const byType: Record<string, number> = {};
const byTag: Record<string, number> = {};
for (const r of rows ?? []) {
  byType[r.node_type] = (byType[r.node_type] || 0) + 1;
  for (const t of r.tags ?? []) {
    if (t.startsWith('type/')) byTag[t] = (byTag[t] || 0) + 1;
  }
}

console.log('knowledge_nodes:', nodes);
console.log('knowledge_edges:', edges);
console.log('by node_type:', byType);
console.log('by tag type/*:', byTag);
