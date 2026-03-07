import React, { useState } from 'react';
import { getWhatIf } from '../utils/api.js';

const UTD_MAJORS = [
  'Computer Science', 'Software Engineering', 'Computer Engineering',
  'Electrical Engineering', 'Mechanical Engineering', 'Cognitive Science',
  'Information Technology', 'Mathematics', 'Physics', 'Chemistry',
  'Neuroscience', 'Biomedical Engineering',
];

export default function WhatIfModal({ user, onClose }) {
  const [targetMajor, setTargetMajor] = useState('Cognitive Science');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await getWhatIf({
        currentMajor: user.major,
        targetMajor,
        completedCourses: user.completedCourses,
        currentRequirements: [],
        targetRequirements: [],
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const available = UTD_MAJORS.filter(m => m !== user.major);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-space-800 rounded-2xl border border-blue-900/50 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-blue-900/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">What-If Major Switch</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Explore switching from <span className="text-white">{user.major}</span> to another major
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm text-blue-300 mb-1">Target major</label>
            <select
              className="w-full bg-space-700 border border-blue-900 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              value={targetMajor}
              onChange={e => setTargetMajor(e.target.value)}
            >
              {available.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Switch'}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {result && (
            <div className="space-y-4">
              {/* Summary from Gemini */}
              <div className="bg-purple-950/40 border border-purple-900/50 rounded-xl p-4">
                <p className="text-sm text-purple-200 leading-relaxed">{result.summary}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-space-700 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{result.creditOverlap}</div>
                  <div className="text-xs text-gray-400 mt-1">Credits kept</div>
                </div>
                <div className="bg-space-700 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{result.lostCourses?.length || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Lost</div>
                </div>
                <div className="bg-space-700 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{result.neededCourses?.length || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">New needed</div>
                </div>
              </div>

              {result.keptCourses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-400 mb-2">Courses that transfer</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keptCourses.map(c => (
                      <span key={c} className="text-xs bg-green-950/40 text-green-400 border border-green-900/50 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.lostCourses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-2">Courses that don't count</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.lostCourses.map(c => (
                      <span key={c} className="text-xs bg-red-950/40 text-red-400 border border-red-900/50 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
