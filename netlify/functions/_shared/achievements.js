import { supabaseAdmin } from './supabase.js';

/**
 * Achievement checking engine.
 * Maps trigger actions to relevant achievement slugs,
 * evaluates conditions, and awards newly unlocked achievements.
 */

/**
 * Map of trigger actions to achievement slugs that should be checked.
 */
export const ACHIEVEMENT_TRIGGERS = {
  predict: ['first_prediction', 'century', 'diversified', 'early_bird'],
  predict_resolve_win: ['on_a_roll', 'hot_streak', 'unstoppable', 'iron_will', 'contrarian', 'sharp_eye'],
  predict_resolve_lose: [],
  coins_change: ['whale', 'ranked_up', 'rising_star'],
  login: [],
  level_up: [],
  community_approved: ['market_maker', 'trendsetter'],
  betting_streak: ['on_a_roll', 'hot_streak', 'unstoppable', 'iron_will'],
};

/**
 * Check achievements for a user after a specific action.
 * Awards any newly unlocked achievements and returns them.
 *
 * @param {string} userId - User UUID
 * @param {string} triggerAction - The action that triggered the check
 * @param {object} context - Additional context (market, prediction, etc.)
 * @returns {Promise<Array>} Array of newly unlocked achievements
 */
export async function checkAchievements(userId, triggerAction, context = {}) {
  const relevantSlugs = ACHIEVEMENT_TRIGGERS[triggerAction] || [];
  if (relevantSlugs.length === 0) return [];

  // Get all achievements
  const { data: allAchievements } = await supabaseAdmin
    .from('achievements')
    .select('*');

  if (!allAchievements) return [];

  // Get already-unlocked achievement slugs
  const { data: unlocked } = await supabaseAdmin
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);

  // Filter to achievements that:
  // 1. Are in the relevant triggers list
  // 2. Haven't been unlocked yet
  const toCheck = allAchievements.filter(
    a => relevantSlugs.includes(a.slug) && !unlockedIds.has(a.id)
  );

  const newlyUnlocked = [];

  for (const achievement of toCheck) {
    const met = await evaluateCondition(userId, achievement.slug, context);

    if (met) {
      // Award the achievement + rewards atomically
      await supabaseAdmin.rpc('unlock_achievement', {
        p_user_id: userId,
        p_achievement_id: achievement.id,
        p_xp: achievement.xp_reward,
        p_coins: achievement.coin_reward,
      });

      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/**
 * Evaluate whether a specific achievement condition is met.
 *
 * @param {string} userId - User UUID
 * @param {string} slug - Achievement slug
 * @param {object} context - Trigger context
 * @returns {Promise<boolean>}
 */
async function evaluateCondition(userId, slug, context) {
  switch (slug) {
    case 'first_prediction': {
      const { count } = await supabaseAdmin
        .from('predictions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 1;
    }

    case 'on_a_roll': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('betting_streak')
        .eq('id', userId)
        .single();
      return user?.betting_streak >= 3;
    }

    case 'hot_streak': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('betting_streak')
        .eq('id', userId)
        .single();
      return user?.betting_streak >= 7;
    }

    case 'unstoppable': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('betting_streak')
        .eq('id', userId)
        .single();
      return user?.betting_streak >= 15;
    }

    case 'iron_will': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('betting_streak')
        .eq('id', userId)
        .single();
      return user?.betting_streak >= 30;
    }

    case 'diversified': {
      const { count } = await supabaseAdmin
        .from('predictions')
        .select(`
          market:market_id!inner(category)
        `, { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get distinct categories
      const { data: cats } = await supabaseAdmin
        .from('predictions')
        .select('market:market_id(category)')
        .eq('user_id', userId);

      const categories = new Set(cats?.map(c => c.market?.category).filter(Boolean) || []);
      return categories.size >= 5;
    }

    case 'contrarian': {
      // Check if user won a prediction where <10% of players were on their side
      if (context.marketId && context.position) {
        const { count: total } = await supabaseAdmin
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .eq('market_id', context.marketId);

        const { count: sameSide } = await supabaseAdmin
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .eq('market_id', context.marketId)
          .eq('position', context.position);

        if (total > 0 && sameSide / total < 0.10) {
          return true;
        }
      }
      return false;
    }

    case 'whale': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('coins')
        .eq('id', userId)
        .single();
      return user?.coins >= 10000;
    }

    case 'early_bird': {
      // Prediction was within 1 hour of market opening
      if (context.predictionCreatedAt && context.marketOpensAt) {
        const diff = new Date(context.predictionCreatedAt) - new Date(context.marketOpensAt);
        return diff >= 0 && diff <= 3600000; // within 1 hour
      }
      return false;
    }

    case 'century': {
      const { count } = await supabaseAdmin
        .from('predictions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 100;
    }

    case 'sharp_eye': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('total_predictions, accuracy')
        .eq('id', userId)
        .single();
      return user?.total_predictions >= 50 && user?.accuracy >= 0.70;
    }

    case 'market_maker': {
      const { count } = await supabaseAdmin
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('source', 'community')
        .eq('status', 'open');
      return count >= 1;
    }

    case 'trendsetter': {
      const { data: markets } = await supabaseAdmin
        .from('markets')
        .select('participant_count')
        .eq('creator_id', userId)
        .eq('source', 'community');
      return markets?.some(m => m.participant_count >= 50) || false;
    }

    case 'ranked_up': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('rank')
        .eq('id', userId)
        .single();
      const rankedRanks = ['Analyst', 'Strategist', 'Forecaster', 'Visionary', 'Prophet', 'Omniscient'];
      return rankedRanks.includes(user?.rank);
    }

    case 'rising_star': {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('rank')
        .eq('id', userId)
        .single();
      const risingRanks = ['Strategist', 'Forecaster', 'Visionary', 'Prophet', 'Omniscient'];
      return risingRanks.includes(user?.rank);
    }

    case 'seasoned_trader': {
      const { count } = await supabaseAdmin
        .from('seasonal_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 3;
    }

    default:
      return false;
  }
}
