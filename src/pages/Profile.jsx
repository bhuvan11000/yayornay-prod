import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Coins, Target, BarChart3, TrendingUp, Calendar, Flame, Award, Medal, User, CheckCircle, XCircle, Minus } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useAchievements } from '../hooks/useAchievements';
import { useAuthStore } from '../stores/authStore';
import { RankBadge } from '../components/gamification/RankBadge';
import { AchievementCard } from '../components/gamification/AchievementCard';
import TiltedCard from '../components/reactbits/TiltedCard/TiltedCard';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import CountUp from '../components/reactbits/CountUp/CountUp';
import { formatCoins, formatDate, formatPercent } from '../lib/format';
import { useShouldAnimate } from '../lib/countUpSession';
import { getRankColor } from '../lib/ranks';

const TABS = [
  { id: 'predictions', label: 'Predictions' },
  { id: 'achievements', label: 'Achievements' },
];

export default function Profile() {
  const { username } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useProfile(username);
  const [activeTab, setActiveTab] = useState('predictions');

  const profile = data?.user;
  const profileCoins = profile?.coins ?? 0;
  const profilePredictions = profile?.total_predictions ?? 0;
  const profileAccuracy = Math.round(
    (profilePredictions > 0 ? ((profile?.correct_predictions ?? 0) / profilePredictions) * 100 : 0)
  );
  const coinsAnimate = useShouldAnimate('profile-coins', profileCoins);
  const accuracyAnimate = useShouldAnimate('profile-accuracy', profileAccuracy);
  const predictionsAnimate = useShouldAnimate('profile-predictions', profilePredictions);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" width="72px" height="72px" />
            <div className="flex flex-col gap-2">
              <Skeleton variant="text" width="160px" height="24px" />
              <Skeleton variant="text" width="120px" height="16px" />
              <Skeleton variant="text" width="100px" height="12px" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height="80px" />
          ))}
        </div>
        <Skeleton variant="rect" height="200px" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <User size={48} className="opacity-50 text-[var(--text-muted)]" />
          <h1 className="text-2xl font-heading">Player Not Found</h1>
          <p className="text-muted">No player with the username "{username}" exists.</p>
          <Link to="/" className="mt-2 rounded-[var(--radius-md)] bg-[var(--accent-blue)] px-5 py-3 text-sm font-semibold text-white">Go Home</Link>
        </div>
      </div>
    );
  }

  const { predictions, achievements, badges } = data;
  const rankColor = getRankColor(profile.rank);
  const isOwn = currentUser?.username === username;
  const avatarLetter = (profile.username || '?').charAt(0).toUpperCase();
  const accuracy = profile.total_predictions > 0
    ? (profile.correct_predictions / profile.total_predictions)
    : 0;
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-6 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full font-heading text-2xl font-bold uppercase text-white select-none" style={{ background: rankColor }}>
            {avatarLetter}
          </div>
          <div className="flex flex-col items-center gap-1 md:items-start">
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">{profile.username}</h1>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <RankBadge rank={profile.rank} size="lg" showLabel />
              <span className="font-mono text-sm text-[var(--text-muted)]">Lvl {profile.level || 1}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Calendar size={12} />
                Joined {formatDate(profile.created_at)}
              </span>
              {profile.betting_streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Flame size={12} className="text-[var(--color-warning)]" />
                  {profile.betting_streak}-day streak
                </span>
              )}
            </div>
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {badges.map((badge) => (
                  <TiltedCard
                    key={badge.id}
                    imageSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23f59e0b' stop-opacity='0.5'/%3E%3Cstop offset='1' stop-color='%23a855f7' stop-opacity='0.2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='14' fill='url(%23g)'/%3E%3C/svg%3E"
                    altText={`Season ${badge.season_number} — ${badge.badge_type}`}
                    containerHeight="44px"
                    containerWidth="44px"
                    imageHeight="44px"
                    imageWidth="44px"
                    rotateAmplitude={8}
                    scaleOnHover={1.12}
                    showMobileWarning={false}
                    showTooltip={false}
                    displayOverlayContent
                    overlayContent={
                      <div className="flex h-full w-full cursor-default items-center justify-center">
                        <Medal size={16} className="text-[var(--text-primary)]" />
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] px-2 py-4 text-center">
            <Coins size={18} className="text-[var(--color-warning)]" />
            {coinsAnimate ? (
              <CountUp to={profile.coins || 0} from={0} duration={0.8} separator="," className="font-mono text-xl font-bold text-[var(--text-primary)]" />
            ) : (
              <span className="font-mono text-xl font-bold text-[var(--text-primary)]">{formatCoins(profile.coins || 0)}</span>
            )}
            <span className="text-xs uppercase tracking-[0.05em] text-[var(--text-muted)]">Coins</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] px-2 py-4 text-center">
            <Target size={18} className="text-[var(--color-info)]" />
            {accuracyAnimate ? (
              <CountUp to={Math.round(accuracy * 100)} from={0} duration={0.8} className="font-mono text-xl font-bold text-[var(--text-primary)]" />
            ) : (
              <span className="font-mono text-xl font-bold text-[var(--text-primary)]">{Math.round(accuracy * 100)}</span>
            )}
            <span className="text-xs uppercase tracking-[0.05em] text-[var(--text-muted)]">Accuracy %</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] px-2 py-4 text-center">
            <BarChart3 size={18} className="text-[var(--rank-forecaster)]" />
            {predictionsAnimate ? (
              <CountUp to={profile.total_predictions || 0} from={0} duration={0.8} className="font-mono text-xl font-bold text-[var(--text-primary)]" />
            ) : (
              <span className="font-mono text-xl font-bold text-[var(--text-primary)]">{profile.total_predictions || 0}</span>
            )}
            <span className="text-xs uppercase tracking-[0.05em] text-[var(--text-muted)]">Total Predictions</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] px-2 py-4 text-center">
            <TrendingUp size={18} className={profile.net_profit >= 0 ? 'text-[var(--color-yes)]' : 'text-[var(--color-no)]'} />
            <span className={`font-mono text-xl font-bold ${profile.net_profit >= 0 ? 'text-[var(--color-yes)]' : 'text-[var(--color-no)]'}`}>
              {(profile.net_profit >= 0 ? '+' : '')}{formatCoins(profile.net_profit || 0)}
            </span>
            <span className="text-xs uppercase tracking-[0.05em] text-[var(--text-muted)]">Net Profit</span>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'predictions' && (
        <div className="flex flex-col gap-3">
          {predictions && predictions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {predictions.map((p) => {
                const marketTitle = p.market?.title || 'Unknown Market';
                const isWin = p.result === 'won';
                const isLoss = p.result === 'lost';
                const isPending = p.result === 'pending';
                const isSold = p.result === 'sold';
                const profit = isWin ? (p.payout || 0) - (p.coins_spent || 0) : isLoss ? -(p.coins_spent || 0) : 0;

                return (
                  <Link
                    key={p.id}
                    to={`/markets/${p.market_id}`}
                    className="flex flex-col items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 no-underline transition-colors duration-150 hover:border-[var(--accent-blue)] md:flex-row md:items-center md:gap-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1">
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-[var(--text-primary)]">{marketTitle}</span>
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
                          <span className="font-mono font-semibold uppercase">
                            {p.position === 'yes' ? 'YES' : 'NO'}
                          </span>
                          {p.entry_price != null && (
                            <span className="font-mono">@ {p.entry_price.toFixed(3)}</span>
                          )}
                          {p.shares != null && (
                            <span className="font-mono">{p.shares.toFixed(1)} shares</span>
                          )}
                          {'  '}
                          {p.coins_spent != null && (
                            <span className="font-mono">{formatCoins(p.coins_spent)} coins</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 self-end md:ml-3 md:self-auto">
                      {isWin && (
                        <span className="flex items-center gap-1 whitespace-nowrap font-mono text-sm font-semibold text-[var(--color-yes)]">
                          <CheckCircle size={14} />
                          Won +{formatCoins(profit)}
                        </span>
                      )}
                      {isLoss && (
                        <span className="flex items-center gap-1 whitespace-nowrap font-mono text-sm font-semibold text-[var(--color-no)]">
                          <XCircle size={14} />
                          Lost -{formatCoins(p.coins_spent)}
                        </span>
                      )}
                      {isPending && (
                        <span className="flex items-center gap-1 whitespace-nowrap font-mono text-sm text-[var(--text-muted)]">
                          <Minus size={14} />
                          Pending
                        </span>
                      )}
                      {isSold && (
                        <span className="whitespace-nowrap font-mono text-sm text-[var(--text-muted)]">
                          Sold
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <p className="text-muted">No predictions yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <ProfileAchievements isOwn={isOwn} profileAchievements={achievements} />
      )}
    </div>
  );
}

/**
 * ProfileAchievements — shows all achievements with unlock/lock styling.
 * For own profile: uses useAchievements to get full list with progress.
 * For other users: falls back to profile's unlocked achievements only.
 */
function ProfileAchievements({ isOwn, profileAchievements }) {
  const { data: allAchievements, isLoading } = useAchievements();

  // For own profile, use the full achievements list (with progress for locked ones)
  // For other users, show only their unlocked achievements from the profile endpoint
  const achievementsList = isOwn ? allAchievements : profileAchievements?.map(a => ({ ...a, unlocked: true }));

  if (isLoading && isOwn) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (!achievementsList || achievementsList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-12 text-center">
        <Award size={24} className="opacity-40 text-[var(--text-muted)]" />
        <p className="text-muted">No achievements unlocked yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {achievementsList.map((ach) => (
        <AchievementCard key={ach.slug || ach.id} achievement={ach} />
      ))}
    </div>
  );
}
