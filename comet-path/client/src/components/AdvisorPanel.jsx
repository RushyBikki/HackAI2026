import React, { useState } from 'react';
import { getRecommendations } from '../utils/api.js';

const DIFFICULTY_COLORS = {
  Easy: 'text-green-400 bg-green-950/40 border-green-800/50',
  Medium: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50',
  Hard: 'text-red-400 bg-red-950/40 border-red-800/50',
};

export default function AdvisorPanel({ user, availableCourses, onHighlight }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  async function fetchRecs() {
    setLoading(true);
    setError('');
    try {
      const result = await getRecommendations({
        major: user.major,
        completedCourses: user.completedCourses,
        availableCourses: availableCourses.slice(0, 20), // limit payload
        gradeData: {},
      });
      setRecs(result.recommendations || []);
    } catch (e) {
      setError(e.message.includes('GEMINI_API_KEY') ? 'Gemini API key not configured.' : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-[320px] flex-shrink-0 bg-space-800 border-r border-blue-900/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-blue-900/30 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🤖</span>
          <h2 className="font-semibold text-white">AI Advisor</h2>
        </div>
        <p className="text-xs text-gray-400">
          Personalized course recommendations from Gemini
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {recs.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">
              Get AI-powered course recommendations for next semester based on your completed courses and goals.
            </p>
            <button
              onClick={fetchRecs}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full"
            >
              Get Recommendations
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-3xl animate-pulse mb-3">🤖</div>
            <p className="text-blue-400 text-sm">Gemini is analyzing your profile...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 text-sm text-red-400">
            {error}
            <button onClick={fetchRecs} className="block mt-2 text-blue-400 underline text-xs">
              Retry
            </button>
          </div>
        )}

        {recs.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{recs.length} recommendations</p>
              <button onClick={fetchRecs} className="text-xs text-blue-400 hover:underline">Refresh</button>
            </div>
            <div className="space-y-3">
              {recs.map((rec, i) => {
                const isOpen = expanded === i;
                const diffStyle = DIFFICULTY_COLORS[rec.difficulty] || DIFFICULTY_COLORS.Medium;
                return (
                  <div
                    key={i}
                    className="bg-space-700 rounded-xl border border-blue-900/30 overflow-hidden"
                  >
                    <div
                      className="p-3 cursor-pointer hover:bg-space-600 transition-colors"
                      onClick={() => {
                        setExpanded(isOpen ? null : i);
                        onHighlight?.(rec.courseId);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-sm font-bold text-white">{rec.courseId}</span>
                          <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">{rec.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${diffStyle}`}>
                            {rec.difficulty}
                          </span>
                          <span className="text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-3 pb-3 border-t border-blue-900/20 pt-2 space-y-2">
                        <p className="text-xs text-gray-300 leading-relaxed">{rec.reasoning}</p>
                        {rec.recommendedProfessor && (
                          <div className="bg-space-900 rounded-lg px-3 py-2">
                            <p className="text-xs text-blue-400 font-medium">Recommended: {rec.recommendedProfessor}</p>
                            {rec.professorReasoning && (
                              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{rec.professorReasoning}</p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => onHighlight?.(rec.courseId)}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          Show on tree →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Stats footer */}
      <div className="p-4 border-t border-blue-900/30 flex-shrink-0">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-lg font-bold text-white">{user?.completedCourses?.length || 0}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">{availableCourses?.length || 0}</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">{user?.plannedSemesters?.reduce((s, sem) => s + sem.courses.length, 0) || 0}</div>
            <div className="text-xs text-gray-500">Planned</div>
          </div>
        </div>
      </div>
    </div>
  );
}
