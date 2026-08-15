import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

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
    // Permanently deletes markets resolved/cancelled more than 7 weeks ago,
    // along with their predictions, disputes, and price history.
    const { data, error } = await supabaseAdmin.rpc('purge_expired_markets');

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      cutoff_weeks: 7,
      ...data,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Purge expired markets error:', err);
    return new Response(JSON.stringify({ error: 'Failed to purge expired markets' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
