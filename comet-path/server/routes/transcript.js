const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/transcript
// Accepts multipart or plain text body and extracts UTD course IDs.
// Supports:
//  - Text/plain (pasted transcript text)
//  - application/json { text: "..." }
//
// Returns { courses: ["CS1337", "MATH2414", ...], raw: "..." }
router.post('/', express.text({ type: '*/*', limit: '2mb' }), async (req, res) => {
  try {
    let rawText = '';

    if (typeof req.body === 'string' && req.body.trim()) {
      rawText = req.body;
    } else if (req.headers['content-type']?.includes('application/json')) {
      const parsed = JSON.parse(req.body || '{}');
      rawText = parsed.text || '';
    }

    if (!rawText.trim()) {
      return res.status(400).json({ error: 'No transcript text provided' });
    }

    // First try pure regex extraction (fast, no Gemini needed)
    const regexCourses = extractCourseIds(rawText);

    // If we have a Gemini key AND regex found very few courses, use Gemini for smarter parsing
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && regexCourses.length < 3) {
      try {
        const geminiCourses = await parseWithGemini(rawText, geminiKey);
        return res.json({ courses: geminiCourses, method: 'gemini', raw: rawText.slice(0, 500) });
      } catch (geminiErr) {
        console.warn('[transcript] Gemini parse failed, falling back to regex:', geminiErr.message);
      }
    }

    res.json({ courses: regexCourses, method: 'regex', raw: rawText.slice(0, 500) });
  } catch (err) {
    console.error('[transcript]', err);
    res.status(500).json({ error: err.message });
  }
});

function extractCourseIds(text) {
  // Match patterns like "CS 1337", "MATH2414", "EE 3301" with optional grade/credit columns
  const matches = text.match(/\b([A-Z]{2,4})\s?(\d{4})\b/g) || [];
  const courses = matches.map(m => m.replace(/\s/, ''));
  return [...new Set(courses)];
}

async function parseWithGemini(text, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Extract all completed UTD course IDs from this unofficial transcript text.
Return ONLY a JSON array of course IDs like ["CS1337", "MATH2414"].
Only include courses the student has completed (grades A, B, C, D, P — not W or IP).
Normalize to format: prefix + number with no space (e.g. "CS 1337" → "CS1337").

Transcript text:
${text.slice(0, 4000)}

Return ONLY the JSON array, nothing else.`;

  const result = await model.generateContent(prompt);
  const clean = result.response.text().trim()
    .replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(clean);
}

module.exports = router;
