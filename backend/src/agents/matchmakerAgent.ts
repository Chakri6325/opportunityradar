import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchingData {
  userSkills: string[];
  userInterests: string[];
  userExperience: number;
  opportunity: {
    requiredSkills: string[];
    requiredExperience: number;
    type: string;
    description: string;
    title: string;
  };
}

export async function calculateMatchScore(data: MatchingData): Promise<{
  score: number;
  explanation: string;
  skillMatch: number;
  interestMatch: number;
  experienceMatch: number;
}> {
  try {
    const prompt = `
    You are an AI career counselor. Analyze this opportunity match:
    
    User Profile:
    - Skills: ${data.userSkills.join(', ')}
    - Interests: ${data.userInterests.join(', ')}
    - Years of Experience: ${data.userExperience}
    
    Opportunity:
    - Title: ${data.opportunity.title}
    - Required Skills: ${data.opportunity.requiredSkills.join(', ')}
    - Required Experience: ${data.opportunity.requiredExperience} years
    - Type: ${data.opportunity.type}
    - Description: ${data.opportunity.description}
    
    Provide scores (0-100) and brief explanation.
    Return ONLY valid JSON with exactly this structure:
    {"skillMatch":number,"interestMatch":number,"experienceMatch":number,"overallScore":number,"explanation":"string"}
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
      max_tokens: 200,
    });

    const content = response.choices[0].message.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      score: result.overallScore || 50,
      explanation: result.explanation || 'Unable to calculate match',
      skillMatch: result.skillMatch || 50,
      interestMatch: result.interestMatch || 50,
      experienceMatch: result.experienceMatch || 50,
    };
  } catch (error) {
    console.error('❌ Matching error:', error);
    return {
      score: 50,
      explanation: 'Unable to calculate match score',
      skillMatch: 50,
      interestMatch: 50,
      experienceMatch: 50,
    };
  }
}
