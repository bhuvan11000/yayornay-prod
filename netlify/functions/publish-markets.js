import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * Cron function that runs at 12:00 PM IST (06:30 UTC) daily.
 * Publishes all AI-generated draft markets whose opens_at has arrived.
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
    const now = new Date().toISOString();

    const { data: drafts, error: fetchError } = await supabaseAdmin
      .from('markets')
      .select('id, title')
      .eq('status', 'draft')
      .lte('opens_at', now);

    if (fetchError) throw fetchError;

    if (!drafts || drafts.length === 0) {
      return new Response(JSON.stringify({
        published: 0,
        message: 'No drafts to publish',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ids = drafts.map(m => m.id);

    const { error: updateError } = await supabaseAdmin
      .from('markets')
      .update({ status: 'open' })
      .in('id', ids);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      published: drafts.length,
      message: `${drafts.length} market${drafts.length !== 1 ? 's' : ''} published`,
      markets: drafts.map(m => ({ id: m.id, title: m.title })),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Publish markets error:', err);
    return new Response(JSON.stringify({ error: 'Failed to publish markets' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
