import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all opportunities
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, limit = 20, offset = 0 } = req.query;

    let query = 'SELECT * FROM opportunities WHERE is_active = true';
    const params: any[] = [];

    if (type && type !== 'all') {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get opportunity by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM opportunities WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Search opportunities
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM opportunities 
         WHERE is_active = true AND (title ILIKE $1 OR description ILIKE $1 OR company_name ILIKE $1)
         ORDER BY created_at DESC LIMIT 50`,
        [`%${q}%`]
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
