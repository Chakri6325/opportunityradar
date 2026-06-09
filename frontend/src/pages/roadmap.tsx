import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

export default function Roadmap() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    setToken(savedToken);
  }, []);

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['roadmap'],
    queryFn: async () => {
      const response = await api.get('/api/profile/roadmap', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
  });

  if (isLoading) return <div>Loading roadmap...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Career Roadmap 🗺️</h1>

        <div className="space-y-8">
          {roadmap?.milestones?.map((milestone: any, index: number) => (
            <div key={index} className="flex gap-8 items-start">
              <div className="w-32 text-right">
                <p className="font-bold text-lg text-blue-600">{milestone.timeframe}</p>
              </div>
              <div className="w-1 h-24 bg-blue-500 rounded-full"></div>
              <div className="flex-1 bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">{milestone.goal}</h3>
                <p className="text-gray-600 mb-4">{milestone.description}</p>
                <div className="flex flex-wrap gap-2">
                  {milestone.skills?.map((skill: string) => (
                    <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                {milestone.opportunityTypes && (
                  <p className="text-sm text-gray-500 mt-4">Opportunities: {milestone.opportunityTypes.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
