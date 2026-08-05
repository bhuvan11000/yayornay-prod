import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from './tabs';

/**
 * Tabs — shadcn-backed horizontal tab navigation.
 *
 * @param {object} props
 * @param {Array<{id: string, label: string}>} props.tabs
 * @param {string} props.activeTab - Currently active tab ID
 * @param {function} props.onChange - Called with tab ID on click
 */
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <ShadcnTabs
      value={activeTab}
      onValueChange={(id) => onChange(id)}
      className="group/tabs w-full"
    >
      <TabsList variant="default" className="h-9 w-full rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] p-[3px]">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="rounded-[2px] font-heading text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)] data-active:bg-[var(--bg-secondary)] data-active:text-[var(--accent-amber)] data-active:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  );
}
