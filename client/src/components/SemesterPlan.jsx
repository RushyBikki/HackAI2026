import { useState } from 'react';
import { api } from '../utils/api.js';

const DEFAULT_SEMESTERS = ['Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028'];

export function SemesterPlan({ user, onUserChange }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const semesters = user.plannedSemesters?.length
    ? user.plannedSemesters
    : DEFAULT_SEMESTERS.map((s) => ({ semester: s, courses: [] }));

  const updateSemesters = (next) => {
    onUserChange({ ...user, plannedSemesters: next });
  };

  const addCourseToNext = (courseId) => {
    const next = semesters.map((s) => ({ ...s, courses: [...(s.courses || [])] }));
    for (const sem of next) {
      if (!sem.courses.includes(courseId)) {
        sem.courses.push(courseId);
        break;
      }
    }
    updateSemesters(next);
  };

  const removeCourse = (semesterIndex, courseId) => {
    const next = semesters.map((s, idx) => ({
      ...s,
      courses:
        idx === semesterIndex
          ? (s.courses || []).filter((c) => c !== courseId)
          : [...(s.courses || [])],
    }));
    updateSemesters(next);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await api.saveUserProfile({
        ...user,
        plannedSemesters: semesters,
      });
    } catch {
      setError('Failed to save semester plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-100">Semester builder</p>
          <p className="text-[0.7rem] text-slate-400">
            Drop recommended courses into upcoming semesters.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-emerald-500 px-2 py-1 text-[0.7rem] font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/70"
        >
          {saving ? 'Saving…' : 'Save plan'}
        </button>
      </div>

      {error && (
        <p className="text-[0.7rem] text-rose-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-1 grid gap-2 md:grid-cols-4">
        {semesters.map((sem, idx) => {
          const totalHours = (sem.courses || []).length * 3;
          const overloaded = totalHours > 18;
          const underloaded = totalHours < 12 && totalHours > 0;

          return (
            <div
              key={sem.semester}
              className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/60 p-2"
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-[0.7rem] font-semibold text-slate-100">
                  {sem.semester}
                </p>
                <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[0.65rem] text-slate-300">
                  {totalHours} hrs
                </span>
              </div>

              <ul className="space-y-0.5">
                {(sem.courses || []).map((c) => (
                  <li
                    key={c}
                    className="flex items-center justify-between rounded-md bg-slate-900 px-1.5 py-1 text-[0.7rem] text-slate-200"
                  >
                    <span className="truncate">{c}</span>
                    <button
                      type="button"
                      onClick={() => removeCourse(idx, c)}
                      className="ml-1 text-[0.65rem] text-slate-400 hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {!sem.courses?.length && (
                  <li className="text-[0.65rem] italic text-slate-500">
                    No courses yet
                  </li>
                )}
              </ul>

              {overloaded && (
                <p className="text-[0.65rem] text-amber-300">
                  Warning: heavy semester (&gt; 18 hours)
                </p>
              )}
              {underloaded && (
                <p className="text-[0.65rem] text-sky-300">
                  Under 12 hours – may not be full-time.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

SemesterPlan.addCourseToNext = () => {};

