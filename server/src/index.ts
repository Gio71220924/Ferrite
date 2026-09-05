import express from 'express';
import cors from 'cors';
import { youtubeRouter } from './routes/youtube.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://127.0.0.1:5199',
      'http://localhost:5199',
      'http://localhost:3001',
      'https://ferrite-app.vercel.app',
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.trycloudflare.com') || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
