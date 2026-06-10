import { Router, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, authMiddleware } from '../middleware/auth';


const router = Router();

// GitHub OAuth - Start
router.get('/github', (req, res) => {
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.append('client_id', process.env.GITHUB_CLIENT_ID || '');
  githubAuthUrl.searchParams.append('redirect_uri', `${process.env.BACKEND_URL}/api/auth/github/callback`);
  githubAuthUrl.searchParams.append('scope', 'user:email read:user');

  res.redirect(githubAuthUrl.toString());
});

// GitHub OAuth - Callback
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/github/callback`,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    const { id: github_id, login, avatar_url, email } = userResponse.data;

    // Get user email if not provided
    let userEmail = email;
    if (!userEmail) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${access_token}` },
      });
      userEmail = emailResponse.data.find((e: any) => e.primary)?.email || `${login}@github.com`;
    }

    // Find or create user
    let client = await pool.connect();
    try {
      let user = await client.query(
        'SELECT id, email FROM users WHERE github_id = $1',
        [github_id]
      );

      if (user.rows.length === 0) {
        const userId = uuidv4();
        await client.query(
          `INSERT INTO users (id, email, name, github_id, profile_picture) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, userEmail, login, github_id, avatar_url]
        );
        user.rows[0] = { id: userId, email: userEmail };
      }

      // Create JWT token
      const jwtToken = jwt.sign(
        { userId: user.rows[0].id, email: userEmail },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/dashboard?token=${jwtToken}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {

  try {
    const userId = req.userId;
    const client = await pool.connect();

    try {
      const user = await client.query(
        'SELECT id, email, name, profile_picture, bio, location, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
