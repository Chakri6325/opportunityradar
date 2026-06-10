import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

const ACCENTS: Record<string, { line: string, dot: string, border: string, text: string, bg: string, btnBg: string }> = {
  '3 months': {
    line: 'bg-blue-500',
    dot: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    text: 'text-blue-400',
    bg: 'bg-blue-500/5',
    btnBg: 'from-blue-600 to-indigo-600'
  },
  '6 months': {
    line: 'bg-violet-500',
    dot: 'bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    text: 'text-violet-400',
    bg: 'bg-violet-500/5',
    btnBg: 'from-violet-600 to-fuchsia-600'
  },
  '12 months': {
    line: 'bg-pink-500',
    dot: 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]',
    border: 'border-pink-500/20 hover:border-pink-500/40',
    text: 'text-pink-400',
    bg: 'bg-pink-500/5',
    btnBg: 'from-pink-600 to-rose-600'
  }
};

export default function Roadmap() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.replace('/');
    } else {
      setToken(savedToken);
    }
  }, []);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', token],
    queryFn: async () => {
      const response = await api.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  // Fetch career roadmap
  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['roadmap', token],
    queryFn: async () => {
      const response = await api.get('/api/profile/roadmap', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  if (!token || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasMilestones = roadmap && Array.isArray(roadmap.milestones) && roadmap.milestones.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden pb-20">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600 opacity-[0.05] blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[450px] h-[450px] rounded-full bg-blue-600 opacity-[0.05] blur-[100px]" />
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
            <Link href="/roadmap" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Career Roadmap
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-3 pr-4 py-1.5 hover:bg-white/10 transition-all cursor-pointer">
              {profile?.profile_picture ? (
                <img src={profile.profile_picture} alt="Avatar" className="w-7 h-7 rounded-full border border-violet-500/50" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                  {profile?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-200 hidden sm:inline">{profile?.name}</span>
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

      <main className="max-w-4xl mx-auto px-6 mt-12 relative z-10">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            Your Personal <span className="gradient-text">Career Roadmap</span> 🗺️
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
            AI-generated growth trajectory matching your profile skills, career goals, and opportunities.
          </p>
        </div>

        {!hasMilestones ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/5 mt-10">
            <span className="text-5xl block mb-4">🗺️</span>
            <h2 className="text-xl font-bold mb-2">No career roadmap available</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Complete your onboarding questionnaire to analyze your career goals and generate your custom path.
            </p>
            <Link
              href="/onboarding"
              className="px-6 py-3 rounded-xl animated-gradient text-white text-sm font-bold shadow-md hover:opacity-90 inline-block transition-all"
            >
              Go to Onboarding 🚀
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Executive Assessment Card */}
            <div className="glass rounded-3xl p-6 border border-violet-500/10 bg-violet-950/5 glow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 hidden sm:block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                🧠 Powered by Microsoft Work IQ
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤖</span>
                <h3 className="text-lg font-black gradient-text">AI Profile Assessment</h3>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                {roadmap.current_assessment || 'No current profile evaluation available.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div>
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Dream Role Timeline</h4>
                  <p className="text-xs font-semibold text-violet-300">⏳ {roadmap.dream_role_timeline || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Key Skill Gaps to Close</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.isArray(roadmap.key_skill_gaps) ? (
                      roadmap.key_skill_gaps.map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[10px] font-bold text-rose-400">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">None detected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE VISUAL */}
            <div className="relative pl-6 sm:pl-8 border-l border-white/10 space-y-12 py-4">
              {roadmap.milestones.map((milestone: any, index: number) => {
                const accent = ACCENTS[milestone.timeframe] || {
                  line: 'bg-violet-500',
                  dot: 'bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]',
                  border: 'border-white/10',
                  text: 'text-violet-400',
                  bg: 'bg-white/5',
                  btnBg: 'from-violet-500 to-indigo-500'
                };

                return (
                  <div key={index} className="relative group">
                    {/* Dot on timeline */}
                    <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full ${accent.dot}`} />

                    {/* Card container */}
                    <div className={`glass rounded-3xl p-6 sm:p-8 border ${accent.border} hover:bg-white/[0.03] transition-all duration-300`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className={`px-3.5 py-1.5 rounded-full ${accent.bg} ${accent.text} border ${accent.border} text-xs font-black uppercase tracking-wider w-max`}>
                          {milestone.timeframe}
                        </div>
                        <h4 className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                          🎯 Opportunities: 
                          <span className="text-gray-200">
                            {Array.isArray(milestone.opportunityTypes) ? milestone.opportunityTypes.join(', ') : milestone.opportunityTypes || 'N/A'}
                          </span>
                        </h4>
                      </div>

                      <h3 className="text-xl font-black text-white mb-2">{milestone.goal}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6">{milestone.description}</p>

                      {/* Action Checklist */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wider">Action Items</h4>
                        <div className="space-y-2.5">
                          {Array.isArray(milestone.actions) ? (
                            milestone.actions.map((action: string, actIdx: number) => (
                              <div key={actIdx} className="flex items-start gap-3 text-xs leading-relaxed text-gray-300 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                                <span className="text-violet-500 font-bold">0{actIdx + 1}.</span>
                                <span>{action}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">No specific action items listed.</p>
                          )}
                        </div>
                      </div>

                      {/* Skills to Learn */}
                      {Array.isArray(milestone.skills) && milestone.skills.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                          <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2.5">Focus Skill Acquisition</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {milestone.skills.map((skill: string) => (
                              <span key={skill} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${accent.bg} ${accent.text} border ${accent.border}`}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center pt-10">
              <Link href="/dashboard" className="text-xs font-bold text-gray-400 hover:text-white transition-all">
                ← Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
