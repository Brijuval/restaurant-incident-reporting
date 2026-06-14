import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, AlertTriangle, AlertCircle, CheckCircle, Clock, 
  MapPin, Calendar, Briefcase, FileText, ChevronRight, X, Sparkles, Send 
} from 'lucide-react';
import styles from './Dashboard.module.css';

const CATEGORIES = ['POS Issue', 'Delivery Delay', 'Inventory', 'Kitchen Equipment', 'Customer Complaint', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];

export default function Dashboard({ backendUrl }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  
  // Manager edit states
  const [managerNotes, setManagerNotes] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch incidents
  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (severity) queryParams.append('severity', severity);
      if (status) queryParams.append('status', status);

      const res = await fetch(`${backendUrl}/api/incidents/?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch incidents');
      
      const data = await res.json();
      setIncidents(data);

      // Keep selected incident details up to date if one is open
      if (selectedIncident) {
        const updated = data.find(inc => inc.id === selectedIncident.id);
        if (updated) {
          setSelectedIncident(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [category, severity, status]); // Refetch automatically on dropdown change

  // Handle manual search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setSeverity('');
    setStatus('');
    // Wait for state updates to execute, or call endpoint directly
    setTimeout(() => fetchIncidents(), 50);
  };

  // Open incident side panel
  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setManagerNotes(incident.manager_notes || '');
    setStatusUpdate(incident.status);
  };

  // Update status & notes
  const handleUpdateIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`${backendUrl}/api/incidents/${selectedIncident.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusUpdate,
          manager_notes: managerNotes
        })
      });

      if (!res.ok) throw new Error('Failed to update incident');
      
      const updatedData = await res.json();
      
      // Update local state list
      setIncidents(prev => prev.map(inc => inc.id === updatedData.id ? updatedData : inc));
      setSelectedIncident(updatedData);
      
      // Flash a brief alert
      alert('Incident updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Error updating incident details.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Statistics calculation
  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'Open').length,
    inProgress: incidents.filter(i => i.status === 'In Progress').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
    critical: incidents.filter(i => i.severity === 'Critical' || i.severity === 'High').length
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'Critical': return 'var(--severity-critical)';
      case 'High': return 'var(--severity-high)';
      case 'Medium': return 'var(--severity-medium)';
      case 'Low': return 'var(--severity-low)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusIcon = (stat) => {
    switch (stat) {
      case 'Open': return <Clock size={16} color="var(--status-open)" />;
      case 'In Progress': return <AlertTriangle size={16} color="var(--status-progress)" />;
      case 'Resolved': return <CheckCircle size={16} color="var(--status-resolved)" />;
      default: return null;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={styles.dashboardGrid}>
      {/* Main Dashboard Content */}
      <div className={styles.mainContent}>
        {/* KPI Panel */}
        <div className={styles.kpiRow}>
          <div className={`glass-card ${styles.kpiCard}`}>
            <span className={styles.kpiValue}>{stats.total}</span>
            <span className={styles.kpiLabel}>Total Reported</span>
          </div>
          <div className={`glass-card ${styles.kpiCard}`} style={{ borderLeft: '3px solid var(--status-open)' }}>
            <span className={styles.kpiValue} style={{ color: 'var(--status-open)' }}>{stats.open}</span>
            <span className={styles.kpiLabel}>Open Tickets</span>
          </div>
          <div className={`glass-card ${styles.kpiCard}`} style={{ borderLeft: '3px solid var(--status-progress)' }}>
            <span className={styles.kpiValue} style={{ color: 'var(--status-progress)' }}>{stats.inProgress}</span>
            <span className={styles.kpiLabel}>In Progress</span>
          </div>
          <div className={`glass-card ${styles.kpiCard}`} style={{ borderLeft: '3px solid var(--status-resolved)' }}>
            <span className={styles.kpiValue} style={{ color: 'var(--status-resolved)' }}>{stats.resolved}</span>
            <span className={styles.kpiLabel}>Resolved</span>
          </div>
          <div className={`glass-card ${styles.kpiCard}`} style={{ borderLeft: '3px solid var(--severity-critical)' }}>
            <span className={styles.kpiValue} style={{ color: 'var(--severity-critical)' }}>{stats.critical}</span>
            <span className={styles.kpiLabel}>Urgent (High/Critical)</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className={`glass-panel ${styles.filterBar}`}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Search title, details, or store location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.searchButton}>Search</button>
          </form>

          <div className={styles.dropdownFilters}>
            <div className={styles.filterGroup}>
              <Filter size={14} className={styles.filterIcon} />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">All Severities</option>
                {SEVERITIES.map(sev => <option key={sev} value={sev}>{sev}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(stat => <option key={stat} value={stat}>{stat}</option>)}
              </select>
            </div>

            {(search || category || severity || status) && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Incident List */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={`${styles.spinner} animate-pulse-soft`}></div>
            <p>Fetching incident logs...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className={`glass-panel ${styles.emptyState}`}>
            <AlertCircle size={48} color="var(--text-muted)" />
            <h3>No incidents logged</h3>
            <p>Try resetting filters or submit a new incident to see reports here.</p>
          </div>
        ) : (
          <div className={styles.incidentList}>
            {incidents.map((incident) => (
              <div 
                key={incident.id} 
                className={`glass-card ${styles.incidentCard} ${
                  selectedIncident?.id === incident.id ? styles.selectedCard : ''
                }`}
                onClick={() => handleSelectIncident(incident)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.metaLeft}>
                    <span 
                      className={styles.severityBadge}
                      style={{ 
                        backgroundColor: `${getSeverityColor(incident.severity)}15`,
                        color: getSeverityColor(incident.severity),
                        borderColor: `${getSeverityColor(incident.severity)}30`
                      }}
                    >
                      {incident.severity}
                    </span>
                    <span className={styles.categoryBadge}>{incident.category}</span>
                  </div>
                  <div className={styles.statusBadge}>
                    {getStatusIcon(incident.status)}
                    <span>{incident.status}</span>
                  </div>
                </div>

                <h3 className={styles.cardTitle}>{incident.title}</h3>
                
                <p className={styles.cardExcerpt}>{incident.description}</p>

                <div className={styles.cardFooter}>
                  <div className={styles.footerInfo}>
                    <MapPin size={12} />
                    <span>{incident.location}</span>
                  </div>
                  <div className={styles.footerInfo}>
                    <Calendar size={12} />
                    <span>{formatDate(incident.timestamp)}</span>
                  </div>
                  <ChevronRight size={16} className={styles.arrowIcon} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Details Panel */}
      <div className={`${styles.sidePanel} ${selectedIncident ? styles.sidePanelOpen : ''}`}>
        {selectedIncident ? (
          <div className={`glass-panel ${styles.panelContent} animate-fade-in`}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderTitle}>
                <span className={styles.panelCategory}>{selectedIncident.category}</span>
                <h3>{selectedIncident.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.panelBody}>
              {/* Incident Metadata */}
              <div className={styles.metadataGrid}>
                <div className={styles.metaItem}>
                  <MapPin size={14} className={styles.metaIcon} />
                  <div>
                    <span className={styles.metaLabel}>Location</span>
                    <span className={styles.metaValue}>{selectedIncident.location}</span>
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={14} className={styles.metaIcon} />
                  <div>
                    <span className={styles.metaLabel}>Incident Date</span>
                    <span className={styles.metaValue}>{formatDate(selectedIncident.timestamp)}</span>
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <Briefcase size={14} className={styles.metaIcon} />
                  <div>
                    <span className={styles.metaLabel}>Severity</span>
                    <span 
                      className={styles.metaValue}
                      style={{ color: getSeverityColor(selectedIncident.severity), fontWeight: 700 }}
                    >
                      {selectedIncident.severity}
                    </span>
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <Clock size={14} className={styles.metaIcon} />
                  <div>
                    <span className={styles.metaLabel}>Reported At</span>
                    <span className={styles.metaValue}>{formatDate(selectedIncident.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={styles.detailSection}>
                <h4>Report Details</h4>
                <div className={styles.descriptionBox}>
                  {selectedIncident.description}
                </div>
              </div>

              {/* AI Assistant Section */}
              <div className={`${styles.detailSection} ${styles.aiSection}`}>
                <div className={styles.aiHeader}>
                  <Sparkles size={16} className={styles.aiSpark} />
                  <h4>Groq AI Triage Assistant</h4>
                </div>
                
                {selectedIncident.ai_summary ? (
                  <div className={styles.aiContent}>
                    <div className={styles.aiSummary}>
                      <h5>Executive Summary</h5>
                      <p>{selectedIncident.ai_summary}</p>
                    </div>
                    {selectedIncident.ai_suggested_action && (
                      <div className={styles.aiActions}>
                        <h5>Manager Action Plan</h5>
                        <div 
                          className={styles.markdownList}
                          dangerouslySetInnerHTML={{ 
                            __html: selectedIncident.ai_suggested_action
                              .replace(/\n/g, '<br />')
                              .replace(/-\s(.*)/g, '<li>$1</li>') 
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.aiMuted}>AI summary not generated for this ticket.</p>
                )}
              </div>

              {/* Manager Actions / Updating Form */}
              <form onSubmit={handleUpdateIncident} className={styles.updateForm}>
                <h4>Manage Ticket</h4>
                
                <div className={styles.fieldGroup}>
                  <label htmlFor="statusUpdate">Update Ticket Status</label>
                  <select 
                    id="statusUpdate"
                    value={statusUpdate} 
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    {STATUSES.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="managerNotes">Internal Operations Notes</label>
                  <textarea
                    id="managerNotes"
                    rows={4}
                    placeholder="Log details on repair actions, technician appointments, customer resolutions..."
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className={styles.updateButton}
                >
                  {isUpdating ? (
                    'Saving Updates...'
                  ) : (
                    <>
                      <Send size={16} />
                      Save Ticket Updates
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className={styles.sidePanelEmpty}>
            <FileText size={48} className={styles.panelEmptyIcon} />
            <p>Select an incident report from the list to manage and review details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
