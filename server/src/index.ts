import express from 'express';
import cors from 'cors';
import { youtubeRouter } from './routes/youtube.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({
  origin: ['http://127.0.0.1:5199', 'http://localhost:5199'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/youtube', youtubeRouter);

app.listen(PORT, () => {
  console.log(`Ferrite server running on http://localhost:${PORT}`);
});
