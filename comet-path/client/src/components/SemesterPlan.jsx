import React, { useState } from 'react';

const UPCOMING_SEMESTERS = [
  'Fall 2026', 'Spring 2027', 'Summer 2027',
  'Fall 2027', 'Spring 2028', 'Summer 2028',
];

export default function SemesterPlan({ plannedSemesters, onUpdate, allCourses }) {
  const [selected, setSelected] = useState(null); // selected semester index

  function removeCourse(semIdx, courseId) {
    const updated = plannedSemesters.map((s, i) =>
      i === semIdx ? { ...s, courses: s.courses.filter(c => c !== courseId) } : s
    );
    onUpdate(updated);
  }

  function addSemester() {
    const used = new Set(plannedSemesters.map(s => s.semester));
    const next = UPCOMING_SEMESTERS.find(s => !used.has(s));
    if (next) onUpdate([...plannedSemesters, { semester: next, courses: [] }]);
  }

  const totalCredits = (courses) =>
    courses.reduce((sum, cId) => {
      const c = allCourses?.find(a => (a._id || a.course_number) === cId);
      return sum + (c?.credit_hours || c?.semester_credit_hours || 3);
    }, 0);

  return (
    <div className="bg-space-800 border-t border-blue-900/50 flex-shrink-0">
      <div className="px-4 py-3 flex items-center justify-between border-b border-blue-900/30">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>📅</span> Semester Planner
        </h3>
        <button
          onClick={addSemester}
          className="text-xs text-blue-400 hover:text-white border border-blue-900/50 hover:border-blue-500 rounded px-2 py-1 transition-colors"
        >
          + Add Semester
        </button>
      </div>

      {plannedSemesters.length === 0 ? (
        <div className="px-4 py-4 text-xs text-gray-500 text-center">
          Click "Add to Plan" on any available course node to start building semesters
        </div>
      ) : (
        <div className="flex gap-3 px-4 py-3 overflow-x-auto">
          {plannedSemesters.map((sem, idx) => {
            const credits = totalCredits(sem.courses);
            const creditWarning = credits > 18 ? 'text-red-400' : credits < 12 && credits > 0 ? 'text-yellow-400' : 'text-green-400';
            return (
              <div
                key={sem.semester}
                className={`flex-shrink-0 w-44 bg-space-700 rounded-xl border transition-colors ${
                  selected === idx ? 'border-blue-500' : 'border-blue-900/30'
                }`}
                onClick={() => setSelected(selected === idx ? null : idx)}
              >
                <div className="px-3 py-2 border-b border-blue-900/20">
                  <p className="text-xs font-semibold text-white truncate">{sem.semester}</p>
                  <p className={`text-xs font-mono ${creditWarning}`}>
                    {credits} credits
                    {credits > 18 && ' ⚠️ Overload'}
                    {credits > 0 && credits < 12 && ' ⚠️ Light'}
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  {sem.courses.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-2">Empty</p>
                  )}
                  {sem.courses.map(cId => (
                    <div
                      key={cId}
                      className="flex items-center justify-between bg-space-900 rounded px-2 py-1 group"
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="text-xs font-mono text-yellow-300 truncate">{cId}</span>
                      <button
                        onClick={() => removeCourse(idx, cId)}
                        className="text-gray-600 hover:text-red-400 text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
