import styles from './Markets.module.css';

/**
 * Markets — Browse and filter AI-generated markets.
 * Category tabs, status filter, market cards with live prices.
 */
export default function Markets() {
  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Markets</h1>
      <p className="text-muted">Browse prediction markets — coming soon</p>
    </div>
  );
}
