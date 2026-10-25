import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Sparkles,
  Compass,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Utensils,
  Hotel,
  Ticket,
  Users,
  X,
  ChevronRight,
  LogOut,
  Copy,
  Download,
  Printer,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Moon,
  Bookmark,
  Send,
  Loader2,
  Lock,
  User as UserIcon,
  Star,
  Coffee,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('travel_assistant_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState('home'); 
  const [activeModal, setActiveModal] = useState(null); // 'login' | 'setup' | 'itinerary' | 'stays' | 'eats' | 'experiences'
  const [authMode, setAuthMode] = useState('signin');

  // Auth fields
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form Fields
  const [promptText, setPromptText] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [pace, setPace] = useState('Balanced (Standard Flow)');
  const [budgetTier, setBudgetTier] = useState('Moderate / Value');

  // Response Results
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [userTrips, setUserTrips] = useState([]);

  // Fetch Saved Trips from Flask backend
  const fetchUserTrips = async (userId) => {
    const targetId = userId || user?.id;
    if (!targetId) return;
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/user-trips/${targetId}`);
      if (Array.isArray(res.data)) {
        setUserTrips(res.data);
      }
    } catch (err) {
      console.warn('Trips fetch notice:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserTrips(user.id);
    }
  }, [user]);

  // Helper to open any modal with fresh, empty input fields
  const openCleanModal = (modalName) => {
    setPromptText('');
    setDestination('');
    setError('');
    setActiveModal(modalName);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'register' ? 'register' : 'login';
      const payload = authMode === 'register' 
        ? { name: authName.trim(), email: authEmail.trim(), password: authPassword }
        : { email: authEmail.trim(), password: authPassword };

      const res = await axios.post(`http://127.0.0.1:5000/api/${endpoint}`, payload);
      
      // Clean person display name: never raw email containing '@'
      let displayName = res.data.name || authName.trim();
      if (!displayName || displayName.includes('@')) {
        const rawPart = authEmail.split('@')[0];
        displayName = rawPart.charAt(0).toUpperCase() + rawPart.slice(1);
      }

      const loggedInUser = {
        id: res.data.user_id || res.data.id || 1,
        name: displayName,
        email: authEmail.trim()
      };
      
      setUser(loggedInUser);
      sessionStorage.setItem('travel_assistant_current_user', JSON.stringify(loggedInUser));
      setActiveModal(null);
      fetchUserTrips(loggedInUser.id);
    } catch (err) {
      let fallbackName = authName.trim();
      if (!fallbackName) {
        const rawPart = authEmail.split('@')[0];
        fallbackName = rawPart ? (rawPart.charAt(0).toUpperCase() + rawPart.slice(1)) : 'Pearlie';
      }
      const fallbackUser = {
        id: 1,
        name: fallbackName,
        email: authEmail.trim()
      };
      setUser(fallbackUser);
      sessionStorage.setItem('travel_assistant_current_user', JSON.stringify(fallbackUser));
      setActiveModal(null);
      fetchUserTrips(fallbackUser.id);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const demoGoogleUser = { id: 1, name: 'Pearlie', email: 'pearlie@travel.ai' };
    setUser(demoGoogleUser);
    sessionStorage.setItem('travel_assistant_current_user', JSON.stringify(demoGoogleUser));
    setActiveModal(null);
    fetchUserTrips(demoGoogleUser.id);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('travel_assistant_current_user');
    setUserTrips([]);
    setCurrentView('home');
  };

  const handleExecuteSearch = async (e) => {
    if (e) e.preventDefault();
    const finalDest = destination.trim() || 'Rajasthan';
    const chosenMode = activeModal || 'itinerary';

    setLoading(true);
    setError('');
    setActiveModal(null);

    const activeUserId = user ? user.id : 1;

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/generate-itinerary', {
        destination: finalDest,
        query: promptText.trim(),
        days: parseInt(days, 10),
        mode: chosenMode,
        user_id: activeUserId
      });

      setResultData(res.data);
      setCurrentView('results');

      // Clear the prompt text and destination so the next modal opened is completely blank
      setPromptText('');
      setDestination('');

      // If an itinerary was generated, immediately refresh saved trips
      if (chosenMode === 'itinerary' && user?.id) {
        await fetchUserTrips(user.id);
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.error || 'Could not connect to Flask backend.');
    } finally {
      setLoading(false);
    }
  };

  // Manual save trip button handler
  const handleSaveCurrentTrip = async () => {
    if (!resultData || resultData.type !== 'itinerary') return;
    const activeUserId = user ? user.id : 1;
    const finalDest = destination.trim() || 'Rajasthan';

    try {
      await axios.post('http://127.0.0.1:5000/api/save-trip', {
        user_id: activeUserId,
        title: `${finalDest} (${days} Days Journey)`,
        days: parseInt(days, 10),
        trip_data: resultData
      });
      setSavedSuccess(true);
      await fetchUserTrips(activeUserId);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Manual save warning:', err);
    }
  };

  const parsedItinerary = useMemo(() => {
    if (!resultData || resultData.type !== 'itinerary' || !resultData.itinerary_markdown) return null;
    const raw = resultData.itinerary_markdown;
    const daySections = [];
    const xaiItems = [];

    const cleanStr = (str) => (!str ? '' : str.replace(/^\s*[\*\-\#\:\_]+\s*/g, '').replace(/\*\*/g, '').trim());

    const parseSlot = (rawSlot) => {
      if (!rawSlot) return null;
      const cleaned = cleanStr(rawSlot);
      let place = '', activity = '', dining = '', tip = '';

      if (cleaned.includes('|')) {
        const parts = cleaned.split('|').map((p) => p.trim());
        place = parts[0] || '';
        parts.slice(1).forEach((part) => {
          const lower = part.toLowerCase();
          if (lower.startsWith('activity:')) activity = part.replace(/^activity:\s*/i, '');
          else if (lower.startsWith('dining:') || lower.startsWith('food:')) dining = part.replace(/^(dining|food):\s*/i, '');
          else if (lower.startsWith('tip:')) tip = part.replace(/^tip:\s*/i, '');
          else if (!activity) activity = part;
        });
      } else {
        activity = cleaned;
      }

      return { place: cleanStr(place), activity: cleanStr(activity), dining: cleanStr(dining), tip: cleanStr(tip) };
    };

    const xaiMatch = raw.match(/Explainable\s*AI.*?(?:\n|$)([\s\S]*)$/i);
    if (xaiMatch && xaiMatch[1]) {
      xaiMatch[1].trim().split('\n').filter(Boolean).forEach((line) => {
        const clean = cleanStr(line);
        const idx = clean.indexOf(':');
        if (idx > 0) {
          xaiItems.push({ placeName: clean.substring(0, idx).trim(), justification: clean.substring(idx + 1).trim() });
        }
      });
    }

    const dayRegex = /(?:^|\n)(?:#{1,3}\s*|\*{0,2})Day\s*(\d+)[:\s\-—]*(.*?)(?=(?:\n(?:#{1,3}\s*|\*{0,2})Day\s*\d+|\n(?:#{1,3}\s*)Explainable|\n\*\*Explainable|$))/gis;
    let match;
    while ((match = dayRegex.exec(raw)) !== null) {
      const dayNum = parseInt(match[1], 10);
      const rawBody = match[2].trim();
      const lines = rawBody.split('\n').map((l) => l.trim()).filter(Boolean);
      let theme = `Day ${dayNum} Exploration`;
      if (lines.length > 0 && !lines[0].toLowerCase().includes('morning:')) theme = cleanStr(lines[0]);

      daySections.push({
        dayNumber: dayNum,
        theme,
        morning: parseSlot(rawBody.match(/Morning:?\s*([\s\S]*?)(?=(?:Afternoon:?|Evening:?|$))/i)?.[1]),
        afternoon: parseSlot(rawBody.match(/Afternoon:?\s*([\s\S]*?)(?=(?:Evening:?|$))/i)?.[1]),
        evening: parseSlot(rawBody.match(/Evening:?\s*([\s\S]*?)$/i)?.[1])
      });
    }

    return { days: daySections, xaiItems };
  }, [resultData]);

  return (
    <div className="min-h-screen bg-[#0e1015] text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#0e1015]/80 backdrop-blur-xl border-b border-white/[0.08] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={() => setCurrentView('home')} className="flex items-center gap-2.5 cursor-pointer group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Sparkles className="h-4 w-4 text-black stroke-[2.5]" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-amber-400 transition">
              travel<span className="text-amber-400">.ai</span>
            </span>
          </div>

          {/* Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.04] p-1.5 rounded-full border border-white/[0.08]">
            <button
              onClick={() => openCleanModal('stays')}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
            >
              <Hotel className="h-3.5 w-3.5 text-amber-400" />
              <span>Stays</span>
            </button>
            <button
              onClick={() => openCleanModal('eats')}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
            >
              <Utensils className="h-3.5 w-3.5 text-amber-400" />
              <span>Eats</span>
            </button>
            <button
              onClick={() => openCleanModal('experiences')}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
            >
              <Ticket className="h-3.5 w-3.5 text-amber-400" />
              <span>Experiences</span>
            </button>
            {user && (
              <button
                onClick={() => {
                  fetchUserTrips(user.id);
                  setCurrentView('saved_trips');
                }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                  currentView === 'saved_trips' ? 'bg-amber-400 text-black' : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Trips ({userTrips.length})</span>
              </button>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-200 hidden sm:inline capitalize">
                  {user.name && !user.name.includes('@')
                    ? user.name
                    : (user.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'Traveler')}
                </span>
                <button onClick={handleLogout} title="Log Out" className="p-2 text-slate-400 hover:text-red-400 transition hover:bg-white/[0.05] rounded-full">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setAuthMode('signin'); setAuthError(''); setActiveModal('login'); }}
                  className="text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-1.5"
                >
                  Log in
                </button>
                <button
                  onClick={() => setActiveModal('setup')}
                  className="text-xs font-bold px-4 py-2 rounded-full border border-white/[0.2] hover:border-amber-400 text-white hover:text-amber-400 transition"
                >
                  Set up assistant
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO PAGE */}
      {currentView === 'home' && (
        <main className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=2200&q=85"
              alt="Deep Blue Ocean"
              className="w-full h-full object-cover object-center opacity-65 saturate-150 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1015] via-[#081826]/70 to-[#032541]/40 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e1015]/60 via-transparent to-[#0e1015]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 text-center">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-4">
              Travel that gets you.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
              Meet your personal AI travel assistant. Grounded in verified visitor reviews, aspect sentiment, and authentic discovery.
            </p>
          </div>

          {/* Bottom Planner: Full Master Itinerary */}
          <div className="relative z-10 max-w-3xl w-full mx-auto px-6 pb-16">
            <div
              onClick={() => openCleanModal('itinerary')}
              className="bg-[#181c24]/90 backdrop-blur-2xl border border-white/[0.15] hover:border-amber-400/50 rounded-2xl p-4 shadow-2xl flex items-center justify-between cursor-pointer transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 text-amber-400">
                  <Compass className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition">
                  Where would you like to travel? Ask anything...
                </span>
              </div>
              <button
                type="button"
                className="h-9 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20"
              >
                <span>Plan Trip</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 3. MODALS */}

      {/* Setup Step 1: Onboarding Card */}
      {activeModal === 'setup' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181c24] border border-white/[0.12] rounded-3xl p-8 max-w-md w-full relative shadow-2xl text-center">
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-black flex items-center justify-center mx-auto mb-4 font-black text-xl shadow-lg shadow-amber-500/20">
              <Sparkles className="h-7 w-7 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Set up your travel assistant</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Create an account or sign in to ground recommendations to your travel pace, budget, and saved journeys.
            </p>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); setActiveModal('login'); }}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm py-3.5 rounded-2xl transition shadow-lg shadow-amber-500/20"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Setup Step 2 / Direct Login */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181c24] border border-white/[0.12] rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-center text-white mb-1">
              {authMode === 'register' ? 'Create an account' : 'Log in to travel.ai'}
            </h2>
            <p className="text-xs text-center text-slate-400 mb-6">
              Access your personalized recommendations and saved trip itineraries.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-[#101318] border border-white/[0.1] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-[#101318] border border-white/[0.1] rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#101318] border border-white/[0.1] rounded-2xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {authError && <p className="text-xs text-red-400 font-medium text-center">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-white hover:bg-slate-200 text-black font-bold text-sm py-3.5 rounded-2xl transition flex items-center justify-center gap-2"
              >
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <span>{authMode === 'register' ? 'Create Account' : 'Continue'}</span>}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/[0.08]" />
              <span className="px-3 text-xs text-slate-500 uppercase">or</span>
              <div className="flex-1 border-t border-white/[0.08]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-white font-semibold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2.5 mb-4"
            >
              <span>Continue with Google</span>
            </button>

            <div className="text-center pt-2">
              {authMode === 'register' ? (
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); }} className="text-amber-400 font-bold hover:underline">
                    Log in
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-amber-400 font-bold hover:underline">
                    Create account
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Query Modals (Stays, Eats, Experiences, Itinerary) */}
      {(activeModal === 'itinerary' || activeModal === 'stays' || activeModal === 'eats' || activeModal === 'experiences') && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181c24] border border-white/[0.15] rounded-3xl p-7 max-w-lg w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
                {activeModal === 'eats' ? <Utensils className="h-5 w-5" /> : activeModal === 'stays' ? <Hotel className="h-5 w-5" /> : activeModal === 'experiences' ? <Ticket className="h-5 w-5" /> : <Compass className="h-5 w-5" />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {activeModal === 'eats' ? "Tell me what food you're in the mood for" : activeModal === 'stays' ? 'What kind of stay can I help you find?' : activeModal === 'experiences' ? 'What experiences are you seeking?' : 'What should I keep in mind for this trip?'}
              </h2>
            </div>

            <form onSubmit={handleExecuteSearch} className="space-y-4">
              <textarea
                rows={3}
                placeholder={
                  activeModal === 'eats'
                    ? 'e.g., Authentic local thali, famous street food lanes, or rooftop dinner with sunset view...'
                    : activeModal === 'stays'
                    ? 'e.g., A quiet heritage boutique stay, haveli with rooftop pool, or backpacker hostel...'
                    : activeModal === 'experiences'
                    ? 'e.g., Heritage fort walking tours, local craft block-printing workshops, or evening boat rides...'
                    : 'e.g., A relaxed cultural exploration with scenic heritage landmarks...'
                }
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full bg-[#101318] border border-white/[0.1] rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Have details? Share what you know:
                </span>

                <div className="flex items-center justify-between bg-[#101318] border border-white/[0.08] rounded-xl px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-400">Where</span>
                  <input
                    type="text"
                    placeholder="Destination (e.g. Rajasthan, Goa, Agra)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-transparent text-right text-xs text-white placeholder-slate-500 focus:outline-none max-w-[240px]"
                  />
                </div>

                {activeModal === 'itinerary' && (
                  <div className="flex items-center justify-between bg-[#101318] border border-white/[0.08] rounded-xl px-4 py-2.5">
                    <span className="text-xs font-semibold text-slate-400">When</span>
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="bg-transparent text-right text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-[#181c24]">1 Day Trip</option>
                      <option value={2} className="bg-[#181c24]">2 Days Weekend</option>
                      <option value={3} className="bg-[#181c24]">3 Days Plan</option>
                      <option value={5} className="bg-[#181c24]">5 Days Extended</option>
                    </select>
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm py-3.5 rounded-2xl transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <span>
                    {activeModal === 'eats' ? 'Find restaurants' : activeModal === 'stays' ? 'Find stays' : activeModal === 'experiences' ? 'Find experiences' : 'Plan Trip'}
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. RESULTS SECTION */}
      {currentView === 'results' && resultData && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentView('home')} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
              <ArrowLeft className="h-4 w-4" /> Back to Search
            </button>

            {/* Quick Actions for Master Itinerary */}
            {resultData.type === 'itinerary' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCurrentTrip}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl transition flex items-center gap-1.5"
                >
                  {savedSuccess ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Bookmark className="h-3.5 w-3.5" />}
                  <span>{savedSuccess ? 'Saved to Profile' : 'Save Itinerary'}</span>
                </button>
              </div>
            )}
          </div>

          {/* VIEW TYPE A: STAYS */}
          {resultData.type === 'stays' && (
            <div>
              <div className="mb-8">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
                  Accommodations Guide
                </span>
                <h2 className="text-2xl font-black text-white mt-2">Recommended Stays in {resultData.destination}</h2>
                <p className="text-xs text-slate-400">Curated accommodations rated across Comfort, Location, and Value.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultData.items?.map((stay, idx) => (
                  <div key={idx} className="bg-[#181c24] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white text-lg">{stay.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <MapPin className="h-3 w-3 text-amber-400" />
                            <span>{stay.location}</span>
                            <span className="text-amber-400 font-bold ml-2">{stay.price_tier}</span>
                          </div>
                        </div>
                        <span className="text-[11px] bg-white/[0.06] text-amber-300 px-3 py-1 rounded-full font-semibold">
                          {stay.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed my-4">{stay.description}</p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {stay.amenities?.map((amenity, i) => (
                          <span key={i} className="text-[10px] bg-[#101318] border border-white/[0.06] text-slate-300 px-2.5 py-1 rounded-md">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06] pt-4 grid grid-cols-5 gap-2 text-center">
                      {Object.entries(stay.scores || {}).map(([dim, score]) => (
                        <div key={dim} className="bg-[#101318] p-1.5 rounded-lg border border-white/[0.04]">
                          <div className="text-[10px] text-slate-400 truncate">{dim}</div>
                          <div className="text-xs font-bold text-amber-400">{score}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW TYPE B: EATS */}
          {resultData.type === 'eats' && (
            <div>
              <div className="mb-8">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
                  Culinary & Dining Guide
                </span>
                <h2 className="text-2xl font-black text-white mt-2">Food & Dining in {resultData.destination}</h2>
                <p className="text-xs text-slate-400">Famous eateries, street food lanes, and signature dishes evaluated for taste & authenticity.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultData.items?.map((eat, idx) => (
                  <div key={idx} className="bg-[#181c24] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white text-lg">{eat.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <Utensils className="h-3 w-3 text-amber-400" />
                            <span>{eat.cuisine}</span>
                            <span className="text-emerald-400 font-semibold ml-2">{eat.price_range}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed my-3">{eat.description}</p>

                      <div className="bg-[#101318] rounded-xl p-3 border border-white/[0.04] mb-4">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Must-Order Specialties:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {eat.signature_dishes?.map((dish, i) => (
                            <span key={i} className="text-xs font-medium text-white bg-white/[0.05] px-2.5 py-0.5 rounded-md">
                              {dish}
                            </span>
                          ))}
                        </div>
                      </div>

                      {eat.tip && (
                        <p className="text-[11px] text-slate-400 italic mb-4">
                          <span className="font-semibold text-slate-300">Foodie Tip:</span> {eat.tip}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-white/[0.06] pt-4 grid grid-cols-5 gap-2 text-center">
                      {Object.entries(eat.scores || {}).map(([dim, score]) => (
                        <div key={dim} className="bg-[#101318] p-1.5 rounded-lg border border-white/[0.04]">
                          <div className="text-[10px] text-slate-400 truncate">{dim}</div>
                          <div className="text-xs font-bold text-amber-400">{score}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW TYPE C: EXPERIENCES */}
          {resultData.type === 'experiences' && (
            <div>
              <div className="mb-8">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
                  Activities & Attractions
                </span>
                <h2 className="text-2xl font-black text-white mt-2">Curated Experiences in {resultData.destination}</h2>
                <p className="text-xs text-slate-400">Guided tours, cultural workshops, and viewpoints evaluated from visitor sentiment.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultData.items?.map((exp, idx) => (
                  <div key={idx} className="bg-[#181c24] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white text-lg">{exp.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <Clock className="h-3 w-3 text-amber-400" />
                            <span>{exp.duration}</span>
                          </div>
                        </div>
                        <span className="text-[11px] bg-white/[0.06] text-amber-300 px-3 py-1 rounded-full font-semibold">
                          {exp.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed my-3">{exp.description}</p>
                      {exp.tip && <p className="text-[11px] text-slate-400 italic mb-4">Tip: {exp.tip}</p>}
                    </div>

                    <div className="border-t border-white/[0.06] pt-4 grid grid-cols-5 gap-2 text-center">
                      {Object.entries(exp.scores || {}).map(([dim, score]) => (
                        <div key={dim} className="bg-[#101318] p-1.5 rounded-lg border border-white/[0.04]">
                          <div className="text-[10px] text-slate-400 truncate">{dim}</div>
                          <div className="text-xs font-bold text-amber-400">{score}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW TYPE D: FULL MASTER ITINERARY */}
          {resultData.type === 'itinerary' && (
            <div>
              {/* Recommended Stay Banner */}
              {resultData.stay_recommendation && (
                <div className="mb-8 bg-gradient-to-r from-amber-500/10 via-[#181c24] to-[#181c24] border border-amber-400/30 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                      <Hotel className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Recommended Stay Base Camp</span>
                      <h4 className="text-sm font-bold text-white">{resultData.stay_recommendation}</h4>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">Included with Daily Route</span>
                </div>
              )}

              {/* Top Aspect Matches */}
              {resultData.explainability_data && (
                <div className="mb-10">
                  <h3 className="text-lg font-bold text-white mb-1">Grounded Destination Matches</h3>
                  <p className="text-xs text-slate-400 mb-5">Aspect-based scores evaluated across Scenery, Food, and Budget.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {resultData.explainability_data.map((place, idx) => (
                      <div key={idx} className="bg-[#181c24] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white text-sm">{place.place_name}</h4>
                          <span className="text-[10px] bg-white/[0.06] text-amber-300 px-2 py-0.5 rounded-full">{place.category}</span>
                        </div>
                        <div className="space-y-1.5 mt-3">
                          {Object.entries(place.scores || {}).map(([dim, score]) => (
                            <div key={dim} className="text-[11px] flex justify-between">
                              <span className="text-slate-400 capitalize">{dim}</span>
                              <span className="font-bold text-slate-200">{score} / 5</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day-by-Day Timeline */}
              <div className="bg-[#181c24] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  Day-by-Day Journey Itinerary
                </h3>

                <div className="space-y-6">
                  {parsedItinerary?.days?.map((d) => (
                    <div key={d.dayNumber} className="bg-[#101318] border border-white/[0.06] rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.06]">
                        <span className="text-xs font-bold uppercase px-3 py-1 bg-amber-400/10 text-amber-400 rounded-lg">Day {d.dayNumber}</span>
                        <h4 className="font-bold text-white text-base">{d.theme}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['morning', 'afternoon', 'evening'].map((slot) => {
                          const item = d[slot];
                          return (
                            <div key={slot} className="bg-[#181c24] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                              <div>
                                <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 capitalize">{slot}</div>
                                <div className="text-xs font-bold text-white mb-1">{item?.place}</div>
                                <p className="text-xs text-slate-300 leading-relaxed mb-2">{item?.activity}</p>
                                {item?.dining && <div className="text-[11px] text-amber-300"><span className="text-slate-400">Dining: </span>{item.dining}</div>}
                              </div>
                              {item?.tip && <div className="mt-3 pt-2 border-t border-white/[0.04] text-[10px] text-slate-400">Tip: {item.tip}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. SAVED TRIPS */}
      {currentView === 'saved_trips' && (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-amber-400" /> Saved Travel Plans
            </h2>
            <button onClick={() => setCurrentView('home')} className="text-xs font-semibold text-slate-400 hover:text-white transition">Back to Home</button>
          </div>

          {userTrips.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/[0.1] rounded-3xl">
              <Compass className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No saved itineraries yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Generate an itinerary using the bottom "Plan Trip" bar, or click "Save Itinerary" on any generated plan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTrips.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setResultData(item.data); setCurrentView('results'); }}
                  className="bg-[#181c24] hover:bg-[#1f242e] border border-white/[0.08] hover:border-amber-400/40 p-5 rounded-2xl cursor-pointer transition shadow-lg group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">{item.days} Days Plan</span>
                    <span className="text-[11px] text-slate-500">{item.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">{item.queryTitle}</h3>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}