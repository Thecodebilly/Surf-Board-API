require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();
const { containsProfanity } = require('./profanity');

const buildPoolConfig = () => {
  if (process.env.DATABASE_PUBLIC_URL) {
    return {
      connectionString: process.env.DATABASE_PUBLIC_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

const pool = new Pool(buildPoolConfig());

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: 'Database unavailable' });
  }
});

app.get('/records', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, score, created_at FROM records ORDER BY score DESC, created_at ASC'
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch records:', error);
    return res.status(500).json({ error: 'Failed to fetch records' });
  }
});

app.post('/records', async (req, res) => {
  const { name, score } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required and must be a non-empty string' });
  }

  if (!Number.isFinite(score)) {
    return res.status(400).json({ error: 'score is required and must be a number' });
  }

  const cleanName = name.trim();

  if (containsProfanity(cleanName)) {
    return res.status(400).json({ error: 'Profanity is not allowed in player names' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO records (name, score) VALUES ($1, $2) RETURNING id, name, score, created_at',
      [cleanName, score]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create record:', error);
    return res.status(500).json({ error: 'Failed to create record' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
