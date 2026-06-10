import OpenAI from 'openai';

export interface StudentProfile {
  name: string;
  skills: string[];
  interests: string[];
  education_level: string;
  career_goals: string;
  target_role: string;
  experience_years: number;
}

export interface OpportunityMatch {
  opportunity_id: string;
  match_score: number;
  skill_match_percentage: number;
  interest_match_percentage: number;
  experience_match_percentage: number;
  match_explanation: string;
  skill_gaps: string[];
  is_recommended: boolean;
}

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your GitHub') || apiKey.includes('<your')) {
    console.warn('⚠️ OpenAI API Key is missing or placeholders used. Falling back to local heuristic matching.');
    return null;
  }
  return new OpenAI({ apiKey });
};

// Heuristic matching for local fallback
function generateLocalMatch(profile: StudentProfile, opp: any): OpportunityMatch {
  const oppSkills = Array.isArray(opp.required_skills) ? opp.required_skills : [];
  
  // 1. Skill Match
  const userSkillsUpper = profile.skills.map(s => s.toLowerCase());
  const matchedSkills = oppSkills.filter(s => userSkillsUpper.includes(s.toLowerCase()));
  const skillMatch = oppSkills.length > 0 
    ? Math.round((matchedSkills.length / oppSkills.length) * 100) 
    : 75; // baseline if no skills required

  // 2. Interest Match
  const oppText = `${opp.title} ${opp.description} ${opp.type}`.toLowerCase();
  const matchedInterests = profile.interests.filter(interest => 
    oppText.includes(interest.toLowerCase()) || 
    opp.type.toLowerCase().includes(interest.toLowerCase())
  );
  const interestMatch = profile.interests.length > 0 
    ? Math.round((matchedInterests.length / profile.interests.length) * 100) 
    : 70;

  // 3. Experience Match
  const reqExp = opp.required_experience_years || 0;
  let expMatch = 100;
  if (profile.experience_years < reqExp) {
    expMatch = Math.round((profile.experience_years / reqExp) * 100);
  }

  // Overall Score (weighted average)
  const match_score = Math.round((skillMatch * 0.45) + (interestMatch * 0.35) + (expMatch * 0.20));

  // Determine skill gaps
  const skill_gaps = oppSkills.filter(s => !userSkillsUpper.includes(s.toLowerCase()));

  // Dynamic explanation
  let match_explanation = '';
  if (match_score > 80) {
    match_explanation = `Excellent fit! Your strong skills in ${matchedSkills.slice(0, 2).join(', ') || 'related areas'} align perfectly with the requirements of this ${opp.type}.`;
  } else if (match_score > 60) {
    match_explanation = `Good potential match. You meet the key interests for this ${opp.type}, though developing skills in ${skill_gaps.slice(0, 2).join(', ') || 'cloud/dev tools'} will strengthen your profile.`;
  } else {
    match_explanation = `Potential growth opportunity. This ${opp.type} would help you build skills in ${oppSkills.slice(0, 2).join(', ')}, though it doesn't align fully with your current active skills.`;
  }

  return {
    opportunity_id: opp.id,
    match_score,
    skill_match_percentage: skillMatch,
    interest_match_percentage: interestMatch,
    experience_match_percentage: expMatch,
    match_explanation,
    skill_gaps,
    is_recommended: match_score >= 70
  };
}

export async function generateMatches(profile: StudentProfile, opportunities: any[]): Promise<OpportunityMatch[]> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Run local heuristic matching for all opportunities
    return opportunities.map(opp => generateLocalMatch(profile, opp));
  }

  const results: OpportunityMatch[] = [];
  const batchSize = 10;

  for (let i = 0; i < opportunities.length; i += batchSize) {
    const batch = opportunities.slice(i, i + batchSize);
    
    try {
      const prompt = `
You are an expert AI Career Coach. Analyze the following student profile and match it against the provided list of career opportunities (hackathons, jobs, internships, scholarships, courses).

Student Profile:
${JSON.stringify({
  skills: profile.skills,
  interests: profile.interests,
  education_level: profile.education_level,
  career_goals: profile.career_goals,
  target_role: profile.target_role,
  experience_years: profile.experience_years
}, null, 2)}

Opportunities:
${JSON.stringify(batch.map(opp => ({
  id: opp.id,
  title: opp.title,
  description: opp.description,
  type: opp.type,
  required_skills: opp.required_skills,
  required_experience_years: opp.required_experience_years
})), null, 2)}

Provide scores and metrics for each opportunity in the batch. Return ONLY a valid JSON object matching the schema below:
{
  "matches": [
    {
      "opportunity_id": "string (UUID from the opportunity list)",
      "match_score": number (0-100 overall score),
      "skill_match_percentage": number (0-100),
      "interest_match_percentage": number (0-100),
      "experience_match_percentage": number (0-100),
      "match_explanation": "string (1-2 sentences explaining the match)",
      "skill_gaps": ["string", "string"] (list of skills required by opportunity but missing in student profile),
      "is_recommended": boolean (true if match_score >= 70)
    }
  ]
}
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a career counselor AI. Evaluate a batch of opportunities for a student and return JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }, {
        timeout: 5000
      });


      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      
      if (parsed && Array.isArray(parsed.matches)) {
        for (const match of parsed.matches) {
          results.push({
            opportunity_id: match.opportunity_id,
            match_score: Number(match.match_score) || 50,
            skill_match_percentage: Number(match.skill_match_percentage) || 50,
            interest_match_percentage: Number(match.interest_match_percentage) || 50,
            experience_match_percentage: Number(match.experience_match_percentage) || 50,
            match_explanation: match.match_explanation || 'Match calculated.',
            skill_gaps: Array.isArray(match.skill_gaps) ? match.skill_gaps : [],
            is_recommended: !!match.is_recommended
          });
        }
      } else {
        throw new Error('Invalid response structure');
      }

    } catch (error) {
      console.error(`❌ OpenAI error matching batch starting at index ${i}:`, error);
      // Fallback to local heuristic matching for this batch
      for (const opp of batch) {
        results.push(generateLocalMatch(profile, opp));
      }
    }
  }

  return results;
}
