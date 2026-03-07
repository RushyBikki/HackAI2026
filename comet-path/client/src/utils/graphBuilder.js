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

// Extract course IDs from a prereq string like "CS 1337 and MATH 2414"
export function parsePrereqs(prereqString) {
  if (!prereqString) return [];
  const matches = prereqString.match(/[A-Z]{2,4}\s?\d{4}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\s/, '')))];
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
  const courseIds = new Set(courses.map(c => c._id || c.course_number || c.id));

  for (const course of courses) {
    const id = course._id || course.course_number || course.id;
    const prereqStr = course.prerequisites || course.co_or_pre_requisites || '';
    const prereqs = parsePrereqs(prereqStr).filter(p => courseIds.has(p));
    const status = getCourseStatus(id, completedCourses, prereqs, plannedCourses);
    const gradeInfo = gradeMap[id] || {};

    nodes.push({
      id,
      type: 'courseNode',
      data: {
        courseId: id,
        name: course.title || course.long_title || id,
        prefix: id.match(/^[A-Z]+/)?.[0] || 'CS',
        creditHours: course.credit_hours || course.semester_credit_hours || 3,
        status,
        avgGPA: gradeInfo.avgGPA ?? null,
        topProfessor: gradeInfo.topProfessor ?? null,
        prereqString: prereqStr,
        prereqs,
      },
      position: { x: 0, y: 0 }, // filled by layoutEngine
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
