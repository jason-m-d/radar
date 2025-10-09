import { ArrowLeft, User, Zap, Brain, Bell, Palette, Shield } from 'lucide-react';

type SettingsView = 'account' | 'signal-rules' | 'behavior' | 'notifications' | 'appearance' | 'data-privacy';

interface SettingsSidebarProps {
  activeView: SettingsView;
  onViewChange: (view: SettingsView) => void;
  onClose: () => void;
}

const menuItems = [
  { id: 'account' as SettingsView, label: 'Account', icon: User },
  { id: 'signal-rules' as SettingsView, label: 'Signal Rules', icon: Zap },
  { id: 'behavior' as SettingsView, label: 'Behavior', icon: Brain },
  { id: 'notifications' as SettingsView, label: 'Notifications', icon: Bell },
  { id: 'appearance' as SettingsView, label: 'Appearance', icon: Palette },
  { id: 'data-privacy' as SettingsView, label: 'Data & Privacy', icon: Shield },
];

export function SettingsSidebar({ activeView, onViewChange, onClose }: SettingsSidebarProps) {
  return (
    <div 
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        width: '280px',
        background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(24, 24, 24, 0.8) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
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
      <div style={{ position: 'relative', zIndex: 1 }} className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
          aria-label="Back to chat"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#E2E8DD' }} />
        </button>
        <h1 className="text-2xl" style={{ color: '#E2E8DD', fontWeight: 600 }}>Settings</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all"
                style={{
                  backgroundColor: isActive ? 'rgba(219, 76, 64, 0.15)' : 'transparent',
                  color: isActive ? '#DB4C40' : '#E2E8DD',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="p-4 flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#DB4C40' }}
          >
            <User className="w-5 h-5" style={{ color: '#E2E8DD' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: '#E2E8DD' }}>Jason Miller</p>
            <p className="text-xs truncate" style={{ color: '#E2E8DD', opacity: 0.5 }}>jason@hungry.llc</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}