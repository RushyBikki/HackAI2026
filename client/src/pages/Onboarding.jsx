import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

const MAJORS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Computer Engineering',
  'Cognitive Science',
  'Information Technology',
];

export function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [customMajor, setCustomMajor] = useState('');
  const [courses, setCourses] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const effectiveMajor = major === 'custom' ? customMajor : major;

  useEffect(() => {
    if (!major || major === 'custom') {
      setCourses([]);
      return;
    }

    const abort = new AbortController();
    setLoadingCourses(true);
    setError('');

    api
      .fetchCourses({ prefix: 'CS', signal: abort.signal })
      .then((data) => {
        setCourses(data ?? []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Failed to load courses. You can still continue without checklist.');
        }
      })
      .finally(() => setLoadingCourses(false));

    return () => abort.abort();
  }, [major]);

  const toggleCompleted = (courseId) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) =>
        (a.courseId ?? a.id ?? '').localeCompare(b.courseId ?? b.id ?? ''),
      ),
    [courses],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !effectiveMajor.trim()) {
      setError('Please enter your name and major.');
      return;
    }

    try {
      setSaving(true);
      const profile = {
        name: name.trim(),
        major: effectiveMajor.trim(),
        completedCourses: Array.from(completed),
        plannedSemesters: [],
      };
      const saved = await api.saveUserProfile(profile);
      if (saved && saved._id) {
        window.localStorage.setItem('cometpathUserId', saved._id);
      }
      navigate('/planner');
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Welcome to CometPath
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Tell us a bit about yourself and which courses you&apos;ve already
          completed. We&apos;ll build your degree tech tree from there.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-200">
              Name
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Comet Coder"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-200">
              Major
            </label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            >
              <option value="">Select major…</option>
              {MAJORS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="custom">Other (type manually)</option>
            </select>
            {major === 'custom' && (
              <input
                type="text"
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring"
                value={customMajor}
                onChange={(e) => setCustomMajor(e.target.value)}
                placeholder="e.g. Mathematics"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/60"
          >
            {saving ? 'Saving…' : 'Continue to Planner'}
          </button>

          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            You can always adjust your completed courses and plan later in the
            planner view.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-100">
                Completed courses
              </p>
              <p className="text-xs text-slate-400">
                {loadingCourses
                  ? 'Loading course list from Nebula…'
                  : courses.length
                  ? 'Check everything you have already taken.'
                  : 'Select a major to load courses.'}
              </p>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
              {completed.size} selected
            </span>
          </div>

          <div className="h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-sm">
            {loadingCourses && (
              <p className="px-1 py-2 text-xs text-slate-400">
                Fetching courses…
              </p>
            )}
            {!loadingCourses && !sortedCourses.length && (
              <p className="px-1 py-2 text-xs text-slate-500">
                Courses will appear here after selecting a major. You can skip
                this step for now.
              </p>
            )}
            <ul className="space-y-1">
              {sortedCourses.map((course) => {
                const id = course.courseId ?? course.id ?? course._id;
                const label = `${id ?? 'COURSE'} • ${course.name ?? course.title ?? ''}`;
                const checked = id ? completed.has(id) : false;
                return (
                  <li key={id ?? label}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-800/60">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                        checked={checked}
                        onChange={() => id && toggleCompleted(id)}
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}

