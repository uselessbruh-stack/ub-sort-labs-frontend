import { useState, useContext } from 'react';
import { AppContext } from '../App';
import BarChart from '../components/BarChart';
import Dropdown from '../components/Dropdown';
import { compareLanguages, generateRandomArray, ALGORITHM_INFO, LANGUAGE_NAMES } from '../services/api';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function LanguagesTab() {
  const { algorithms, languages } = useContext(AppContext);

  const [algorithm, setAlgorithm] = useState('quick');
  const [arraySize, setArraySize] = useState(20);
  const [selectedLangs, setSelectedLangs] = useState(['c', 'python', 'rust', 'java']);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [elements, setElements] = useState([]);

  function toggleLang(lang) {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  }

  async function handleCompare() {
    let elems = elements;
    if (manualInput.trim()) {
      elems = manualInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
    if (elems.length === 0) {
      elems = generateRandomArray(arraySize);
      setManualInput(elems.join(', '));
    }
    setElements(elems);
    setLoading(true);
    setError('');
    try {
      const res = await compareLanguages(algorithm, elems);
      setResults(res.results);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGenerateRandom() {
    const arr = generateRandomArray(arraySize);
    setElements(arr);
    setManualInput(arr.join(', '));
    setResults(null);
  }

  const rankingData = results ? selectedLangs
    .filter(l => results[l] && !results[l].error)
    .map(l => ({
      lang: l, name: LANGUAGE_NAMES[l], time: results[l].actual_time_ms,
      swaps: results[l].swaps, comparisons: results[l].comparisons,
      output: results[l].output,
    }))
    .sort((a, b) => a.time - b.time)
    .map((item, i) => ({ ...item, rank: i + 1 }))
    : [];

  const colClass = selectedLangs.length <= 2 ? 'cols-2'
    : selectedLangs.length <= 3 ? 'cols-3' : 'cols-4';

  const chartData = rankingData.map(r => ({
    name: r.name, time: parseFloat(r.time.toFixed(4)),
  }));

  return (
    <div className="tab-page">
      <div className="tab-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Algorithm</div>
          <Dropdown
            value={algorithm}
            options={algorithms.map(a => ({ value: a, label: ALGORITHM_INFO[a]?.name || a }))}
            onChange={v => { setAlgorithm(v); setResults(null); }}
          />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Languages</div>
          <div className="flex flex-col gap-2">
            {languages.map(l => (
              <label key={l} className="checkbox-group">
                <input type="checkbox" checked={selectedLangs.includes(l)} onChange={() => toggleLang(l)} />
                {LANGUAGE_NAMES[l] || l}
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
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={handleGenerateRandom}>
            RANDOM ARRAY
          </button>
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Manual Input</label>
            <input className="form-input" placeholder="e.g. 5, 2, 8, 1, 3" value={manualInput} onChange={e => setManualInput(e.target.value)} />
          </div>
        </div>

        <div className="sidebar-section" style={{ borderBottom: 'none' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCompare} disabled={loading || selectedLangs.length === 0}>
            {loading ? 'COMPARING...' : 'COMPARE LANGUAGES'}
          </button>
          {error && <p style={{ color: '#333', fontSize: '0.8rem', marginTop: '6px' }}>[ERROR] {error}</p>}
        </div>
      </div>

      <div className="tab-main">
        <div style={{ flex: 1, overflow: 'auto' }}>
          {results ? (
            <>
              <div className={`language-grid ${colClass}`}>
                {rankingData.map((r) => (
                  <div className="language-pane" key={r.lang}>
                    <div className="language-pane-header">
                      <div className="language-pane-title">
                        {r.name}
                        {r.rank === 1 && <span className="badge badge-gold">#1</span>}
                        {r.rank === 2 && <span className="badge badge-silver">#2</span>}
                        {r.rank === 3 && <span className="badge badge-bronze">#3</span>}
                      </div>
                    </div>
                    <div className="language-pane-bars">
                      <BarChart
                        array={r.output}
                        highlights={{ sorted: Array.from({ length: r.output.length }, (_, i) => i) }}
                        maxValue={Math.max(...r.output, 100)}
                        showValues={false}
                        speedMs={0}
                      />
                    </div>
                    <div className="language-pane-stats">
                      <span>Time: {r.time.toFixed(4)}ms</span>
                      <span>Swaps: {r.swaps}</span>
                      <span>Comps: {r.comparisons}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ margin: '16px' }}>
                <h3 style={{ fontSize: '0.8rem', marginBottom: '12px' }}>EXECUTION TIME COMPARISON</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <ReBarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#000', fontFamily: 'Courier New' }} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #000', fontSize: '0.8rem', fontFamily: 'Courier New' }} formatter={(value) => [`${value}ms`, 'Time']} />
                    <Bar dataKey="time" radius={[0, 0, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#000000' : '#888888'} />)}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ margin: '0 16px 16px' }}>
                <h3 style={{ fontSize: '0.8rem', marginBottom: '12px' }}>DETAILED COMPARISON</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>Rank</th><th>Language</th><th>Time</th><th>Swaps</th><th>Comparisons</th></tr>
                  </thead>
                  <tbody>
                    {rankingData.map(r => (
                      <tr key={r.lang}>
                        <td>#{r.rank}</td>
                        <td>{r.name}</td>
                        <td className="mono">{r.time.toFixed(4)}ms</td>
                        <td className="mono">{r.swaps}</td>
                        <td className="mono">{r.comparisons}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <p>Select an algorithm, choose languages, and click <strong>COMPARE LANGUAGES</strong></p>
            </div>
          )}
          {loading && (
            <div className="loading-overlay" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
              <div className="loader-spinner" />
              <p>COMPARING {ALGORITHM_INFO[algorithm]?.name?.toUpperCase()} ACROSS {selectedLangs.length} LANGUAGES</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
