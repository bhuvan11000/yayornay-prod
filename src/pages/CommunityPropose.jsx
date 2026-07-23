import styles from './CommunityPropose.module.css';

/**
 * CommunityPropose — Form to submit a new community market proposal.
 * Requires minimum level 5 to access.
 */
export default function CommunityPropose() {
  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Propose a Market</h1>
      <p className="text-muted">Submit a new community prediction market — coming soon</p>
    </div>
  );
}
