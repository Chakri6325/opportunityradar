import axios from 'axios';
import { pool } from '../config/database';

interface LiveJob {
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  url: string;
  salary_min?: number;
  salary_max?: number;
  type: 'job' | 'internship';
}

export async function syncLiveOpportunities(): Promise<number> {
  console.log('🔄 Starting real-time opportunities sync from public APIs...');
  
  const jobs: LiveJob[] = [];

  // 1. Fetch from RemoteOK API (Remote/Worldwide jobs)
  try {
    const response = await axios.get('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (Array.isArray(response.data)) {
      // RemoteOK returns legal disclaimer as the first element, skip it
      const rawJobs = response.data.slice(1);
      
      for (const item of rawJobs.slice(0, 15)) { // take top 15 active jobs
        jobs.push({
          title: item.position || 'Software Developer',
          company: item.company || 'Remote Company',
          location: item.location || 'Remote (Worldwide)',
          description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 1000) : 'Active remote job opportunity.',
          skills: Array.isArray(item.tags) ? item.tags.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)) : ['React', 'JavaScript'],
          url: item.url || 'https://remoteok.com',
          salary_min: item.salary_min || null,
          salary_max: item.salary_max || null,
          type: (item.position || '').toLowerCase().includes('intern') ? 'internship' : 'job'
        });
      }
      console.log(`✅ Fetched ${jobs.length} live remote jobs from RemoteOK`);
    }
  } catch (err: any) {
    console.error('⚠️ Failed to fetch remote jobs from RemoteOK:', err.message);
  }

  // 2. Fetch from Arbeitnow API (European / Global jobs)
  try {
    const response = await axios.get('https://www.arbeitnow.com/api/job-board-api');
    
    if (response.data && Array.isArray(response.data.data)) {
      const rawJobs = response.data.data;
      
      let addedCount = 0;
      for (const item of rawJobs.slice(0, 15)) { // take top 15 active jobs
        jobs.push({
          title: item.title || 'Developer',
          company: item.company_name || 'Tech Company',
          location: item.location || 'Europe (Hybrid)',
          description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 1000) : 'Developer role.',
          skills: Array.isArray(item.tags) ? item.tags.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)) : ['TypeScript', 'Node.js'],
          url: item.url || 'https://www.arbeitnow.com',
          type: (item.title || '').toLowerCase().includes('intern') ? 'internship' : 'job'
        });
        addedCount++;
      }
      console.log(`✅ Fetched ${addedCount} live jobs from Arbeitnow`);
    }
  } catch (err: any) {
    console.error('⚠️ Failed to fetch jobs from Arbeitnow:', err.message);
  }

  // 3. Insert/Upsert into PostgreSQL Database
  if (jobs.length === 0) {
    console.log('⚠️ No live opportunities synced.');
    return 0;
  }

  const client = await pool.connect();
  let upsertedCount = 0;

  try {
    await client.query('BEGIN');
    
    for (const job of jobs) {
      // Parse required skills as a text array
      const skillsArray = Array.from(new Set(job.skills));

      const result = await client.query(
        `INSERT INTO opportunities (
          title, description, type, company_name, location, 
          salary_min, salary_max, deadline_date, required_skills, 
          required_experience_years, difficulty_level, source, source_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '30 days', $8, $9, $10, $11, $12, true)
        ON CONFLICT (title, company_name) DO UPDATE SET
          description = EXCLUDED.description,
          location = EXCLUDED.location,
          required_skills = EXCLUDED.required_skills,
          salary_min = EXCLUDED.salary_min,
          salary_max = EXCLUDED.salary_max,
          source_url = EXCLUDED.source_url,
          updated_at = NOW()
        RETURNING id`,
        [
          job.title,
          job.description,
          job.type,
          job.company,
          job.location,
          job.salary_min,
          job.salary_max,
          skillsArray,
          job.type === 'job' ? 2 : 0, // required experience years
          job.type === 'job' ? 'intermediate' : 'beginner',
          'linkedin',
          job.url
        ]
      );

      if (result.rows.length > 0) {
        upsertedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`🚀 Successfully synchronized and upserted ${upsertedCount} live opportunities into the database.`);
    return upsertedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to save synced opportunities to DB:', error);
    throw error;
  } finally {
    client.release();
  }
}
