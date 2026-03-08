import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, getCourses, updatePlan } from '../utils/api.js';
import { buildGraph, normalizeCourseId } from '../utils/graphBuilder.js';
import { MAJOR_CORE, CONCENTRATION_COURSES } from '../utils/degreeData.js';
import TechTree from '../components/TechTree.jsx';
import CoursePanel from '../components/CoursePanel.jsx';
import AdvisorPanel from '../components/AdvisorPanel.jsx';
import SemesterPlan from '../components/SemesterPlan.jsx';
import WhatIfModal from '../components/WhatIfModal.jsx';

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

const DEPT_COLORS = {
  CS: '#3b82f6', MATH: '#ef4444', CGS: '#a855f7', SE: '#22c55e',
  ECS: '#f59e0b', PHYS: '#06b6d4', CHEM: '#f97316',
};

function DegStat({ big, sub, label, color }) {
  return (
    <div className="flex-shrink-0 text-center px-1">
      <div className="flex items-baseline gap-1 justify-center">
        <span className={`text-xl font-bold ${color}`}>{big}</span>
        <span className="text-gray-500 text-xs">{sub}</span>
      </div>
      <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  );
}

export default function Planner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAdvisor, setShowAdvisor] = useState(true);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'available' | dept prefix
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseListModal, setCourseListModal] = useState(null); // null | 'completed' | 'available' | 'planned' | 'locked'

  const userName = localStorage.getItem('cometpath_user');

  useEffect(() => {
    if (!userName) { navigate('/'); return; }
    loadData();
  }, [userName]);

  async function loadData() {
    setLoading(true);
    try {
      const userData = await getUser(userName);
      setUser(userData);

      const prefixes = MAJOR_PREFIXES[userData.major] || ['CS'];
      const results = await Promise.allSettled(prefixes.map(p => getCourses(p)));
      const all = [];
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value?.data) all.push(...r.value.data);
      }
      // Deduplicate by courseId (e.g. "CS1337")
      const seen = new Set();
      const courses = all.filter(c => {
        const id = c.courseId;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setAllCourses(courses);

      const plannedIds = (userData.plannedSemesters || []).flatMap(s => s.courses);
      const concIds = new Set(
        (userData.concentrations || []).flatMap(c => CONCENTRATION_COURSES[userData.major]?.[c] || [])
      );
      const { nodes: n, edges: e } = buildGraph(courses, userData.completedCourses, plannedIds, {}, concIds);
      setNodes(n);
      setEdges(e);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const availableCourses = nodes
    .filter(n => n.data.status === 'available')
    .map(n => ({ courseId: n.data.courseId, name: n.data.name }));

  function handleNodeClick(courseData) {
    setSelectedCourse(courseData);
  }

  function handleAddToPlan(course) {
    if (!user) return;
    const semesters = [...(user.plannedSemesters || [])];
    let lastSem = semesters[semesters.length - 1];
    if (!lastSem) {
      lastSem = { semester: 'Fall 2026', courses: [] };
      semesters.push(lastSem);
    }
    if (!lastSem.courses.includes(course.courseId)) {
      lastSem.courses = [...lastSem.courses, course.courseId];
    }
    updatePlan(user.name, semesters).then(r => {
      setUser(r.user);
      // Refresh graph with new planned state
      const plannedIds = semesters.flatMap(s => s.courses);
      const concIds = new Set((user.concentrations || []).flatMap(c => CONCENTRATION_COURSES[user.major]?.[c] || []));
      const { nodes: n, edges: e } = buildGraph(allCourses, user.completedCourses, plannedIds, {}, concIds);
      setNodes(n);
      setEdges(e);
    }).catch(console.error);
  }

  function handlePlanUpdate(newSemesters) {
    if (!user) return;
    const updated = { ...user, plannedSemesters: newSemesters };
    setUser(updated);
    updatePlan(user.name, newSemesters).catch(console.error);
    const plannedIds = newSemesters.flatMap(s => s.courses);
    const concIds = new Set((user.concentrations || []).flatMap(c => CONCENTRATION_COURSES[user.major]?.[c] || []));
    const { nodes: n, edges: e } = buildGraph(allCourses, user.completedCourses, plannedIds, {}, concIds);
    setNodes(n);
    setEdges(e);
  }

  function handleSearch(e) {
    const value = e.target.value;
    setSearchTerm(value);
    const normalized = normalizeCourseId(value);
    if (normalized && normalized.length >= 4) {
      setSearchTarget(normalized);
    } else {
      setSearchTarget(null);
    }
  }

  function handleHighlight(courseId) {
    const target = normalizeCourseId(courseId);
    setSearchTarget(target);
    const node = nodes.find(n => n.id === target);
    if (node) setSelectedCourse(node.data);
  }

  // Apply dept/status filter to nodes
  const visibleNodes = filter === 'all' ? nodes
    : filter === 'available' ? nodes.filter(n => n.data.status === 'available' || n.data.status === 'completed')
    : nodes.filter(n => n.data.prefix === filter);

  const visibleEdges = filter === 'all' ? edges
    : edges.filter(e =>
        visibleNodes.some(n => n.id === e.source) && visibleNodes.some(n => n.id === e.target)
      );

  const totalCompleted = user?.completedCourses?.length || 0;
  const totalPlanned = (user?.plannedSemesters || []).flatMap(s => s.courses).length;

  // Degree progress stats
  const majorData = MAJOR_CORE[user?.major];
  const allCompletedIds = [...new Set([...(user?.completedCourses || []), ...(user?.transferCourses || [])])];
  const prepDone = majorData ? majorData.prep.filter(id => allCompletedIds.includes(id)).length : 0;
  const coreDone = majorData ? majorData.core.filter(id => allCompletedIds.includes(id)).length : 0;
  const majorCoursesTotal = majorData ? majorData.prep.length + majorData.core.length : 0;
  const majorCoursesDone = prepDone + coreDone;
  const totalCreditsEstimate = allCompletedIds.length * 3;
  const totalCreditsRequired = majorData?.totalCredits || 120;
  const concCourses = (user?.concentrations || []).flatMap(c => CONCENTRATION_COURSES[user?.major]?.[c] || []);
  const concDone = concCourses.filter(id => allCompletedIds.includes(id)).length;
  const concTotal = concCourses.length;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-space-900">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">☄️</div>
          <p className="text-blue-400">Building your degree tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-space-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="text-blue-400 underline">← Back to setup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-space-900 overflow-hidden">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-blue-900/50 flex-shrink-0 bg-space-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">☄️</span>
          <span className="font-bold text-white text-lg">CometPath</span>
          <span className="text-gray-500 text-sm hidden sm:block">
            {user?.name} • {user?.major}
            {user?.concentrations?.filter(c => c && c !== 'Undecided').map((c, i) => (
              <span key={i} className="text-purple-400 ml-1">· {c}</span>
            ))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            className="bg-space-700 border border-blue-900 rounded-lg px-3 py-1.5 text-white text-sm w-36 focus:outline-none focus:border-blue-500"
            placeholder="Find course..."
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Filter */}
          <div className="flex gap-1">
            {['all', 'available', 'CS', 'MATH', 'SE'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-space-700 text-gray-400 hover:text-white border border-blue-900/50'
                }`}
              >
                {f === 'all' ? 'All' : f === 'available' ? 'Unlocked' : f}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-blue-900/50" />

          <button
            onClick={() => setShowWhatIf(true)}
            className="text-xs text-purple-400 hover:text-white border border-purple-900/50 hover:border-purple-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            What-If?
          </button>

          <button
            onClick={() => setShowAdvisor(s => !s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showAdvisor
                ? 'bg-blue-950 border-blue-600 text-blue-300'
                : 'border-blue-900/50 text-gray-400 hover:text-white'
            }`}
          >
            🤖 AI Advisor
          </button>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-500 hover:text-white"
          >
            ← Setup
          </button>
        </div>
      </header>

      {/* Status bar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-space-900 border-b border-blue-900/20 flex-shrink-0">
        {[
          { key: 'completed', dot: 'bg-green-500', label: 'completed', count: totalCompleted },
          { key: 'available', dot: 'bg-blue-500 animate-pulse', label: 'available', count: availableCourses.length },
          { key: 'planned',   dot: 'bg-yellow-500', label: 'planned',   count: totalPlanned },
          { key: 'locked',    dot: 'bg-gray-600',   label: 'locked',    count: nodes.filter(n => n.data.status === 'locked').length },
        ].map(({ key, dot, label, count }) => (
          <button
            key={key}
            onClick={() => setCourseListModal(courseListModal === key ? null : key)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors mr-1 ${
              courseListModal === key ? 'bg-space-700 text-white' : 'text-gray-400 hover:text-white hover:bg-space-700'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${dot}`} />
            <span className="font-medium">{count}</span> {label}
          </button>
        ))}
        {/* Dept legend */}
        <div className="ml-auto flex items-center gap-2">
          {Object.entries(DEPT_COLORS).slice(0, 4).map(([dept, color]) => (
            <div key={dept} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {dept}
            </div>
          ))}
        </div>
      </div>

      {/* Course list drawer (completed / available / planned / locked) */}
      {courseListModal && (() => {
        const statusNodes = nodes.filter(n => {
          if (courseListModal === 'completed') return n.data.status === 'completed';
          if (courseListModal === 'available') return n.data.status === 'available';
          if (courseListModal === 'planned')   return n.data.status === 'planned';
          if (courseListModal === 'locked')    return n.data.status === 'locked';
          return false;
        });
        const colors = { completed: 'text-green-400', available: 'text-blue-400', planned: 'text-yellow-400', locked: 'text-gray-400' };
        return (
          <div className="bg-space-800/95 border-b border-blue-900/30 flex-shrink-0 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-blue-900/20 sticky top-0 bg-space-800">
              <span className={`text-xs font-semibold uppercase tracking-wide ${colors[courseListModal]}`}>
                {statusNodes.length} {courseListModal} courses
              </span>
              <button onClick={() => setCourseListModal(null)} className="text-gray-500 hover:text-white text-xs">✕ close</button>
            </div>
            <div className="px-4 py-2 flex flex-wrap gap-1.5">
              {statusNodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => { handleNodeClick(n.data); setCourseListModal(null); }}
                  className="font-mono text-xs px-2 py-1 rounded bg-space-700 hover:bg-space-600 text-white border border-blue-900/30 transition-colors"
                  title={n.data.name}
                >
                  {n.id}
                </button>
              ))}
              {statusNodes.length === 0 && <span className="text-gray-500 text-xs py-2">None yet.</span>}
            </div>
          </div>
        );
      })()}

      {/* Degree progress info bar */}
      {majorData && (
        <div className="flex items-center gap-1 px-4 py-2 bg-space-800/70 border-b border-blue-900/20 flex-shrink-0 overflow-x-auto">
          <DegStat big={`${totalCreditsEstimate}`} sub={`/ ${totalCreditsRequired}`} label="Est. Credits" color="text-white" />
          <div className="w-px h-8 bg-blue-900/30 flex-shrink-0 mx-2" />
          <DegStat big={`${majorCoursesDone}`} sub={`/ ${majorCoursesTotal}`} label="Major Courses" color="text-blue-400" />
          {concTotal > 0 && <>
            <div className="w-px h-8 bg-blue-900/30 flex-shrink-0 mx-2" />
            <DegStat big={`${concDone}`} sub={`/ ${concTotal}`} label="Concentration" color="text-purple-400" />
          </>}
          {(user?.transferCourses?.length > 0) && <>
            <div className="w-px h-8 bg-blue-900/30 flex-shrink-0 mx-2" />
            <DegStat big={`${user.transferCourses.length}`} sub="courses" label="Transfer" color="text-green-400" />
          </>}
          <div className="w-px h-8 bg-blue-900/30 flex-shrink-0 mx-2" />
          <DegStat big={`${majorCoursesTotal - majorCoursesDone}`} sub="remaining" label="Major Left" color="text-yellow-400" />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Advisor sidebar */}
        {showAdvisor && (
          <AdvisorPanel
            user={user}
            availableCourses={availableCourses}
            onHighlight={handleHighlight}
          />
        )}

        {/* Tech Tree */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <TechTree
              nodes={visibleNodes}
              edges={visibleEdges}
              onNodeClick={handleNodeClick}
              searchTarget={searchTarget}
            />
          </div>

          {/* Semester plan strip at bottom */}
          <SemesterPlan
            plannedSemesters={user?.plannedSemesters || []}
            onUpdate={handlePlanUpdate}
            allCourses={allCourses}
          />
        </div>

        {/* Course detail panel */}
        {selectedCourse && (
          <CoursePanel
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
            onAddToPlan={handleAddToPlan}
          />
        )}
      </div>

      {/* What-If Modal */}
      {showWhatIf && user && (
        <WhatIfModal user={user} onClose={() => setShowWhatIf(false)} />
      )}
    </div>
  );
}
