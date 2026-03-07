const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Memory storage — we process the buffer directly, never touch disk
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/transcript/file  — multipart file upload (PDF or TXT)
router.post('/file', upload.single('transcript'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let rawText = '';
    const mime = req.file.mimetype;

    if (mime === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      const parsed = await pdfParse(req.file.buffer);
      rawText = parsed.text;
    } else {
      // text/plain or anything else — decode as UTF-8
      rawText = req.file.buffer.toString('utf-8');
    }

    const result = await processTranscript(rawText);
    res.json(result);
  } catch (err) {
    console.error('[transcript/file]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transcript/text  — JSON body { text: "..." } for pasted transcript
router.post('/text', async (req, res) => {
  try {
    const rawText = req.body?.text || '';
    if (!rawText.trim()) return res.status(400).json({ error: 'No transcript text provided' });
    const result = await processTranscript(rawText);
    res.json(result);
  } catch (err) {
    console.error('[transcript/text]', err);
    res.status(500).json({ error: err.message });
  }
});

// Shared processing logic
async function processTranscript(rawText) {
  const regexCourses = extractCourseIds(rawText);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && regexCourses.length < 3) {
    try {
      const geminiCourses = await parseWithGemini(rawText, geminiKey);
      return { courses: geminiCourses, method: 'gemini', count: geminiCourses.length };
    } catch (err) {
      console.warn('[transcript] Gemini fallback failed:', err.message);
    }
  }

  return { courses: regexCourses, method: 'regex', count: regexCourses.length };
}

function extractCourseIds(text) {
  const matches = text.match(/\b([A-Z]{2,4})\s?(\d{4})\b/g) || [];
  const courses = matches.map(m => m.replace(/\s/, ''));
  return [...new Set(courses)];
}

async function parseWithGemini(text, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Extract all completed UTD course IDs from this unofficial transcript.
Return ONLY a JSON array like ["CS1337", "MATH2414"].
Only include courses with final grades A, B, C, D, or P. Skip W (withdrawal) and IP (in progress).
Normalize format: prefix + number, no space (e.g. "CS 1337" -> "CS1337").

Transcript:
${text.slice(0, 4000)}

Return ONLY the JSON array, nothing else.`;

  const result = await model.generateContent(prompt);
  const clean = result.response.text().trim()
    .replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(clean);
}

module.exports = router;
