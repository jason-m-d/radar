import { Camera, Pencil, Mail, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function AccountSettings() {
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6" style={{ paddingTop: '24px' }}>
        <h1 className="text-2xl" style={{ color: '#E2E8DD', fontWeight: 600 }}>Account</h1>
      </div>

      {/* User Profile Card */}
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
        {/* Noise texture overlay */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
            pointerEvents: 'none',
            borderRadius: '12px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative group">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#DB4C40' }}
            >
              <span className="text-2xl" style={{ color: '#E2E8DD' }}>JM</span>
            </div>
            <button 
              className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
              aria-label="Change avatar"
            >
              <Camera className="w-5 h-5" style={{ color: '#E2E8DD' }} />
            </button>
          </div>

          {/* Name and Email */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 group">
              {isEditingName ? (
                <input
                  type="text"
                  defaultValue="Jason Miller"
                  className="bg-transparent border-none focus:outline-none text-lg"
                  style={{ color: '#E2E8DD', fontWeight: 500 }}
                  onBlur={() => setIsEditingName(false)}
                  autoFocus
                />
              ) : (
                <>
                  <h2 className="text-lg" style={{ color: '#E2E8DD', fontWeight: 500 }}>Jason Miller</h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Edit name"
                  >
                    <Pencil className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm mb-4" style={{ color: '#E2E8DD', opacity: 0.7 }}>jason@hungry.llc</p>
            
            <button 
              className="px-4 py-2 rounded-lg transition-all hover:bg-white/10"
              style={{ 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8DD',
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Connected Accounts Card */}
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
        {/* Noise texture overlay */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
            pointerEvents: 'none',
            borderRadius: '12px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 500 }}>Connected Accounts</h2>
        
        <div className="space-y-4">
          {/* Gmail */}
          <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(219, 76, 64, 0.15)' }}
              >
                <Mail className="w-5 h-5" style={{ color: '#DB4C40' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 500 }}>Gmail</span>
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(99, 105, 64, 0.3)' }}
                  >
                    <CheckCircle className="w-3 h-3" style={{ color: '#636940' }} />
                    <span className="text-xs" style={{ color: '#636940' }}>Connected</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>Last sync: 2 minutes ago</p>
              </div>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
              style={{ 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8DD',
                fontSize: '13px',
              }}
            >
              Reconnect
            </button>
          </div>

          {/* Google Drive */}
          <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(233, 138, 21, 0.15)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#E98A15" opacity="0.6"/>
                  <path d="M2 17L12 22L22 17" stroke="#E98A15" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 500 }}>Google Drive</span>
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(99, 105, 64, 0.3)' }}
                  >
                    <CheckCircle className="w-3 h-3" style={{ color: '#636940' }} />
                    <span className="text-xs" style={{ color: '#636940' }}>Connected</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>Last sync: 5 minutes ago</p>
              </div>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
              style={{ 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8DD',
                fontSize: '13px',
              }}
            >
              Reconnect
            </button>
          </div>

          {/* Calendar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(226, 232, 221, 0.1)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#E2E8DD" strokeWidth="2" opacity="0.6"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="#E2E8DD" strokeWidth="2" opacity="0.6"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 500 }}>Calendar</span>
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(99, 105, 64, 0.3)' }}
                  >
                    <CheckCircle className="w-3 h-3" style={{ color: '#636940' }} />
                    <span className="text-xs" style={{ color: '#636940' }}>Connected</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>Last sync: 1 minute ago</p>
              </div>
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
              style={{ 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8DD',
                fontSize: '13px',
              }}
            >
              Reconnect
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}