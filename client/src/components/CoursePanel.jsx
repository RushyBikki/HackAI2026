import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

export function CoursePanel({ courseId, onClose, onAddToPlan }) {
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState(null);
  const [professors, setProfessors] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [c, g, p] = await Promise.all([
          api.fetchCourse(courseId),
          api.fetchGrades(courseId).catch(() => null),
          api.fetchProfessors(courseId).catch(() => null),
        ]);
        if (cancelled) return;
        setCourse(c);
        setGrades(g);
        setProfessors(p);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!courseId) return null;

  const courseCode = course?.courseId || courseId;
  const courseName = course?.name || course?.title || courseCode;
  const prereqText =
    course?.prerequisites || course?.prereq || course?.preReq || 'See catalog.';

  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `UTD ${courseCode} ${courseName}`,
  )}`;

  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Course details
          </p>
          <p className="text-sm font-medium text-slate-50">
            {courseCode} • {courseName}
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

      {loading && (
        <p className="mt-3 text-xs text-slate-400">Loading course insights…</p>
      )}

      {!loading && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-300">Prerequisites</p>
            <p className="mt-0.5 text-xs text-slate-400">{prereqText}</p>
          </div>

          {grades && Array.isArray(grades.buckets) && (
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Grade distribution
              </p>
              <div className="mt-1 space-y-1">
                {grades.buckets.map((bucket) => (
                  <div key={bucket.letter} className="flex items-center gap-2">
                    <span className="w-4 text-[0.7rem] text-slate-400">
                      {bucket.letter}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${bucket.percent || 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[0.7rem] text-slate-400">
                      {(bucket.percent || 0).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {professors && Array.isArray(professors.items) && (
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Professors
              </p>
              <div className="mt-1 space-y-1 rounded-md border border-slate-800 bg-slate-950/60 p-2">
                {professors.items.map((prof) => (
                  <div
                    key={prof.name}
                    className="flex items-center justify-between text-[0.7rem]"
                  >
                    <span className="text-slate-200">{prof.name}</span>
                    <span className="text-slate-400">
                      Avg GPA {prof.avgGPA?.toFixed(2) ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onAddToPlan?.(courseCode)}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Add to semester plan
            </button>
            <a
              href={ytUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-sky-500 hover:text-sky-300"
            >
              YouTube resources
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}

