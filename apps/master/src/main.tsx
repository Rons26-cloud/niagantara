import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
function App() { return <div className="master"><div className="badge">N</div><p className="eyebrow">MASTER CONTROL</p><h1>NIAGANTARA</h1><p>Platform governance, security, rollout, dan company control.</p><div className="status">Foundation ready · authentication and authorization follow Phase 1.</div></div>; }
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
