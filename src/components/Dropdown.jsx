import { useState, useRef, useEffect } from 'react';

export default function Dropdown({ value, options = [], onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Normalize options to { value, label }
  const items = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  const selected = items.find(i => i.value === value);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="custom-dropdown" ref={ref}>
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.label || '-- select --'}</span>
        <span className="custom-dropdown-arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <ul className="custom-dropdown-menu">
          {items.map(item => (
            <li
              key={item.value}
              className={`custom-dropdown-item ${item.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(item.value); setOpen(false); }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
