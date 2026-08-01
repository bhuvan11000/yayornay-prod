import styles from './Tabs.module.css';

/**
 * Tabs — Horizontal tab navigation.
 *
 * @param {object} props
 * @param {Array<{id: string, label: string}>} props.tabs
 * @param {string} props.activeTab - Currently active tab ID
 * @param {function} props.onChange - Called with tab ID on click
 */
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
