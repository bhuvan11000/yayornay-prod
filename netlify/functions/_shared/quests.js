import { supabaseAdmin } from './supabase.js';

/**
 * Quest progress engine.
 * Handles tracking, completion checking, and assignment.
 */

/**
 * Update quest progress for a user after a relevant action.
 *
 * @param {string} userId - User UUID
 * @param {string} actionType - Type of action ('predict', 'vote', 'win', 'category', 'confidence', 'login')
 * @param {object} context - Context about the action
 * @returns {Promise<Array>} Array of newly completed quests
 */
export async function updateQuestProgress(userId, actionType, context = {}) {
  // Get active, uncompleted quests matching this action type
  const { data: activeQuests } = await supabaseAdmin
    .from('user_quests')
    .select(`
      id,
      progress,
      completed,
      quest:quest_id(title, description, type, action_type, target, xp_reward, coin_reward)
    `)
    .eq('user_id', userId)
    .eq('completed', false)
    .gt('reset_at', new Date().toISOString());

  if (!activeQuests || activeQuests.length === 0) return [];

  const completedQuests = [];

  for (const uq of activeQuests) {
    const quest = uq.quest;
    if (quest.action_type !== actionType) continue;

    let shouldIncrement = false;

    switch (quest.action_type) {
      case 'predict':
        shouldIncrement = true;
        break;
      case 'category': {
        // Count distinct categories predicted since quest assignment
        if (quest.criteria?.distinct_categories && context.category) {
          const { data: recentPreds } = await supabaseAdmin
            .from('predictions')
            .select('market:market_id(category)')
            .eq('user_id', userId)
            .gte('created_at', uq.assigned_at);
          const distinctCategories = new Set(
            (recentPreds || []).map(p => p.market?.category).filter(Boolean)
          );
          shouldIncrement = distinctCategories.size > uq.progress;
        } else {
          shouldIncrement = context.category === quest.criteria?.category;
        }
        break;
      }
      case 'confidence':
        shouldIncrement = context.confidence >= (quest.criteria?.min_confidence || 3);
        break;
      case 'vote':
        shouldIncrement = true;
        break;
      case 'win':
        shouldIncrement = context.result === 'won';
        break;
      case 'login':
        shouldIncrement = true;
        break;
      default:
        shouldIncrement = true;
    }

    if (shouldIncrement) {
      const newProgress = uq.progress + 1;

      if (newProgress >= quest.target) {
        // Quest completed!
        await supabaseAdmin
          .from('user_quests')
          .update({ progress: newProgress, completed: true })
          .eq('id', uq.id);

        // Award rewards
        await supabaseAdmin
          .from('users')
          .update({
            coins: supabaseAdmin.rpc('increment', { x: quest.coin_reward }),
            xp: supabaseAdmin.rpc('increment', { x: quest.xp_reward }),
          })
          .eq('id', userId);

        completedQuests.push({
          ...quest,
          completed: true,
        });
      } else {
        await supabaseAdmin
          .from('user_quests')
          .update({ progress: newProgress })
          .eq('id', uq.id);
      }
    }
  }

  return completedQuests;
}

/**
 * Assign daily quests to a user.
 * Randomly picks 3 daily quest templates (with weighting to avoid repeats).
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Assigned quests
 */
export async function assignDailyQuests(userId) {
  return assignQuests(userId, 'daily', 3);
}

/**
 * Assign weekly quests to a user.
 * Randomly picks 2 weekly quest templates.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Assigned quests
 */
export async function assignWeeklyQuests(userId) {
  return assignQuests(userId, 'weekly', 2);
}

/**
 * Generic quest assignment.
 *
 * @param {string} userId
 * @param {'daily'|'weekly'} type
 * @param {number} count
 * @returns {Promise<Array>}
 */
async function assignQuests(userId, type, count) {
  // Get all quest templates of this type
  const { data: templates } = await supabaseAdmin
    .from('quests')
    .select('*')
    .eq('type', type);

  if (!templates || templates.length === 0) return [];

  // Get recently assigned quest IDs to avoid repeats
  const { data: recent } = await supabaseAdmin
    .from('user_quests')
    .select('quest_id')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false })
    .limit(10);

  const recentIds = new Set(recent?.map(r => r.quest_id) || []);

  // Filter out recently assigned, then pick randomly
  const available = templates.filter(t => !recentIds.has(t.id));
  const pool = available.length >= count ? available : templates;

  // Shuffle and pick
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Calculate reset time
  const now = new Date();
  let resetAt;

  if (type === 'daily') {
    resetAt = new Date(now);
    resetAt.setUTCHours(24, 0, 0, 0); // Next midnight UTC
  } else {
    // Next Monday 00:00 UTC
    resetAt = new Date(now);
    const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
    resetAt.setUTCDate(resetAt.getUTCDate() + daysUntilMonday);
    resetAt.setUTCHours(0, 0, 0, 0);
  }

  // Insert
  const assignments = selected.map(q => ({
    user_id: userId,
    quest_id: q.id,
    progress: 0,
    completed: false,
    assigned_at: now.toISOString(),
    reset_at: resetAt.toISOString(),
  }));

  const { data: inserted } = await supabaseAdmin
    .from('user_quests')
    .insert(assignments)
    .select();

  return inserted || [];
}
