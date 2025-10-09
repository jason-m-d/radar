import { useState } from 'react';
import { Switch } from './ui/switch';

type AutonomyLevel = 'conservative' | 'balanced' | 'aggressive';

const autonomyDescriptions = {
  conservative: 'Low inference. RADAR only acts on explicit commands and high-confidence signals.',
  balanced: 'Moderate inference. RADAR acts when confident, asks when uncertain.',
  aggressive: 'High inference. RADAR proactively handles tasks and makes suggestions.',
};

export function BehaviorSettings() {
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('balanced');
  const [signalOnlyMode, setSignalOnlyMode] = useState(false);

  const handleSliderChange = (value: number) => {
    if (value <= 33) {
      setAutonomyLevel('conservative');
    } else if (value <= 66) {
      setAutonomyLevel('balanced');
    } else {
      setAutonomyLevel('aggressive');
    }
  };

  const getSliderValue = () => {
    switch (autonomyLevel) {
      case 'conservative':
        return 0;
      case 'balanced':
        return 50;
      case 'aggressive':
        return 100;
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6" style={{ paddingTop: '24px' }}>
        <h1 className="text-2xl" style={{ color: '#E2E8DD', fontWeight: 600 }}>Behavior</h1>
      </div>

      {/* Autonomy Slider Card */}
      <div 
        className="rounded-xl p-6 mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(35, 35, 35, 0.8) 0%, rgba(22, 22, 22, 0.7) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
          borderRadius: '12px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 600 }}>Autonomy Level</h2>
        
        {/* Slider */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={getSliderValue()}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #DB4C40 0%, #DB4C40 ${getSliderValue()}%, rgba(255, 255, 255, 0.1) ${getSliderValue()}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
          </div>
        </div>

        {/* Position Labels */}
        <div className="flex justify-between mb-4">
          <button
            onClick={() => setAutonomyLevel('conservative')}
            className="text-sm transition-opacity hover:opacity-100"
            style={{ 
              color: '#E2E8DD', 
              opacity: autonomyLevel === 'conservative' ? 1 : 0.5,
            }}
          >
            Conservative
          </button>
          <button
            onClick={() => setAutonomyLevel('balanced')}
            className="text-sm transition-opacity hover:opacity-100"
            style={{ 
              color: '#E2E8DD', 
              opacity: autonomyLevel === 'balanced' ? 1 : 0.5,
            }}
          >
            Balanced
          </button>
          <button
            onClick={() => setAutonomyLevel('aggressive')}
            className="text-sm transition-opacity hover:opacity-100"
            style={{ 
              color: '#E2E8DD', 
              opacity: autonomyLevel === 'aggressive' ? 1 : 0.5,
            }}
          >
            Aggressive
          </button>
        </div>

        {/* Description */}
        <p className="text-sm" style={{ color: '#E2E8DD', opacity: 0.7 }}>
          {autonomyDescriptions[autonomyLevel]}
        </p>
        </div>
      </div>

      {/* Signal-only Mode Card */}
      <div 
        className="rounded-xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(35, 35, 35, 0.8) 0%, rgba(22, 22, 22, 0.7) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
          borderRadius: '12px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg" style={{ color: '#E2E8DD', fontWeight: 600 }}>Signal-only mode</h2>
          <Switch 
            checked={signalOnlyMode} 
            onCheckedChange={setSignalOnlyMode}
          />
        </div>
        <p className="text-sm" style={{ color: '#E2E8DD', opacity: 0.6 }}>
          Only show emails that pass VIP rules
        </p>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #DB4C40;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(219, 76, 64, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #DB4C40;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(219, 76, 64, 0.3);
        }
      `}</style>
    </div>
  );
}