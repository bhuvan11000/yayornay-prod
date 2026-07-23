import styles from './Auth.module.css';

/**
 * Auth — Login / Sign Up page.
 * Uses Supabase Auth UI with email, Google, and GitHub options.
 */
export default function Auth() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className="text-2xl font-heading">Predict Arena</h1>
        <p className={styles.subtitle}>Predict the future. Climb the ranks.</p>

        {/* TODO: Integrate Supabase Auth UI */}
        <div className={styles.placeholder}>
          <p className="text-muted">Authentication UI — coming soon</p>
        </div>
      </div>
    </div>
  );
}
