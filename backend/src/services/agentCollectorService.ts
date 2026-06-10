import axios from 'axios';
import { pool } from '../config/database';

export interface SyncedOpportunity {
  title: string;
  description: string;
  type: 'hackathon' | 'scholarship' | 'internship' | 'job' | 'course';
  company_name: string;
  location: string;
  source: string;
  source_url: string;
  required_skills: string[];
}

// Helper to parse HNRSS feeds
function parseRSS(xmlText: string): { title: string; link: string; description: string }[] {
  const items: { title: string; link: string; description: string }[] = [];
  const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  for (const itemXml of itemMatches) {
    const title = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
                  itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
    const description = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
                        itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
    
    if (title && link) {
      items.push({
        title: title.trim(),
        link: link.trim(),
        description: description.replace(/<[^>]*>/g, '').trim().slice(0, 500) || 'Active opportunity details'
      });
    }
  }
  return items;
}

// 1. Agent 1: Hackathons Collector Agent
export class HackathonCollectorAgent {
  static async collect(): Promise<number> {
    console.log('🤖 [Agent 1] Running Hackathons Collector Agent...');
    try {
      const response = await axios.get('https://hnrss.org/newest?q=hackathon');
      const items = parseRSS(response.data);
      let count = 0;

      for (const item of items.slice(0, 10)) {
        const skills = ['React', 'Node.js', 'Python', 'Git'];
        const success = await saveOpportunity({
          title: item.title,
          description: item.description,
          type: 'hackathon',
          company_name: 'Hackathon Host',
          location: 'Remote',
          source: 'hn_hackathons',
          source_url: item.link,
          required_skills: skills
        });
        if (success) count++;
      }
      return count;
    } catch (err: any) {
      console.error('❌ [Agent 1] Hackathons sync failed:', err.message);
      return 0;
    }
  }
}

// 2. Agent 2: Scholarships Collector Agent
export class ScholarshipCollectorAgent {
  static async collect(): Promise<number> {
    console.log('🤖 [Agent 2] Running Scholarships Collector Agent...');
    try {
      const response = await axios.get('https://hnrss.org/newest?q=scholarship');
      const items = parseRSS(response.data);
      let count = 0;

      for (const item of items.slice(0, 10)) {
        const skills = ['Academic Excellence', 'Research'];
        const success = await saveOpportunity({
          title: item.title,
          description: item.description,
          type: 'scholarship',
          company_name: 'Scholarship Provider',
          location: 'Remote',
          source: 'hn_scholarships',
          source_url: item.link,
          required_skills: skills
        });
        if (success) count++;
      }
      return count;
    } catch (err: any) {
      console.error('❌ [Agent 2] Scholarships sync failed:', err.message);
      return 0;
    }
  }
}

// 3. Agent 3: Jobs & Internships Collector Agent
export class JobCollectorAgent {
  static async collect(): Promise<number> {
    console.log('🤖 [Agent 3] Running Jobs & Internships Collector Agent...');
    let count = 0;

    // Fetch from RemoteOK API
    try {
      const response = await axios.get('https://remoteok.com/api', {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (Array.isArray(response.data)) {
        const rawJobs = response.data.slice(1, 11); // Skip legal disclaimer, take top 10
        for (const item of rawJobs) {
          const type = (item.position || '').toLowerCase().includes('intern') ? 'internship' : 'job';
          const success = await saveOpportunity({
            title: item.position || 'Software Developer',
            description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 500) : 'Active Remote Job',
            type: type,
            company_name: item.company || 'Remote Company',
            location: item.location || 'Remote (Worldwide)',
            source: 'remoteok',
            source_url: item.url || 'https://remoteok.com',
            required_skills: Array.isArray(item.tags) ? item.tags : ['JavaScript', 'React']
          });
          if (success) count++;
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [Agent 3] RemoteOK API failed:', err.message);
    }

    // Fetch from Arbeitnow API
    try {
      const response = await axios.get('https://www.arbeitnow.com/api/job-board-api');
      if (response.data && Array.isArray(response.data.data)) {
        const rawJobs = response.data.data.slice(0, 10);
        for (const item of rawJobs) {
          const type = (item.title || '').toLowerCase().includes('intern') ? 'internship' : 'job';
          const success = await saveOpportunity({
            title: item.title || 'Developer',
            description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 500) : 'Active Developer Job',
            type: type,
            company_name: item.company_name || 'Tech Company',
            location: item.location || 'Europe (Hybrid)',
            source: 'arbeitnow',
            source_url: item.url || 'https://www.arbeitnow.com',
            required_skills: Array.isArray(item.tags) ? item.tags : ['TypeScript', 'Node.js']
          });
          if (success) count++;
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [Agent 3] Arbeitnow API failed:', err.message);
    }

    return count;
  }
}

// 4. Agent 4: Research Programs Collector Agent
export class ResearchCollectorAgent {
  static async collect(): Promise<number> {
    console.log('🤖 [Agent 4] Running Research Programs Collector Agent...');
    try {
      const response = await axios.get('https://hnrss.org/newest?q=fellowship'); // Fellowship is standard for research
      const items = parseRSS(response.data);
      let count = 0;

      for (const item of items.slice(0, 10)) {
        const skills = ['Research', 'Writing', 'Data Analysis'];
        const success = await saveOpportunity({
          title: item.title,
          description: item.description,
          type: 'course', // map research programs to course/pathways
          company_name: 'Research Institution',
          location: 'Remote',
          source: 'hn_research',
          source_url: item.link,
          required_skills: skills
        });
        if (success) count++;
      }
      return count;
    } catch (err: any) {
      console.error('❌ [Agent 4] Research sync failed:', err.message);
      return 0;
    }
  }
}

// 5. Agent 5: Competitions Collector Agent
export class CompetitionCollectorAgent {
  static async collect(): Promise<number> {
    console.log('🤖 [Agent 5] Running Competitions Collector Agent...');
    try {
      // Query Codeforces contests
      const response = await axios.get('https://codeforces.com/api/contest.list');
      let count = 0;
      
      if (response.data && response.data.status === 'OK') {
        const contests = response.data.result.filter((c: any) => c.phase === 'BEFORE').slice(0, 10);
        for (const contest of contests) {
          const success = await saveOpportunity({
            title: contest.name,
            description: `Competitive programming contest. Duration: ${(contest.durationSeconds / 3600).toFixed(1)} hours. Type: ${contest.type}.`,
            type: 'hackathon', // map coding competitions to hackathons
            company_name: 'Codeforces',
            location: 'Online',
            source: 'codeforces',
            source_url: `https://codeforces.com/contests/${contest.id}`,
            required_skills: ['Algorithms', 'Data Structures', 'C++', 'Python', 'Java']
          });
          if (success) count++;
        }
      }
      return count;
    } catch (err: any) {
      console.error('❌ [Agent 5] Competitions sync failed:', err.message);
      return 0;
    }
  }
}

// DB Helper to insert opportunity dynamically
async function saveOpportunity(opp: SyncedOpportunity): Promise<boolean> {
  const client = await pool.connect();
  try {
    const skillsArray = Array.from(new Set(opp.required_skills.map(s => s.charAt(0).toUpperCase() + s.slice(1))));
    const result = await client.query(
      `INSERT INTO opportunities (
        title, description, type, company_name, location,
        salary_min, salary_max, deadline_date, required_skills,
        required_experience_years, difficulty_level, source, source_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, null, null, NOW() + INTERVAL '30 days', $6, $7, $8, $9, $10, true)
      ON CONFLICT (title, company_name) DO UPDATE SET
        description = EXCLUDED.description,
        source_url = EXCLUDED.source_url,
        required_skills = EXCLUDED.required_skills,
        updated_at = NOW()
      RETURNING id`,
      [
        opp.title,
        opp.description,
        opp.type,
        opp.company_name,
        opp.location,
        skillsArray,
        opp.type === 'job' ? 1 : 0,
        opp.type === 'job' ? 'intermediate' : 'beginner',
        opp.source,
        opp.source_url
      ]
    );
    return result.rows.length > 0;
  } catch (err) {
    // Suppress console spam for conflicts
    return false;
  } finally {
    client.release();
  }
}
