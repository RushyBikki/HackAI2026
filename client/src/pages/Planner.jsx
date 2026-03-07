import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { TechTree } from '../components/TechTree.jsx';
import { CoursePanel } from '../components/CoursePanel.jsx';
import { AdvisorPanel } from '../components/AdvisorPanel.jsx';
import { WhatIfModal } from '../components/WhatIfModal.jsx';
import { SemesterPlan } from '../components/SemesterPlan.jsx';

export function Planner() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = window.localStorage.getItem('cometpathUserId');
    if (!userId) {
      setLoading(false);
      setError('No saved profile found. Go back and complete onboarding.');
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const profile = await api.loadUserProfile(userId);
        if (cancelled) return;
        setUser(profile);
        const courseData = await api.fetchCourses({ prefix: 'CS' });
        if (!cancelled) {
          setCourses(courseData ?? []);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load planner data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        Loading your degree plan…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-100">
        <p className="font-medium">Profile not found</p>
        <p className="text-amber-100/80">
          I couldn&apos;t find a saved profile. Go back to the onboarding page
          to set up your degree.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {user.name}&apos;s degree map
            </p>
            <p className="text-xs text-slate-400">
              {user.major} • {user.completedCourses?.length ?? 0} completed
              courses
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWhatIf(true)}
            className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            What-if major switch
          </button>
        </div>

        <div className="h-[540px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <TechTree
            courses={courses}
            user={user}
            plannedSemesters={user.plannedSemesters ?? []}
            onSelectCourse={setSelectedCourseId}
            selectedCourseId={selectedCourseId}
          />
        </div>

        <SemesterPlan
          user={user}
          onUserChange={setUser}
        />
      </div>

      <div className="space-y-3">
        <AdvisorPanel user={user} courses={courses} onSelectCourse={setSelectedCourseId} />
        <CoursePanel
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
          onAddToPlan={() => {}}
        />
      </div>

      {showWhatIf && (
        <WhatIfModal
          user={user}
          onClose={() => setShowWhatIf(false)}
        />
      )}
    </div>
  );
}

