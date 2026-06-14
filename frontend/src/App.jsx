import React, { useState } from 'react';
import { LayoutGrid, ClipboardCheck, ShieldCheck, Flame, RefreshCw, BarChart2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import IncidentForm from './components/IncidentForm';

// Define backend API endpoint dynamically
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerDashboardRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Sleek top header */}
      <header className="glass-panel" style={{
        margin: '16px',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        borderRadius: '14px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #d946ef 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={20} color="var(--text-main)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              CrispyBites Ops
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Incident Reporting Center
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent',
              color: 'var(--text-main)',
              border: activeTab === 'dashboard' ? 'none' : '1px solid var(--border-color)',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <LayoutGrid size={16} />
            Manager Dashboard
          </button>
          <button
            onClick={() => setActiveTab('report')}
            style={{
              background: activeTab === 'report' ? 'var(--primary)' : 'transparent',
              color: 'var(--text-main)',
              border: activeTab === 'report' ? 'none' : '1px solid var(--border-color)',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <ClipboardCheck size={16} />
            File New Report
          </button>
        </nav>
      </header>

      {/* Main panel container */}
      <main className="main-content-area">
        {activeTab === 'dashboard' ? (
          <Dashboard 
            key={refreshTrigger} 
            backendUrl={BACKEND_URL} 
          />
        ) : (
          <div style={{ overflowY: 'auto', height: '100%', padding: '4px' }}>
            <IncidentForm 
              backendUrl={BACKEND_URL} 
              onSubmitSuccess={() => {
                triggerDashboardRefresh();
                // Switch automatically back to dashboard
                setTimeout(() => {
                  setActiveTab('dashboard');
                }, 1000);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
