import React, { useEffect, useState } from 'react';
import { getGrades, getProfessors, getProfessorInsight } from '../utils/api.js';

const GRADE_LABELS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'W'];
const GRADE_COLORS = {
  'A+': '#22c55e', 'A': '#22c55e', 'A-': '#4ade80',
  'B+': '#86efac', 'B': '#a3e635', 'B-': '#bef264',
  'C+': '#fde047', 'C': '#facc15', 'C-': '#fb923c',
  'D+': '#f97316', 'D': '#ef4444', 'D-': '#dc2626',
  'F': '#991b1b', 'W': '#6b7280',
};

function GradeBar({ label, pct }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-6 text-right">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: GRADE_COLORS[label] || '#6b7280' }}
        />
      </div>
      <span className="text-gray-400 w-8">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function CoursePanel({ course, onClose, onAddToPlan }) {
  const [grades, setGrades] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!course) return;
    setLoading(true);
    setGrades(null);
    setProfessors([]);
    setInsight('');

    Promise.allSettled([
      getGrades(course.courseId),
      getProfessors(course.courseId),
    ]).then(([gradesResult, profsResult]) => {
      if (gradesResult.status === 'fulfilled') setGrades(gradesResult.value);
      if (profsResult.status === 'fulfilled') {
        const profs = profsResult.value?.data || [];
        setProfessors(profs);
        if (profs.length >= 2) {
          getProfessorInsight({ courseName: course.name, professors: profs })
            .then(r => setInsight(r.insight || ''))
            .catch(() => {});
        }
      }
    }).finally(() => setLoading(false));
  }, [course?.courseId]);

  if (!course) return null;

  // Aggregate grade distribution across all sections
  const gradeDistribution = {};
  if (grades?.data) {
    for (const section of grades.data) {
      const dist = section.grade_distribution || {};
      for (const [g, count] of Object.entries(dist)) {
        if (g === 'average_gpa' || g === 'total') continue;
        gradeDistribution[g] = (gradeDistribution[g] || 0) + (count || 0);
      }
    }
  }
  const total = Object.values(gradeDistribution).reduce((s, v) => s + v, 0);
  const gradeData = GRADE_LABELS.map(l => ({
    label: l,
    pct: total > 0 ? ((gradeDistribution[l] || 0) / total) * 100 : 0,
  })).filter(g => g.pct > 0);

  const ytLink = `https://www.youtube.com/results?search_query=UTD+${course.courseId}+${encodeURIComponent(course.name)}`;
  const statusBadge = {
    completed: 'bg-green-900 text-green-400',
    available: 'bg-blue-900 text-blue-400',
    planned: 'bg-yellow-900 text-yellow-400',
    locked: 'bg-gray-800 text-gray-400',
  }[course.status] || 'bg-gray-800 text-gray-400';

  return (
    <div className="panel-slide-in w-[380px] flex-shrink-0 bg-space-800 border-l border-blue-900/50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-blue-900/30 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-mono font-bold text-xl text-white">{course.courseId}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge}`}>
                {course.status}
              </span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                {course.creditHours} credits
              </span>
            </div>
            <p className="text-gray-300 text-sm mt-1">{course.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none flex-shrink-0 mt-0.5"
          >✕</button>
        </div>

        {course.prereqString && (
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            <span className="text-gray-400 font-medium">Prereqs: </span>
            {course.prereqString}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Actions */}
        <div className="flex gap-2">
          {course.status === 'available' && (
            <button
              onClick={() => onAddToPlan?.(course)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 px-3 rounded-lg transition-colors font-medium"
            >
              + Add to Plan
            </button>
          )}
          <a
            href={ytLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm py-2 px-3 rounded-lg transition-colors text-center border border-red-900/50"
          >
            YouTube Resources
          </a>
        </div>

        {loading && (
          <div className="text-center py-6 text-gray-500 text-sm">Loading data...</div>
        )}

        {/* Grade Distribution */}
        {!loading && gradeData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Grade Distribution</h3>
            <div className="space-y-1.5">
              {gradeData.map(g => <GradeBar key={g.label} label={g.label} pct={g.pct} />)}
            </div>
            {course.avgGPA && (
              <p className="text-xs text-gray-400 mt-2">Avg GPA: <span className="text-white font-medium">{course.avgGPA.toFixed(2)}</span></p>
            )}
          </div>
        )}

        {/* Professor Comparison */}
        {!loading && professors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Professor Comparison</h3>
            {insight && (
              <p className="text-xs text-blue-300 bg-blue-950/40 rounded-lg p-3 mb-3 leading-relaxed border border-blue-900/30">
                {insight}
              </p>
            )}
            <div className="space-y-2">
              {professors
                .sort((a, b) => (b.avgGpa || 0) - (a.avgGpa || 0))
                .slice(0, 8)
                .map(prof => (
                  <div key={prof.name} className="flex items-center justify-between text-xs bg-space-700 rounded-lg px-3 py-2">
                    <a
                      href={`https://www.ratemyprofessors.com/search/professors?q=${encodeURIComponent(prof.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-medium truncate max-w-[60%]"
                    >
                      {prof.name}
                    </a>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {prof.avgGpa != null ? (
                        <span className={`font-mono ${prof.avgGpa >= 3.0 ? 'text-green-400' : prof.avgGpa >= 2.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {prof.avgGpa.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">No GPA data</span>
                      )}
                      {(prof.sections != null) && (
                        <span className="text-gray-500">{prof.sections} sec</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {!loading && professors.length === 0 && gradeData.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No grade data available yet.</p>
        )}
      </div>
    </div>
  );
}
