// Converts Nebula course data into React Flow nodes + edges.

const DEPT_COLORS = {
  CS: '#3b82f6',   // blue
  MATH: '#ef4444', // red
  CGS: '#a855f7',  // purple
  SE: '#22c55e',   // green
  ECS: '#f59e0b',  // amber
  PHYS: '#06b6d4', // cyan
  CHEM: '#f97316', // orange
  HIST: '#84cc16', // lime
  COMM: '#ec4899', // pink
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

export function buildGraph(courses, completedCourses, plannedCourses = [], gradeMap = {}) {
  const nodes = [];
  const edges = [];

  const normalizedCompleted = (completedCourses || []).map(normalizeCourseId);
  const normalizedPlanned = (plannedCourses || []).map(normalizeCourseId);

  // Server normalizeCourse() already sets courseId = subject_prefix + course_number (e.g. "CS1337")
  const courseIds = new Set(courses.map(c => c.courseId).filter(Boolean));

  for (const course of courses) {
    const id = course.courseId; // e.g. "CS1337"
    if (!id) continue;

    // enrollment_reqs has human-readable text like "Prerequisite: CS 1337 or CS 1136"
    // course.prerequisites is a structured JSON object — not parseable by regex
    const prereqStr = course.enrollment_reqs || '';
    const prereqs = parsePrereqs(prereqStr).filter(p => courseIds.has(p));
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
      },
      position: { x: 0, y: 0 },
    });

    for (const prereqId of prereqs) {
      edges.push({
        id: `${prereqId}->${id}`,
        source: prereqId,
        target: id,
        animated: status === 'available',
        style: {
          stroke: status === 'available' ? '#3b82f6' : '#374151',
          strokeWidth: 2,
        },
      });
    }
  }

  return { nodes, edges };
}
