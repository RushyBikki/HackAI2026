// Converts Nebula course data into React Flow nodes + edges.

export const DEPT_COLORS = {
  CS:   '#3b82f6', // blue
  MATH: '#ef4444', // red
  CGS:  '#a855f7', // purple
  SE:   '#22c55e', // green
  ECS:  '#f59e0b', // amber
  PHYS: '#06b6d4', // cyan
  CHEM: '#f97316', // orange
  HIST: '#84cc16', // lime
  COMM: '#ec4899', // pink
  GOVT: '#a16207', // yellow-brown
  RHET: '#db2777', // deep pink
  NSC:  '#14b8a6', // teal
  PSY:  '#8b5cf6', // violet
  BIOL: '#10b981', // emerald
  EE:   '#6366f1', // indigo
  STAT: '#f43f5e', // rose
  BA:   '#0ea5e9', // sky
  ENGR: '#78716c', // stone
  ATCM: '#d946ef', // fuchsia
  MIS:  '#f59e0b', // amber (ITSS/MIS share)
  ITSS: '#fb923c', // orange-ish
  FIN:  '#34d399', // mint
  ECON: '#60a5fa', // light blue
  ACCT: '#a78bfa', // lavender
  DEFAULT: '#6b7280',
};

export function getDeptColor(courseId) {
  const prefix = courseId.match(/^[A-Z]+/)?.[0] || 'DEFAULT';
  return DEPT_COLORS[prefix] || DEPT_COLORS.DEFAULT;
}

// Normalize a course identifier into a canonical form like "CS1337"
// Handles variants such as "cs 1337", "CS-1337", "cs1337.0"
export function normalizeCourseId(raw) {
  if (!raw) return '';
  const s = String(raw).toUpperCase().trim();
  const match = s.match(/([A-Z]{2,4})\s*-?\s*(\d{4})/);
  if (match) {
    const [, prefix, number] = match;
    return `${prefix}${number}`;
  }
  // Fallback: strip whitespace
  return s.replace(/\s+/g, '');
}

// Extract course IDs from a prereq string like "CS 1337 and MATH 2414"
export function parsePrereqs(prereqString) {
  if (!prereqString) return [];
  const matches = prereqString.match(/[A-Z]{2,4}\s?\d{4}/g) || [];
  return [...new Set(matches.map(m => normalizeCourseId(m)))];
}

// Determine node status
export function getCourseStatus(courseId, completedCourses, prereqs, plannedCourses = []) {
  if (completedCourses.includes(courseId)) return 'completed';
  if (plannedCourses.includes(courseId)) return 'planned';
  const allMet = prereqs.every(p => completedCourses.includes(p));
  return allMet ? 'available' : 'locked';
}

export function buildGraph(courses, completedCourses, plannedCourses = [], gradeMap = {}, concentrationCourseIds = new Set()) {
  const nodes = [];
  const edges = [];

  const normalizedCompleted = (completedCourses || []).map(normalizeCourseId);
  const normalizedPlanned = (plannedCourses || []).map(normalizeCourseId);

  // Server normalizeCourse() already sets courseId = subject_prefix + course_number (e.g. "CS1337")
  const courseIds = new Set(courses.map(c => c.courseId).filter(Boolean));

  // Allow prereqs to reference completed/planned stub nodes so completed courses
  // that aren't in the Nebula fetch (gen-eds, transfers) still show edges into the tree
  const allKnownIds = new Set([...courseIds, ...normalizedCompleted, ...normalizedPlanned]);

  for (const course of courses) {
    const id = course.courseId; // e.g. "CS1337"
    if (!id) continue;

    // enrollment_reqs has human-readable text like "Prerequisite: CS 1337 or CS 1136"
    // course.prerequisites is a structured JSON object — not parseable by regex
    const prereqStr = course.enrollment_reqs || '';
    const prereqs = parsePrereqs(prereqStr).filter(p => allKnownIds.has(p));
    const status = getCourseStatus(id, normalizedCompleted, prereqs, normalizedPlanned);
    const gradeInfo = gradeMap[id] || {};

    nodes.push({
      id,
      type: 'courseNode',
      data: {
        courseId: id,
        name: course.title || id,
        prefix: course.subject_prefix || id.match(/^[A-Z]+/)?.[0] || 'CS',
        creditHours: parseInt(course.credit_hours, 10) || 3,
        status,
        avgGPA: gradeInfo.avgGPA ?? null,
        topProfessor: gradeInfo.topProfessor ?? null,
        prereqString: prereqStr,
        prereqs,
        isConcentration: concentrationCourseIds.has(id),
      },
      position: { x: 0, y: 0 },
    });

    for (const prereqId of prereqs) {
      const srcCompleted = normalizedCompleted.includes(prereqId);
      const edgeColor =
        status === 'completed' ? '#16a34a'
        : status === 'available' ? '#3b82f6'
        : status === 'planned' ? '#ca8a04'
        : srcCompleted ? '#4b5563'
        : '#1f2937';
      edges.push({
        id: `${prereqId}->${id}`,
        source: prereqId,
        target: id,
        animated: status === 'available',
        style: {
          stroke: edgeColor,
          strokeWidth: (status === 'completed' || status === 'available') ? 2 : 1,
          opacity: (status === 'locked' && !srcCompleted) ? 0.25 : 1,
        },
      });
    }
  }

  // Add stub nodes for completed/planned courses not in the fetched course list
  // (e.g. Texas Core gen-eds, cross-listed courses, or transfer credits).
  // Stubs give dagre something to anchor edges to when a gen-ed is listed as a prereq.
  const edgeSourceIds = new Set(edges.map(e => e.source));
  const missingCompleted = normalizedCompleted.filter(id => !courseIds.has(id));
  const missingPlanned   = normalizedPlanned.filter(id => !courseIds.has(id));
  for (const id of [...missingCompleted, ...missingPlanned]) {
    const status = normalizedCompleted.includes(id) ? 'completed' : 'planned';
    const prefix = id.match(/^[A-Z]+/)?.[0] || 'OTHER';
    // Only create a stub if it already has an outgoing edge (it's actually a prereq
    // for something in the fetched course list) — avoids flooding rank 0 with
    // nameless "HONS1310", "LIT1301" nodes that Nebula doesn't know about.
    if (status === 'completed' && !edgeSourceIds.has(id)) continue;
    nodes.push({
      id,
      type: 'courseNode',
      data: {
        courseId: id,
        name: id,
        prefix,
        creditHours: 3,
        status,
        avgGPA: null,
        topProfessor: null,
        prereqString: '',
        prereqs: [],
        isConcentration: concentrationCourseIds.has(id),
      },
      position: { x: 0, y: 0 },
    });
  }

  return { nodes, edges };
}
