import { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import BarChart from '../components/BarChart';
import StatsPanel from '../components/StatsPanel';
import Dropdown from '../components/Dropdown';
import { useAnimation, generateFrames } from '../hooks/useAnimation';
import { executeSort, generateRandomArray, ALGORITHM_INFO, LANGUAGE_NAMES } from '../services/api';
import { playSwapSound, playCompareSound, playSortedSound } from '../services/sound';

export default function AlgorithmsTab() {
  const { algorithms, languages } = useContext(AppContext);

  const [algorithm, setAlgorithm] = useState('bubble');
  const [language, setLanguage] = useState('c');
  const [arraySize, setArraySize] = useState(20);
  const [manualInput, setManualInput] = useState('');
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const prevFrameRef = useRef(0);

  const [result, setResult] = useState(null);
  const [inputArray, setInputArray] = useState([]);

  const animation = useAnimation(speed);

  const handleGenerateRandom = useCallback(() => {
    const arr = generateRandomArray(arraySize);
    setInputArray(arr);
    setManualInput(arr.join(', '));
    animation.reset();
    animation.setFrames([]);
    setResult(null);
    setError('');
  }, [arraySize, animation]);

  const handleSort = useCallback(async () => {
    let elements = inputArray;
    if (manualInput.trim()) {
      elements = manualInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
    if (elements.length === 0) {
      elements = generateRandomArray(arraySize);
      setManualInput(elements.join(', '));
    }
    setInputArray(elements);
    setLoading(true);
    setError('');

    try {
      const res = await executeSort(language, algorithm, elements);
      setResult(res.data);

      const frames = generateFrames(algorithm, elements, res.data.output);
      animation.setFrames(frames);
      animation.reset();
      setTimeout(() => animation.play(), 200);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [inputArray, manualInput, arraySize, language, algorithm, animation]);

  const currentFrame = animation.currentData;
  const displayArray = currentFrame ? currentFrame.array : inputArray;
  const highlights = currentFrame ? {
    comparing: currentFrame.comparing || [],
    swapping: currentFrame.swapping || [],
    sorted: currentFrame.sorted || [],
    pivot: currentFrame.pivot ?? null,
  } : {};

  // Extract raw values for maxValue calc (handles both number[] and {id,value}[])
  const rawValues = displayArray.map(item => typeof item === 'object' ? item.value : item);
  const computedMax = rawValues.length > 0 ? Math.max(...rawValues, 100) : 100;

  const speedMs = Math.max(50, 400 / speed);

  // Sound effects on frame change
  useEffect(() => {
    if (muted || !currentFrame) return;
    if (animation.currentFrame === prevFrameRef.current) return;
    prevFrameRef.current = animation.currentFrame;

    const { swapping = [], comparing = [], sorted = [] } = currentFrame;

    if (swapping.length > 0) {
      const idx = swapping[0];
      const val = currentFrame.array[idx];
      const v = typeof val === 'object' ? val.value : val;
      playSwapSound(v, computedMax);
    } else if (comparing.length > 0) {
      const idx = comparing[0];
      const val = currentFrame.array[idx];
      const v = typeof val === 'object' ? val.value : val;
      playCompareSound(v, computedMax);
    }

    // Completion sound
    if (animation.isComplete && sorted.length === displayArray.length) {
      playSortedSound();
    }
  }, [animation.currentFrame, currentFrame, muted, computedMax, displayArray.length, animation.isComplete]);

  return (
    <div className="tab-page">
      {/* Sidebar */}
      <div className="tab-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Algorithm</div>
          <Dropdown
            value={algorithm}
            options={algorithms.map(a => ({ value: a, label: ALGORITHM_INFO[a]?.name || a }))}
            onChange={v => { setAlgorithm(v); animation.reset(); animation.setFrames([]); setResult(null); }}
          />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Language</div>
          <Dropdown
            value={language}
            options={languages.map(l => ({ value: l, label: LANGUAGE_NAMES[l] || l }))}
            onChange={v => setLanguage(v)}
          />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Data Input</div>
          <div className="form-group">
            <label className="form-label">Array Size: {arraySize}</label>
            <input
              type="range" min="2" max="50" value={arraySize}
              onChange={e => setArraySize(Number(e.target.value))}
            />
            <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', color: '#888' }}>
              <span>2</span><span>50</span>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={handleGenerateRandom}
          >
            RANDOM ARRAY
          </button>
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Manual Input</label>
            <input
              className="form-input"
              placeholder="e.g. 5, 2, 8, 1, 3"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Playback</div>
          <div className="playback-controls">
            <button
              className={`playback-btn ${animation.isPlaying ? 'active' : ''}`}
              onClick={() => animation.isPlaying ? animation.pause() : animation.play()}
              disabled={animation.totalFrames === 0}
              title={animation.isPlaying ? 'Pause' : 'Play'}
            >
              {animation.isPlaying ? '\u2016' : '\u25B6'}
            </button>
            <button
              className="playback-btn"
              onClick={animation.stepForward}
              disabled={animation.isComplete || animation.totalFrames === 0}
              title="Step Forward"
            >{'\u25B6|'}</button>
            <button
              className="playback-btn"
              onClick={animation.reset}
              disabled={animation.totalFrames === 0}
              title="Reset"
            >{'\u25A0'}</button>
            <button
              className={`playback-btn ${muted ? '' : 'active'}`}
              onClick={() => setMuted(m => !m)}
              title={muted ? 'Unmute' : 'Mute'}
            >{muted ? '\u2022' : '\u266A'}</button>
          </div>
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Speed: {speed}x</label>
            <input
              type="range" min="0.5" max="15" step="0.5" value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
            />
            <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', color: '#888' }}>
              <span>0.5x</span><span>15x</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section" style={{ borderBottom: 'none' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleSort}
            disabled={loading}
          >
            {loading ? 'SORTING...' : 'SORT & ANIMATE'}
          </button>
          {error && <p style={{ color: '#333', fontSize: '0.8rem', marginTop: '6px' }}>[ERROR] {error}</p>}
        </div>
      </div>

      {/* Main Area */}
      <div className="tab-main" style={{ overflow: 'auto' }}>
        <div className="main-visualization">
          {displayArray.length > 0 ? (
            <BarChart
              array={displayArray}
              highlights={highlights}
              maxValue={computedMax}
              speedMs={speedMs}
            />
          ) : (
            <div className="empty-state" style={{ width: '100%' }}>
              <p>Select an algorithm, generate an array, and click <strong>SORT & ANIMATE</strong></p>
            </div>
          )}
          {loading && (
            <div className="loading-overlay">
              <div className="loader-spinner" />
              <p>EXECUTING {ALGORITHM_INFO[algorithm]?.name?.toUpperCase()} IN {LANGUAGE_NAMES[language]?.toUpperCase()}</p>
            </div>
          )}
        </div>

        <StatsPanel
          comparisons={result?.comparisons ?? 0}
          swaps={result?.swaps ?? 0}
          timeMs={result?.actual_time_ms ?? 0}
          currentStep={animation.currentFrame}
          totalSteps={animation.totalFrames}
          progress={animation.progress}
          algorithmClass={ALGORITHM_INFO[algorithm]?.class || ''}
          isSorted={result?.is_sorted ?? false}
        />

      </div>
    </div>
  );
}
