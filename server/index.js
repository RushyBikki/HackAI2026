import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import coursesRouter from './routes/courses.js';
import usersRouter from './routes/users.js';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
  }),
);
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', coursesRouter);
app.use('/api', usersRouter);
app.use('/api', aiRouter);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error.' });
  next();
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CometPath server listening on http://localhost:${port}`);
});

