import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { assignDailyQuests, assignWeeklyQuests } from './_shared/quests.js';

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const [daily, weekly] = await Promise.all([
      assignDailyQuests(user.id),
      assignWeeklyQuests(user.id),
    ]);

    return new Response(JSON.stringify({
      assigned: {
        daily: daily.length,
        weekly: weekly.length,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Assign quests error:', err);
    return new Response(JSON.stringify({ error: 'Failed to assign quests' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
