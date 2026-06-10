import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'opportunityradar',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
});

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Database connected:', result.rows[0].version.split(',')[0]);
    
    // Add unique constraint for title/company to prevent duplicate seeds
    try {
      await client.query('ALTER TABLE opportunities ADD CONSTRAINT unique_title_company UNIQUE (title, company_name)');
      console.log('✅ Added unique constraint to opportunities');
    } catch (err: any) {
      if (err.code !== '42710') { // 42710 = duplicate_relation (already exists)
        console.error('⚠️ Could not add unique constraint to opportunities:', err.message);
      }
    }

    // Add skill_gaps column to matches table dynamically
    try {
      await client.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS skill_gaps TEXT[]');
      console.log('✅ Ensured skill_gaps column exists in matches table');
    } catch (err: any) {
      console.error('⚠️ Could not add skill_gaps column to matches:', err.message);
    }

    // Ensure career_roadmap column is JSONB in career_profiles
    try {
      await client.query('ALTER TABLE career_profiles ADD COLUMN IF NOT EXISTS career_roadmap JSONB');
      console.log('✅ Ensured career_roadmap column exists in career_profiles table');
    } catch (err: any) {
      console.error('⚠️ Could not add career_roadmap column to career_profiles:', err.message);
    }

    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await pool.end();
  console.log('✅ Database connection closed');
}
