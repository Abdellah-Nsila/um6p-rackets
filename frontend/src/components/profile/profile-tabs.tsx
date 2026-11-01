export type ProfileTabType = 'statistics' | 'history';

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
}

export default function ProfileTabs({
  activeTab,
  onTabChange,
}: ProfileTabsProps) {
  const tabs: { id: ProfileTabType; label: string }[] = [
    { id: 'history', label: 'Match History' },
  ];

  return (
    <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border border-border/80 shadow-2xs w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold italic transition-all cursor-pointer ${
              isActive
                ? 'bg-brand-orange text-white shadow-xs'
                : 'text-muted-foreground hover:text-brand-ink dark:hover:text-white hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}