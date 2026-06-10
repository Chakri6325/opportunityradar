-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  github_id VARCHAR(255) UNIQUE,
  profile_picture VARCHAR(500),
  bio TEXT,
  location VARCHAR(255),
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(255) NOT NULL,
  proficiency_level VARCHAR(50),
  years_of_experience INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interests table
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_name VARCHAR(255) NOT NULL,
  importance_level INT CHECK (importance_level >= 1 AND importance_level <= 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  company_name VARCHAR(255),
  location VARCHAR(255),
  salary_min INT,
  salary_max INT,
  deadline_date DATE,
  start_date DATE,
  duration_months INT,
  required_skills TEXT[],
  required_experience_years INT,
  difficulty_level VARCHAR(50),
  source VARCHAR(50) NOT NULL,
  source_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) CHECK (match_score >= 0 AND match_score <= 100),
  skill_match_percentage DECIMAL(5,2),
  interest_match_percentage DECIMAL(5,2),
  experience_match_percentage DECIMAL(5,2),
  match_explanation TEXT,
  is_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, opportunity_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'interested',
  application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Career profiles table
CREATE TABLE IF NOT EXISTS career_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_position VARCHAR(255),
  target_role VARCHAR(255),
  target_industry VARCHAR(255),
  experience_years INT,
  education_level VARCHAR(50),
  salary_expectation INT,
  remote_preference VARCHAR(50),
  mobility VARCHAR(50),
  career_roadmap JSONB,
  learning_path JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_career_profiles_user_id ON career_profiles(user_id);

COMMIT;
