import { useState, useEffect, useRef } from 'react';

const FEATURES = [
  {
    icon: '🎓',
    title: 'Scholarships',
    desc: 'AI-matched funding opportunities tailored to your academic profile and goals.',
    color: 'from-violet-500 to-purple-600',
    glow: 'rgba(139, 92, 246, 0.3)',
    filter: 'scholarship',
  },
  {
    icon: '💼',
    title: 'Internships & Jobs',
    desc: 'Discover roles that fit your skills — scored and ranked just for you.',
    color: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59, 130, 246, 0.3)',
    filter: 'internship',
  },
  {
    icon: '🏆',
    title: 'Hackathons & Courses',
    desc: 'Build skills, win prizes, and grow your network with curated events.',
    color: 'from-pink-500 to-rose-500',
    glow: 'rgba(236, 72, 153, 0.3)',
    filter: 'hackathon',
  },
];



export default function Home() {
  const [mounted, setMounted] = useState(false);
  const featuresRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGitHubLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/github`;
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600 opacity-10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600 opacity-10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-pink-600 opacity-8 blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold gradient-text">OpportunityRadar</span>
        </div>
        <button
          id="nav-signin-btn"
          onClick={handleGitHubLogin}
          className="glass px-5 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-all duration-300"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">


        <h1
          className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease 0.1s' }}
        >
          Never miss an
          <br />
          <span className="gradient-text">opportunity</span>
          <br />
          again.
        </h1>

        <p
          className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}
        >
          Your personalized career discovery platform. AI matches you with scholarships, 
          internships, jobs, and hackathons — ranked by fit.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
          style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}
        >
          <button
            id="hero-github-btn"
            onClick={handleGitHubLogin}
            className="group flex items-center gap-3 animated-gradient text-white px-8 py-4 rounded-2xl font-semibold text-lg glow hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
          <button
            id="hero-demo-btn"
            onClick={scrollToFeatures}
            className="glass px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
          >
            View Demo →
          </button>
        </div>


      </section>

      {/* Features */}
      <section ref={featuresRef} className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to <span className="gradient-text">succeed</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            One platform for all career opportunities — powered by AI that actually understands you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              id={`feature-card-${f.filter}`}
              onClick={handleGitHubLogin}
              className="glass rounded-3xl p-8 hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
              style={{
                boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.4)`,
                animationDelay: `${i * 0.5}s`
              }}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}
                style={{ boxShadow: `0 8px 32px ${f.glow}` }}
              >
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              <div className="mt-6 flex items-center gap-2 text-violet-400 text-sm font-medium group-hover:gap-3 transition-all">
                Explore <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="glass rounded-3xl p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))' }}>
          <h2 className="text-4xl font-bold mb-4">Ready to find your next big thing?</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of students and professionals discovering personalized opportunities every day.
          </p>
          <button
            id="cta-github-btn"
            onClick={handleGitHubLogin}
            className="animated-gradient text-white px-10 py-5 rounded-2xl font-bold text-xl glow hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            Get Started Free 🚀
          </button>
          <p className="text-gray-500 text-sm mt-4">No credit card needed · GitHub login in seconds</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="font-semibold gradient-text">OpportunityRadar</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 OpportunityRadar. Built for the future.</p>
        </div>
      </footer>
    </div>
  );
}
