import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

const TYPE_COLORS: Record<string, { bg: string, text: string, border: string, badge: string }> = {
  scholarship: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    badge: 'from-violet-600 to-indigo-600'
  },
  internship: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    badge: 'from-blue-600 to-cyan-600'
  },
  job: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    badge: 'from-emerald-600 to-teal-600'
  },
  hackathon: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/20',
    badge: 'from-pink-600 to-rose-600'
  },
  course: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    badge: 'from-amber-600 to-orange-600'
  },
};

const TYPE_ICONS: Record<string, string> = {
  scholarship: '🎓',
  internship: '💼',
  job: '🏢',
  hackathon: '⚡',
  course: '📚',
};

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [showPostModal, setShowPostModal] = useState(false);

  const [postForm, setPostForm] = useState({
    title: '',
    type: 'hackathon',
    company_name: '',
    location: 'Remote',
    required_skills: '',
    difficulty_level: 'intermediate',
    source_url: '',
    deadline_date: '',
    salary_min: '',
    salary_max: '',
    description: ''
  });
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      localStorage.setItem('token', tokenParam);
      setToken(tokenParam);
      router.replace('/dashboard');
    } else {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        router.replace('/');
      } else {
        setToken(savedToken);
      }
    }
  }, []);

  // Fetch onboarding status
  const { data: onboardingStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['onboardingStatus', token],
    queryFn: async () => {
      const response = await api.get('/api/onboarding/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (onboardingStatus && !onboardingStatus.completed && !isStatusLoading) {
      router.replace('/onboarding');
    }
  }, [onboardingStatus, isStatusLoading]);

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

  // Fetch matches
  const { data: matches, isLoading: isMatchesLoading } = useQuery({
    queryKey: ['matches', token],
    queryFn: async () => {
      const response = await api.get('/api/matches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token && !!onboardingStatus?.completed,
  });

  // Mutation to regenerate matches
  const regenerateMatches = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/matches/regenerate', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    }
  });

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    setPostError(null);
    setPostSuccess(false);

    try {
      const skillsArray = postForm.required_skills
        ? postForm.required_skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      const payload = {
        ...postForm,
        required_skills: skillsArray,
        salary_min: postForm.salary_min ? parseInt(postForm.salary_min) : null,
        salary_max: postForm.salary_max ? parseInt(postForm.salary_max) : null,
        deadline_date: postForm.deadline_date || null
      };

      await api.post('/api/opportunities', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPostSuccess(true);
      setTimeout(() => {
        setShowPostModal(false);
        setPostSuccess(false);
        // Reset form
        setPostForm({
          title: '',
          type: 'hackathon',
          company_name: '',
          location: 'Remote',
          required_skills: '',
          difficulty_level: 'intermediate',
          source_url: '',
          deadline_date: '',
          salary_min: '',
          salary_max: '',
          description: ''
        });
        // Invalidate matches query to reload them
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setPostError(err.response?.data?.error || 'Failed to submit opportunity.');
    } finally {
      setIsPosting(false);
    }
  };



  const handleLogout = () => {

    localStorage.removeItem('token');
    router.replace('/');
  };

  const handleApply = async (oppId: string, sourceUrl: string) => {
    try {
      if (token) {
        await api.post('/api/applications', { opportunity_id: oppId, status: 'applied' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
      }
    } catch (err) {
      console.error('Failed to track application:', err);
    }
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  };

  if (!token || isStatusLoading || (onboardingStatus && !onboardingStatus.completed)) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate statistics
  const filteredMatches = matches
    ? matches.filter((opp: any) => activeFilter === 'all' || opp.type === activeFilter)
    : [];

  const totalMatches = matches ? matches.length : 0;
  const avgScore = matches && matches.length > 0
    ? Math.round(matches.reduce((acc: number, item: any) => acc + Number(item.match_score), 0) / matches.length)
    : 0;
  const topMatch = matches && matches.length > 0
    ? Math.round(Math.max(...matches.map((item: any) => Number(item.match_score))))
    : 0;
  const recommendedCount = matches ? matches.filter((opp: any) => opp.is_recommended).length : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden pb-16">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600 opacity-[0.05] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[450px] h-[450px] rounded-full bg-pink-600 opacity-[0.05] blur-[100px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-black gradient-text">OpportunityRadar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
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

      <main className="max-w-7xl mx-auto px-6 mt-10 relative z-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black mb-2">
              Welcome back, <span className="gradient-text">{profile?.name || 'Explorer'}</span> 👋
            </h1>
            <p className="text-gray-400 text-sm">
              Here are your customized career matches powered by OpportunityRadar AI.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowPostModal(true)}
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition-all cursor-pointer"
            >
              ➕ Share Opportunity
            </button>
            <button
              onClick={() => regenerateMatches.mutate()}
              disabled={regenerateMatches.isPending}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-sm font-bold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {regenerateMatches.isPending ? '🤖 Updating...' : '🔄 Refresh Matches'}
            </button>
          </div>

        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="glass rounded-2xl p-5 hover:scale-[1.01] transition-all border border-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Total Matches</p>
            <h3 className="text-2xl font-black gradient-text">{totalMatches}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Opportunities matched</p>
          </div>
          <div className="glass rounded-2xl p-5 hover:scale-[1.01] transition-all border border-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Average Match</p>
            <h3 className="text-2xl font-black text-violet-400">{avgScore}%</h3>
            <p className="text-[10px] text-gray-400 mt-1">Fit score across types</p>
          </div>
          <div className="glass rounded-2xl p-5 hover:scale-[1.01] transition-all border border-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Top Match</p>
            <h3 className="text-2xl font-black text-pink-400">{topMatch}%</h3>
            <p className="text-[10px] text-gray-400 mt-1">Highest affinity opportunity</p>
          </div>
          <div className="glass rounded-2xl p-5 hover:scale-[1.01] transition-all border border-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Recommended</p>
            <h3 className="text-2xl font-black text-emerald-400">{recommendedCount}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Ready to apply (score ≥ 70%)</p>
          </div>
        </div>

        {/* FILTERS & LAYOUT CONTROLS */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Match Categories' },
              { id: 'hackathon', label: 'Hackathons ⚡' },
              { id: 'scholarship', label: 'Scholarships 🎓' },
              { id: 'internship', label: 'Internships 💼' },
              { id: 'job', label: 'Jobs 🏢' },
              { id: 'course', label: 'Courses 📚' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  activeFilter === filter.id
                    ? 'animated-gradient text-white shadow-md'
                    : 'glass text-gray-400 hover:text-white hover:border-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Grid View"
            >
              📐
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              ≡
            </button>
          </div>
        </div>

        {/* OPPORTUNITY CARDS */}
        {isMatchesLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[1, 2, 6].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 border border-white/5 h-[340px] flex flex-col justify-between animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-white/10 rounded-xl" />
                  <div className="w-12 h-6 bg-white/10 rounded-lg" />
                </div>
                <div className="space-y-3 flex-1 mt-6">
                  <div className="h-5 bg-white/10 rounded-md w-3/4" />
                  <div className="h-4 bg-white/10 rounded-md w-1/2" />
                  <div className="h-3 bg-white/5 rounded-md w-full" />
                  <div className="h-3 bg-white/5 rounded-md w-5/6" />
                </div>
                <div className="h-10 bg-white/10 rounded-xl w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center max-w-xl mx-auto border border-white/5 mt-10">
            <span className="text-5xl block mb-4">🔍</span>
            <h2 className="text-xl font-bold mb-2">No matching opportunities found</h2>
            <p className="text-gray-400 text-sm mb-6">
              Try updating your skills or interests, or regenerate matches to trigger the AI agent evaluation.
            </p>
            <button
              onClick={() => regenerateMatches.mutate()}
              disabled={regenerateMatches.isPending}
              className="px-6 py-3 rounded-xl animated-gradient text-white text-sm font-bold shadow-md hover:opacity-90 transition-all"
            >
              {regenerateMatches.isPending ? '🤖 Regenerating...' : 'Regenerate Matches'}
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn' : 'space-y-4'}>
            {filteredMatches.map((opp: any) => {
              const styles = TYPE_COLORS[opp.type] || { bg: 'bg-white/5', text: 'text-white', border: 'border-white/10', badge: 'from-gray-600 to-gray-800' };
              const icon = TYPE_ICONS[opp.type] || '❓';
              const skillMatch = Math.round(Number(opp.skill_match_percentage));
              const interestMatch = Math.round(Number(opp.interest_match_percentage));
              const experienceMatch = Math.round(Number(opp.experience_match_percentage));
              const deadline = opp.deadline_date ? new Date(opp.deadline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible';
              
              const salaryText = opp.salary_min
                ? `$${(opp.salary_min/1000).toFixed(0)}k${opp.salary_max ? ` - $${(opp.salary_max/1000).toFixed(0)}k` : '+'}`
                : null;

              return (
                <div
                  key={opp.id}
                  id={`opp-${opp.id}`}
                  className={`glass rounded-3xl p-6 border ${styles.border} hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group`}
                >
                  <div>
                    {/* Badge & Score Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full ${styles.bg} ${styles.text} border ${styles.border} text-xs font-bold flex items-center gap-1.5`}>
                        <span>{icon}</span>
                        <span className="uppercase tracking-wider text-[10px]">{opp.type}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black gradient-text tracking-tight">{opp.match_score}%</span>
                        <span className="text-[10px] text-gray-500 block">Match Score</span>
                      </div>
                    </div>

                    {/* Title & Organization */}
                    <h3 className="text-lg font-bold mb-1 line-clamp-2 group-hover:text-violet-300 transition-colors">
                      {opp.title}
                    </h3>
                    <p className="text-gray-400 text-xs font-semibold mb-4">
                      {opp.company_name || 'Open Source Organization'}
                    </p>

                    {/* Description */}
                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-5">
                      {opp.description}
                    </p>

                    {/* Match Metric Progress Bars */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1">
                          <span>Skills Match</span>
                          <span className={styles.text}>{skillMatch}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${styles.badge} rounded-full`} style={{ width: `${skillMatch}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1">
                          <span>Interest Match</span>
                          <span className={styles.text}>{interestMatch}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${styles.badge} rounded-full`} style={{ width: `${interestMatch}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1">
                          <span>Experience Match</span>
                          <span className={styles.text}>{experienceMatch}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${styles.badge} rounded-full`} style={{ width: `${experienceMatch}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* AI explanation block */}
                    {opp.match_explanation && (
                      <div className="bg-violet-950/20 border border-violet-500/10 rounded-2xl px-4 py-3 mb-4 text-[11px] text-violet-300 italic leading-relaxed">
                        ✨ {opp.match_explanation}
                      </div>
                    )}

                    {/* Skill Gaps (Red Badges) */}
                    {opp.skill_gaps && opp.skill_gaps.length > 0 && (
                      <div className="mb-6">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Skill Gaps</p>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.skill_gaps.slice(0, 3).map((gap: string) => (
                            <span key={gap} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[10px] font-bold text-rose-400">
                              Missing: {gap}
                            </span>
                          ))}
                          {opp.skill_gaps.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-bold text-gray-400">
                              +{opp.skill_gaps.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <div className="space-y-1">
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Deadline</div>
                      <div className="text-xs font-semibold text-gray-300">📅 {deadline}</div>
                    </div>

                    {salaryText && (
                      <div className="space-y-1 text-center">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Stipend/Salary</div>
                        <div className="text-xs font-semibold text-emerald-400">{salaryText}</div>
                      </div>
                    )}

                    <button
                      onClick={() => handleApply(opp.id, opp.source_url || '#')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r ${styles.badge} hover:opacity-90 transition-all shadow-md`}
                    >
                      Apply →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* POST OPPORTUNITY MODAL */}
      {showPostModal && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl w-full max-w-lg border border-white/10 p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div>
              <button 
                onClick={() => setShowPostModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">➕</span>
                <div>
                  <h2 className="text-xl font-black gradient-text">Share an Opportunity</h2>
                  <p className="text-xs text-gray-400">Add a hackathon, job, scholarship, or course to match against profiles.</p>
                </div>
              </div>

              {postSuccess ? (
                <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-2xl p-6 text-center animate-pulse my-8">
                  <span className="text-4xl block mb-2">🎉</span>
                  <p className="font-bold text-sm">Opportunity posted successfully!</p>
                  <p className="text-xs text-gray-500 mt-1">🤖 AI is immediately evaluating match scores for profiles...</p>
                </div>
              ) : (
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  {postError && (
                    <div className="bg-rose-950/30 border border-rose-500/20 text-rose-400 rounded-xl p-3 text-xs">
                      ⚠️ {postError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Opportunity Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Global ML Hackathon 2026"
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Opportunity Type *</label>
                      <select
                        value={postForm.type}
                        onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                      >
                        <option value="hackathon">Hackathon ⚡</option>
                        <option value="scholarship">Scholarship 🎓</option>
                        <option value="internship">Internship 💼</option>
                        <option value="job">Job 🏢</option>
                        <option value="course">Course 📚</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Organization / Host *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. OpenAI"
                        value={postForm.company_name}
                        onChange={(e) => setPostForm({ ...postForm, company_name: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Remote / NYC"
                        value={postForm.location}
                        onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Difficulty Level</label>
                      <select
                        value={postForm.difficulty_level}
                        onChange={(e) => setPostForm({ ...postForm, difficulty_level: e.target.value })}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Direct Application / Info URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="e.g. https://devpost.com/hackathon-page"
                      value={postForm.source_url}
                      onChange={(e) => setPostForm({ ...postForm, source_url: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Required Skills (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Python, Machine Learning, PyTorch"
                      value={postForm.required_skills}
                      onChange={(e) => setPostForm({ ...postForm, required_skills: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Deadline Date</label>
                      <input
                        type="date"
                        value={postForm.deadline_date}
                        onChange={(e) => setPostForm({ ...postForm, deadline_date: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Est. Salary / Stipend (Min)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={postForm.salary_min}
                        onChange={(e) => setPostForm({ ...postForm, salary_min: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Brief details about the event, team sizes, eligibility criteria..."
                      value={postForm.description}
                      onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowPostModal(false)}
                      className="flex-1 px-4 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-bold transition-all text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPosting}
                      className="flex-1 px-4 py-2.5 rounded-xl animated-gradient text-white text-sm font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {isPosting ? '🤖 Saving...' : 'Post Opportunity 🚀'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
