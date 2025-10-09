import { useState } from 'react';
import { Switch } from './ui/switch';

type DeliveryMethod = 'in-app' | 'email' | 'both';

export function NotificationsSettings() {
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [badgeCount, setBadgeCount] = useState(false);
  const [quietHoursFrom, setQuietHoursFrom] = useState('21:00');
  const [quietHoursTo, setQuietHoursTo] = useState('07:00');
  const [pauseDuringQuietHours, setPauseDuringQuietHours] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('in-app');

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6" style={{ paddingTop: '24px' }}>
        <h1 className="text-2xl" style={{ color: '#E2E8DD', fontWeight: 600 }}>Notifications</h1>
      </div>

      {/* Ping Preferences Card */}
      <div 
        className="rounded-xl p-6 mb-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 600 }}>Ping Preferences</h2>
        
        <div className="space-y-3">
          {/* Desktop notifications */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Desktop notifications</span>
            <Switch 
              checked={desktopNotifications} 
              onCheckedChange={setDesktopNotifications}
            />
          </div>

          {/* Sound alerts */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Sound alerts</span>
            <Switch 
              checked={soundAlerts} 
              onCheckedChange={setSoundAlerts}
            />
          </div>

          {/* Badge count */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Badge count</span>
            <Switch 
              checked={badgeCount} 
              onCheckedChange={setBadgeCount}
            />
          </div>
        </div>
      </div>

      {/* Quiet Hours Card */}
      <div 
        className="rounded-xl p-6 mb-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 600 }}>Quiet Hours</h2>
        
        {/* Time Pickers */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm" style={{ color: '#E2E8DD', opacity: 0.7 }}>From</label>
            <input
              type="time"
              value={quietHoursFrom}
              onChange={(e) => setQuietHoursFrom(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-transparent border focus:outline-none text-sm"
              style={{
                backgroundColor: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E2E8DD',
              }}
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm" style={{ color: '#E2E8DD', opacity: 0.7 }}>To</label>
            <input
              type="time"
              value={quietHoursTo}
              onChange={(e) => setQuietHoursTo(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-transparent border focus:outline-none text-sm"
              style={{
                backgroundColor: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E2E8DD',
              }}
            />
          </div>
        </div>

        {/* Pause toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#E2E8DD' }}>Pause all pings during quiet hours</span>
          <Switch 
            checked={pauseDuringQuietHours} 
            onCheckedChange={setPauseDuringQuietHours}
          />
        </div>
      </div>

      {/* Delivery Method Card */}
      <div 
        className="rounded-xl p-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 600 }}>Delivery Method</h2>
        
        <div className="space-y-3">
          {/* In-app only */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: deliveryMethod === 'in-app' ? '#DB4C40' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: deliveryMethod === 'in-app' ? '#DB4C40' : 'transparent',
              }}
            >
              {deliveryMethod === 'in-app' && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E2E8DD' }} />
              )}
            </div>
            <input
              type="radio"
              name="delivery"
              value="in-app"
              checked={deliveryMethod === 'in-app'}
              onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
              className="sr-only"
            />
            <span className="text-sm" style={{ color: '#E2E8DD' }}>In-app only</span>
          </label>

          {/* Email summaries */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: deliveryMethod === 'email' ? '#DB4C40' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: deliveryMethod === 'email' ? '#DB4C40' : 'transparent',
              }}
            >
              {deliveryMethod === 'email' && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E2E8DD' }} />
              )}
            </div>
            <input
              type="radio"
              name="delivery"
              value="email"
              checked={deliveryMethod === 'email'}
              onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
              className="sr-only"
            />
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Email summaries</span>
          </label>

          {/* Both */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: deliveryMethod === 'both' ? '#DB4C40' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: deliveryMethod === 'both' ? '#DB4C40' : 'transparent',
              }}
            >
              {deliveryMethod === 'both' && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E2E8DD' }} />
              )}
            </div>
            <input
              type="radio"
              name="delivery"
              value="both"
              checked={deliveryMethod === 'both'}
              onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
              className="sr-only"
            />
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Both</span>
          </label>
        </div>
      </div>
    </div>
  );
}