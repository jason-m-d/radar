import { useState } from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';

type Theme = 'dark' | 'light' | 'auto';
type Density = 'compact' | 'comfortable' | 'spacious';

export function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [density, setDensity] = useState<Density>('comfortable');

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6" style={{ paddingTop: '24px' }}>
        <h1 className="text-2xl" style={{ color: '#E2E8DD', fontWeight: 600 }}>Appearance</h1>
      </div>

      {/* Theme Card */}
      <div 
        className="rounded-xl p-6 mb-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 600 }}>Theme</h2>
        
        <div className="flex gap-3">
          {/* Dark Theme */}
          <button
            onClick={() => setTheme('dark')}
            className="flex-1 flex flex-col items-center gap-2 transition-all"
          >
            <div 
              className="w-full rounded-lg overflow-hidden transition-all"
              style={{
                border: theme === 'dark' ? '2px solid #DB4C40' : '2px solid transparent',
                boxShadow: theme === 'dark' ? '0 0 12px rgba(219, 76, 64, 0.3)' : 'none',
              }}
            >
              <div 
                className="w-full h-16 flex items-center justify-center"
                style={{ backgroundColor: '#161616' }}
              >
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#1E1E1E' }} />
                  <div className="w-12 h-6 rounded" style={{ backgroundColor: '#DB4C40' }} />
                </div>
              </div>
            </div>
            <span 
              className="text-sm transition-opacity"
              style={{ 
                color: '#E2E8DD',
                opacity: theme === 'dark' ? 1 : 0.6,
              }}
            >
              Dark
            </span>
          </button>

          {/* Light Theme */}
          <button
            onClick={() => setTheme('light')}
            className="flex-1 flex flex-col items-center gap-2 transition-all"
          >
            <div 
              className="w-full rounded-lg overflow-hidden transition-all"
              style={{
                border: theme === 'light' ? '2px solid #DB4C40' : '2px solid transparent',
                boxShadow: theme === 'light' ? '0 0 12px rgba(219, 76, 64, 0.3)' : 'none',
              }}
            >
              <div 
                className="w-full h-16 flex items-center justify-center"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#F3F3F5' }} />
                  <div className="w-12 h-6 rounded" style={{ backgroundColor: '#DB4C40' }} />
                </div>
              </div>
            </div>
            <span 
              className="text-sm transition-opacity"
              style={{ 
                color: '#E2E8DD',
                opacity: theme === 'light' ? 1 : 0.6,
              }}
            >
              Light
            </span>
          </button>

          {/* Auto Theme */}
          <button
            onClick={() => setTheme('auto')}
            className="flex-1 flex flex-col items-center gap-2 transition-all"
          >
            <div 
              className="w-full rounded-lg overflow-hidden transition-all"
              style={{
                border: theme === 'auto' ? '2px solid #DB4C40' : '2px solid transparent',
                boxShadow: theme === 'auto' ? '0 0 12px rgba(219, 76, 64, 0.3)' : 'none',
              }}
            >
              <div className="w-full h-16 flex">
                <div 
                  className="w-1/2 flex items-center justify-center"
                  style={{ backgroundColor: '#161616' }}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1E1E1E' }} />
                </div>
                <div 
                  className="w-1/2 flex items-center justify-center"
                  style={{ backgroundColor: '#FFFFFF' }}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F3F3F5' }} />
                </div>
              </div>
            </div>
            <span 
              className="text-sm transition-opacity"
              style={{ 
                color: '#E2E8DD',
                opacity: theme === 'auto' ? 1 : 0.6,
              }}
            >
              Auto
            </span>
          </button>
        </div>
      </div>

      {/* Density Card */}
      <div 
        className="rounded-xl p-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 600 }}>Density</h2>
        
        <div className="space-y-3 mb-4">
          {/* Compact */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: density === 'compact' ? '#DB4C40' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: density === 'compact' ? '#DB4C40' : 'transparent',
              }}
            >
              {density === 'compact' && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E2E8DD' }} />
              )}
            </div>
            <input
              type="radio"
              name="density"
              value="compact"
              checked={density === 'compact'}
              onChange={(e) => setDensity(e.target.value as Density)}
              className="sr-only"
            />
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Compact</span>
          </label>

          {/* Comfortable */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: density === 'comfortable' ? '#DB4C40' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: density === 'comfortable' ? '#DB4C40' : 'transparent',
              }}
            >
              {density === 'comfortable' && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E2E8DD' }} />
              )}
            </div>
            <input
              type="radio"
              name="density"
              value="comfortable"
              checked={density === 'comfortable'}
              onChange={(e) => setDensity(e.target.value as Density)}
              className="sr-only"
            />
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Comfortable</span>
          </label>

          {/* Spacious */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: density === 'spacious' ? '#DB4C40' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: density === 'spacious' ? '#DB4C40' : 'transparent',
              }}
            >
              {density === 'spacious' && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E2E8DD' }} />
              )}
            </div>
            <input
              type="radio"
              name="density"
              value="spacious"
              checked={density === 'spacious'}
              onChange={(e) => setDensity(e.target.value as Density)}
              className="sr-only"
            />
            <span className="text-sm" style={{ color: '#E2E8DD' }}>Spacious</span>
          </label>
        </div>

        <p className="text-sm" style={{ color: '#E2E8DD', opacity: 0.6 }}>
          Affects spacing and font sizes throughout the app
        </p>
      </div>
    </div>
  );
}