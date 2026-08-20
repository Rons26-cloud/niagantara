import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return <main className="shell"><div className="mark">N</div><p className="eyebrow">BUSINESS CONTROL PLATFORM</p><h1>NIAGANTARA</h1><p>Fondasi platform bisnis multi-tenant sedang disiapkan.</p></main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
