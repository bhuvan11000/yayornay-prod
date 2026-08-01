import { useState, useEffect } from 'react';
import { formatPercent } from '../../lib/format';
import styles from './PriceBar.module.css';

export function PriceBar({ yesPrice = 0.5, noPrice = 0.5 }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const yesPct = Math.round(yesPrice * 100);
  const noPct = Math.round(noPrice * 100);

  return (
    <div className={styles.bar}>
      <div className={styles.yes} style={{ width: mounted ? `${yesPct}%` : '0%' }}>
        <span className={styles.label}>YES {yesPct}%</span>
      </div>
      <div className={styles.no} style={{ width: mounted ? `${noPct}%` : '0%' }}>
        <span className={styles.label}>NO {noPct}%</span>
      </div>
    </div>
  );
}