import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding.jsx';
import { Planner } from './pages/Planner.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                CP
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">
                  CometPath
                </p>
                <p className="text-xs text-slate-400">
                  UTD AI Degree Planner
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/planner" element={<Planner />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
