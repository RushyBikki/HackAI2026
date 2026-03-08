require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/courses', require('./routes/courses'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/transcript', require('./routes/transcript'));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[Server] CometPath API running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('[Server] DB connect failed, running anyway:', err.message);
  app.listen(PORT, () => console.log(`[Server] CometPath API running on http://localhost:${PORT} (no DB)`));
});
