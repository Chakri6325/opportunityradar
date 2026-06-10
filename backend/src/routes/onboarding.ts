import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { generateMatches, StudentProfile } from '../agents/matchingAgent';
import { generateRoadmap } from '../agents/roadmapAgent';
import { seedOpportunities, getSeedCount } from '../data/seedOpportunities';
import { syncLiveOpportunities } from '../services/syncService';
import { fetchM365Intel } from '../services/workiqService';

const router = Router();

// GET /api/onboarding/sync-workiq - Sync onboarding data from Microsoft Work IQ
router.get('/sync-workiq', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Query MS 365 Intel
    const intel = await fetchM365Intel(userId);
    res.json(intel);
  } catch (error) {
    console.error('❌ Error syncing with Microsoft Work IQ:', error);
    res.status(500).json({ error: 'Failed to sync with Microsoft Work IQ' });
  }
});

// GET /api/onboarding/status - Check if user completed onboarding
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const client = await pool.connect();
    
    try {
      const profileResult = await client.query(
        `SELECT cp.*, u.name, u.location 
         FROM career_profiles cp 
         JOIN users u ON cp.user_id = u.id 
         WHERE cp.user_id = $1`,
        [userId]
      );


      if (profileResult.rows.length === 0) {
        return res.json({ completed: false });
      }

      // Check if user has skills and interests
      const skillsResult = await client.query(
        'SELECT skill_name, proficiency_level FROM skills WHERE user_id = $1',
        [userId]
      );

      const interestsResult = await client.query(
        'SELECT interest_name FROM interests WHERE user_id = $1',
        [userId]
      );

      res.json({
        completed: true,
        profile: {
          ...profileResult.rows[0],
          skills: skillsResult.rows,
          interests: interestsResult.rows.map(r => r.interest_name)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error checking onboarding status:', error);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
});

// POST /api/onboarding/complete - Save onboarding data and run AI analysis
router.post('/complete', async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const {
    fullName,
    educationLevel,
    university,
    graduationYear,
    location,
    skills, // Array of { name: string, proficiency: string }
    interests, // Array of strings
    opportunityTypes, // Array of strings
    workPreference,
    dreamRole,
    targetIndustry,
    timeline,
    yearsExperience,
    salaryExpectation
  } = req.body;

  const client = await pool.connect();
  try {
    // Sync live opportunities in real-time from web APIs during profile submission
    try {
      console.log('🔄 Syncing live career opportunities from global APIs in real-time...');
      await syncLiveOpportunities();
    } catch (syncErr) {
      console.error('⚠️ Real-time sync failed, using cached opportunities:', syncErr);
    }

    await client.query('BEGIN');

    // 2. Update user name (from onboarding form) and location safely (ignore empty strings)
    const cleanName = fullName?.trim() || null;
    const cleanLocation = location?.trim() || null;
    if (cleanName || cleanLocation) {
      await client.query(
        `UPDATE users 
         SET name = COALESCE($1, name), location = COALESCE($2, location), updated_at = NOW() 
         WHERE id = $3`,
        [cleanName, cleanLocation, userId]
      );
    }


    // 3. Delete existing skills & insert new ones
    await client.query('DELETE FROM skills WHERE user_id = $1', [userId]);
    if (Array.isArray(skills) && skills.length > 0) {
      for (const skill of skills) {
        await client.query(
          `INSERT INTO skills (user_id, skill_name, proficiency_level, years_of_experience) 
           VALUES ($1, $2, $3, $4)`,
          [userId, skill.name, skill.proficiency, yearsExperience]
        );
      }
    }

    // 4. Delete existing interests & insert new ones
    await client.query('DELETE FROM interests WHERE user_id = $1', [userId]);
    if (Array.isArray(interests) && interests.length > 0) {
      for (const interest of interests) {
        await client.query(
          `INSERT INTO interests (user_id, interest_name, importance_level) 
           VALUES ($1, $2, $3)`,
          [userId, interest, 8] // default importance level
        );
      }
    }

    // 5. Upsert Career Profile
    const currentPosition = `Student at ${university || 'University'} (Class of ${graduationYear || '2026'})`;
    const parsedSalary = salaryExpectation ? parseInt(salaryExpectation) : null;

    const profileUpsert = await client.query(
      `INSERT INTO career_profiles (
        user_id, current_position, target_role, target_industry, 
        experience_years, education_level, salary_expectation, remote_preference, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        current_position = EXCLUDED.current_position,
        target_role = EXCLUDED.target_role,
        target_industry = EXCLUDED.target_industry,
        experience_years = EXCLUDED.experience_years,
        education_level = EXCLUDED.education_level,
        salary_expectation = EXCLUDED.salary_expectation,
        remote_preference = EXCLUDED.remote_preference,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        currentPosition,
        dreamRole || 'Software Engineer',
        targetIndustry || 'Technology',
        yearsExperience || 0,
        educationLevel || 'Undergraduate',
        parsedSalary,
        workPreference || 'Remote'
      ]
    );

    // Commit profile save transaction first so matching agent can read clean DB states if needed
    await client.query('COMMIT');

    // 6. Generate AI Matches
    // Fetch all active opportunities
    const oppsResult = await client.query('SELECT * FROM opportunities WHERE is_active = true');
    const opportunities = oppsResult.rows;

    const studentProfile: StudentProfile = {
      name: fullName || 'Student',
      skills: Array.isArray(skills) ? skills.map(s => s.name) : [],
      interests: Array.isArray(interests) ? interests : [],
      education_level: educationLevel || 'Undergraduate',
      career_goals: `${dreamRole} in ${targetIndustry}. Timeline: ${timeline}`,
      target_role: dreamRole || 'Software Engineer',
      experience_years: yearsExperience || 0
    };

    console.log(`🤖 Running AI matching for ${studentProfile.name}...`);
    const matches = await generateMatches(studentProfile, opportunities);

    // Save matches in a new transaction
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

    // 7. Generate Career Roadmap
    console.log(`🗺️ Generating career roadmap for ${studentProfile.name}...`);
    const sortedMatches = matches.sort((a, b) => b.match_score - a.match_score);
    const topMatchesIds = sortedMatches.slice(0, 5).map(m => m.opportunity_id);
    
    let topMatchesOpps: any[] = [];
    if (topMatchesIds.length > 0) {
      const topOppsResult = await client.query(
        'SELECT * FROM opportunities WHERE id = ANY($1)',
        [topMatchesIds]
      );
      topMatchesOpps = topOppsResult.rows;
    }

    const roadmap = await generateRoadmap(studentProfile, topMatchesOpps);

    // Save roadmap in career_profile
    await client.query('BEGIN');
    await client.query(
      'UPDATE career_profiles SET career_roadmap = $1 WHERE user_id = $2',
      [JSON.stringify(roadmap), userId]
    );
    await client.query('COMMIT');

    res.json({
      success: true,
      matches_count: matches.length,
      profile: profileUpsert.rows[0]
    });

  } catch (error) {
    // If transaction active, roll it back
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('❌ Error during onboarding completion:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  } finally {
    client.release();
  }
});

export default router;
