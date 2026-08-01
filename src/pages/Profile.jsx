import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Coins, Target, BarChart3, TrendingUp, Calendar, Flame, Award, Medal, User, CheckCircle, XCircle, Minus } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useAuthStore } from '../stores/authStore';
import { RankBadge } from '../components/gamification/RankBadge';
import { AchievementCard } from '../components/gamification/AchievementCard';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import CountUp from '../components/reactbits/CountUp/CountUp';
import { formatCoins, formatDate, formatPercent } from '../lib/format';
import { getRankColor } from '../lib/ranks';
import styles from './Profile.module.css';

const TABS = [
  { id: 'predictions', label: 'Predictions' },
  { id: 'achievements', label: 'Achievements' },
];

export default function Profile() {
  const { username } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useProfile(username);
  const [activeTab, setActiveTab] = useState('predictions');

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.headerSkeleton}>
          <div className={styles.skeletonRow}>
            <Skeleton variant="circle" width="72px" height="72px" />
            <div className={styles.skeletonInfo}>
              <Skeleton variant="text" width="160px" height="24px" />
              <Skeleton variant="text" width="120px" height="16px" />
              <Skeleton variant="text" width="100px" height="12px" />
            </div>
          </div>
        </div>
        <div className={styles.statsGrid}>
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
      <div className={styles.page}>
        <div className={styles.notFound}>
          <User size={48} className={styles.notFoundIcon} />
          <h1 className="text-2xl font-heading">Player Not Found</h1>
          <p className="text-muted">No player with the username "{username}" exists.</p>
          <Link to="/" className={styles.homeLink}>Go Home</Link>
        </div>
      </div>
    );
  }

  const { user: profile, predictions, achievements, badges } = data;
  const rankColor = getRankColor(profile.rank);
  const isOwn = currentUser?.username === username;
  const avatarLetter = (profile.username || '?').charAt(0).toUpperCase();
  const accuracy = profile.total_predictions > 0
    ? (profile.correct_predictions / profile.total_predictions)
    : 0;

  return (
    <div className={styles.page}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar} style={{ background: rankColor }}>
            {avatarLetter}
          </div>
          <div className={styles.nameSection}>
            <h1 className={styles.username}>{profile.username}</h1>
            <div className={styles.rankRow}>
              <RankBadge rank={profile.rank} size="lg" showLabel />
              <span className={styles.level}>Lvl {profile.level || 1}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Calendar size={12} />
                Joined {formatDate(profile.created_at)}
              </span>
              {profile.betting_streak > 0 && (
                <span className={styles.metaItem}>
                  <Flame size={12} className={styles.streakIcon} />
                  {profile.betting_streak}-day streak
                </span>
              )}
            </div>
            {badges && badges.length > 0 && (
              <div className={styles.badgesRow}>
                {badges.map((badge) => (
                  <div key={badge.id} className={styles.badge} title={`Season ${badge.season_number} — ${badge.badge_type}`}>
                    <Medal size={16} />
                    <span>S{badge.season_number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Coins size={18} className={styles.coinIcon} />
            <CountUp to={profile.coins || 0} from={0} duration={0.8} separator="," className={styles.statValue} />
            <span className={styles.statLabel}>Coins</span>
          </div>
          <div className={styles.statCard}>
            <Target size={18} className={styles.targetIcon} />
            <CountUp to={Math.round(accuracy * 100)} from={0} duration={0.8} className={styles.statValue} />
            <span className={styles.statLabel}>Accuracy %</span>
          </div>
          <div className={styles.statCard}>
            <BarChart3 size={18} className={styles.chartIcon} />
            <CountUp to={profile.total_predictions || 0} from={0} duration={0.8} className={styles.statValue} />
            <span className={styles.statLabel}>Total Predictions</span>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={18} className={profile.net_profit >= 0 ? styles.profitIcon : styles.lossIcon} />
            <span className={`${styles.statValue} ${profile.net_profit >= 0 ? styles.textGreen : styles.textRed}`}>
              {(profile.net_profit >= 0 ? '+' : '')}{formatCoins(profile.net_profit || 0)}
            </span>
            <span className={styles.statLabel}>Net Profit</span>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'predictions' && (
        <div className={styles.section}>
          {predictions && predictions.length > 0 ? (
            <div className={styles.predictionsList}>
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
                    className={styles.predictionRow}
                  >
                    <div className={styles.predictionLeft}>
                      <div className={styles.predictionMarket}>
                        <span className={styles.predictionTitle}>{marketTitle}</span>
                        <div className={styles.predictionMeta}>
                          <span className={styles.predictionPosition}>
                            {p.position === 'yes' ? 'YES' : 'NO'}
                          </span>
                          {p.entry_price != null && (
                            <span className={styles.predictionPrice}>@ {p.entry_price.toFixed(3)}</span>
                          )}
                          {p.shares != null && (
                            <span className={styles.predictionShares}>{p.shares.toFixed(1)} shares</span>
                          )}
                          {'  '}
                          {p.coins_spent != null && (
                            <span className={styles.predictionCost}>{formatCoins(p.coins_spent)} coins</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.predictionRight}>
                      {isWin && (
                        <span className={styles.resultWon}>
                          <CheckCircle size={14} />
                          Won +{formatCoins(profit)}
                        </span>
                      )}
                      {isLoss && (
                        <span className={styles.resultLost}>
                          <XCircle size={14} />
                          Lost -{formatCoins(p.coins_spent)}
                        </span>
                      )}
                      {isPending && (
                        <span className={styles.resultPending}>
                          <Minus size={14} />
                          Pending
                        </span>
                      )}
                      {isSold && (
                        <span className={styles.resultSold}>
                          Sold
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className="text-muted">No predictions yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className={styles.section}>
          {achievements && achievements.length > 0 ? (
            <div className={styles.achievementGrid}>
              {achievements.map((ach) => (
                <AchievementCard
                  key={ach.slug || ach.id}
                  achievement={{ ...ach, unlocked: true, unlocked_at: ach.unlocked_at }}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Award size={24} className={styles.emptyIcon} />
              <p className="text-muted">No achievements unlocked yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
