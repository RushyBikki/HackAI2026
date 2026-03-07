const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
}

// POST /api/ai/recommend
router.post('/recommend', async (req, res) => {
  try {
    const { major, completedCourses, availableCourses, gradeData } = req.body;
    const model = getModel();

    const prompt = `You are a UTD academic advisor AI. A student has the following profile:
- Major: ${major}
- Completed courses: ${completedCourses.join(', ')}
- Courses with prerequisites met (available now): ${availableCourses.map(c => `${c.courseId} (${c.name})`).join(', ')}
- Grade distribution summary for available courses: ${JSON.stringify(gradeData || {}, null, 2)}

Recommend 4-5 courses for next semester. For each course, provide:
1. Course ID and name
2. Why this course now (prereq chain progress, graduation timeline, workload balance)
3. Recommended professor and why (based on grade data if available)
4. Difficulty estimate (Easy/Medium/Hard based on average GPA)

Return ONLY a valid JSON array, no markdown, no code blocks:
[{ "courseId": "CS1337", "name": "Computer Science I", "reasoning": "...", "recommendedProfessor": "...", "professorReasoning": "...", "difficulty": "Medium" }]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Strip potential markdown fences
    const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const recommendations = JSON.parse(clean);
    res.json({ recommendations });
  } catch (err) {
    console.error('[AI/recommend]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/whatif
router.post('/whatif', async (req, res) => {
  try {
    const { currentMajor, targetMajor, completedCourses, currentRequirements, targetRequirements } = req.body;
    const model = getModel();

    const keptCourses = completedCourses.filter(c =>
      targetRequirements?.some(r => r === c || r.includes(c))
    );
    const lostCourses = completedCourses.filter(c => !keptCourses.includes(c));
    const neededCourses = (targetRequirements || []).filter(c => !completedCourses.includes(c));

    const prompt = `You are a UTD academic advisor. A student considering switching majors:
- Current major: ${currentMajor}
- Target major: ${targetMajor}
- Completed courses: ${completedCourses.join(', ')}
- Courses that transfer to new major: ${keptCourses.join(', ') || 'unknown'}
- Courses that don't count: ${lostCourses.join(', ') || 'unknown'}
- New courses needed: ${neededCourses.join(', ') || 'unknown'}

Provide a plain-English analysis of this switch. Be encouraging but honest. Include:
1. How many credits transfer (estimate if needed)
2. How much extra time this might add (in semesters)
3. Whether this switch makes sense given their current progress
4. Key things to consider

Keep it under 200 words, conversational, helpful.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    res.json({
      summary,
      keptCourses,
      lostCourses,
      neededCourses,
      creditOverlap: keptCourses.length,
      totalCompleted: completedCourses.length,
    });
  } catch (err) {
    console.error('[AI/whatif]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/professor-insight
router.post('/professor-insight', async (req, res) => {
  try {
    const { courseName, professors } = req.body;
    const model = getModel();

    const prompt = `You are a UTD advisor. Compare these professors for ${courseName} based on grade data:
${professors.map(p => `- ${p.name}: avg GPA ${p.avgGpa}, ${p.sections} sections`).join('\n')}

Write 1-2 sentences comparing them for a student deciding who to take. Be direct and data-driven.`;

    const result = await model.generateContent(prompt);
    res.json({ insight: result.response.text().trim() });
  } catch (err) {
    console.error('[AI/professor-insight]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
