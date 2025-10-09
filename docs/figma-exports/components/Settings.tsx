import { useState } from 'react';
import { SettingsSidebar } from './SettingsSidebar';
import { AccountSettings } from './AccountSettings';
import { SignalRulesSettings } from './SignalRulesSettings';
import { BehaviorSettings } from './BehaviorSettings';
import { NotificationsSettings } from './NotificationsSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { DataPrivacySettings } from './DataPrivacySettings';

type SettingsView = 'account' | 'signal-rules' | 'behavior' | 'notifications' | 'appearance' | 'data-privacy';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [activeView, setActiveView] = useState<SettingsView>('account');

  const renderContent = () => {
    switch (activeView) {
      case 'account':
        return <AccountSettings />;
      case 'signal-rules':
        return <SignalRulesSettings />;
      case 'behavior':
        return <BehaviorSettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'data-privacy':
        return <DataPrivacySettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden dark p-4" 
      style={{ 
        background: 'radial-gradient(circle at center, #0f0f0f 0%, #000000 100%)',
      }}
    >
      <div className="h-full flex gap-4">
        {/* Settings Sidebar */}
        <SettingsSidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          onClose={onClose}
        />

        {/* Main Content Area */}
        <div 
          className="flex-1 overflow-y-auto rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.85) 0%, rgba(16, 16, 16, 0.7) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            position: 'relative',
          }}
        >
          {/* Noise texture overlay */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
              pointerEvents: 'none',
              borderRadius: '12px',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}