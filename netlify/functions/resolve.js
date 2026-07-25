import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

function buildResolutionPrompt(market) {
  return `You are a prediction market resolver. Your job is to determine whether the following prediction market has resolved YES or NO based on real-world events.

MARKET:
Title: "${market.title}"
Description: "${market.description}"
Resolution Criteria: "${market.resolution_criteria}"
Close Date: "${market.closes_at}"
Suggested Sources: []

INSTRUCTIONS:
1. Search for the actual result of this event.
2. Apply the resolution criteria EXACTLY as written.
3. If the event clearly happened and you can determine the outcome, respond with the resolution.
4. If the event hasn't happened yet, was cancelled, or you cannot find reliable information, mark it as AMBIGUOUS.

Respond ONLY with JSON:
{
  "resolution": "yes" | "no" | "ambiguous",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of why this resolves this way",
  "sources": ["URLs of sources that confirm the outcome"]
}`;
}

async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
  const result = JSON.parse(cleaned);

  if (!result.resolution || !['yes', 'no', 'ambiguous'].includes(result.resolution)) {
    throw new Error(`Invalid resolution: ${result.resolution}`);
  }

  return result;
}

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
      const { data: expiredMarkets } = await supabaseAdmin
      .from('markets')
      .select('id, title, description, resolution_criteria, closes_at, failed_resolutions')
      .eq('status', 'open')
      .lte('closes_at', new Date().toISOString())
      .limit(20);

    if (!expiredMarkets || expiredMarkets.length === 0) {
      return new Response(JSON.stringify({ message: 'No markets to resolve', resolved: 0, reviewed: 0, failed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const marketIds = expiredMarkets.map(m => m.id);

    await supabaseAdmin
      .from('markets')
      .update({ status: 'closed' })
      .in('id', marketIds);

    let resolved = 0;
    let reviewed = 0;
    let failed = 0;

    for (const market of expiredMarkets) {
      try {
        const prompt = buildResolutionPrompt(market);
        const result = await callGemini(prompt, apiKey);

        if (result.resolution === 'ambiguous') {
          await supabaseAdmin
            .from('markets')
            .update({
              status: 'review',
              resolution_source: result.sources?.[0] || null,
            })
            .eq('id', market.id);
          reviewed++;
          continue;
        }

        if (result.confidence >= 0.85) {
          const { error } = await supabaseAdmin.rpc('resolve_market', {
            p_market_id: market.id,
            p_resolution: result.resolution,
            p_source: result.sources?.[0] || null,
          });
          if (error) throw error;
          resolved++;
        } else if (result.confidence >= 0.50) {
          await supabaseAdmin
            .from('markets')
            .update({
              status: 'review',
              resolution_source: result.sources?.[0] || null,
            })
            .eq('id', market.id);
          reviewed++;
        } else {
          await supabaseAdmin
            .from('markets')
            .update({
              status: 'review',
              resolution_source: result.sources?.[0] || null,
            })
            .eq('id', market.id);
          reviewed++;
        }
      } catch (err) {
        console.error(`Resolution failed for market ${market.id}:`, err.message);

        const failedCount = (market.failed_resolutions || 0) + 1;

        if (failedCount >= 3) {
          await supabaseAdmin
            .from('markets')
            .update({ status: 'review', failed_resolutions: failedCount })
            .eq('id', market.id);
          reviewed++;
        } else {
          await supabaseAdmin
            .from('markets')
            .update({
              status: 'closed',
              failed_resolutions: failedCount,
            })
            .eq('id', market.id);
          failed++;
        }
      }
    }

    return new Response(JSON.stringify({
      message: 'Resolution complete',
      resolved,
      reviewed,
      failed,
      total: expiredMarkets.length,
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
