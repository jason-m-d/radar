import { useState } from 'react';
import { Search, Upload, ArrowUpDown, Trash2 } from 'lucide-react';

interface SignalRule {
  id: string;
  type: string;
  pattern: string;
  action: string;
  unlessContains: string | null;
  notes: string;
  confidence: number;
  createdAt: string;
}

const mockRules: SignalRule[] = [
  {
    id: '1',
    type: 'DOMAIN',
    pattern: 'alohaenterprise.com',
    action: 'SUPPRESS',
    unlessContains: 'urgent',
    notes: 'Daily reports',
    confidence: 0.7,
    createdAt: '2025-09-30',
  },
  {
    id: '2',
    type: 'TOPIC',
    pattern: 'vendor',
    action: 'SUPPRESS',
    unlessContains: 'vendor',
    notes: 'Skip duplicate...',
    confidence: 0.6,
    createdAt: '2025-09-30',
  },
  {
    id: '3',
    type: 'TOPIC',
    pattern: 'smart kitchen',
    action: 'VIP',
    unlessContains: null,
    notes: '',
    confidence: 0.6,
    createdAt: '2025-09-30',
  },
  {
    id: '4',
    type: 'DOMAIN',
    pattern: 'mailchimp.com',
    action: 'SUPPRESS',
    unlessContains: null,
    notes: '',
    confidence: 0.9,
    createdAt: '2025-09-19',
  },
  {
    id: '5',
    type: 'EMAIL',
    pattern: 'noreply@',
    action: 'SUPPRESS',
    unlessContains: null,
    notes: '',
    confidence: 0.9,
    createdAt: '2025-09-19',
  },
];

type SortField = 'type' | 'pattern' | 'action' | 'unlessContains' | 'notes' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

export function SignalRulesSettings() {
  const [rules, setRules] = useState<SignalRule[]>(mockRules);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [ruleInput, setRuleInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRules(new Set(rules.map(r => r.id)));
    } else {
      setSelectedRules(new Set());
    }
  };

  const handleSelectRule = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRules);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRules(newSelected);
  };

  const handleDeleteSelected = () => {
    setRules(rules.filter(r => !selectedRules.has(r.id)));
    setSelectedRules(new Set());
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleParseRule = () => {
    if (ruleInput.trim()) {
      // In a real app, this would parse the natural language rule
      console.log('Parsing rule:', ruleInput);
      setRuleInput('');
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = searchQuery === '' || 
      rule.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || rule.type === typeFilter;
    const matchesAction = actionFilter === 'all' || rule.action === actionFilter;
    return matchesSearch && matchesType && matchesAction;
  });

  const sortedRules = sortField && sortDirection
    ? [...filteredRules].sort((a, b) => {
        const aVal = a[sortField] ?? '';
        const bVal = b[sortField] ?? '';
        const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? compare : -compare;
      })
    : filteredRules;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6" style={{ paddingTop: '24px' }}>
        <h1 className="text-2xl mb-2" style={{ color: '#E2E8DD', fontWeight: 600 }}>Signal Rules</h1>
        <p className="text-sm" style={{ color: '#E2E8DD', opacity: 0.6 }}>
          Type natural language instructions or upload a CSV to manage advanced routing.
        </p>
      </div>

      {/* Top Input Area */}
      <div className="mb-6">
        <input
          type="text"
          value={ruleInput}
          onChange={(e) => setRuleInput(e.target.value)}
          placeholder="e.g. suppress newsletters unless urgent"
          className="w-full px-4 py-4 rounded-lg bg-transparent border focus:outline-none transition-colors"
          style={{
            backgroundColor: '#1E1E1E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#E2E8DD',
            height: '60px',
          }}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={handleParseRule}
            className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{
              backgroundColor: '#DB4C40',
              color: '#E2E8DD',
            }}
          >
            Parse rule
          </button>
          <button
            className="px-4 py-2 rounded-lg transition-all hover:bg-white/10 flex items-center gap-2"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E2E8DD',
            }}
          >
            <Upload className="w-4 h-4" />
            UPLOAD CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-4">
        {/* Search Bar */}
        <div className="relative" style={{ width: '300px' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-transparent border focus:outline-none text-sm"
            style={{
              backgroundColor: '#1E1E1E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#E2E8DD',
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-transparent border focus:outline-none text-sm"
            style={{
              backgroundColor: '#1E1E1E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#E2E8DD',
            }}
          >
            <option value="all">Type: All</option>
            <option value="DOMAIN">DOMAIN</option>
            <option value="TOPIC">TOPIC</option>
            <option value="EMAIL">EMAIL</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-transparent border focus:outline-none text-sm"
            style={{
              backgroundColor: '#1E1E1E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#E2E8DD',
            }}
          >
            <option value="all">Action: All</option>
            <option value="SUPPRESS">SUPPRESS</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
      </div>

      {/* Selected Action Bar */}
      {selectedRules.size > 0 && (
        <div 
          className="flex items-center justify-between px-4 py-3 rounded-lg mb-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            animation: 'fadeIn 150ms ease-in',
          }}
        >
          <span className="text-sm" style={{ color: '#E2E8DD', opacity: 0.7 }}>
            {selectedRules.size} selected
          </span>
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 rounded-lg transition-all hover:opacity-80 flex items-center gap-2 text-sm"
            style={{
              backgroundColor: 'rgba(219, 76, 64, 0.15)',
              color: '#DB4C40',
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Spreadsheet Table */}
      <div 
        className="rounded-lg overflow-hidden"
        style={{
          border: '1px solid #333',
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#1E1E1E' }}>
              <th className="p-3" style={{ width: '40px', borderRight: '1px solid #333' }}>
                <input
                  type="checkbox"
                  checked={selectedRules.size === rules.length && rules.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th 
                className="p-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
                style={{ borderRight: '1px solid #333', color: '#E2E8DD', fontWeight: 600, fontSize: '13px' }}
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  type
                  <ArrowUpDown className="w-3 h-3" style={{ opacity: sortField === 'type' ? 1 : 0.3 }} />
                </div>
              </th>
              <th 
                className="p-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
                style={{ borderRight: '1px solid #333', color: '#E2E8DD', fontWeight: 600, fontSize: '13px' }}
                onClick={() => handleSort('pattern')}
              >
                <div className="flex items-center gap-2">
                  pattern
                  <ArrowUpDown className="w-3 h-3" style={{ opacity: sortField === 'pattern' ? 1 : 0.3 }} />
                </div>
              </th>
              <th 
                className="p-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
                style={{ borderRight: '1px solid #333', color: '#E2E8DD', fontWeight: 600, fontSize: '13px' }}
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center gap-2">
                  action
                  <ArrowUpDown className="w-3 h-3" style={{ opacity: sortField === 'action' ? 1 : 0.3 }} />
                </div>
              </th>
              <th 
                className="p-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
                style={{ borderRight: '1px solid #333', color: '#E2E8DD', fontWeight: 600, fontSize: '13px' }}
                onClick={() => handleSort('unlessContains')}
              >
                <div className="flex items-center gap-2">
                  unlessContains
                  <ArrowUpDown className="w-3 h-3" style={{ opacity: sortField === 'unlessContains' ? 1 : 0.3 }} />
                </div>
              </th>
              <th 
                className="p-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
                style={{ borderRight: '1px solid #333', color: '#E2E8DD', fontWeight: 600, fontSize: '13px' }}
                onClick={() => handleSort('notes')}
              >
                <div className="flex items-center gap-2">
                  notes
                  <ArrowUpDown className="w-3 h-3" style={{ opacity: sortField === 'notes' ? 1 : 0.3 }} />
                </div>
              </th>
              <th 
                className="p-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
                style={{ color: '#E2E8DD', fontWeight: 600, fontSize: '13px' }}
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  createdAt
                  <ArrowUpDown className="w-3 h-3" style={{ opacity: sortField === 'createdAt' ? 1 : 0.3 }} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRules.map((rule, index) => (
              <tr
                key={rule.id}
                className="hover:brightness-110 transition-all cursor-pointer"
                style={{
                  backgroundColor: index % 2 === 0 ? '#161616' : '#181818',
                  borderTop: '1px solid #333',
                }}
              >
                <td className="p-3" style={{ borderRight: '1px solid #333' }}>
                  <input
                    type="checkbox"
                    checked={selectedRules.has(rule.id)}
                    onChange={(e) => handleSelectRule(rule.id, e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td 
                  className="p-3 text-sm"
                  style={{ borderRight: '1px solid #333', color: '#E2E8DD' }}
                >
                  {rule.type}
                </td>
                <td 
                  className="p-3 text-sm"
                  style={{ borderRight: '1px solid #333', color: '#E2E8DD', fontFamily: 'monospace' }}
                >
                  {rule.pattern}
                </td>
                <td 
                  className="p-3 text-sm"
                  style={{ borderRight: '1px solid #333', color: '#E2E8DD' }}
                >
                  {rule.action}
                </td>
                <td 
                  className="p-3 text-sm"
                  style={{ borderRight: '1px solid #333', color: '#E2E8DD', fontFamily: 'monospace', opacity: rule.unlessContains ? 1 : 0.3 }}
                >
                  {rule.unlessContains || 'null'}
                </td>
                <td 
                  className="p-3 text-sm"
                  style={{ borderRight: '1px solid #333', color: '#E2E8DD' }}
                >
                  {rule.notes}
                </td>
                <td 
                  className="p-3 text-sm"
                  style={{ color: '#E2E8DD', opacity: 0.7 }}
                >
                  {rule.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm" style={{ color: '#E2E8DD', opacity: 0.6 }}>
          Showing 1-{sortedRules.length} of 247
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg transition-all hover:bg-white/5 text-sm"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E2E8DD',
            }}
          >
            Previous
          </button>
          <button
            className="px-3 py-1.5 rounded-lg transition-all hover:bg-white/5 text-sm"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E2E8DD',
            }}
          >
            Next
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}