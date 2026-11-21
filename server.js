require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();
const { validateRecord } = require('./records');

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

// An idle client loses its connection when Postgres restarts; without a
// listener that error crashes the process.
pool.on('error', (error) => {
  console.error('Idle Postgres client error:', error.message);
});

app.use(express.json({ limit: '4kb' }));

app.use((error, _req, res, next) => {
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(400).json({ error: 'Body must be a small JSON object' });
  }
  return next(error);
});

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
  const record = validateRecord(req.body);
  if (record.error) {
    return res.status(400).json({ error: record.error });
  }

  try {
    const result = await pool.query(
      'INSERT INTO records (name, score, created_at) VALUES ($1, $2, NOW()) RETURNING id, name, score, created_at',
      [record.name, record.score]
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
