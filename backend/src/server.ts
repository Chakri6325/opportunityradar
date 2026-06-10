import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { createServer } from 'http';
import { WebSocket, WebSocketServer, RawData } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Import database config
import { initializeDatabase, pool } from './config/database';
import { seedOpportunities } from './data/seedOpportunities';
import { syncLiveOpportunities } from './services/syncService';
import {
  HackathonCollectorAgent,
  ScholarshipCollectorAgent,
  JobCollectorAgent,
  ResearchCollectorAgent,
  CompetitionCollectorAgent
} from './services/agentCollectorService';

// Import routes
import authRoutes from './routes/auth';
import opportunityRoutes from './routes/opportunities';
import matchRoutes from './routes/matches';
import profileRoutes from './routes/profile';
import applicationRoutes from './routes/applications';
import onboardingRoutes from './routes/onboarding';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use(authMiddleware);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/applications', applicationRoutes);

// WebSocket for real-time updates
wss.on('connection', (ws: WebSocket) => {
  console.log('✅ Client connected to WebSocket');
  
  ws.on('message', (message: RawData) => {
    console.log('📨 Received message:', message);
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`\n🚀 OpportunityRadar Backend Running`);
  console.log(`📊 Server: http://localhost:${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

  try {
    // Initialize DB schema additions
    await initializeDatabase();
    
    // Seed base opportunities
    console.log('🌱 Seeding base opportunities...');
    const count = await seedOpportunities();
    console.log(`🌱 Seeded ${count} opportunities.`);

    // Sync live opportunities from RemoteOK & Arbeitnow
    console.log('🔄 Syncing live jobs & internships...');
    const syncCount = await syncLiveOpportunities();
    console.log(`🔄 Synced ${syncCount} live opportunities.`);

    // Run all 5 source collector agents automatically in the background
    console.log('🤖 Launching 5 Source Collector Agents in the background...');
    Promise.allSettled([
      HackathonCollectorAgent.collect(),
      ScholarshipCollectorAgent.collect(),
      JobCollectorAgent.collect(),
      ResearchCollectorAgent.collect(),
      CompetitionCollectorAgent.collect()
    ]).then((results) => {
      const names = ['Hackathons', 'Scholarships', 'Jobs', 'Research', 'Competitions'];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          console.log(`✅ [Agent ${i + 1}] ${names[i]}: collected ${r.value} opportunities`);
        } else {
          console.warn(`⚠️ [Agent ${i + 1}] ${names[i]}: failed — ${r.reason?.message || r.reason}`);
        }
      });
      console.log('🤖 All collector agents finished. Dashboard is now fully populated.');
    });

  } catch (err) {
    console.error('❌ Failed to run startup DB tasks:', err);
  }
});

export { app, wss };
