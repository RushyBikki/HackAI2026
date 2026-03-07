import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

async function callGemini(systemPrompt, userPrompt) {
  if (!GEMINI_API_KEY) {
    // Fallback mock for development when key is missing
    return {
      candidates: [
        {
          content: {
            parts: [
              {
                text:
                  'Gemini API key is not configured. This is a mock response for local development.',
              },
            ],
          },
        },
      ],
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL,
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Gemini error ${res.status}`);
  }

  return res.json();
}

function extractText(response) {
  const candidate = response.candidates?.[0];
  const part = candidate?.content?.parts?.[0];
  return part?.text || '';
}

router.post('/ai/recommend', async (req, res) => {
  try {
    const { major, completedCourses = [], availableCourses = [], gradeData = {} } =
      req.body || {};

    const systemPrompt =
      'You are a UTD academic advisor AI. Return strictly valid JSON only.';

    const userPrompt = `
Major: ${major}
Completed courses: ${JSON.stringify(completedCourses)}
Courses with prerequisites met (available now): ${JSON.stringify(
      availableCourses,
    )}
Grade distribution data for available courses: ${JSON.stringify(gradeData)}

Recommend 4-5 courses for next semester. For each recommendation, provide:
1. Course ID and name
2. Why this course now (prerequisite chain progress, graduation timeline, workload balance)
3. Which professor to take it with and why (based on grade data)
4. Difficulty estimate (based on average GPA)

Return as JSON array with fields:
[{ "courseId": string, "name": string, "reasoning": string, "recommendedProfessor": string, "professorReasoning": string, "difficulty": "Easy" | "Medium" | "Hard" }]
`;

    const response = await callGemini(systemPrompt, userPrompt);
    const text = extractText(response);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = [];
    }

    res.json(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /api/ai/recommend', err);
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

router.post('/ai/whatif', async (req, res) => {
  try {
    const { currentMajor, completedCourses = [], targetMajor } = req.body || {};

    const systemPrompt =
      'You are a UTD academic advisor AI for major switching. Return strictly valid JSON only.';

    const userPrompt = `
Current major: ${currentMajor}
Target major: ${targetMajor}
Completed courses: ${JSON.stringify(completedCourses)}

Estimate:
- Which completed courses are likely to count toward the new major (keptCourses).
- Which are likely to be lost (lostCourses).
- New courses needed (newCourses).
- Extra semesters required (extraSemesters, integer).

Return JSON with:
{ "summary": string, "keptCourses": string[], "lostCourses": string[], "newCourses": string[], "extraSemesters": number }
`;

    const response = await callGemini(systemPrompt, userPrompt);
    const text = extractText(response);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        summary: text,
        keptCourses: [],
        lostCourses: [],
        newCourses: [],
        extraSemesters: null,
      };
    }

    res.json(parsed);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /api/ai/whatif', err);
    res.status(500).json({ error: 'Failed to run what-if analysis.' });
  }
});

export default router;

