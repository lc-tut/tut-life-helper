import { useState, useEffect } from 'react';
import { Bus, CalendarDays, Map as MapIcon, UsersRound, Utensils } from 'lucide-react';
import { CampusMap } from './features/map/components/CampusMap';
import { TimetableView } from './features/timetable/components/TimetableView';
import { CafeteriaMenu } from './features/cafeteria/components/CafeteriaMenu';
import { IntroScreen } from './features/intro/components/IntroScreen';
import { BusView } from './features/bus/components/BusView';
import { isRunningAsPwa } from './features/core/utils/pwa';

const tabs = [
  { id: 'map', label: 'マップ', Icon: MapIcon },
  { id: 'timetable', label: '時間割', Icon: CalendarDays },
  { id: 'cafeteria', label: '学食', Icon: Utensils },
  { id: 'bus', label: 'バス', Icon: Bus },
  { id: 'circle', label: '交流', Icon: UsersRound },
];

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [showIntro, setShowIntro] = useState(() => !isRunningAsPwa());

  const activeTabData = tabs.find(tab => tab.id === activeTab) ?? tabs[0];

  useEffect(() => {
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      if (isRunningAsPwa()) {
        setShowIntro(false);
      }
    };

    displayModeQuery.addEventListener('change', handleDisplayModeChange);
    handleDisplayModeChange();

    return () => {
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  if (showIntro) {
    return <IntroScreen onContinue={() => setShowIntro(false)} />;
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        {activeTab === 'map' ? (
          <CampusMap />
        ) : activeTab === 'timetable' ? (
          <TimetableView />
        ) : activeTab === 'cafeteria' ? (
          <CafeteriaMenu />
        ) : activeTab === 'bus' ? (
          <BusView />
        ) : (
          <section className="blank-view" aria-label={activeTabData.label}>
            <h1>{activeTabData.label}</h1>
          </section>
        )}
      </div>

      <nav className="bottom-tabs" aria-label="メインメニュー">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              className={`tab-button${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              aria-label={`${label}を開く`}
              onClick={() => setActiveTab(id)}
            >
              <Icon aria-hidden="true" strokeWidth={isActive ? 2.8 : 2.4} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
