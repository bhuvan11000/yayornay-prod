import styles from './Community.module.css';

/**
 * Community — Browse community proposals and approved markets.
 * Has tabs for Live Markets and Pending Proposals.
 */
export default function Community() {
  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Community Markets</h1>
      <p className="text-muted">Browse proposals and community markets — coming soon</p>
    </div>
  );
}
