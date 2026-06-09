# OpportunityRadar - System Architecture

## 🏗️ High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│    React Components + Tailwind CSS + Framer Motion           │
│  - Dashboard  - Opportunity Cards  - Career Roadmap          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                  HTTP/WebSocket
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Backend (Express)                          │
│ API Routes + Controllers + Services                          │
│ - Authentication  - Opportunity Management                   │
│ - Matching Engine  - Career Advisory                         │
└──────────┬───────────────┬──────────────┬──────────────────┘
           │               │              │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌───▼──────────┐
    │ PostgreSQL  │ │ Redis       │ │ OpenAI API   │
    │ - Users     │ │ - Caching   │ │ - Embeddings │
    │ - Opps      │ │ - Sessions  │ │ - Analysis   │
    └─────────────┘ └─────────────┘ └──────────────┘
                   │
         ┌─────────▼──────────┐
         │  AI Agents Layer   │
         │ - Opp Finder       │
         │ - Matchmaker       │
         │ - Career Advisor   │
         │ - Personalization  │
         └──────────┬─────────┘
                    │
      ┌─────────────┼──────────────┐
    ┌─▼──────────┐ ┌───▼────────┐ ┌──▼──────────┐
    │ Microsoft  │ │ External   │ │ Work IQ     │
    │ Work IQ    │ │ APIs       │ │ - Career    │
    │            │ │ - GitHub   │ │   Intel     │
    │ Career     │ │ - LinkedIn │ │            │
    │ Intel      │ │ - Devpost  │ │ - Skills    │
    └────────────┘ └────────────┘ └────────────┘
```

## 📦 Module Structure

### **Frontend Architecture**
```
frontend/
├── src/
│   ├── pages/
│   │   ├── _app.tsx              # App wrapper
│   │   ├── index.tsx             # Landing page
│   │   ├── dashboard.tsx         # Main dashboard
│   │   ├── opportunity/[id].tsx  # Opportunity details
│   │   ├── profile.tsx           # User profile
│   │   ├── roadmap.tsx           # Career roadmap
│   │   └── api/                  # API routes
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx        # Navigation
│   │   │   └── Footer.tsx        # Footer
│   │   ├── dashboard/
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── opportunity/
│   │   │   ├── OpportunityCard.tsx
│   │   │   └── OpportunityDetail.tsx
│   │   └── profile/
│   │       ├── SkillInput.tsx
│   │       ├── InterestSelector.tsx
│   │       └── ProfileForm.tsx
│   │
│   ├── hooks/
│   │   ├── useOpportunities.ts   # Fetch opportunities
│   │   ├── useUser.ts             # User profile
│   │   └── useNotifications.ts   # Real-time updates
│   │
│   ├── services/
│   │   ├── api.ts                # API client
│   │   └── auth.ts               # Auth service
│   │
│   ├── store/
│   │   └── useAppStore.ts        # Zustand store
│   │
│   ├── types/
│   │   ├── opportunity.ts
│   │   ├── user.ts
│   │   └── match.ts
│   │
│   ├── utils/
│   │   ├── formatting.ts
│   │   └── validation.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### **Backend Architecture**
```
backend/
├── src/
│   ├── server.ts                # Entry point
│   ├── app.ts                   # Express setup
│   │
│   ├── config/
│   │   ├── database.ts          # DB connection
│   │   ├── env.ts               # Env validation
│   │   └── workiq.ts            # Work IQ setup
│   │
│   ├── routes/
│   │   ├── auth.ts              # /api/auth
│   │   ├── opportunities.ts     # /api/opportunities
│   │   ├── matches.ts           # /api/matches
│   │   ├── profile.ts           # /api/profile
│   │   └── applications.ts      # /api/applications
│   │
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── opportunityController.ts
│   │   ├── matchingController.ts
│   │   ├── careerController.ts
│   │   └── applicationController.ts
│   │
│   ├── services/
│   │   ├── opportunityService.ts    # Fetch & manage
│   │   ├── matchingService.ts       # Calculate matches
│   │   ├── workiqService.ts         # Work IQ integration
│   │   ├── careerAdvisorService.ts  # Career advice
│   │   └── notificationService.ts   # Real-time alerts
│   │
│   ├── agents/
│   │   ├── opportunityFinderAgent.ts   # Search opps
│   │   ├── matchmakerAgent.ts          # Score matches
│   │   ├── careerAdvisorAgent.ts       # Roadmaps
│   │   └── personalizationAgent.ts     # Learning
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── Opportunity.ts
│   │   ├── Match.ts
│   │   ├── Application.ts
│   │   └── CareerProfile.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification
│   │   ├── errorHandler.ts       # Error handling
│   │   └── validation.ts         # Input validation
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── express.ts
│   │   └── database.ts
│   │
│   └── websocket/
│       └── events.ts             # Real-time events
│
├── migrations/
│   └── 001_init_schema.sql       # DB setup
│
├── tests/
├── .env.example
├── tsconfig.json
└── package.json
```

## 🔄 Data Flow Diagram

### **1. User Registration Flow**
```
User clicks "Login with GitHub"
    ↓
Frontend redirects to GitHub OAuth
    ↓
GitHub redirects back with code
    ↓
Backend exchanges code for token
    ↓
Backend creates user in database
    ↓
Backend returns JWT
    ↓
Frontend stores JWT in localStorage
    ↓
Frontend redirects to dashboard
```

### **2. Opportunity Matching Flow**
```
User completes profile (skills, interests)
    ↓
Profile saved to database
    ↓
[Opportunity Finder Agent]
  - Searches all APIs
  - Fetches opportunities
  - Deduplicates
    ↓
[Matchmaker Agent]
  - Analyzes user profile
  - Calculates match scores
  - Generates explanations
    ↓
Results stored in matches table
    ↓
Frontend fetches & displays
    ↓
User interactions tracked
    ↓
[Personalization Engine]
  - Updates ML model
  - Improves future recommendations
```

### **3. Career Roadmap Generation Flow**
```
User views roadmap page
    ↓
Backend fetches user profile
    ↓
[Career Advisor Agent]
  - Analyzes current role
  - Identifies target role
  - Detects skill gaps
  - Queries Work IQ
    ↓
Agent generates roadmap:
  - 6-month goals
  - 1-year goals
  - 5-year projection
  - Recommended opps
  - Learning path
    ↓
Frontend renders timeline
    ↓
User can save/export
```

## 🤖 AI Agent Orchestration

### **Agent Communication Pattern**
```
User Input
  ↓
[Opportunity Finder Agent]
  ├→ Search APIs
  ├→ Filter & validate
  └→ Return normalized opportunities
  ↓
[Matchmaker Agent]
  ├→ Analyze student profile
  ├→ Calculate fit scores
  ├→ Generate explanations
  └→ Return ranked matches
  ↓
[Career Advisor Agent]
  ├→ Analyze career goals
  ├→ Identify gaps
  ├→ Access Work IQ intel
  ├→ Generate roadmap
  └→ Suggest learning path
  ↓
[Personalization Engine]
  ├→ Track interactions
  ├→ Update preferences
  ├→ Improve recommendations
  └→ Feed back to Matchmaker
  ↓
User Sees Personalized Results
```

## 🔐 Security Architecture

### **Authentication Layer**
```
GitHub OAuth 2.0
    ↓
JWT Token Generation
  ├→ Access Token (15 min)
  └→ Refresh Token (7 days)
    ↓
Middleware Verification
  ├→ Check token validity
  ├→ Validate signature
  └→ Extract user ID
    ↓
Route Protection
  ├→ Public routes (no auth)
  ├→ Authenticated routes (JWT)
  └→ Admin routes (special)
```

### **Data Security**
```
✅ Passwords hashed (bcryptjs)
✅ Tokens signed (HS256)
✅ HTTPS enforced
✅ CORS configured
✅ SQL injection prevention (parameterized queries)
✅ XSS protection (React)
✅ Rate limiting
✅ Input validation (Joi)
```

## 💾 Database Schema

### **Core Tables**

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  github_id VARCHAR(255) UNIQUE,
  profile_picture VARCHAR(500),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  skill_name VARCHAR(255),
  proficiency_level VARCHAR(50),
  years_of_experience INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interests
CREATE TABLE interests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  interest_name VARCHAR(255),
  importance_level INT (1-10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  type VARCHAR(50), -- job, internship, hackathon, etc
  company_name VARCHAR(255),
  location VARCHAR(255),
  salary_min INT,
  salary_max INT,
  deadline_date DATE,
  required_skills TEXT[],
  required_experience_years INT,
  difficulty_level VARCHAR(50),
  source VARCHAR(50), -- github, linkedin, devpost, etc
  source_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  match_score DECIMAL(5,2), -- 0-100
  skill_match_percentage DECIMAL(5,2),
  interest_match_percentage DECIMAL(5,2),
  experience_match_percentage DECIMAL(5,2),
  match_explanation TEXT,
  is_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  status VARCHAR(50), -- interested, applied, accepted, rejected
  application_date TIMESTAMP DEFAULT NOW(),
  response_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Career Profiles
CREATE TABLE career_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  current_role VARCHAR(255),
  target_role VARCHAR(255),
  target_industry VARCHAR(255),
  experience_years INT,
  education_level VARCHAR(50),
  salary_expectation INT,
  remote_preference VARCHAR(50),
  mobility VARCHAR(50),
  career_roadmap JSONB,
  learning_path JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_interests_user_id ON interests(user_id);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline_date);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_score ON matches(match_score DESC);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_career_profiles_user_id ON career_profiles(user_id);
```

## 🚀 Deployment Architecture

### **Local Development**
```
Docker Compose
├─ Frontend (Next.js on port 3000)
├─ Backend (Express on port 5000)
├─ PostgreSQL (port 5432)
└─ Redis (port 6379)
```

### **Production**
```
Vercel (Frontend)
├─ GitHub integration
├─ Automatic deployments
└─ Global CDN

Railway/Render (Backend)
├─ Node.js runtime
├─ Environment variables
└─ Custom domain

ElephantSQL/Render (PostgreSQL)
├─ Managed database
├─ Automated backups
└─ SSL connections

Redis Cloud (Redis)
├─ Managed cache
├─ High availability
└─ Auto-scaling
```

## 💾 Caching Strategy

### **Redis Cache Layers**
```
1. User Profile Cache
   - TTL: 1 hour
   - Invalidated on profile update

2. Opportunity Cache
   - TTL: 30 minutes
   - Refreshed from APIs hourly

3. Match Results Cache
   - TTL: 15 minutes
   - Invalidated on profile change

4. Career Roadmap Cache
   - TTL: 2 hours
   - Invalidated on goal change
```

## 📊 Performance Optimization

### **Frontend Optimization**
- Next.js Image optimization
- Code splitting
- CSS-in-JS (Tailwind)
- Lazy loading components
- Caching with React Query

### **Backend Optimization**
- Database indexes
- Query optimization
- Redis caching
- Connection pooling
- Request compression

## 🔄 CI/CD Pipeline

```
Git Push
  ↓
GitHub Actions
  ├→ Lint & Format
  ├→ Type Check
  ├→ Unit Tests
  ├→ Integration Tests
  ├→ Build Docker Images
  └→ Deploy to Staging
  ↓
Manual Approval
  ↓
Deploy to Production
  ├→ Frontend → Vercel
  ├→ Backend → Railway
  └→ Database → ElephantSQL
```

---

For implementation details, see individual module documentation.
