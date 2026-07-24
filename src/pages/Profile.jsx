import { useParams, Link } from 'react-router';
import { Coins, Trophy, Target, TrendingUp, Calendar, Flame, Award } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useAuthStore } from '../stores/authStore';
import { RankBadge } from '../components/gamification/RankBadge';
import { XPBar } from '../components/gamification/XPBar';
import { MarketCard } from '../components/market/MarketCard';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCoins, formatDate, formatXP } from '../lib/format';
import { getRankColor } from '../lib/ranks';
import styles from './Profile.module.css';

export default function Profile() {
  const { username } = useParams();
  const currentUser = useAuthStore(s => s.user);
  const { data, isLoading, isError } = useProfile(username);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton variant="rect" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.page}>
        <h1 className="text-2xl font-heading">Profile Not Found</h1>
        <p className="text-muted">This player does not exist.</p>
      </div>
    );
  }

  const { user: profile, predictions, achievements } = data;
  const rankColor = getRankColor(profile.rank);
  const isOwn = currentUser?.username === username;
  const avatarLetter = (profile.username || '?').charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar} style={{ background: rankColor }}>
            {avatarLetter}
          </div>
          <div className={styles.nameSection}>
            <h1 className={styles.username}>{profile.username}</h1>
            <RankBadge rank={profile.rank} size="lg" showLabel />
            {isOwn && (
              <Link to="/settings" className={styles.editLink}>Edit Profile</Link>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Coins size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{formatCoins(profile.coins)}</span>
            <span className={styles.statLabel}>Coins</span>
          </div>
          <div className={styles.statCard}>
            <Target size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{formatXP(profile.xp)}</span>
            <span className={styles.statLabel}>XP</span>
          </div>
          <div className={styles.statCard}>
            <Trophy size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{profile.accuracy ? `${(profile.accuracy * 100).toFixed(1)}%` : '—'}</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{formatCoins(profile.net_profit || 0)}</span>
            <span className={styles.statLabel}>Net Profit</span>
          </div>
          <div className={styles.statCard}>
            <Flame size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{profile.betting_streak || 0}</span>
            <span className={styles.statLabel}>Streak</span>
          </div>
          <div className={styles.statCard}>
            <Calendar size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{formatDate(profile.created_at)}</span>
            <span className={styles.statLabel}>Joined</span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <h2 className="text-lg font-heading">Progress</h2>
          <XPBar xp={profile.xp} variant="full" />
        </div>
      </div>

      {achievements && achievements.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Award size={18} />
            Achievements
          </h2>
          <div className={styles.achievementGrid}>
            {achievements.map(ach => (
              <div key={ach.id} className={styles.achievementCard}>
                <span className={styles.achievementName}>{ach.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <TrendingUp size={18} />
          Recent Predictions
        </h2>
        {predictions && predictions.length > 0 ? (
          <div className={styles.predictionsList}>
            {predictions.map(p => (
              <div key={p.id} className={styles.predictionRow}>
                <Link to={`/markets/${p.market_id}`} className={styles.predictionMarket}>
                  {p.markets?.title || 'Unknown Market'}
                </Link>
                <span className={`${styles.predictionResult} ${p.result === 'won' ? 'text-yes' : p.result === 'lost' ? 'text-no' : ''}`}>
                  {p.result === 'won' ? `+${formatCoins(p.payout)}` : p.result === 'lost' ? `${formatCoins(p.coins_spent)}` : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">No predictions yet.</p>
        )}
      </section>
    </div>
  );
}