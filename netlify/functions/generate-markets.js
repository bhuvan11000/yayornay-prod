import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/generate-markets
 * Called by GitHub Actions cron (daily 08:00 UTC).
 * Uses Gemini API to generate 10 prediction markets.
 *
 * TODO: Implement Gemini API integration with Google Search grounding.
 * See website_mechanics_lowlevel.md Section 2 for the full prompt and flow.
 */
export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (!verifyCronSecret(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // TODO: Implement Gemini API call with Google Search grounding
    // 1. Fetch active market titles for dedup
    // 2. Build prompt with category distribution, today's date, recent titles
    // 3. Call Gemini 2.5 Flash with grounding enabled
    // 4. Parse response as JSON array
    // 5. Validate each market (schema, date, duplicate, content filter)
    // 6. INSERT valid markets with status='open', 50/50 pricing
    // 7. Log results to market_generation_log table

    const { data: recentMarkets } = await supabaseAdmin
      .from('markets')
      .select('title')
      .eq('source', 'ai')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .limit(50);

    // Placeholder — not implemented yet
    return new Response(JSON.stringify({
      message: 'Market generation not implemented yet',
      recent_market_count: recentMarkets?.length || 0,
    }), {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Generate markets error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate markets' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
