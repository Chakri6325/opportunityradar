import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  interested: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  applied: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  interviewing: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  offered: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
};

export default function Applications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.replace('/');
    } else {
      setToken(savedToken);
    }
  }, []);

  // Fetch profile
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

  // Fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications', token],
    queryFn: async () => {
      const response = await api.get('/api/applications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  // Mutation to update application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await api.put(`/api/applications/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
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
            <Link href="/applications" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Applications
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

      <main className="max-w-5xl mx-auto px-6 mt-12 relative z-10">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2">
            Track Your <span className="gradient-text">Applications</span> 💼
          </h1>
          <p className="text-gray-400 text-sm">
            Manage your opportunities pipeline, interview status, and next steps.
          </p>
        </div>

        {/* APPLICATIONS LIST */}
        {!applications || applications.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/5 max-w-xl mx-auto mt-10">
            <span className="text-5xl block mb-4">💼</span>
            <h2 className="text-xl font-bold mb-2">No tracked applications yet</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              When you click the "Apply" button on any opportunity card on your Dashboard, it will be automatically tracked here.
            </p>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl animated-gradient text-white text-sm font-bold shadow-md hover:opacity-90 inline-block transition-all"
            >
              Explore Opportunities 🚀
            </Link>
          </div>
        ) : (
          <div className="glass rounded-3xl overflow-hidden border border-white/5 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-4 px-6">Opportunity</th>
                    <th className="py-4 px-6">Company</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Tracked Date</th>
                    <th className="py-4 px-6">Pipeline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {applications.map((app: any) => {
                    const status = app.status || 'interested';
                    const colors = STATUS_COLORS[status] || { bg: 'bg-white/5', text: 'text-gray-300', border: 'border-white/10' };
                    
                    return (
                      <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-bold text-white">
                          {app.source_url ? (
                            <a
                              href={app.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-violet-400 hover:underline transition-all inline-flex items-center gap-1"
                            >
                              {app.title} <span className="text-xs opacity-60 font-normal">↗</span>
                            </a>
                          ) : (
                            app.title
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-300">{app.company_name || 'Open Source'}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5 text-xs font-medium uppercase tracking-wider">
                            {app.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-400 text-xs">
                          {new Date(app.application_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={status}
                            onChange={(e) => updateStatusMutation.mutate({ id: app.id, status: e.target.value })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border} bg-[#0a0a0f] focus:outline-none cursor-pointer hover:bg-white/5 transition-all`}
                          >
                            <option value="interested" className="bg-[#0a0a0f] text-blue-400">Interested 🔍</option>
                            <option value="applied" className="bg-[#0a0a0f] text-amber-400">Applied 📤</option>
                            <option value="interviewing" className="bg-[#0a0a0f] text-violet-400">Interviewing 💬</option>
                            <option value="offered" className="bg-[#0a0a0f] text-emerald-400">Offered 🎉</option>
                            <option value="rejected" className="bg-[#0a0a0f] text-rose-400">Rejected ❌</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
