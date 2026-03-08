import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, saveUser } from '../utils/api.js';
import TranscriptUpload from '../components/TranscriptUpload.jsx';
import { normalizeCourseId } from '../utils/graphBuilder.js';
import { CONCENTRATION_RULES } from '../utils/degreeData.js';

// UTD 2025-2026 catalog — all degree programs
const UTD_MAJORS = [
  // ECS
  'Computer Science',
  'Software Engineering',
  'Computer Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Data Science',
  'Biomedical Engineering',
  'Systems Engineering',
  // BBS
  'Cognitive Science',
  'Neuroscience',
  'Psychology',
  // NSM
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Biochemistry',
  // JSOM
  'Computer Information Systems and Technology',
  'Business Administration',
  'Finance',
  // EPPS
  'Economics',
];

// Course prefixes needed per major to pull from Nebula API
const MAJOR_PREFIXES = {
  'Computer Science':      ['CS', 'MATH', 'ECS', 'SE', 'PHYS'],
  'Software Engineering':  ['SE', 'CS', 'MATH', 'ECS', 'PHYS'],
  'Computer Engineering':  ['CE', 'CS', 'EE', 'ENGR', 'MATH', 'PHYS', 'STAT'],
  'Electrical Engineering':['EE', 'ENGR', 'MATH', 'PHYS', 'CHEM'],
  'Mechanical Engineering':['MECH', 'ENGR', 'MATH', 'PHYS', 'CHEM', 'CS'],
  'Data Science':          ['CS', 'MATH', 'STAT', 'PHYS'],
  'Biomedical Engineering':['BMEN', 'BIOL', 'CHEM', 'MATH', 'PHYS'],
  'Systems Engineering':   ['SYS', 'ECS', 'ENGR', 'MATH', 'CS'],
  'Cognitive Science':     ['CGS', 'CS', 'PSY', 'NSC', 'BIOL', 'STAT', 'MATH'],
  'Neuroscience':          ['NSC', 'BIOL', 'CHEM', 'PHYS', 'MATH', 'PSY'],
  'Psychology':            ['PSY', 'STAT', 'MATH', 'NSC'],
  'Mathematics':           ['MATH', 'STAT', 'CS', 'PHYS'],
  'Physics':               ['PHYS', 'MATH', 'CHEM'],
  'Chemistry':             ['CHEM', 'MATH', 'PHYS', 'BIOL'],
  'Biology':               ['BIOL', 'CHEM', 'MATH', 'PHYS', 'STAT'],
  'Biochemistry':          ['BIOL', 'CHEM', 'MATH', 'PHYS', 'STAT'],
  'Computer Information Systems and Technology': ['ITSS', 'MIS', 'CS', 'MATH', 'STAT', 'BA'],
  'Business Administration':['BA', 'ACCT', 'FIN', 'MKT', 'OPRE', 'MATH', 'STAT'],
  'Finance':               ['FIN', 'ACCT', 'BA', 'MATH', 'STAT', 'ECON'],
  'Economics':             ['ECON', 'MATH', 'STAT'],
};

// Elective tracks / concentrations per major (UTD 2025-2026 catalog)
const ELECTIVE_TRACKS = {
  'Computer Science': [
    'Undecided',
    'Artificial Intelligence & Machine Learning',
    'Cybersecurity & Networks',
    'Data Science',
    'Human-Computer Interaction',
    'Software Engineering',
    'Systems & Architecture',
  ],
  'Software Engineering': [
    'Undecided',
    'Enterprise Systems',
    'Embedded & Real-Time Systems',
    'Security Engineering',
  ],
  'Computer Engineering': [
    'Undecided',
    'Computing Systems & Architecture',
    'Circuits & Devices',
    'Communications & Signal Processing',
    'Power Electronics & Robotics',
    'Software & Machine Learning',
  ],
  'Electrical Engineering': [
    'Undecided',
    'Circuits',
    'Computing Systems',
    'Devices',
    'Power Electronics & Energy Systems',
    'Signals & Systems',
  ],
  'Cognitive Science': [
    'Undecided',
    'Psychology Track',
    'Neuroscience Track',
    'Human-Computer Interaction Track',
    'Intelligent Systems Track',
  ],
  'Computer Information Systems and Technology': [
    'Undecided',
    'Business Intelligence & Analytics',
    'Enterprise Systems',
    'IT Sales Engineering',
    'IT Innovation & Entrepreneurship',
    'Cybersecurity Management',
    'Information Technology & Systems',
  ],
  'Mathematics': [
    'Undecided',
    'Pure Mathematics',
    'Statistics',
    'Applied Mathematics',
  ],
  'Neuroscience': [
    'Undecided',
    'Medical Neuroscience Track',
    'Research Neuroscience Track',
    'Industrial Neuroscience Track',
  ],
  'Finance': [
    'Undecided',
    'Investment',
    'Financial Management',
    'FinTech',
    'Real Estate Finance',
    'Risk Management and Insurance Technology',
  ],
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=profile, 2=courses
  const [name, setName] = useState('');
  const [major, setMajor] = useState('Computer Science');
  const [concentrations, setConcentrations] = useState(['Undecided', 'Undecided']);
  const [transferInput, setTransferInput] = useState('');
  const [courses, setCourses] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function loadCourses() {
    setLoading(true);
    setError('');
    try {
      const prefixes = MAJOR_PREFIXES[major] || ['CS'];
      const results = await Promise.allSettled(prefixes.map(p => getCourses(p)));
      const all = [];
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value?.data) {
          all.push(...r.value.data);
        }
      }
      // Deduplicate by courseId (e.g. "CS1337") — set by server normalizeCourse()
      const seen = new Set();
      const deduped = all.filter(c => {
        const id = c.courseId;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      deduped.sort((a, b) => (a.courseId || '').localeCompare(b.courseId || ''));
      setCourses(deduped);
    } catch (e) {
      setError('Could not load courses from Nebula API. Check your server is running.');
    } finally {
      setLoading(false);
    }
  }

  function toggleCourse(id) {
    const normalized = normalizeCourseId(id);
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(normalized)) next.delete(normalized);
      else next.add(normalized);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) return setError('Please enter your name.');
    setSaving(true);
    setError('');
    try {
      const transferCourses = transferInput
        .split(',')
        .map(s => normalizeCourseId(s.trim()))
        .filter(Boolean);
      const selectedConcentrations = concentrations.filter(c => c && c !== 'Undecided');
      await saveUser({
        name: name.trim(),
        major,
        concentration: selectedConcentrations[0] || 'Undecided',
        concentrations: selectedConcentrations,
        completedCourses: [...completed],
        transferCourses,
      });
      localStorage.setItem('cometpath_user', name.trim());
      navigate('/planner');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = courses.filter(c => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      (c.courseId || '').toLowerCase().includes(term) ||
      (c.title || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-space-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">☄️</div>
        <h1 className="text-4xl font-bold text-white tracking-tight">CometPath</h1>
        <p className="text-blue-400 mt-1">UTD AI Degree Planner</p>
      </div>

      <div className="w-full max-w-2xl bg-space-800 rounded-2xl border border-blue-900/50 p-8">
        {step === 1 && (
          <>
            <h2 className="text-2xl font-semibold text-white mb-6">Set up your profile</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-blue-300 mb-1">Your name</label>
                <input
                  className="w-full bg-space-700 border border-blue-900 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
                />
              </div>

              <div>
                <label className="block text-sm text-blue-300 mb-1">Your major</label>
                <select
                  className="w-full bg-space-700 border border-blue-900 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={major}
                  onChange={e => { setMajor(e.target.value); setConcentrations(['Undecided', 'Undecided']); }}
                >
                  {UTD_MAJORS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {ELECTIVE_TRACKS[major] && (() => {
                const rule = CONCENTRATION_RULES[major];
                const required = rule?.required ?? 0;
                const numDropdowns = required === 2 ? 2 : 1;
                return (
                  <div className="space-y-3">
                    {Array.from({ length: numDropdowns }, (_, idx) => (
                      <div key={idx}>
                        <label className="block text-sm text-blue-300 mb-1">
                          {numDropdowns === 2 ? `Concentration ${idx + 1}` : 'Elective track / concentration'}
                          {required === 0 && <span className="text-gray-500 ml-1">(optional)</span>}
                        </label>
                        <select
                          className="w-full bg-space-700 border border-blue-900 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                          value={concentrations[idx] || 'Undecided'}
                          onChange={e => {
                            const next = [...concentrations];
                            next[idx] = e.target.value;
                            setConcentrations(next);
                          }}
                        >
                          {ELECTIVE_TRACKS[major].map(t => {
                            const otherIdx = idx === 0 ? 1 : 0;
                            const otherVal = concentrations[otherIdx];
                            const disabled = numDropdowns === 2 && t !== 'Undecided' && t === otherVal;
                            return (
                              <option key={t} value={t} disabled={disabled}>{t}</option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

            <button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
              onClick={() => {
                if (!name.trim()) { setError('Please enter your name.'); return; }
                setError('');
                setStep(2);
                loadCourses();
              }}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep(1)} className="text-blue-400 hover:text-white text-sm">← Back</button>
              <h2 className="text-2xl font-semibold text-white">Mark completed courses</h2>
            </div>

            {/* Prominent instructions */}
            <div className="mb-4 bg-blue-950/40 border border-blue-700/40 rounded-xl p-4">
              <p className="text-sm text-white font-medium mb-1">How to fill this in:</p>
              <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
                <li><span className="text-yellow-300 font-semibold">Option A — Upload transcript:</span> Drop your UTD unofficial transcript PDF below to auto-fill all completed courses instantly.</li>
                <li><span className="text-yellow-300 font-semibold">Option B — Select manually:</span> Scroll the list below and check off each course you've finished.</li>
              </ol>
            </div>

            <p className="text-blue-300 text-sm mb-4">
              Major: <span className="text-white font-medium">{major}</span> •
              Selected: <span className="text-green-400 font-medium">{completed.size}</span> courses
            </p>

            {/* Transcript upload shortcut */}
            <div className="mb-4 bg-space-900/60 border border-blue-900/40 rounded-xl p-4">
              <p className="text-xs text-blue-300 font-medium mb-2">
                Option A — Upload UTD transcript (PDF or paste text)
              </p>
              <TranscriptUpload
                onCoursesExtracted={(ids) => {
                  setCompleted(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.add(normalizeCourseId(id)));
                    return next;
                  });
                }}
              />
            </div>

            {/* Transfer credits */}
            <div className="mb-4 bg-space-900/60 border border-green-900/40 rounded-xl p-4">
              <p className="text-xs text-green-300 font-medium mb-1">Transfer credits</p>
              <p className="text-xs text-gray-500 mb-2">Comma-separated course IDs taken at another institution (e.g. MATH2413, PHYS2325)</p>
              <input
                className="w-full bg-space-700 border border-green-900/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-600"
                placeholder="MATH2413, PHYS2325, ..."
                value={transferInput}
                onChange={e => setTransferInput(e.target.value)}
              />
            </div>

            <p className="text-xs text-blue-300 font-medium mb-2">Option B — Select courses manually</p>
            <input
              className="w-full bg-space-700 border border-blue-900 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-blue-500"
              placeholder="Search courses by ID or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {loading && (
              <div className="text-center py-12 text-blue-400">
                <div className="animate-spin text-3xl mb-3">⟳</div>
                Loading courses from Nebula API...
              </div>
            )}

            {!loading && courses.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {error ? (
                  <div>
                    <p className="text-red-400 mb-2">{error}</p>
                    <button onClick={loadCourses} className="text-blue-400 underline text-sm">Retry</button>
                  </div>
                ) : (
                  <p>No courses found.</p>
                )}
              </div>
            )}

            {!loading && courses.length > 0 && (() => {
              const transferIds = new Set(
                transferInput.split(',').map(s => normalizeCourseId(s.trim())).filter(Boolean)
              );
              return (
                <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
                  {filtered.map(course => {
                    const id = course.courseId;
                    const title = course.title || '';
                    const credits = parseInt(course.credit_hours, 10) || 3;
                    const done = completed.has(id);
                    const isTransfer = transferIds.has(id);
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          isTransfer ? 'bg-green-950/40 border border-green-800/50'
                          : done ? 'bg-green-900/30 border border-green-700/50'
                          : 'hover:bg-space-700 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleCourse(id)}
                          className="w-4 h-4 accent-green-500 flex-shrink-0"
                        />
                        <span className="text-blue-300 font-mono text-sm w-20 flex-shrink-0">{id}</span>
                        <span className="text-white text-sm flex-1 truncate">{title}</span>
                        {isTransfer && <span className="text-green-400 text-xs font-bold bg-green-900/40 px-1.5 py-0.5 rounded flex-shrink-0">T</span>}
                        <span className="text-gray-500 text-xs flex-shrink-0">{credits} cr</span>
                      </label>
                    );
                  })}
                </div>
              );
            })()}

            {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}

            <button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : `Build My Degree Tree →`}
            </button>
          </>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-6">Powered by Nebula Labs API + Google Gemini</p>
    </div>
  );
}
