import { formatPercent } from '../../lib/format';
import styles from './PriceBar.module.css';

export function PriceBar({ yesPrice = 0.5, noPrice = 0.5 }) {
  const yesPct = Math.round(yesPrice * 100);
  const noPct = Math.round(noPrice * 100);

  return (
    <div className={styles.bar}>
      <div className={styles.yes} style={{ width: `${yesPct}%` }}>
        <span className={styles.label}>YES {yesPct}%</span>
      </div>
      <div className={styles.no} style={{ width: `${noPct}%` }}>
        <span className={styles.label}>NO {noPct}%</span>
      </div>
    </div>
  );
}