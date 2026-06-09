import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  const handleGitHubLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/github`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center text-white">
        <h1 className="text-5xl font-bold mb-4">OpportunityRadar 🎯</h1>
        <p className="text-2xl mb-6 opacity-90">Never miss an opportunity again</p>
        <p className="text-lg mb-8 opacity-80">
          Your personalized career discovery platform powered by AI and Microsoft Work IQ
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">🎓 Scholarships</h3>
            <p>Find funding opportunities</p>
          </div>
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">💼 Internships & Jobs</h3>
            <p>Discover perfect roles</p>
          </div>
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">🏆 Hackathons & Courses</h3>
            <p>Build skills & network</p>
          </div>
        </div>

        <button
          onClick={handleGitHubLogin}
          className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-all"
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}
