import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateMatches, StudentProfile } from '../agents/matchingAgent';
import { syncLiveOpportunities } from '../services/syncService';

const router = Router();

// GET /api/matches - Get user's matches with opportunity details, sorted by match_score DESC
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT 
          m.match_score, 
          m.skill_match_percentage, 
          m.interest_match_percentage, 
          m.experience_match_percentage, 
          m.match_explanation, 
          m.skill_gaps,
          m.is_recommended,
          o.id,
          o.title,
          o.description,
          o.type,
          o.company_name,
          o.location,
          o.salary_min,
          o.salary_max,
          o.deadline_date,
          o.required_skills,
          o.difficulty_level,
          o.source,
          o.source_url
         FROM matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = $1
         ORDER BY m.match_score DESC`,
        [userId]
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/recommended - Get top 5 recommended opportunities (score >= 70)
router.get('/recommended', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT 
          m.match_score, 
          m.skill_match_percentage, 
          m.interest_match_percentage, 
          m.experience_match_percentage, 
          m.match_explanation, 
          m.skill_gaps,
          m.is_recommended,
          o.id,
          o.title,
          o.description,
          o.type,
          o.company_name,
          o.location,
          o.salary_min,
          o.salary_max,
          o.deadline_date,
          o.required_skills,
          o.difficulty_level,
          o.source,
          o.source_url
         FROM matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = $1 AND m.match_score >= 70
         ORDER BY m.match_score DESC
         LIMIT 5`,
        [userId]
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error fetching recommended matches:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// POST /api/matches/regenerate - Re-run AI matching for the user
router.post('/regenerate', async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const client = await pool.connect();
  
  try {
    // Sync live opportunities in real-time from web APIs before regenerating matches
    try {
      console.log('🔄 Syncing live career opportunities from global APIs in real-time...');
      await syncLiveOpportunities();
    } catch (syncErr) {
      console.error('⚠️ Real-time sync failed, using cached opportunities:', syncErr);
    }

    // 1. Fetch user's profile info
    const profileResult = await client.query(
      'SELECT * FROM career_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({ error: 'Please complete onboarding before regenerating matches.' });
    }

    const userResult = await client.query('SELECT name FROM users WHERE id = $1', [userId]);
    const name = userResult.rows[0]?.name || 'Student';

    const skillsResult = await client.query('SELECT skill_name FROM skills WHERE user_id = $1', [userId]);
    const interestsResult = await client.query('SELECT interest_name FROM interests WHERE user_id = $1', [userId]);

    const profile = profileResult.rows[0];
    const studentProfile: StudentProfile = {
      name,
      skills: skillsResult.rows.map(r => r.skill_name),
      interests: interestsResult.rows.map(r => r.interest_name),
      education_level: profile.education_level || 'Undergraduate',
      career_goals: `${profile.target_role} in ${profile.target_industry}`,
      target_role: profile.target_role || 'Software Engineer',
      experience_years: profile.experience_years || 0
    };

    // 2. Fetch all active opportunities
    const oppsResult = await client.query('SELECT * FROM opportunities WHERE is_active = true');
    const opportunities = oppsResult.rows;

    // 3. Generate matches
    console.log(`🤖 Regenerating matches for ${name}...`);
    const matches = await generateMatches(studentProfile, opportunities);

    // 4. Update database matches table
    await client.query('BEGIN');
    await client.query('DELETE FROM matches WHERE user_id = $1', [userId]);

    for (const match of matches) {
      await client.query(
        `INSERT INTO matches (
          user_id, opportunity_id, match_score, skill_match_percentage, 
          interest_match_percentage, experience_match_percentage, 
          match_explanation, is_recommended, skill_gaps
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          match.opportunity_id,
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
    await client.query('COMMIT');

    res.json({
      success: true,
      matches_count: matches.length
    });

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('❌ Error regenerating matches:', error);
    res.status(500).json({ error: 'Failed to regenerate matches' });
  } finally {
    client.release();
  }
});

export default router;
