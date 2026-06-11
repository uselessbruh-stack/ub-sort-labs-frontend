import axios from 'axios';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || '').trim() ||
  (import.meta.env.PROD
    ? 'https://ub-sort-lab-backend.onrender.com'
    : `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || '3000'}`);

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Discovery ──
export async function getLanguages() {
  const { data } = await client.get('/api/languages');
  return data; // { languages: [...], algorithms: [...] }
}

export async function healthCheck() {
  const { data } = await client.get('/api/health');
  return data;
}

// ── Sorting ──
export async function executeSort(language, algorithm, elements) {
  const { data } = await client.post(`/api/sort/${language}/${algorithm}`, { elements });
  return data; // { success, language, data: { input, output, actual_time_ms, ... } }
}

// ── Comparisons ──
export async function compareLanguages(algorithm, elements) {
  const { data } = await client.post(`/api/compare/${algorithm}`, { elements });
  return data; // { success, algorithm, results: { c: {...}, python: {...}, ... } }
}

export async function compareAlgorithms(language, elements) {
  const { data } = await client.post(`/api/algorithms/${language}`, { elements });
  return data; // { success, language, results: { bubble: {...}, ... } }
}

// ── History ──
export async function getHistory(params = {}) {
  const { data } = await client.get('/api/history', { params });
  return data; // { success, data: [...], pagination: {...} }
}

export async function getHistoryByLanguage(language, params = {}) {
  const { data } = await client.get(`/api/history/language/${language}`, { params });
  return data;
}

export async function getHistoryByAlgorithm(algorithm, params = {}) {
  const { data } = await client.get(`/api/history/algorithm/${algorithm}`, { params });
  return data;
}

export async function getHistoryStats() {
  const { data } = await client.get('/api/history/stats');
  return data;
}

// ── Utilities ──
export function generateRandomArray(size = 10, min = 5, max = 1000) {
  return Array.from({ length: size }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

export const ALGORITHM_INFO = {
  bubble:    { name: 'Bubble Sort',    class: 'O(n²)',      type: 'comparison' },
  selection: { name: 'Selection Sort', class: 'O(n²)',      type: 'comparison' },
  insertion: { name: 'Insertion Sort', class: 'O(n²)',      type: 'comparison' },
  merge:     { name: 'Merge Sort',     class: 'O(n log n)', type: 'comparison' },
  quick:     { name: 'Quick Sort',     class: 'O(n log n)', type: 'comparison' },
  heap:      { name: 'Heap Sort',      class: 'O(n log n)', type: 'comparison' },
  counting:  { name: 'Counting Sort',  class: 'O(n+k)',     type: 'non-comparison' },
  radix:     { name: 'Radix Sort',     class: 'O(nk)',      type: 'non-comparison' },
  bucket:    { name: 'Bucket Sort',    class: 'O(n+k)',     type: 'non-comparison' },
  tim:       { name: 'Tim Sort',       class: 'O(n log n)', type: 'comparison' },
  intro:     { name: 'Intro Sort',     class: 'O(n log n)', type: 'comparison' },
};

export const LANGUAGE_COLORS = {
  c:      '#000000',
  python: '#333333',
  rust:   '#555555',
  csharp: '#777777',
  go:     '#999999',
  cpp:    '#444444',
  java:   '#666666',
};

export const LANGUAGE_NAMES = {
  c: 'C', python: 'Python', rust: 'Rust',
  csharp: 'C#', go: 'Go', cpp: 'C++', java: 'Java',
};
