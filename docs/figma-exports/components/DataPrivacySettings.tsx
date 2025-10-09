import { useState } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

export function DataPrivacySettings() {
  const [completedTasksRetention, setCompletedTasksRetention] = useState('90');
  const [backBurnerRetention, setBackBurnerRetention] = useState('40');

  const handleExportData = () => {
    // In a real app, this would trigger a data export
    console.log('Exporting data...');
  };

  const handleDeleteAllData = () => {
    // In a real app, this would show a confirmation dialog
    console.log('Delete all data requested');
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6" style={{ paddingTop: '24px' }}>
        <h1 className="text-2xl" style={{ color: '#E2E8DD', fontWeight: 600 }}>Data & Privacy</h1>
      </div>

      {/* Data Retention Card */}
      <div 
        className="rounded-xl p-6 mb-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="text-lg mb-4" style={{ color: '#E2E8DD', fontWeight: 600 }}>Data Retention</h2>
        
        <div className="space-y-4">
          {/* Completed Tasks Retention */}
          <div className="flex items-center gap-3">
            <label className="text-sm flex-shrink-0" style={{ color: '#E2E8DD', width: '200px' }}>
              Keep completed tasks for:
            </label>
            <select
              value={completedTasksRetention}
              onChange={(e) => setCompletedTasksRetention(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-transparent border focus:outline-none text-sm"
              style={{
                backgroundColor: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E2E8DD',
              }}
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </div>

          {/* Back Burner Retention */}
          <div className="flex items-center gap-3">
            <label className="text-sm flex-shrink-0" style={{ color: '#E2E8DD', width: '200px' }}>
              Keep back burner tasks for:
            </label>
            <select
              value={backBurnerRetention}
              onChange={(e) => setBackBurnerRetention(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-transparent border focus:outline-none text-sm"
              style={{
                backgroundColor: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E2E8DD',
              }}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="40">40 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Data Card */}
      <div 
        className="rounded-xl p-6 mb-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="text-lg mb-2" style={{ color: '#E2E8DD', fontWeight: 600 }}>Export Your Data</h2>
        <p className="text-sm mb-4" style={{ color: '#E2E8DD', opacity: 0.6 }}>
          Download your tasks, projects, and settings as JSON
        </p>
        <button
          onClick={handleExportData}
          className="px-4 py-2 rounded-lg transition-all hover:opacity-90 flex items-center gap-2"
          style={{
            backgroundColor: '#DB4C40',
            color: '#E2E8DD',
          }}
        >
          <Download className="w-4 h-4" />
          Export All Data
        </button>
      </div>

      {/* Delete Data Card */}
      <div 
        className="rounded-xl p-6"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(220, 38, 38, 0.3)',
        }}
      >
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#DC2626' }} />
          <h2 className="text-lg" style={{ color: '#DC2626', fontWeight: 600 }}>Delete All Data</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: '#DC2626', opacity: 0.8 }}>
          Permanently delete all your RADAR data. This cannot be undone.
        </p>
        <button
          onClick={handleDeleteAllData}
          className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
          }}
        >
          Delete All Data
        </button>
      </div>
    </div>
  );
}