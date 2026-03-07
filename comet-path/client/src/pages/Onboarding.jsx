import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, saveUser } from '../utils/api.js';
import TranscriptUpload from '../components/TranscriptUpload.jsx';

const UTD_MAJORS = [
  'Computer Science',
  'Software Engineering',
  'Computer Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Cognitive Science',
  'Information Technology',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Neuroscience',
  'Biomedical Engineering',
];

const MAJOR_PREFIXES = {
  'Computer Science': ['CS', 'MATH', 'ECS', 'SE'],
  'Software Engineering': ['SE', 'CS', 'MATH', 'ECS'],
  'Computer Engineering': ['CE', 'CS', 'EE', 'MATH'],
  'Electrical Engineering': ['EE', 'MATH', 'PHYS'],
  'Mechanical Engineering': ['MECH', 'MATH', 'PHYS'],
  'Cognitive Science': ['CGS', 'CS', 'PSYC', 'COMM'],
  'Information Technology': ['MIS', 'CS', 'MATH'],
  'Mathematics': ['MATH', 'CS', 'STAT'],
  'Physics': ['PHYS', 'MATH'],
  'Chemistry': ['CHEM', 'MATH', 'PHYS'],
  'Neuroscience': ['NSC', 'BIOL', 'CHEM'],
  'Biomedical Engineering': ['BMEN', 'BIOL', 'CHEM', 'MATH'],
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=profile, 2=courses
  const [name, setName] = useState('');
  const [major, setMajor] = useState('Computer Science');
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
      // Deduplicate
      const seen = new Set();
      const deduped = all.filter(c => {
        const id = c._id || c.course_number;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      deduped.sort((a, b) => {
        const aId = a._id || a.course_number || '';
        const bId = b._id || b.course_number || '';
        return aId.localeCompare(bId);
      });
      setCourses(deduped);
    } catch (e) {
      setError('Could not load courses from Nebula API. Check your server is running.');
    } finally {
      setLoading(false);
    }
  }

  function toggleCourse(id) {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) return setError('Please enter your name.');
    setSaving(true);
    setError('');
    try {
      await saveUser({ name: name.trim(), major, completedCourses: [...completed] });
      localStorage.setItem('cometpath_user', name.trim());
      navigate('/planner');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = courses.filter(c => {
    const id = c._id || c.course_number || '';
    const title = c.title || c.long_title || '';
    return (
      id.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase())
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
                  onChange={e => setMajor(e.target.value)}
                >
                  {UTD_MAJORS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
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
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="text-blue-400 hover:text-white text-sm">← Back</button>
              <h2 className="text-2xl font-semibold text-white">Mark completed courses</h2>
            </div>

            <p className="text-blue-300 text-sm mb-4">
              Major: <span className="text-white font-medium">{major}</span> •
              Selected: <span className="text-green-400 font-medium">{completed.size}</span> courses
            </p>

            {/* Transcript upload shortcut */}
            <div className="mb-4 bg-space-900/60 border border-blue-900/40 rounded-xl p-4">
              <p className="text-xs text-blue-300 font-medium mb-2">
                Auto-import from UTD transcript
              </p>
              <TranscriptUpload
                onCoursesExtracted={(ids) => {
                  setCompleted(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.add(id));
                    return next;
                  });
                }}
              />
            </div>

            <input
              className="w-full bg-space-700 border border-blue-900 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-blue-500"
              placeholder="Search courses..."
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

            {!loading && courses.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
                {filtered.map(course => {
                  const id = course._id || course.course_number;
                  const title = course.title || course.long_title || '';
                  const credits = course.credit_hours || course.semester_credit_hours || 3;
                  const done = completed.has(id);
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        done ? 'bg-green-900/30 border border-green-700/50' : 'hover:bg-space-700 border border-transparent'
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
                      <span className="text-gray-500 text-xs flex-shrink-0">{credits} cr</span>
                    </label>
                  );
                })}
              </div>
            )}

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
