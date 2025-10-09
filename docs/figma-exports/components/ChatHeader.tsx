import { LayoutGrid, Settings } from 'lucide-react';

export function ChatHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] z-50" style={{ backgroundColor: '#0F0E0E' }}>
      {/* Border */}
      <div className="absolute inset-x-0 bottom-0 h-px opacity-10" style={{ backgroundColor: '#E2E8DD' }}></div>
      
      {/* Content */}
      <div className="relative h-full max-w-[1600px] mx-auto px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#DB4C40' }}>
            <span style={{ color: '#E2E8DD' }}>R</span>
          </div>
          <h1 className="tracking-tight" style={{ color: '#E2E8DD' }}>RADAR</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="w-10 h-10 rounded-lg hover:opacity-80 flex items-center justify-center transition-opacity duration-200"
            style={{ backgroundColor: 'transparent' }}
            aria-label="Dashboard"
          >
            <LayoutGrid className="w-5 h-5" style={{ color: '#E2E8DD' }} />
          </button>
          <button 
            className="w-10 h-10 rounded-lg hover:opacity-80 flex items-center justify-center transition-opacity duration-200"
            style={{ backgroundColor: 'transparent' }}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" style={{ color: '#E2E8DD' }} />
          </button>
        </div>
      </div>
    </header>
  );
}
