import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
function App() { return <div className="master"><div className="badge">N</div><p className="eyebrow">MASTER CONTROL</p><h1>NIAGANTARA</h1><p>Platform governance, security, rollout, dan company control.</p><div className="status">Phase 5 integration visibility enabled</div><section className="integration"><h2>Google Sheets reporting</h2><p>Company-scoped OAuth · durable sync queue · recovery history · Supabase source of truth</p><span>No Google credentials or spreadsheet contents are exposed to Master UI.</span></section></div>; }
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
