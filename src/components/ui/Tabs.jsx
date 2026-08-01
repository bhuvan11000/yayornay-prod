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
      <TabsList variant="default" className="h-10 w-full bg-[var(--bg-tertiary)] p-[3px]">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="rounded-md text-sm font-medium text-[var(--text-secondary)] data-active:bg-[var(--bg-secondary)] data-active:text-[var(--text-primary)] data-active:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  );
}
