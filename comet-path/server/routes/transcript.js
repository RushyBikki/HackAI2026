const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/transcript/file  — multipart file upload (PDF or TXT)
router.post('/file', upload.single('transcript'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let rawText = '';
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      const parsed = await pdfParse(req.file.buffer);
      rawText = parsed.text;
    } else {
      rawText = req.file.buffer.toString('utf-8');
    }

    // Normalize: replace all Unicode/special whitespace with plain spaces, then
    // collapse runs of spaces so the regex can match "CS  1337" or "CS\u00a01337"
    rawText = rawText
      .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ') // Unicode spaces → ASCII space
      .replace(/\r\n/g, '\n')                                     // CRLF → LF
      .toUpperCase();                                              // uppercase so regex matches

    console.log('[transcript] PDF text sample:', rawText.slice(0, 400));

    res.json(processTranscript(rawText));
  } catch (err) {
    console.error('[transcript/file]', err);
    res.status(500).json({ error: err.message || 'Failed to process transcript.' });
  }
});

// POST /api/transcript/text  — JSON body { text: "..." } for pasted transcript
router.post('/text', (req, res) => {
  const rawText = (req.body?.text || '').toUpperCase();
  if (!rawText.trim()) return res.status(400).json({ error: 'No transcript text provided' });
  res.json(processTranscript(rawText));
});

function processTranscript(text) {
  const courses = extractCourseIds(text);
  console.log('[transcript] Courses found:', courses);
  return { courses, method: 'regex', count: courses.length };
}

function extractCourseIds(text) {
  const seen = new Set();
  const courses = [];

  // (?<![A-Z])  — lookbehind prevents matching word-endings (DING, GRAM, TIVE…)
  // [ \t-]*     — only same-line whitespace between prefix and number (no \n)
  //               prevents "BIOL\n<two lines later>1311" cross-row false matches
  // [1-4]\d{3}  — UTD undergrad course numbers start with 1–4 (1000–4999)
  const re = /(?<![A-Z])([A-Z]{2,4})[ \t-]*([1-4]\d{3})(?!\d)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const id = `${m[1]}${m[2]}`;
    // Filter noise: skip header words, grade labels, and common false-positive prefixes
    if (/^(PAGE|FALL|SPRI|SUMM|TERM|DATE|YEAR|GRAD|ENRL|ATTN|EARN|QUAL|GPA|PLAN|UNIV|DEPT|COUR|CRED|TRAN|ACAD|INST|PROG|DIVI|SEMI|TION|MENT|NESS|OUND|ANCE|ENCE|UNIT|HOUR|REQU|COMP|ONLY)/.test(m[1])) continue;
    if (!seen.has(id)) { seen.add(id); courses.push(id); }
  }

  return courses;
}

module.exports = router;
