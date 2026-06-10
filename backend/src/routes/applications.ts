import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get user's applications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT a.*, o.title, o.company_name, o.type, o.source_url 
         FROM applications a
         JOIN opportunities o ON a.opportunity_id = o.id
         WHERE a.user_id = $1
         ORDER BY a.application_date DESC`,
        [userId]
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create application
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { opportunity_id, status = 'interested' } = req.body;

    const client = await pool.connect();
    try {
      const applicationId = uuidv4();
      const result = await client.query(
        `INSERT INTO applications (id, user_id, opportunity_id, status, application_date)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [applicationId, userId, opportunity_id, status]
      );

      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application status
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

export default router;
