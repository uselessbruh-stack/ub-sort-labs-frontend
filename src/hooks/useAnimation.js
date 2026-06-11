import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useAnimation — frame-by-frame animation engine for sorting visualizations.
 *
 * The backend returns `incremental` data (per-size timings) but does NOT return per-step
 * frames. We simulate a sorting animation client-side from the known input/output.
 *
 * For the Algorithms tab we do a client-side simulation of the sort to get frames.
 * For the Languages/Comparisons tabs we skip animation and show results.
 *
 * Each frame stores array as [{id, value}, ...] so bars can be tracked by identity
 * and animate their positions when swapped.
 */
export function useAnimation(speedMultiplier = 1) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState([]); // [{array, comparing, swapping, sorted}]
  const timerRef = useRef(null);
  const speedRef = useRef(speedMultiplier);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const totalFrames = frames.length;
  const progress = totalFrames > 1 ? (currentFrame / (totalFrames - 1)) * 100 : 0;
  const isComplete = currentFrame >= totalFrames - 1 && totalFrames > 0;
  const currentData = frames[currentFrame] || null;

  const play = useCallback(() => {
    if (totalFrames === 0) return;
    setIsPlaying(true);
  }, [totalFrames]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const stepForward = useCallback(() => {
    setCurrentFrame(f => Math.min(f + 1, totalFrames - 1));
  }, [totalFrames]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(0);
  }, []);

  const jumpTo = useCallback((frame) => {
    setCurrentFrame(Math.max(0, Math.min(frame, totalFrames - 1)));
  }, [totalFrames]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || totalFrames === 0) {
      clearInterval(timerRef.current);
      return;
    }

    const baseDelay = 400; // ms at 1x speed
    const delay = Math.max(30, baseDelay / speedRef.current);

    timerRef.current = setInterval(() => {
      setCurrentFrame(f => {
        if (f >= totalFrames - 1) {
          setIsPlaying(false);
          return f;
        }
        return f + 1;
      });
    }, delay);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, totalFrames, speedMultiplier]);

  return {
    frames,
    setFrames,
    currentFrame,
    currentData,
    totalFrames,
    progress,
    isPlaying,
    isComplete,
    play,
    pause,
    stepForward,
    reset,
    jumpTo,
  };
}

// ── Helper: wrap raw array into {id, value} items ──
function toItems(arr) {
  return arr.map((v, i) => ({ id: i, value: v }));
}

function cloneItems(items) {
  return items.map(it => ({ ...it }));
}

// ── Client-side sorting frame generators ──
// Each frame.array is [{id, value}, ...] so the BarChart can track element identity.

export function generateBubbleSortFrames(inputArray) {
  const arr = toItems(inputArray);
  const frames = [];
  const sorted = [];
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [] });

  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      frames.push({ array: cloneItems(arr), comparing: [j, j + 1], swapping: [], sorted: [...sorted] });
      if (arr[j].value > arr[j + 1].value) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        frames.push({ array: cloneItems(arr), comparing: [], swapping: [j, j + 1], sorted: [...sorted] });
      }
    }
    sorted.push(arr.length - 1 - i);
  }
  sorted.push(0);
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i) });
  return frames;
}

export function generateSelectionSortFrames(inputArray) {
  const arr = toItems(inputArray);
  const frames = [];
  const sorted = [];
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [] });

  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      frames.push({ array: cloneItems(arr), comparing: [minIdx, j], swapping: [], sorted: [...sorted] });
      if (arr[j].value < arr[minIdx].value) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      frames.push({ array: cloneItems(arr), comparing: [], swapping: [i, minIdx], sorted: [...sorted] });
    }
    sorted.push(i);
  }
  sorted.push(arr.length - 1);
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i) });
  return frames;
}

export function generateInsertionSortFrames(inputArray) {
  const arr = toItems(inputArray);
  const frames = [];
  const sorted = [0];
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [0] });

  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0 && arr[j - 1].value > arr[j].value) {
      frames.push({ array: cloneItems(arr), comparing: [j - 1, j], swapping: [], sorted: [...sorted] });
      [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
      frames.push({ array: cloneItems(arr), comparing: [], swapping: [j - 1, j], sorted: [...sorted] });
      j--;
    }
    sorted.push(i);
  }
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i) });
  return frames;
}

export function generateMergeSortFrames(inputArray) {
  const arr = toItems(inputArray);
  const frames = [];
  const sortedIndices = new Set();
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [] });

  function merge(l, m, r) {
    const left = arr.slice(l, m + 1).map(it => ({ ...it }));
    const right = arr.slice(m + 1, r + 1).map(it => ({ ...it }));
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      frames.push({ array: cloneItems(arr), comparing: [l + i, m + 1 + j], swapping: [], sorted: [...sortedIndices] });
      if (left[i].value <= right[j].value) { arr[k] = { ...left[i] }; i++; }
      else { arr[k] = { ...right[j] }; j++; }
      frames.push({ array: cloneItems(arr), comparing: [], swapping: [k], sorted: [...sortedIndices] });
      k++;
    }
    while (i < left.length) { arr[k] = { ...left[i] }; i++; k++; }
    while (j < right.length) { arr[k] = { ...right[j] }; j++; k++; }
    frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [...sortedIndices] });
  }

  function sort(l, r) {
    if (l < r) {
      const m = Math.floor((l + r) / 2);
      sort(l, m);
      sort(m + 1, r);
      merge(l, m, r);
      if (l === 0 && r === arr.length - 1) {
        for (let x = l; x <= r; x++) sortedIndices.add(x);
      }
    }
  }
  sort(0, arr.length - 1);
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i) });
  return frames;
}

export function generateQuickSortFrames(inputArray) {
  const arr = toItems(inputArray);
  const frames = [];
  const sortedIndices = new Set();
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [], pivot: null });

  function partition(low, high) {
    const pivotVal = arr[high].value;
    frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [...sortedIndices], pivot: high });
    let i = low - 1;
    for (let j = low; j < high; j++) {
      frames.push({ array: cloneItems(arr), comparing: [j, high], swapping: [], sorted: [...sortedIndices], pivot: high });
      if (arr[j].value <= pivotVal) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          frames.push({ array: cloneItems(arr), comparing: [], swapping: [i, j], sorted: [...sortedIndices], pivot: high });
        }
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    frames.push({ array: cloneItems(arr), comparing: [], swapping: [i + 1, high], sorted: [...sortedIndices], pivot: null });
    sortedIndices.add(i + 1);
    return i + 1;
  }

  function sort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      sort(low, pi - 1);
      sort(pi + 1, high);
    } else if (low === high) {
      sortedIndices.add(low);
    }
  }
  sort(0, arr.length - 1);
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i), pivot: null });
  return frames;
}

export function generateHeapSortFrames(inputArray) {
  const arr = toItems(inputArray);
  const frames = [];
  const sorted = [];
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: [] });

  function heapify(n, i) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < n) {
      frames.push({ array: cloneItems(arr), comparing: [largest, l], swapping: [], sorted: [...sorted] });
      if (arr[l].value > arr[largest].value) largest = l;
    }
    if (r < n) {
      frames.push({ array: cloneItems(arr), comparing: [largest, r], swapping: [], sorted: [...sorted] });
      if (arr[r].value > arr[largest].value) largest = r;
    }
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      frames.push({ array: cloneItems(arr), comparing: [], swapping: [i, largest], sorted: [...sorted] });
      heapify(n, largest);
    }
  }

  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) heapify(arr.length, i);
  for (let i = arr.length - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    frames.push({ array: cloneItems(arr), comparing: [], swapping: [0, i], sorted: [...sorted] });
    sorted.push(i);
    heapify(i, 0);
  }
  sorted.push(0);
  frames.push({ array: cloneItems(arr), comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i) });
  return frames;
}

// Generic frame generator fallback – just show before & after
export function generateGenericFrames(inputArray, outputArray) {
  const allSorted = Array.from({ length: inputArray.length }, (_, i) => i);
  return [
    { array: toItems(inputArray), comparing: [], swapping: [], sorted: [] },
    { array: toItems(outputArray || inputArray), comparing: [], swapping: [], sorted: allSorted },
  ];
}

// Master dispatcher
export function generateFrames(algorithm, inputArray, outputArray) {
  switch (algorithm) {
    case 'bubble':    return generateBubbleSortFrames(inputArray);
    case 'selection': return generateSelectionSortFrames(inputArray);
    case 'insertion': return generateInsertionSortFrames(inputArray);
    case 'merge':     return generateMergeSortFrames(inputArray);
    case 'quick':     return generateQuickSortFrames(inputArray);
    case 'heap':      return generateHeapSortFrames(inputArray);
    default:          return generateGenericFrames(inputArray, outputArray);
  }
}
