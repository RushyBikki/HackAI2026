import { useState } from 'react';
import { api } from '../utils/api.js';

export function WhatIfModal({ user, onClose }) {
  const [targetMajor, setTargetMajor] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetMajor.trim()) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.whatIfMajor({
        currentMajor: user.major,
        completedCourses: user.completedCourses || [],
        targetMajor: targetMajor.trim(),
      });
      setResult(res);
    } catch {
      setError('What-if analysis failed. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900/95 p-4 text-sm shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              What-if mode
            </p>
            <p className="text-sm font-medium text-slate-50">
              Switch from {user.major}?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Target major
            </label>
            <input
              type="text"
              value={targetMajor}
              onChange={(e) => setTargetMajor(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring"
              placeholder="e.g. Cognitive Science"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/70"
          >
            {loading ? 'Analyzing…' : 'Run what-if analysis'}
          </button>

          {error && (
            <p className="text-xs text-rose-400" role="alert">
              {error}
            </p>
          )}
        </form>

        {result && (
          <div className="mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs font-semibold text-slate-300">
              Summary
            </p>
            {result.summary && (
              <p className="text-xs text-slate-200 whitespace-pre-wrap">
                {result.summary}
              </p>
            )}

            <div className="grid gap-3 text-xs md:grid-cols-3">
              <div>
                <p className="font-medium text-emerald-300">
                  Credits kept
                </p>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {(result.keptCourses || []).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-rose-300">
                  Credits lost
                </p>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {(result.lostCourses || []).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-sky-300">
                  New requirements
                </p>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  {(result.newCourses || []).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {result.extraSemesters != null && (
              <p className="text-xs text-slate-400">
                Estimated extra semesters: {result.extraSemesters}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

