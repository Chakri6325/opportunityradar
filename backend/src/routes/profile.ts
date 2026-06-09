import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get career profile
router.get('/career', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM career_profiles WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Career profile not found' });
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch career profile' });
  }
});

// Update career profile
router.put('/career', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { current_role, target_role, target_industry, experience_years } = req.body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE career_profiles 
         SET current_role = $1, target_role = $2, target_industry = $3, experience_years = $4, updated_at = NOW()
         WHERE user_id = $5
         RETURNING *`,
        [current_role, target_role, target_industry, experience_years, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Career profile not found' });
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to update career profile' });
  }
});

// Get career roadmap
router.get('/roadmap', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT career_roadmap FROM career_profiles WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      res.json(result.rows[0].career_roadmap || { milestones: [] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch roadmap' });
  }
});

export default router;
