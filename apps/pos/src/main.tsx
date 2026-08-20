import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
function App() { return <main className="pos"><div className="logo">N</div><p className="eyebrow">POS / KASIR</p><h1>Siap untuk transaksi.</h1><p>Scanner akan menjadi akselerator, bukan dependency transaksi.</p><button>Mulai shift (Phase 3)</button></main>; }
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
