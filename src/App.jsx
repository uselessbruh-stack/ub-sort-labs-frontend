import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext } from 'react';
import Navigation from './components/Navigation';
import AlgorithmsTab from './pages/AlgorithmsTab';
import LanguagesTab from './pages/LanguagesTab';
import ComparisonsTab from './pages/ComparisonsTab';
import HistoryTab from './pages/HistoryTab';
import { getLanguages } from './services/api';
import './App.css';

export const AppContext = createContext();

function App() {
  const [languages, setLanguages] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const data = await getLanguages();
      setLanguages(data.languages || []);
      setAlgorithms(data.algorithms || []);
      setBackendStatus('connected');
    } catch {
      setBackendStatus('disconnected');
      setLanguages(['c', 'python', 'rust', 'csharp', 'go', 'cpp', 'java']);
      setAlgorithms(['bubble', 'selection', 'insertion', 'merge', 'quick', 'heap', 'counting', 'radix', 'bucket', 'tim', 'intro']);
    } finally {
      setLoading(false);
    }
  }

  const contextValue = { languages, algorithms, backendStatus };

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-spinner" />
        <p>LOADING UB SORT LABS...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <div className="app-layout">
          <Navigation />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/algorithms" replace />} />
              <Route path="/algorithms" element={<AlgorithmsTab />} />
              <Route path="/languages" element={<LanguagesTab />} />
              <Route path="/comparisons" element={<ComparisonsTab />} />
              <Route path="/history" element={<HistoryTab />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
