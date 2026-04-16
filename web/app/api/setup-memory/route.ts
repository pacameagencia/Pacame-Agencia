import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/setup-memory
 * Creates the bot_memory table in Supabase.
 * Run this once to set up persistent memory for the Telegram bot.
 */
export async function POST() {
  try {
    const supabase = createServerSupabase();

    // Check if table already exists
    const { error: checkError } = await supabase.from("bot_memory").select("id").limit(1);

    if (!checkError) {
      return NextResponse.json({ ok: true, message: "Table bot_memory already exists" });
    }

    if (checkError.code !== "42P01") {
      return NextResponse.json({ ok: false, error: checkError.message }, { status: 500 });
    }

    // Table doesn't exist — create it via SQL
    // Note: This requires the service role key (not anon key)
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.bot_memory (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          category TEXT NOT NULL DEFAULT 'fact',
          content TEXT NOT NULL,
          importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
          source TEXT DEFAULT 'conversation',
          tags TEXT[] DEFAULT '{}',
          last_accessed TIMESTAMPTZ DEFAULT NOW(),
          access_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_bot_memory_category ON public.bot_memory(category);
        CREATE INDEX IF NOT EXISTS idx_bot_memory_importance ON public.bot_memory(importance DESC);
        CREATE INDEX IF NOT EXISTS idx_bot_memory_tags ON public.bot_memory USING GIN(tags);

        -- Disable RLS for simplicity (internal use only)
        ALTER TABLE public.bot_memory ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all for service role" ON public.bot_memory
          FOR ALL USING (true) WITH CHECK (true);
      `,
    });

    if (createError) {
      // If RPC doesn't exist, provide manual SQL instructions
      return NextResponse.json({
        ok: false,
        error: "exec_sql RPC not available. Create the table manually in Supabase SQL Editor:",
        sql: `
CREATE TABLE IF NOT EXISTS public.bot_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'fact',
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  source TEXT DEFAULT 'conversation',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_memory_category ON public.bot_memory(category);
CREATE INDEX IF NOT EXISTS idx_bot_memory_importance ON public.bot_memory(importance DESC);
CREATE INDEX IF NOT EXISTS idx_bot_memory_tags ON public.bot_memory USING GIN(tags);
        `.trim(),
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Table bot_memory created successfully" });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
}
