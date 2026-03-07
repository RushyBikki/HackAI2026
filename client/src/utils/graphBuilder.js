const COURSE_ID_REGEX = /[A-Z]{2,4}\s?\d{4}/g;

function normalizeCourse(raw) {
  const courseId = raw.courseId || raw.id || raw._id || '';
  const name = raw.name || raw.title || courseId;
  const prefix = raw.prefix || courseId.replace(/\d+.*/, '');
  const creditHours = raw.creditHours || raw.credits || 3;
  const prereqText = raw.prerequisites || raw.prereq || raw.preReq || '';

  return {
    courseId,
    name,
    prefix,
    creditHours,
    prereqText,
    avgGPA: raw.avgGPA,
    topProfessor: raw.topProfessor,
  };
}

export function buildGraph(courses, user) {
  const completed = new Set(user?.completedCourses || []);
  const planned = new Set(
    (user?.plannedSemesters || []).flatMap((s) => s.courses || []),
  );

  const nodes = [];
  const edges = [];

  const courseById = new Map();
  for (const course of courses) {
    const normalized = normalizeCourse(course);
    if (!normalized.courseId) continue;
    courseById.set(normalized.courseId, normalized);
  }

  for (const [, course] of courseById) {
    const status = getStatus(course.courseId, course.prereqText, {
      completed,
      planned,
      courseById,
    });

    nodes.push({
      id: course.courseId,
      type: 'courseNode',
      data: {
        courseId: course.courseId,
        name: course.name,
        prefix: course.prefix,
        creditHours: course.creditHours,
        status,
        avgGPA: course.avgGPA,
        topProfessor: course.topProfessor,
      },
      position: { x: 0, y: 0 },
    });

    const foundPrereqs =
      course.prereqText?.match(COURSE_ID_REGEX)?.map((s) => s.replace(/\s+/g, '')) || [];
    for (const prereqId of foundPrereqs) {
      if (!courseById.has(prereqId)) continue;
      edges.push({
        id: `${prereqId}-${course.courseId}`,
        source: prereqId,
        target: course.courseId,
        animated: status === 'available',
        style: { stroke: '#64748b' },
      });
    }
  }

  return { nodes, edges };
}

function getStatus(courseId, prereqText, { completed, planned, courseById }) {
  if (completed.has(courseId)) return 'completed';
  if (planned.has(courseId)) return 'planned';

  const prereqIds =
    prereqText?.match(COURSE_ID_REGEX)?.map((s) => s.replace(/\s+/g, '')) || [];
  if (!prereqIds.length) return 'available';

  const allMet = prereqIds.every((id) => completed.has(id) || planned.has(id) || !courseById.has(id));
  return allMet ? 'available' : 'locked';
}

