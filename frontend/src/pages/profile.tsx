import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

const POPULAR_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL',
  'Machine Learning', 'Data Science', 'Docker', 'AWS', 'Java', 'C++',
  'Go', 'Rust', 'Flutter', 'Swift', 'Kotlin', 'TensorFlow', 'PyTorch',
  'Figma', 'UI/UX', 'Product Management',
];

const INTEREST_DOMAINS = [
  'AI/ML', 'Web Development', 'Mobile Apps', 'Cloud & DevOps', 'Data Science',
  'Cybersecurity', 'Blockchain', 'Climate Tech', 'HealthTech', 'FinTech',
  'EdTech', 'Game Development', 'Open Source', 'Research', 'Design', 'Product Management',
];

interface SkillEntry {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface ProfileFormData {
  fullName: string;
  educationLevel: string;
  university: string;
  graduationYear: string;
  location: string;
  skills: SkillEntry[];
  interests: string[];
  workPreference: string;
  dreamRole: string;
  targetIndustry: string;
  yearsExperience: number;
  salaryExpectation: string;
}

export default function Profile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    educationLevel: 'Undergraduate',
    university: '',
    graduationYear: '2026',
    location: '',
    skills: [],
    interests: [],
    workPreference: 'Remote',
    dreamRole: '',
    targetIndustry: '',
    yearsExperience: 0,
    salaryExpectation: '',
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.replace('/');
    } else {
      setToken(savedToken);
    }
  }, []);

  // Fetch onboarding status/profile data
  const { data: onboardingData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['onboardingStatus', token],
    queryFn: async () => {
      const response = await api.get('/api/onboarding/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  // Pre-fill form when data arrives
  useEffect(() => {
    if (onboardingData?.profile) {
      const p = onboardingData.profile;
      
      // Parse university from current_position e.g. "Student at MIT (Class of 2026)"
      let uni = '';
      let gradYear = '2026';
      if (p.current_position) {
        const uniMatch = p.current_position.match(/Student at ([^(]+)/);
        const yearMatch = p.current_position.match(/Class of (\d+)/);
        if (uniMatch) uni = uniMatch[1].trim();
        if (yearMatch) gradYear = yearMatch[1];
      }

      setFormData({
        fullName: onboardingData.profile.name || '',
        educationLevel: p.education_level || 'Undergraduate',
        university: uni,
        graduationYear: gradYear,
        location: p.location || '',
        skills: Array.isArray(p.skills) ? p.skills.map((s: any) => ({
          name: s.skill_name || s.name,
          proficiency: s.proficiency_level || s.proficiency || 'Intermediate'
        })) : [],
        interests: Array.isArray(p.interests) ? p.interests : [],
        workPreference: p.remote_preference || 'Remote',
        dreamRole: p.target_role || '',
        targetIndustry: p.target_industry || '',
        yearsExperience: Number(p.experience_years) || 0,
        salaryExpectation: p.salary_expectation ? String(p.salary_expectation) : '',
      });
    }
  }, [onboardingData]);

  // Mutation to save profile
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.post('/api/onboarding/complete', {
        ...data,
        opportunityTypes: ['Hackathons', 'Scholarships', 'Internships', 'Jobs', 'Online Courses'] // default all
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      alert('✅ Profile updated and AI matches regenerated successfully!');
      router.push('/dashboard');
    }
  });

  const updateField = (field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skillName: string) => {
    setFormData((prev) => {
      const exists = prev.skills.find((s) => s.name === skillName);
      if (exists) {
        return { ...prev, skills: prev.skills.filter((s) => s.name !== skillName) };
      }
      return { ...prev, skills: [...prev.skills, { name: skillName, proficiency: 'Intermediate' }] };
    });
  };

  const updateSkillProficiency = (skillName: string, proficiency: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => s.name === skillName ? { ...s, proficiency } : s),
    }));
  };

  const addCustomSkill = () => {
    const name = customSkillInput.trim();
    if (!name || formData.skills.find((s) => s.name === name)) {
      setCustomSkillInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name, proficiency: 'Intermediate' }],
    }));
    setCustomSkillInput('');
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists ? prev.interests.filter((i) => i !== interest) : [...prev.interests, interest],
      };
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  if (!token || isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden pb-20">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600 opacity-[0.05] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[450px] h-[450px] rounded-full bg-blue-600 opacity-[0.05] blur-[100px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-black gradient-text">OpportunityRadar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              Career Roadmap
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-3 pr-4 py-1.5 border-violet-500/50">
              {onboardingData?.profile?.profile_picture ? (
                <img src={onboardingData.profile.profile_picture} alt="Avatar" className="w-7 h-7 rounded-full border border-violet-500/50" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                  {onboardingData?.profile?.fullName?.charAt(0) || onboardingData?.profile?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-200 hidden sm:inline">{onboardingData?.profile?.fullName || onboardingData?.profile?.name || 'User'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-all text-gray-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-12 relative z-10">
        {/* Title */}
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black mb-2">
              Edit Your <span className="gradient-text">Profile</span> 👤
            </h1>
            <p className="text-gray-400 text-sm">
              Keep your profile updated so the AI matching calculations stay accurate.
            </p>
          </div>
        </div>

        {/* PROFILE FORM */}
        <div className="space-y-8">
          {/* Section 1: About You */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>👤</span> About You
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Education Level</label>
                  <select
                    value={formData.educationLevel}
                    onChange={(e) => updateField('educationLevel', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                  >
                    {['High School', 'Undergraduate', 'Graduate', 'PhD'].map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="City, Country"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">University / College</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => updateField('university', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Graduation Year</label>
                  <select
                    value={formData.graduationYear}
                    onChange={(e) => updateField('graduationYear', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Skills */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>⚡</span> Your Skills
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Popular Skills</label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.map((skill) => {
                    const isSelected = formData.skills.some((s) => s.name === skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? 'animated-gradient text-white shadow-md'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.skills.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Proficiency Levels</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {formData.skills.map((skill) => (
                      <div key={skill.name} className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{skill.name}</span>
                        <div className="flex gap-1">
                          {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                            <button
                              key={level}
                              onClick={() => updateSkillProficiency(skill.name, level)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                                skill.proficiency === level
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-white/5 text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Or add custom skill</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                    placeholder="e.g. GraphQL, Redis..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                  />
                  <button
                    onClick={addCustomSkill}
                    className="px-4 py-2 rounded-xl animated-gradient text-white text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Interests & Arrangement */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🌟</span> Your Interests
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Domain Interests</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_DOMAINS.map((domain) => {
                    const isSelected = formData.interests.includes(domain);
                    return (
                      <button
                        key={domain}
                        onClick={() => toggleInterest(domain)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? 'animated-gradient text-white shadow-md'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Work Preference</label>
                <div className="flex gap-2">
                  {['Remote', 'Hybrid', 'On-site'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => updateField('workPreference', pref)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                        formData.workPreference === pref
                          ? 'animated-gradient text-white shadow-md'
                          : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {pref === 'Remote' ? '🌐' : pref === 'Hybrid' ? '🔄' : '🏢'} {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Goals */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🚀</span> Career Goals
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Dream Role</label>
                <input
                  type="text"
                  value={formData.dreamRole}
                  onChange={(e) => updateField('dreamRole', e.target.value)}
                  placeholder="e.g. ML Engineer at a startup"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Industry</label>
                  <select
                    value={formData.targetIndustry}
                    onChange={(e) => updateField('targetIndustry', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                  >
                    {['Technology', 'Finance', 'Healthcare', 'Education', 'Climate', 'Gaming', 'Other'].map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Salary Expectation ($ / Month)</label>
                  <input
                    type="number"
                    value={formData.salaryExpectation}
                    onChange={(e) => updateField('salaryExpectation', e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">
                  Years of Experience: <span className="text-violet-400 font-bold">{formData.yearsExperience} yr{formData.yearsExperience !== 1 ? 's' : ''}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={formData.yearsExperience}
                  onChange={(e) => updateField('yearsExperience', Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex-1 text-center py-4 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all text-gray-300"
            >
              Cancel
            </Link>
            <button
              onClick={() => saveProfileMutation.mutate(formData)}
              disabled={saveProfileMutation.isPending}
              className="flex-1 py-4 rounded-xl animated-gradient font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              {saveProfileMutation.isPending ? '🤖 Regenerating matches...' : 'Save Profile & Recalculate 🚀'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
