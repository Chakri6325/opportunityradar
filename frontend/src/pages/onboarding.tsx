import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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

const OPPORTUNITY_TYPES = ['Hackathons', 'Scholarships', 'Internships', 'Jobs', 'Online Courses'];
const WORK_PREFS = ['Remote', 'Hybrid', 'On-site'];

interface SkillEntry {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface FormData {
  // Step 1
  fullName: string;
  educationLevel: string;
  university: string;
  graduationYear: string;
  location: string;
  // Step 2
  skills: SkillEntry[];
  customSkillInput: string;
  // Step 3
  interests: string[];
  opportunityTypes: string[];
  workPreference: string;
  // Step 4
  dreamRole: string;
  targetIndustry: string;
  timeline: string;
  yearsExperience: number;
  salaryExpectation: string;
}

const STEPS = [
  { num: 1, title: 'About You', icon: '👤', subtitle: 'Tell us who you are' },
  { num: 2, title: 'Your Skills', icon: '⚡', subtitle: 'What can you do?' },
  { num: 3, title: 'Your Interests', icon: '🌟', subtitle: 'What excites you?' },
  { num: 4, title: 'Career Goals', icon: '🚀', subtitle: 'Where are you headed?' },
];

export default function Onboarding() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    educationLevel: '',
    university: '',
    graduationYear: '',
    location: '',
    skills: [],
    customSkillInput: '',
    interests: [],
    opportunityTypes: [],
    workPreference: 'Remote',
    dreamRole: '',
    targetIndustry: '',
    timeline: '',
    yearsExperience: 0,
    salaryExpectation: '',
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const syncWithWorkIQ = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await api.get('/api/onboarding/sync-workiq', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      if (data) {
        const formattedSkills = Array.isArray(data.skills) 
          ? data.skills.map((skill: string) => ({ name: skill, proficiency: 'Intermediate' as const }))
          : [];
        
        setFormData((prev) => ({
          ...prev,
          skills: formattedSkills,
          interests: Array.isArray(data.interests) ? data.interests : prev.interests,
          dreamRole: Array.isArray(data.suggestedRoles) && data.suggestedRoles.length > 0 ? data.suggestedRoles[0] : prev.dreamRole,
          targetIndustry: 'Technology',
          location: 'New York, NY',
          educationLevel: 'Undergraduate'
        }));
        
        setSyncMessage(`🎉 Microsoft Work IQ synchronized successfully! Found ${formattedSkills.length} skills and ${data.interests?.length || 0} interests from your OneDrive & Outlook data.`);
        setTimeout(() => setSyncMessage(null), 8000);
      }
    } catch (err) {
      console.error('Work IQ sync failed:', err);
      setSyncMessage('⚠️ Work IQ sync failed. Using local profile defaults.');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('token');
    if (!saved) {
      router.replace('/');
      return;
    }
    setToken(saved);

    // Check onboarding status
    api.get('/api/onboarding/status', {
      headers: { Authorization: `Bearer ${saved}` },
    }).then((res) => {
      if (res.data?.completed) router.replace('/dashboard');
    }).catch(() => {});

    // Pre-fill from profile
    api.get('/api/auth/profile', {
      headers: { Authorization: `Bearer ${saved}` },
    }).then((res) => {
      if (res.data?.name) {
        setFormData((prev) => ({ ...prev, fullName: res.data.name }));
      }
    }).catch(() => {});
  }, []);

  const updateField = (field: keyof FormData, value: any) => {
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
    const name = formData.customSkillInput.trim();
    if (!name || formData.skills.find((s) => s.name === name)) {
      updateField('customSkillInput', '');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name, proficiency: 'Intermediate' }],
      customSkillInput: '',
    }));
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

  const toggleOppType = (type: string) => {
    setFormData((prev) => {
      const exists = prev.opportunityTypes.includes(type);
      return {
        ...prev,
        opportunityTypes: exists ? prev.opportunityTypes.filter((t) => t !== type) : [...prev.opportunityTypes, type],
      };
    });
  };

  const handleSubmit = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/onboarding/complete', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  if (!token) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isSubmitting) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm mx-auto px-6">
        <div className="w-20 h-20 mx-auto animated-gradient rounded-full flex items-center justify-center text-3xl animate-pulse">
          🤖
        </div>
        <h2 className="text-2xl font-bold gradient-text">Analyzing Your Profile</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          🤖 AI is analyzing your profile and finding matches...
        </p>
        <div className="glass rounded-full overflow-hidden h-2">
          <div className="h-full animated-gradient rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600 opacity-[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-600 opacity-[0.07] blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-pink-600 opacity-[0.05] blur-[80px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">🎯</span>
          <span className="text-2xl font-black gradient-text">OpportunityRadar</span>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 w-full max-w-2xl glow">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Step {currentStep} of 4
              </span>
              <span className="text-xs font-bold gradient-text">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full animated-gradient rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Step dots */}
            <div className="flex justify-between mt-3">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    step.num <= currentStep ? 'opacity-100' : 'opacity-30'
                  }`}
                  onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.num === currentStep
                      ? 'animated-gradient text-white shadow-lg'
                      : step.num < currentStep
                      ? 'bg-violet-600/50 text-white'
                      : 'bg-white/10 text-gray-500'
                  }`}>
                    {step.num < currentStep ? '✓' : step.num}
                  </div>
                  <span className="text-[10px] text-gray-500 hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{STEPS[currentStep - 1].icon}</span>
                <h2 className="text-2xl font-black gradient-text">{STEPS[currentStep - 1].title}</h2>
              </div>
              <p className="text-gray-400 text-sm ml-12">{STEPS[currentStep - 1].subtitle}</p>
            </div>
            
            {currentStep === 1 && (
              <button
                type="button"
                onClick={syncWithWorkIQ}
                disabled={isSyncing}
                className="px-4 py-2 border border-violet-500/30 hover:border-violet-500/50 rounded-xl text-xs font-bold animated-gradient shadow-md shadow-violet-500/20 text-white flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
              >
                {isSyncing ? '🧠 Syncing...' : '🧠 Sync with Microsoft Work IQ'}
              </button>
            )}
          </div>

          {/* Sync Success / Alert Message */}
          {syncMessage && (
            <div className={`mb-6 p-4 rounded-2xl border text-xs leading-relaxed animate-fadeIn ${
              syncMessage.includes('⚠️') 
                ? 'bg-rose-950/20 border-rose-500/10 text-rose-300'
                : 'bg-emerald-950/20 border-emerald-500/10 text-emerald-300'
            }`}>
              {syncMessage}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Education Level</label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => updateField('educationLevel', e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select your education level</option>
                  {['High School', 'Undergraduate', 'Graduate', 'PhD'].map((level) => (
                    <option key={level} value={level} className="bg-[#0a0a0f]">{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">University / College</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => updateField('university', e.target.value)}
                  placeholder="e.g. MIT, Stanford, IIT..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Graduation Year</label>
                  <select
                    value={formData.graduationYear}
                    onChange={(e) => updateField('graduationYear', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Year</option>
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y} className="bg-[#0a0a0f]">{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="City, Country"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select your skills <span className="text-gray-500">({formData.skills.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.map((skill) => {
                    const isSelected = formData.skills.some((s) => s.name === skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'animated-gradient text-white shadow-lg shadow-violet-500/25 scale-105'
                            : 'glass text-gray-400 hover:text-white hover:border-violet-500/40'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proficiency for selected skills */}
              {formData.skills.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Set proficiency levels</label>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {formData.skills.map((skill) => (
                      <div key={skill.name} className="glass-light rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{skill.name}</span>
                        <div className="flex gap-1.5">
                          {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                            <button
                              key={level}
                              onClick={() => updateSkillProficiency(skill.name, level)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Or type a skill</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.customSkillInput}
                    onChange={(e) => updateField('customSkillInput', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                    placeholder="e.g. GraphQL, Redis..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-all"
                  />
                  <button
                    onClick={addCustomSkill}
                    className="px-5 py-3 rounded-xl animated-gradient text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Interest Domains <span className="text-gray-500">({formData.interests.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_DOMAINS.map((domain) => {
                    const isSelected = formData.interests.includes(domain);
                    return (
                      <button
                        key={domain}
                        onClick={() => toggleInterest(domain)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'animated-gradient text-white shadow-lg shadow-violet-500/25 scale-105'
                            : 'glass text-gray-400 hover:text-white hover:border-violet-500/40'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Opportunity Type Preferences</label>
                <div className="grid grid-cols-2 gap-2">
                  {OPPORTUNITY_TYPES.map((type) => {
                    const isChecked = formData.opportunityTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleOppType(type)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                          isChecked ? 'glass-light border-violet-500/50 text-white' : 'glass text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-violet-600 border-violet-600' : 'border-white/20'
                        }`}>
                          {isChecked && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        <span className="text-sm font-medium">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Work Preference</label>
                <div className="flex gap-2">
                  {WORK_PREFS.map((pref) => (
                    <button
                      key={pref}
                      onClick={() => updateField('workPreference', pref)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        formData.workPreference === pref
                          ? 'animated-gradient text-white shadow-lg'
                          : 'glass text-gray-400 hover:text-white'
                      }`}
                    >
                      {pref === 'Remote' ? '🌐' : pref === 'Hybrid' ? '🔄' : '🏢'} {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dream Role</label>
                <input
                  type="text"
                  value={formData.dreamRole}
                  onChange={(e) => updateField('dreamRole', e.target.value)}
                  placeholder="e.g. ML Engineer at a startup"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Industry</label>
                  <select
                    value={formData.targetIndustry}
                    onChange={(e) => updateField('targetIndustry', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select industry</option>
                    {['Technology', 'Finance', 'Healthcare', 'Education', 'Climate', 'Gaming', 'Other'].map((ind) => (
                      <option key={ind} value={ind} className="bg-[#0a0a0f]">{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timeline</label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => updateField('timeline', e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select timeline</option>
                    {['Next 3 months', 'Next 6 months', 'This year', '1-2 years'].map((t) => (
                      <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Years of Experience
                  <span className="ml-2 text-violet-400 font-bold">{formData.yearsExperience} yr{formData.yearsExperience !== 1 ? 's' : ''}</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={formData.yearsExperience}
                    onChange={(e) => updateField('yearsExperience', Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0</span>
                    <span>5</span>
                    <span>10+</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monthly Salary Expectation <span className="text-gray-600 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.salaryExpectation}
                    onChange={(e) => updateField('salaryExpectation', e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Summary mini preview */}
              <div className="glass-light rounded-2xl p-4 border border-violet-500/20">
                <p className="text-xs text-violet-400 font-medium mb-2 uppercase tracking-wider">Your Profile Summary</p>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.slice(0, 5).map((s) => (
                    <span key={s.name} className="px-2 py-0.5 bg-violet-500/20 rounded-full text-xs text-violet-300">{s.name}</span>
                  ))}
                  {formData.interests.slice(0, 3).map((i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-500/20 rounded-full text-xs text-blue-300">{i}</span>
                  ))}
                  {formData.skills.length > 5 && (
                    <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-gray-400">+{formData.skills.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex-1 glass rounded-xl py-3.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                ← Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex-1 animated-gradient rounded-xl py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 animated-gradient rounded-xl py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30 disabled:opacity-70"
              >
                Find My Opportunities 🚀
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-600">
          Your data is secure and used only to find you the best opportunities.
        </p>
      </div>
    </div>
  );
}
