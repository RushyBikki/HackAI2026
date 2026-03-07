import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

export function AdvisorPanel({ user, courses, onSelectCourse }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const availableCourses = courses?.map((c) => c.courseId || c.id || c._id) || [];
        const gradeData = {}; // front-end leaves grade aggregation to backend for now
        const recs = await api.recommendCourses({
          major: user.major,
          completedCourses: user.completedCourses || [],
          availableCourses,
          gradeData,
        });
        if (!cancelled) setRecommendations(recs || []);
      } catch {
        if (!cancelled) {
          setError('AI advisor is unavailable right now.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, courses]);

  return (
    <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            AI advisor
          </p>
          <p className="text-xs text-slate-400">
            Gemini-powered next semester suggestions
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-slate-400">Generating recommendations…</p>
      )}

      {error && (
        <p className="text-xs text-rose-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && !recommendations.length && (
        <p className="text-xs text-slate-500">
          Recommendations will appear here once your profile and course data are
          loaded.
        </p>
      )}

      <div className="space-y-2">
        {recommendations.map((rec) => (
          <button
            type="button"
            key={rec.courseId}
            onClick={() => onSelectCourse?.(rec.courseId)}
            className="w-full rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-2 text-left text-xs hover:border-emerald-500/70 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-100">
                {rec.courseId} • {rec.name}
              </p>
              <span className="ml-2 rounded-full bg-slate-800 px-1.5 py-0.5 text-[0.65rem] text-slate-300">
                {rec.difficulty || 'Medium'}
              </span>
            </div>
            <p className="mt-1 line-clamp-3 text-[0.7rem] text-slate-300">
              {rec.reasoning}
            </p>
            {rec.recommendedProfessor && (
              <p className="mt-1 text-[0.7rem] text-slate-400">
                Best with {rec.recommendedProfessor}. {rec.professorReasoning}
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

