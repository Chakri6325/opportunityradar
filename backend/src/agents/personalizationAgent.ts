import { pool } from '../config/database';

export interface UserInteractionEvent {
  userId: string;
  opportunityId: string;
  action: 'viewed' | 'applied' | 'saved' | 'clicked';
  timestamp: Date;
}

export async function trackUserInteraction(event: UserInteractionEvent): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      // In production, store interactions in database
      console.log(`📊 Tracked: ${event.action} on opportunity ${event.opportunityId}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Personalization tracking error:', error);
  }
}

export async function getPersonalizedRecommendations(userId: string): Promise<string[]> {
  try {
    const client = await pool.connect();
    try {
      // Fetch user's interests and applied opportunities
      const result = await client.query(
        `SELECT interest_name FROM interests WHERE user_id = $1 LIMIT 10`,
        [userId]
      );

      return result.rows.map((row: any) => row.interest_name);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    return [];
  }
}
