import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CareerData {
  currentRole: string;
  targetRole: string;
  experience: number;
  skills: string[];
  interests: string[];
}

interface Milestone {
  timeframe: string;
  goal: string;
  skills: string[];
  description: string;
  opportunityTypes: string[];
}

export async function generateCareerRoadmap(data: CareerData): Promise<{
  milestones: Milestone[];
  learningPath: string[];
  skillGaps: string[];
}> {
  try {
    const prompt = `
    You are a career advisor. Create a detailed career roadmap.
    
    Current Role: ${data.currentRole}
    Target Role: ${data.targetRole}
    Years of Experience: ${data.experience}
    Current Skills: ${data.skills.join(', ')}
    Interests: ${data.interests.join(', ')}
    
    Generate a 5-year career roadmap with quarterly milestones.
    Return ONLY valid JSON with this exact structure:
    {"milestones":[{"timeframe":"string","goal":"string","skills":["string"],"description":"string","opportunityTypes":["string"]}],"learningPath":["string"],"skillGaps":["string"]}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('❌ Roadmap generation error:', error);
    return {
      milestones: [],
      learningPath: [],
      skillGaps: [],
    };
  }
}
