import axios from 'axios';
import { workiqConfig } from '../config/workiq';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WorkIQIntel {
  skills: string[];
  interests: string[];
  experienceSummary: string;
  suggestedRoles: string[];
}

export async function fetchM365Intel(userId: string, accessToken?: string): Promise<WorkIQIntel> {
  console.log(`🧠 Querying Microsoft Work IQ Gateway for user ${userId}...`);
  
  let rawM365Text = '';
  
  if (accessToken) {
    try {
      // Real REST call to Microsoft Work IQ Gateway
      const response = await axios.post(
        `${workiqConfig.gatewayUrl}/v1/agent/ask`,
        {
          prompt: "Analyze the user's M365 data (emails, documents, calendars) to extract professional skills, tech stack, and career interests.",
          scopes: ["mail.read", "files.read", "calendars.read"]
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      if (response.data && response.data.answer) {
        rawM365Text = response.data.answer;
      }
    } catch (err: any) {
      console.warn('⚠️ Microsoft Work IQ Live Gateway call failed, falling back to simulated M365 local intelligence context:', err.message);
    }
  }

  // Fallback / Simulation context (what would be returned by reasoning over a student's M365 tenant)
  if (!rawM365Text) {
    rawM365Text = `
      OneDrive Document: "Machine_Learning_Project_Report.pdf"
      Author: Student User
      Content: Implemented a convolutional neural network (CNN) in PyTorch to classify satellite images. Used Pandas, NumPy, and Scikit-Learn for preprocessing. Devised training pipelines on AWS EC2 GPU instances.

      Outlook Email Calendar Event:
      Subject: "HackAI 2026 Onboarding & Team Building"
      Location: Microsoft Teams
      Organizer: HackAI Organizer

      Outlook Email Thread:
      From: GitHub Notifications
      Subject: "[Merged] PR #12: Refactor backend API routes to PostgreSQL"
      Body: Merged commit adding Express server configurations, knex migrations, and Redis caching. Tested database indexes for scale.

      Teams Chat Message:
      "Hey, I am working on the UI/UX redesign in Figma. Can you help me tie the React frontend to the Node.js controllers? We need to use TypeScript for clean routing."
    `;
  }

  // Use OpenAI to parse the grounded M365 context
  try {
    const prompt = `
      You are Microsoft Work IQ. Analyze the following grounded Microsoft 365 data (documents, emails, calendar, Teams chat) for a student and extract their technical skills, career interests, a short experience summary, and suggested target roles.
      
      M365 Grounded Context:
      ${rawM365Text}
      
      Return ONLY valid JSON with this structure:
      {
        "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
        "interests": ["Interest1", "Interest2", "Interest3"],
        "experienceSummary": "Short 2-sentence summary of projects and background.",
        "suggestedRoles": ["Role1", "Role2"]
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    }, {
      timeout: 5000
    });


    const content = response.choices[0].message.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('❌ Work IQ parsing error:', err);
  }

  // Fallback defaults
  return {
    skills: ['Python', 'PyTorch', 'React', 'Node.js', 'PostgreSQL', 'Figma', 'TypeScript', 'Docker'],
    interests: ['AI/ML', 'Web Development', 'Design', 'Data Science', 'Cloud & DevOps'],
    experienceSummary: 'Experienced in developing Machine Learning models in PyTorch and refactoring backend APIs in Node.js/PostgreSQL.',
    suggestedRoles: ['Machine Learning Engineer', 'Full Stack Developer']
  };
}
