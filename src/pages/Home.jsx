import styles from './Home.module.css';

/**
 * Home — Main dashboard page.
 * Shows daily reward banner, season info, trending markets, active quests.
 */
export default function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <h1 className="text-2xl font-heading">Dashboard</h1>
      </div>

      {/* TODO: Daily reward banner */}
      <div className="card">
        <p className="text-secondary">Daily reward status — coming soon</p>
      </div>

      {/* TODO: Season info */}
      <div className="card">
        <p className="text-secondary">Season progress — coming soon</p>
      </div>

      {/* TODO: Trending markets */}
      <section className={styles.section}>
        <h2 className="text-xl font-heading">Trending Markets</h2>
        <p className="text-muted">Market cards will appear here</p>
      </section>

      {/* TODO: Active quests */}
      <section className={styles.section}>
        <h2 className="text-xl font-heading">Active Quests</h2>
        <p className="text-muted">Quest progress will appear here</p>
      </section>
    </div>
  );
}
