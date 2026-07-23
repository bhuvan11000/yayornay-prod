import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/resolve
 * Called by GitHub Actions cron (every 2 hours).
 * Resolves expired markets using Gemini API.
 *
 * TODO: Implement Gemini API integration for resolution.
 * See polls_deep_dive.md Section 3 for the full prompt and flow.
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
    // Find markets that need resolution
    const { data: expiredMarkets } = await supabaseAdmin
      .from('markets')
      .select('id, title, description, resolution_criteria, closes_at')
      .eq('status', 'open')
      .lte('closes_at', new Date().toISOString())
      .limit(20);

    if (!expiredMarkets || expiredMarkets.length === 0) {
      return new Response(JSON.stringify({ message: 'No markets to resolve', resolved: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Close these markets first (no more predictions)
    const marketIds = expiredMarkets.map(m => m.id);
    await supabaseAdmin
      .from('markets')
      .update({ status: 'closed' })
      .in('id', marketIds);

    // TODO: For each closed market:
    // 1. Call Gemini with grounding to determine outcome
    // 2. If confidence >= 0.85: call resolve_market PG function
    // 3. If confidence < 0.85 or ambiguous: move to 'review' status
    // 4. Handle edge cases (cancelled events, etc.)

    return new Response(JSON.stringify({
      message: 'Markets closed, resolution pending',
      markets_found: expiredMarkets.length,
      // TODO: return actual resolution results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Resolve error:', err);
    return new Response(JSON.stringify({ error: 'Failed to resolve markets' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
