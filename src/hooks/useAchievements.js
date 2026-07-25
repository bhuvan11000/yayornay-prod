import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

/**
 * Fetch all achievements with unlock status for the current user.
 * Computes progress for locked achievements where measurable.
 */
export function useAchievements() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      const [achRes, userAchRes, userData, catsData, marketsData, badgesData] = await Promise.all([
        supabase.from('achievements').select('*').order('slug', { ascending: true }),
        supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id),
        supabase.from('users').select('total_predictions, betting_streak, accuracy, coins, rank').eq('id', user.id).single(),
        supabase.from('predictions').select('market:market_id(category)').eq('user_id', user.id),
        supabase.from('markets').select('id, participant_count').eq('creator_id', user.id).eq('source', 'community'),
        supabase.from('seasonal_badges').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const allAchievements = achRes.data || [];
      const unlockedMap = {};
      if (userAchRes.data) {
        userAchRes.data.forEach((ua) => { unlockedMap[ua.achievement_id] = ua.unlocked_at; });
      }

      const profile = userData.data || {};
      const categories = new Set((catsData?.data || []).map(c => c.market?.category).filter(Boolean));
      const communityMarkets = marketsData?.data || [];
      const badgeCount = badgesData?.count || 0;

      return allAchievements.map((a) => {
        const unlocked = !!unlockedMap[a.id];
        const progress = unlocked ? null : computeProgress(a.slug, profile, categories, communityMarkets, badgeCount);
        return {
          ...a,
          unlocked,
          unlocked_at: unlockedMap[a.id] || null,
          progress,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

function computeProgress(slug, profile, categories, communityMarkets, badgeCount) {
  switch (slug) {
    case 'first_prediction':
      return { current: Math.min(profile.total_predictions || 0, 1), target: 1, percentage: profile.total_predictions > 0 ? 100 : 0 };
    case 'century':
      return { current: profile.total_predictions || 0, target: 100, percentage: ((profile.total_predictions || 0) / 100) * 100 };
    case 'on_a_roll':
      return { current: Math.min(profile.betting_streak || 0, 3), target: 3, percentage: ((profile.betting_streak || 0) / 3) * 100 };
    case 'hot_streak':
      return { current: Math.min(profile.betting_streak || 0, 7), target: 7, percentage: ((profile.betting_streak || 0) / 7) * 100 };
    case 'unstoppable':
      return { current: Math.min(profile.betting_streak || 0, 15), target: 15, percentage: ((profile.betting_streak || 0) / 15) * 100 };
    case 'iron_will':
      return { current: Math.min(profile.betting_streak || 0, 30), target: 30, percentage: ((profile.betting_streak || 0) / 30) * 100 };
    case 'diversified':
      return { current: categories.size, target: 5, percentage: (categories.size / 5) * 100 };
    case 'whale':
      return { current: Math.min(profile.coins || 0, 10000), target: 10000, percentage: ((profile.coins || 0) / 10000) * 100 };
    case 'sharp_eye':
      return { current: Math.min(profile.total_predictions || 0, 50), target: 50, percentage: ((profile.total_predictions || 0) / 50) * 100 };
    case 'market_maker':
      return { current: Math.min(communityMarkets.filter(m => m.status === 'open').length, 1), target: 1, percentage: communityMarkets.some(m => m.status === 'open') ? 100 : 0 };
    case 'trendsetter':
      return { current: Math.min(communityMarkets.filter(m => m.participant_count >= 50).length, 1), target: 1, percentage: communityMarkets.some(m => m.participant_count >= 50) ? 100 : 0 };
    case 'ranked_up':
      return { current: profile.rank !== 'Unranked' ? 1 : 0, target: 1, percentage: profile.rank !== 'Unranked' ? 100 : 0 };
    case 'rising_star':
      return { current: ['Strategist', 'Forecaster', 'Visionary', 'Prophet', 'Omniscient'].includes(profile.rank) ? 1 : 0, target: 1, percentage: ['Strategist', 'Forecaster', 'Visionary', 'Prophet', 'Omniscient'].includes(profile.rank) ? 100 : 0 };
    case 'seasoned_trader':
      return { current: Math.min(badgeCount, 3), target: 3, percentage: (badgeCount / 3) * 100 };
    default:
      return null;
  }
}
