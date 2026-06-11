export default function StatsPanel({
  comparisons = 0,
  swaps = 0,
  timeMs = 0,
  currentStep = 0,
  totalSteps = 0,
  progress = 0,
  algorithmClass = '',
  isSorted = false,
}) {
  const stats = [
    { label: 'Comparisons', value: comparisons.toLocaleString() },
    { label: 'Swaps', value: swaps.toLocaleString() },
    { label: 'Exec. Time', value: `${timeMs.toFixed(4)} ms` },
    { label: 'Progress', value: `${Math.round(progress)}%` },
    ...(algorithmClass ? [{ label: 'Complexity', value: algorithmClass }] : []),
    { label: 'Status', value: isSorted ? 'SORTED' : 'Unsorted' },
    { label: 'Step', value: `${currentStep} / ${totalSteps}` },
  ];

  return (
    <div className="main-stats" style={{ padding: '10px 14px' }}>
      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="progress-bar" style={{ marginTop: '8px' }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
