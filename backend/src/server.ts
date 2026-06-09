import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import opportunityRoutes from './routes/opportunities';
import matchRoutes from './routes/matches';
import profileRoutes from './routes/profile';
import applicationRoutes from './routes/applications';

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
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/applications', applicationRoutes);

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');
  
  ws.on('message', (message) => {
    console.log('📨 Received message:', message);
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
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
server.listen(PORT, () => {
  console.log(`
🚀 OpportunityRadar Backend Running`);
  console.log(`📊 Server: http://localhost:${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});

export { app, wss };
