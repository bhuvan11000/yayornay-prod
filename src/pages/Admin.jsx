import styles from './Admin.module.css';

/**
 * Admin — Admin review page for flagged/disputed markets.
 * Requires admin email to access (checked in ProtectedRoute).
 */
export default function Admin() {
  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Admin Panel</h1>
      <p className="text-muted">Review flagged/disputed markets — coming soon</p>
    </div>
  );
}
