import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateMatches, StudentProfile } from '../agents/matchingAgent';
import {
  HackathonCollectorAgent,
  ScholarshipCollectorAgent,
  JobCollectorAgent,
  ResearchCollectorAgent,
  CompetitionCollectorAgent
} from '../services/agentCollectorService';

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

// POST /api/opportunities - Add a new opportunity (user submission)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      title,
      description,
      type,
      company_name,
      location = 'Remote',
      salary_min = null,
      salary_max = null,
      deadline_date = null,
      required_skills = [],
      difficulty_level = 'intermediate',
      source_url
    } = req.body;

    if (!title || !type || !company_name || !source_url) {
      return res.status(400).json({ error: 'Missing required fields: title, type, company_name, source_url are required.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert the opportunity
      const deadline = deadline_date ? new Date(deadline_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      
      const oppResult = await client.query(
        `INSERT INTO opportunities (
          title, description, type, company_name, location,
          salary_min, salary_max, deadline_date, required_skills,
          required_experience_years, difficulty_level, source, source_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
        RETURNING *`,
        [
          title,
          description || 'User submitted opportunity.',
          type,
          company_name,
          location,
          salary_min ? parseInt(salary_min) : null,
          salary_max ? parseInt(salary_max) : null,
          deadline,
          required_skills,
          type === 'job' ? 1 : 0,
          difficulty_level,
          'user_submission',
          source_url
        ]
      );

      const newOpportunity = oppResult.rows[0];

      // 2. Fetch current user's profile to run matching on this new opportunity
      const profileResult = await client.query(
        'SELECT * FROM career_profiles WHERE user_id = $1',
        [userId]
      );

      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        const userResult = await client.query('SELECT name FROM users WHERE id = $1', [userId]);
        const name = userResult.rows[0]?.name || 'Student';

        const skillsResult = await client.query('SELECT skill_name FROM skills WHERE user_id = $1', [userId]);
        const interestsResult = await client.query('SELECT interest_name FROM interests WHERE user_id = $1', [userId]);

        const studentProfile: StudentProfile = {
          name,
          skills: skillsResult.rows.map(r => r.skill_name),
          interests: interestsResult.rows.map(r => r.interest_name),
          education_level: profile.education_level || 'Undergraduate',
          career_goals: `${profile.target_role} in ${profile.target_industry}`,
          target_role: profile.target_role || 'Software Engineer',
          experience_years: profile.experience_years || 0
        };

        // Run matching on the single new opportunity
        const matches = await generateMatches(studentProfile, [newOpportunity]);

        if (matches && matches.length > 0) {
          const match = matches[0];
          // Save the match score
          await client.query(
            `INSERT INTO matches (
              user_id, opportunity_id, match_score, skill_match_percentage, 
              interest_match_percentage, experience_match_percentage, 
              match_explanation, is_recommended, skill_gaps
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, opportunity_id) DO UPDATE SET
              match_score = EXCLUDED.match_score,
              skill_match_percentage = EXCLUDED.skill_match_percentage,
              interest_match_percentage = EXCLUDED.interest_match_percentage,
              experience_match_percentage = EXCLUDED.experience_match_percentage,
              match_explanation = EXCLUDED.match_explanation,
              is_recommended = EXCLUDED.is_recommended,
              skill_gaps = EXCLUDED.skill_gaps`,
            [
              userId,
              newOpportunity.id,
              match.match_score,
              match.skill_match_percentage,
              match.interest_match_percentage,
              match.experience_match_percentage,
              match.match_explanation,
              match.is_recommended,
              match.skill_gaps
            ]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json(newOpportunity);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error adding opportunity:', error);
    res.status(500).json({ error: 'Failed to add opportunity' });
  }
});

// Run 5 Source Collector Agents in parallel
router.post('/sync-agents', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🤖 Starting 5 Source Collector Agents in parallel...');
    
    const [
      hackathonsResult,
      scholarshipsResult,
      jobsResult,
      researchResult,
      competitionsResult
    ] = await Promise.allSettled([
      HackathonCollectorAgent.collect(),
      ScholarshipCollectorAgent.collect(),
      JobCollectorAgent.collect(),
      ResearchCollectorAgent.collect(),
      CompetitionCollectorAgent.collect()
    ]);

    const counts = {
      hackathons: hackathonsResult.status === 'fulfilled' ? hackathonsResult.value : 0,
      scholarships: scholarshipsResult.status === 'fulfilled' ? scholarshipsResult.value : 0,
      jobs: jobsResult.status === 'fulfilled' ? jobsResult.value : 0,
      research: researchResult.status === 'fulfilled' ? researchResult.value : 0,
      competitions: competitionsResult.status === 'fulfilled' ? competitionsResult.value : 0
    };

    console.log('🤖 Collector Agents finished. Counts:', counts);

    res.json({
      success: true,
      counts
    });
  } catch (error) {
    console.error('❌ Error running collector agents:', error);
    res.status(500).json({ error: 'Failed to run collector agents' });
  }
});

export default router;

