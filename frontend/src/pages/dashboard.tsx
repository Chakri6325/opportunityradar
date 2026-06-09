import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

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
        router.push('/');
      } else {
        setToken(savedToken);
      }
    }
  }, []);

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const response = await api.get('/api/opportunities', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  if (!token) return <div>Loading...</div>;
  if (isLoading) return <div>Loading opportunities...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}! 👋</h1>
          <p className="text-gray-600">Your personalized opportunities are ready</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Matched Opportunities</h3>
            <p className="text-3xl font-bold text-blue-600">{opportunities?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Match Score</h3>
            <p className="text-3xl font-bold text-green-600">85%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Applications</h3>
            <p className="text-3xl font-bold text-purple-600">3</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Saved Items</h3>
            <p className="text-3xl font-bold text-orange-600">12</p>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Top Opportunities</h2>
          <div className="space-y-4">
            {opportunities?.slice(0, 5).map((opp: any) => (
              <div key={opp.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{opp.title}</h3>
                    <p className="text-gray-600">{opp.company_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{opp.match_score || 85}%</div>
                    <p className="text-sm text-gray-500">Match</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">{opp.type} • {opp.location}</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
