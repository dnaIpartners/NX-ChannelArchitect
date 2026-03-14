import React, { useState } from 'react';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === 'pourlui' && password === '0907') {
      onLoginSuccess();
    } else {
      setError('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white relative overflow-hidden font-sans">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        {/* Dotted grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        {/* Glowing spiral approximation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]"></div>
        {/* SVG Spiral */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-40" viewBox="0 0 1000 1000">
          <g stroke="#3b82f6" strokeWidth="1.5" fill="none" className="origin-center animate-[spin_120s_linear_infinite]">
            {Array.from({ length: 40 }).map((_, i) => (
              <ellipse 
                key={i} 
                cx="500" 
                cy="500" 
                rx={50 + i * 12} 
                ry={25 + i * 6} 
                transform={`rotate(${i * 10} 500 500)`} 
                strokeDasharray="2 6" 
                opacity={0.1 + (i / 40) * 0.5}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
         
          <span className="text-slate-400 text-xl font-light">NX Platform</span>
        </div>
        <button 
          onClick={() => setShowLogin(true)}
          className="px-6 py-2 rounded-full border border-slate-600 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          LOG IN
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col justify-center min-h-[calc(100vh-85px)] px-12 md:px-24 lg:px-32">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            AI는 사람을 대신하는 것이 아니라,<br />
            <span className="text-blue-500">역량을 한 단계 위로</span><br />
            끌어올리는 것입니다.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-12 font-light">
            1년차가 5년차의 시야를 갖고, 5년차가 10년차의 깊이를 갖습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              NX ChannelArchitect<i className="fas fa-arrow-right"></i>
            </button>
            <a 
              href="https://nx-context-cast.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(30,41,59,0.4)]"
            >
              NX ContextCast <i className="fas fa-external-link-alt"></i>
            </a>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl relative animate-fade-in-up">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>             
                <span className="text-slate-400 text-2xl font-light">NX Platform</span>
              </div>
              <h2 className="text-lg font-medium text-slate-300 mt-4">로그인</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">아이디</label>
                <input 
                  type="text" 
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">비밀번호</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                로그인
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
