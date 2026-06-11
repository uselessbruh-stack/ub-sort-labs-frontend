import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import Dropdown from '../components/Dropdown';
import { getHistory, getHistoryStats, ALGORITHM_INFO, LANGUAGE_NAMES } from '../services/api';

export default function HistoryTab() {
  const { algorithms, languages } = useContext(AppContext);

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('newest');
  const [filterAlgo, setFilterAlgo] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => { fetchHistory(); fetchStats(); }, []);

  async function fetchHistory() {
    setLoading(true); setError('');
    try {
      const res = await getHistory({ limit: 100 });
      setHistory(res.data || []);
    } catch (err) {
      if (err.response?.status === 503) setError('Database not connected. History requires MongoDB.');
      else setError(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }

  async function fetchStats() {
    try { const res = await getHistoryStats(); setStats(res); } catch {}
  }

  let filtered = [...history];
  if (filterAlgo) filtered = filtered.filter(h => h.algorithm === filterAlgo);
  if (filterLang) filtered = filtered.filter(h => h.language === filterLang);
  if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  else if (sortBy === 'fastest') filtered.sort((a, b) => a.actualTimeMs - b.actualTimeMs);
  else if (sortBy === 'slowest') filtered.sort((a, b) => b.actualTimeMs - a.actualTimeMs);

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatArray(arr) {
    if (!arr || arr.length === 0) return '--';
    if (arr.length <= 5) return `[${arr.join(', ')}]`;
    return `[${arr.slice(0, 4).join(', ')}, ... +${arr.length - 4}]`;
  }



  return (
    <div className="tab-page">
      <div className="tab-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Filters</div>
          <div className="form-group">
            <label className="form-label">Algorithm</label>
            <Dropdown
              value={filterAlgo}
              options={[{ value: '', label: 'All Algorithms' }, ...algorithms.map(a => ({ value: a, label: ALGORITHM_INFO[a]?.name || a }))]}
              onChange={v => setFilterAlgo(v)}
            />
          </div>
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Language</label>
            <Dropdown
              value={filterLang}
              options={[{ value: '', label: 'All Languages' }, ...languages.map(l => ({ value: l, label: LANGUAGE_NAMES[l] || l }))]}
              onChange={v => setFilterLang(v)}
            />
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Sort By</div>
          <Dropdown
            value={sortBy}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'fastest', label: 'Fastest First' },
              { value: 'slowest', label: 'Slowest First' },
            ]}
            onChange={v => setSortBy(v)}
          />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">View</div>
          <div className="view-tabs">
            <button className={`view-tab ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
            <button className={`view-tab ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>Grid</button>
          </div>
        </div>

        <div className="sidebar-section" style={{ borderBottom: 'none' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={fetchHistory}>
            REFRESH
          </button>
        </div>
      </div>

      <div className="tab-main" style={{ overflow: 'auto' }}>
        {/* Stats Summary */}
        {stats && stats.totalRecords > 0 && (
          <div className="stats-summary">
            <div className="stats-summary-card">
              <div className="stats-summary-label">Total Runs</div>
              <div className="stats-summary-value">{stats.totalRecords}</div>
            </div>
            <div className="stats-summary-card">
              <div className="stats-summary-label">Languages</div>
              <div className="stats-summary-value">{Object.keys(stats.byLanguage || {}).length}</div>
            </div>
            <div className="stats-summary-card">
              <div className="stats-summary-label">Algorithms</div>
              <div className="stats-summary-value">{Object.keys(stats.byAlgorithm || {}).length}</div>
            </div>
            <div className="stats-summary-card">
              <div className="stats-summary-label">Avg Time</div>
              <div className="stats-summary-value">
                {history.length > 0 ? (history.reduce((s, h) => s + (h.actualTimeMs || 0), 0) / history.length).toFixed(4) : '--'}ms
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="card" style={{ margin: '16px', borderColor: '#000' }}>
            <p style={{ color: '#000', fontSize: '0.85rem' }}>[WARNING] {error}</p>
          </div>
        )}

        {loading ? (
          <div className="empty-state" style={{ height: '300px' }}>
            <div className="loader-spinner" /><p>LOADING HISTORY...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ height: '300px' }}>
            <p>{history.length === 0 ? 'No history yet. Run some sorts first!' : 'No results match your filters.'}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="history-list">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="history-item"
                onClick={() => setSelectedItem(item)}
              >
                <div className="history-item-header">
                  <div className="history-item-tags">
                    <span className="badge">{LANGUAGE_NAMES[item.language] || item.language}</span>
                    <span className="badge badge-gold">{ALGORITHM_INFO[item.algorithm]?.name || item.algorithm}</span>
                    {item.isSorted && <span className="badge">SORTED</span>}
                  </div>
                  <span className="history-item-date">{formatDate(item.timestamp)}</span>
                </div>
                <div className="history-item-body">
                  <span className="history-item-input">{formatArray(item.inputElements)}</span>
                  <span className="history-item-arrow">-&gt;</span>
                  <span className="history-item-output">{formatArray(item.outputElements)}</span>
                </div>
                <div className="history-item-stats">
                  <span>Time: {(item.actualTimeMs || 0).toFixed(4)}ms</span>
                  <span>Swaps: {item.swaps ?? '--'}</span>
                  <span>Comps: {item.comparisons ?? '--'}</span>
                  <span>Elements: {item.inputElements?.length ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="history-grid">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="history-card"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-center justify-between" style={{ gap: '6px' }}>
                  <span className="badge">{LANGUAGE_NAMES[item.language] || item.language}</span>
                  <span className="badge badge-gold">{ALGORITHM_INFO[item.algorithm]?.name || item.algorithm}</span>
                </div>
                <div style={{ fontFamily: 'Courier New', fontSize: '0.78rem', color: '#444', wordBreak: 'break-all' }}>
                  {formatArray(item.inputElements)}
                </div>
                <div className="flex gap-3" style={{ fontSize: '0.75rem', color: '#888', flexWrap: 'wrap' }}>
                  <span>Time: {(item.actualTimeMs || 0).toFixed(4)}ms</span>
                  <span>Swaps: {item.swaps ?? '--'}</span>
                  <span>Elements: {item.inputElements?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 'auto' }}>
                  <span style={{ fontFamily: 'Courier New', fontSize: '0.6rem', color: '#888' }}>{formatDate(item.timestamp)}</span>
                  {item.isSorted && <span className="badge">OK</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div className="detail-overlay" onClick={() => setSelectedItem(null)}>
            <div className="detail-panel" onClick={e => e.stopPropagation()}>
              <div className="detail-header">
                <h3>EXECUTION DETAILS</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedItem(null)}>X</button>
              </div>
              <div className="detail-body">
                <div className="detail-meta-grid">
                  <div className="detail-meta-item">
                    <span className="detail-label">Language</span>
                    <span className="detail-value">
                      {LANGUAGE_NAMES[selectedItem.language] || selectedItem.language}
                    </span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="detail-label">Algorithm</span>
                    <span className="detail-value">{ALGORITHM_INFO[selectedItem.algorithm]?.name || selectedItem.algorithm}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{formatDate(selectedItem.timestamp)}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="detail-label">Complexity</span>
                    <span className="detail-value">{ALGORITHM_INFO[selectedItem.algorithm]?.class || '--'}</span>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Exec. Time</span>
                    <span className="stat-value">{(selectedItem.actualTimeMs || 0).toFixed(4)}ms</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Comparisons</span>
                    <span className="stat-value">{selectedItem.comparisons ?? '--'}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Swaps</span>
                    <span className="stat-value">{selectedItem.swaps ?? '--'}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Elements</span>
                    <span className="stat-value">{selectedItem.inputElements?.length ?? 0}</span>
                  </div>
                </div>

                <div>
                  <div className="detail-label" style={{ marginBottom: '4px' }}>INPUT</div>
                  <div className="detail-array-box">
                    [{selectedItem.inputElements?.join(', ')}]
                  </div>
                </div>

                <div>
                  <div className="detail-label" style={{ marginBottom: '4px' }}>OUTPUT</div>
                  <div className="detail-array-box" style={{ fontWeight: 700 }}>
                    [{selectedItem.outputElements?.join(', ')}]
                  </div>
                </div>

                {selectedItem.isSorted !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      {selectedItem.isSorted ? 'CORRECTLY SORTED' : 'NOT SORTED'}
                    </span>
                  </div>
                )}


              </div>
              <div className="detail-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>CLOSE</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
