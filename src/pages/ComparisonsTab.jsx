import { useState, useContext } from 'react';
import { AppContext } from '../App';
import Dropdown from '../components/Dropdown';
import { compareAlgorithms, generateRandomArray, ALGORITHM_INFO, LANGUAGE_NAMES } from '../services/api';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ComparisonsTab() {
  const { algorithms, languages } = useContext(AppContext);

  const [language, setLanguage] = useState('c');
  const [selectedAlgos, setSelectedAlgos] = useState([...algorithms]);
  const [arraySize, setArraySize] = useState(30);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  function toggleAlgo(algo) {
    setSelectedAlgos(prev => prev.includes(algo) ? prev.filter(a => a !== algo) : [...prev, algo]);
  }

  function selectPreset(type) {
    if (type === 'all') setSelectedAlgos([...algorithms]);
    else if (type === 'comparison') setSelectedAlgos(algorithms.filter(a => ALGORITHM_INFO[a]?.type === 'comparison'));
    else if (type === 'non-comparison') setSelectedAlgos(algorithms.filter(a => ALGORITHM_INFO[a]?.type === 'non-comparison'));
  }

  async function handleCompare() {
    let elems;
    if (manualInput.trim()) {
      elems = manualInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    } else {
      elems = generateRandomArray(arraySize);
      setManualInput(elems.join(', '));
    }
    setLoading(true);
    setError('');
    try {
      const res = await compareAlgorithms(language, elems);
      setResults(res.results);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  const rankingData = results ? selectedAlgos
    .filter(a => results[a] && !results[a].error)
    .map(a => ({
      algo: a, name: ALGORITHM_INFO[a]?.name || a, time: results[a].actual_time_ms,
      swaps: results[a].swaps, comparisons: results[a].comparisons,
      cls: ALGORITHM_INFO[a]?.class || '',
    }))
    .sort((a, b) => a.time - b.time)
    .map((item, i) => ({ ...item, rank: i + 1, ratio: 1 }))
    : [];

  if (rankingData.length > 0) {
    const fastest = rankingData[0].time || 0.0001;
    rankingData.forEach(r => { r.ratio = r.time / fastest; });
  }

  const maxTime = rankingData.length > 0 ? Math.max(...rankingData.map(r => r.time)) : 1;
  const chartData = rankingData.map(r => ({ name: r.name, time: parseFloat(r.time.toFixed(4)) }));

  return (
    <div className="tab-page">
      <div className="tab-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Language</div>
          <Dropdown
            value={language}
            options={languages.map(l => ({ value: l, label: LANGUAGE_NAMES[l] || l }))}
            onChange={v => { setLanguage(v); setResults(null); }}
          />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Algorithms</div>
          <div className="flex gap-1 flex-wrap" style={{ marginBottom: '8px' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => selectPreset('all')}>All</button>
            <button className="btn btn-sm btn-secondary" onClick={() => selectPreset('comparison')}>Comparison</button>
            <button className="btn btn-sm btn-secondary" onClick={() => selectPreset('non-comparison')}>Non-Comp</button>
          </div>
          <div className="flex flex-col gap-2">
            {algorithms.map(a => (
              <label key={a} className="checkbox-group">
                <input type="checkbox" checked={selectedAlgos.includes(a)} onChange={() => toggleAlgo(a)} />
                {ALGORITHM_INFO[a]?.name || a}
                <span style={{ marginLeft: 'auto', fontFamily: 'Courier New', fontSize: '0.65rem', color: '#888' }}>
                  {ALGORITHM_INFO[a]?.class}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Data Input</div>
          <div className="form-group">
            <label className="form-label">Array Size: {arraySize}</label>
            <input type="range" min="2" max="50" value={arraySize} onChange={e => setArraySize(Number(e.target.value))} />
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setManualInput(generateRandomArray(arraySize).join(', ')); setResults(null); }}>
            RANDOM ARRAY
          </button>
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Manual Input</label>
            <input className="form-input" placeholder="e.g. 5, 2, 8, 1, 3" value={manualInput} onChange={e => setManualInput(e.target.value)} />
          </div>
        </div>

        <div className="sidebar-section" style={{ borderBottom: 'none' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCompare} disabled={loading || selectedAlgos.length === 0}>
            {loading ? 'COMPARING...' : 'COMPARE ALGORITHMS'}
          </button>
          {error && <p style={{ color: '#333', fontSize: '0.8rem', marginTop: '6px' }}>[ERROR] {error}</p>}
        </div>
      </div>

      <div className="tab-main">
        <div className="comparison-main">
          {results ? (
            <>
              <div className="card">
                <h3 style={{ fontSize: '0.8rem', marginBottom: '14px' }}>ALGORITHM RANKING ({LANGUAGE_NAMES[language]?.toUpperCase()})</h3>
                <div className="ranking-chart">
                  {rankingData.map((r) => (
                    <div className="ranking-row" key={r.algo}>
                      <span className="ranking-name">{r.name}</span>
                      <div className="ranking-bar-container">
                        <div
                          className="ranking-bar-fill"
                          style={{ width: `${Math.max((r.time / maxTime) * 100, 8)}%` }}
                        >
                          {r.time.toFixed(4)}ms
                        </div>
                      </div>
                      <span className="ranking-rank">
                        #{r.rank}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '0.8rem', marginBottom: '12px' }}>EXECUTION TIME CHART</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ReBarChart data={chartData} margin={{ left: 20, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888', fontFamily: 'Courier New' }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #000', fontSize: '0.8rem', fontFamily: 'Courier New' }} formatter={(value) => [`${value}ms`, 'Time']} />
                    <Bar dataKey="time" radius={[0, 0, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#000000' : '#888888'} />)}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '0.8rem', marginBottom: '12px' }}>DETAILED COMPARISON</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>Rank</th><th>Algorithm</th><th>Time</th><th>Comps</th><th>Swaps</th><th>Class</th><th>Ratio</th></tr>
                  </thead>
                  <tbody>
                    {rankingData.map(r => (
                      <tr key={r.algo}>
                        <td>#{r.rank}</td>
                        <td style={{ fontWeight: 700 }}>{r.name}</td>
                        <td className="mono">{r.time.toFixed(4)}ms</td>
                        <td className="mono">{r.comparisons}</td>
                        <td className="mono">{r.swaps}</td>
                        <td><span className="badge">{r.cls}</span></td>
                        <td className="mono">{r.ratio.toFixed(1)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <p>Select algorithms and click <strong>COMPARE ALGORITHMS</strong></p>
            </div>
          )}
          {loading && (
            <div className="loading-overlay" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
              <div className="loader-spinner" />
              <p>COMPARING {selectedAlgos.length} ALGORITHMS IN {LANGUAGE_NAMES[language]?.toUpperCase()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
