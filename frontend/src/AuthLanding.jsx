import React, { useState } from 'react';
import axios from 'axios';
import { 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  LogIn, 
  UserPlus, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function AuthLanding({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required.');
      return;
    }

    if (isSignUp && !formData.name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP FLOW ---
        await axios.post('http://127.0.0.1:5000/api/register', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        });

        // 1. Show confirmation banner
        setSuccessMsg('Account created successfully in database! Please sign in below.');
        // 2. Switch mode to Login
        setIsSignUp(false);
        // 3. Clear password but keep email pre-filled for convenience
        setFormData((prev) => ({ ...prev, password: '', name: '' }));
      } else {
        // --- LOGIN FLOW ---
        const res = await axios.post('http://127.0.0.1:5000/api/login', {
          email: formData.email.trim(),
          password: formData.password
        });

        // On successful authentication against SQLite, enter workspace
        onLoginSuccess(res.data);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(
        err.response?.data?.error || 
        'Could not connect to backend authentication server. Ensure Flask is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Public Header */}
{/* Public Header - Clean & Minimal */}
      <header className="border-b border-white/[0.08] px-6 py-4 bg-[#090d16]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
                <Compass className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">AI Travel Assistant</span>
              <p className="text-[11px] text-slate-400">Intelligent Itinerary Synthesizer</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </div>
        </div>
      </header>

      {/* Main Split Showcase */}
      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Presentation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Aspect-Based Sentiment Grounding &bull; Zero Hallucinations</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Personalized Itineraries Grounded in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">Verified Reviews</span>.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
            Say goodbye to generic itineraries and LLM hallucinations. Our architecture pairs 
            <strong className="text-slate-200 font-semibold"> ChromaDB Dense Vector Retrieval</strong> with 
            <strong className="text-slate-200 font-semibold"> Aspect-Based Sentiment Analysis (ABSA)</strong> across 
            Scenery, Culinary, Nightlife, Budget, and Crowd Density.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Grounded RAG Search
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Strict semantic matching against verified location databases prevents hallucinated attractions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <Layers className="h-4 w-4 text-blue-400" /> Explainable AI (XAI)
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Inspect every rating breakdown to understand exactly why a destination fits your travel profile.
              </p>
            </div>
          </div>
        </div>

        {/* Right Auth Portal */}
        <div className="lg:col-span-5">
          <div className="bg-[#121824] border border-white/[0.1] rounded-2xl p-7 shadow-2xl backdrop-blur-xl relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isSignUp ? 'Create User Account' : 'Access Your Workspace'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isSignUp ? 'Register profile into SQLite database' : 'Sign in with your registered credentials'}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              </div>
            </div>

            {/* Success Message After Registration */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#090d16] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="e.g., Alex Carter"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#090d16] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#090d16] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Contacting Database...</span>
                  </>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Register New Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Log In to Workspace</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/[0.08] text-center text-xs text-slate-400">
              {isSignUp ? (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 ml-1"
                  >
                    Log In
                  </button>
                </>
              ) : (
                <>
                  Need a new user account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 ml-1"
                  >
                    Register New Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-4 px-6 text-center text-[11px] text-slate-500">
        AI Travel Assistant &bull; SQLite Database Auth &bull; Bounded RAG Context &bull; ABSA Grounded
      </footer>
    </div>
  );
}