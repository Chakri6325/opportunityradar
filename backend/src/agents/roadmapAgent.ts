import OpenAI from 'openai';
import { StudentProfile } from './matchingAgent';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your GitHub') || apiKey.includes('<your')) {
    return null;
  }
  return new OpenAI({ apiKey });
};

// Local customized roadmap fallback based on student profile
function generateLocalRoadmap(profile: StudentProfile, topMatches: any[]) {
  const role = profile.target_role || 'Software Engineer';
  const industry = profile.career_goals || 'Technology';

  const defaultGaps = ['Docker', 'System Design', 'Kubernetes', 'Cloud Deployment', 'Data Structures'];
  const skillGaps = defaultGaps.filter(g => !profile.skills.map(s => s.toLowerCase()).includes(g.toLowerCase()));

  const matchedOppTitles = topMatches.map(m => m.title).slice(0, 3);
  
  return {
    current_assessment: `You have a solid foundation in ${profile.skills.slice(0, 3).join(', ') || 'programming'}. You are aiming for a career as a ${role} in ${industry}, with ${profile.experience_years} years of current experience. Developing skills in cloud orchestration and building projects will be critical next steps.`,
    dream_role_timeline: `Estimated 12-18 months to reach a competitive candidate level for a senior/mid-level ${role} position.`,
    key_skill_gaps: skillGaps.length > 0 ? skillGaps : ['Advanced System Design', 'AWS/GCP Cloud Architecture'],
    milestones: [
      {
        timeframe: '3 months',
        goal: `Strengthen Core Foundations & Start Small Projects`,
        description: `Focus on mastering intermediate coding concepts and building minor portfolio features. Participate in your first developer hackathon.`,
        skills: [...profile.skills.slice(0, 2), 'Git', 'Agile Methodologies'],
        opportunityTypes: ['Hackathons', 'Online Courses'],
        actions: [
          `Build 2 small open-source portfolio apps focusing on ${role} functionalities.`,
          `Register and participate in a community hackathon (e.g. ${matchedOppTitles[0] || 'Local MLH Hackathon'}).`,
          `Complete online certification courses in missing tech stack items.`
        ]
      },
      {
        timeframe: '6 months',
        goal: `Build Full-Stack Competency & Complete Internships`,
        description: `Transition into full-stack or deep domain engineering. Work on database optimization, deployment pipelines, and seek internships.`,
        skills: [skillGaps[0] || 'Docker', 'PostgreSQL', 'API Development'],
        opportunityTypes: ['Internships', 'Scholarships'],
        actions: [
          `Deploy a production-ready application using containerization (Docker).`,
          `Apply for at least 5 tech internships matching your profile (e.g. Google SWE Intern or startup roles).`,
          `Apply to technology diversity scholarships to gain industry backing and network.`
        ]
      },
      {
        timeframe: '12 months',
        goal: `System Design & Landing Your Dream Role`,
        description: `Focus on system design at scale, testing, security practices, and applying for high-matching full-time positions.`,
        skills: ['System Design', 'AWS', 'CI/CD Pipelines', 'Cybersecurity Foundations'],
        opportunityTypes: ['Jobs', 'Hackathons'],
        actions: [
          `Architect and document a high-scale microservices system design.`,
          `Start applying to entry-level and junior full-time roles for ${role}.`,
          `Actively contribute to open-source software repositories on GitHub.`
        ]
      }
    ]
  };
}

export async function generateRoadmap(profile: StudentProfile, topMatches: any[]): Promise<any> {
  const openai = getOpenAIClient();

  if (!openai) {
    return generateLocalRoadmap(profile, topMatches);
  }

  try {
    const prompt = `
You are an expert Career Counselor AI. Create a personalized, actionable career roadmap for a student aiming to become a "${profile.target_role}".

Student Profile:
${JSON.stringify({
  skills: profile.skills,
  interests: profile.interests,
  education_level: profile.education_level,
  career_goals: profile.career_goals,
  experience_years: profile.experience_years
}, null, 2)}

Top Matched Opportunities (for context):
${JSON.stringify(topMatches.slice(0, 5).map(opp => ({
  title: opp.title,
  type: opp.type,
  company_name: opp.company_name
})), null, 2)}

Generate a career roadmap. Return ONLY a valid JSON object matching the following structure:
{
  "current_assessment": "string (1-2 sentences assessing their current position and readiness)",
  "dream_role_timeline": "string (estimated timeframe to reach their target role)",
  "key_skill_gaps": ["string", "string"] (top skills they need to learn),
  "milestones": [
    {
      "timeframe": "3 months",
      "goal": "string (milestone title)",
      "description": "string (detailed description of what to achieve)",
      "skills": ["string"] (skills to focus on in this phase),
      "opportunityTypes": ["string"] (types of opportunities to look for, e.g., Hackathons, Internships),
      "actions": ["string", "string"] (3 specific, actionable steps to take)
    },
    {
      "timeframe": "6 months",
      "goal": "string",
      "description": "string",
      "skills": ["string"],
      "opportunityTypes": ["string"],
      "actions": ["string", "string"]
    },
    {
      "timeframe": "12 months",
      "goal": "string",
      "description": "string",
      "skills": ["string"],
      "opportunityTypes": ["string"],
      "actions": ["string", "string"]
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career counselor. Generate a personalized career roadmap as JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }, {
      timeout: 5000
    });


    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);

  } catch (error) {
    console.error('❌ OpenAI error generating roadmap:', error);
    return generateLocalRoadmap(profile, topMatches);
  }
}
