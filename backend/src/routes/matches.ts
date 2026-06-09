import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get user's matches
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT m.*, o.title, o.company_name, o.type, o.location 
         FROM matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = $1
         ORDER BY m.match_score DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get recommended opportunities
router.get('/recommended', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT m.*, o.title, o.company_name, o.type, o.location 
         FROM matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = $1 AND m.is_recommended = true
         ORDER BY m.match_score DESC
         LIMIT 10`,
        [userId]
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
