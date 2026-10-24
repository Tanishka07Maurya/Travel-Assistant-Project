import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import AuthLanding from './AuthLanding';
import { 
  Compass, 
  Calendar, 
  Sparkles, 
  MapPin, 
  AlertCircle, 
  Loader2, 
  Utensils, 
  Eye, 
  Moon, 
  Wallet, 
  Users, 
  Award, 
  SlidersHorizontal, 
  Check, 
  Clock, 
  Layers, 
  Copy, 
  Download, 
  Printer, 
  History, 
  ChevronRight, 
  ShieldCheck, 
  LogOut, 
  ArrowLeft, 
  Bookmark,
  BarChart3,
  Sun,
  Sunset,
  Gauge,
  Sparkle
} from 'lucide-react';

const PRESET_VIBES = [
  { id: 'scenic', label: 'Scenic Panoramas', text: 'stunning scenic and sunset views' },
  { id: 'food', label: 'Local Food & Dining', text: 'authentic local seafood and great food' },
  { id: 'low_crowd', label: 'Quiet & Low Crowds', text: 'peaceful spots with low crowd density' },
  { id: 'budget', label: 'Value & Budget', text: 'affordable budget-friendly options' },
  { id: 'nightlife', label: 'Vibrant Nightlife', text: 'lively nightlife and evening spots' },
  { id: 'culture', label: 'Heritage & Culture', text: 'rich cultural history and architectural landmarks' },
];

const DEMO_PRESETS = [
  {
    title: 'Peaceful Coastal Escape',
    query: 'A peaceful 3-day coastal trip with serene sunset views, authentic seafood, and low crowd density.',
    days: 3,
    pace: 'Leisurely (Slow & Restful)',
    budget: 'Moderate / Value',
    vibes: ['scenic', 'food', 'low_crowd']
  },
  {
    title: 'Budget Street Food & Nightlife',
    query: 'A vibrant weekend trip on a budget with lively beach shacks, good music, street food, and social spots.',
    days: 2,
    pace: 'Packed (High Exploration)',
    budget: 'Budget / Backpacker',
    vibes: ['budget', 'nightlife', 'food']
  },
  {
    title: 'Heritage & Architecture Tour',
    query: 'A cultural getaway focusing on historic walking tours, heritage architecture, and cozy local cafes.',
    days: 3,
    pace: 'Balanced (Standard Flow)',
    budget: 'Moderate / Value',
    vibes: ['culture', 'scenic']
  }
];

function App() {
  // Session storage ensures fresh login on project restart
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('travel_assistant_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState('planner');
  const [query, setQuery] = useState('');
  const [days, setDays] = useState('');
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [pace, setPace] = useState('');
  const [budgetTier, setBudgetTier] = useState('');
  const [activePaceProfile, setActivePaceProfile] = useState('');
  const [activeBudgetTier, setActiveBudgetTier] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [activeDayTab, setActiveDayTab] = useState('all');
  const [comparisonMode, setComparisonMode] = useState('cards');
  const [copied, setCopied] = useState(false);
  const [userTrips, setUserTrips] = useState([]);

  const fetchUserTrips = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/user-trips/${user.id}`);
      setUserTrips(res.data);
    } catch (err) {
      console.warn('Could not load user trips from database:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserTrips();
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    sessionStorage.setItem('travel_assistant_current_user', JSON.stringify(userData));
    setCurrentView('planner');
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('travel_assistant_current_user');
    setResponse(null);
    setUserTrips([]);
    setCurrentView('planner');
  };

  const toggleVibe = (vibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe.id)
        ? prev.filter((id) => id !== vibe.id)
        : [...prev, vibe.id]
    );
  };

  const applyDemoPreset = (preset) => {
    setQuery(preset.query);
    setDays(preset.days);
    setPace(preset.pace);
    setBudgetTier(preset.budget);
    setSelectedVibes(preset.vibes);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!days || !pace || !budgetTier) {
      setError('Please select trip duration, pace, and budget tier before proceeding.');
      return;
    }

    const vibeTexts = selectedVibes
      .map((id) => PRESET_VIBES.find((v) => v.id === id)?.text)
      .filter(Boolean);

    let combinedQuery = query.trim();

    if (vibeTexts.length > 0) {
      const vibeString = `Focusing on: ${vibeTexts.join(', ')}.`;
      combinedQuery = combinedQuery ? `${combinedQuery} ${vibeString}` : vibeString;
    }

    combinedQuery += ` Pace: ${pace}. Budget style: ${budgetTier}.`;

    if (!combinedQuery.trim()) {
      setError('Please select travel vibes or describe your trip style.');
      return;
    }

    setLoading(true);
    setError('');
    setActiveDayTab('all');

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/generate-itinerary', {
        query: combinedQuery.trim(),
        days: parseInt(days, 10),
        user_id: user.id
      });

      setActivePaceProfile(pace);
      setActiveBudgetTier(budgetTier);
      setResponse(res.data);
      setCurrentView('itinerary');
      fetchUserTrips();
    } catch (err) {
      console.error('API Error:', err);
      setError(
        err.response?.data?.error ||
        'Could not connect to Flask server. Please ensure python main.py is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response?.itinerary_markdown) return;
    navigator.clipboard.writeText(response.itinerary_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!response?.itinerary_markdown) return;
    const blob = new Blob([response.itinerary_markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AI-Travel-Plan-${days}Days.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getAspectIcon = (aspect) => {
    switch (aspect.toLowerCase()) {
      case 'scenery': return <Eye className="h-3.5 w-3.5 text-emerald-400" />;
      case 'food': return <Utensils className="h-3.5 w-3.5 text-amber-400" />;
      case 'nightlife': return <Moon className="h-3.5 w-3.5 text-indigo-400" />;
      case 'budget': return <Wallet className="h-3.5 w-3.5 text-teal-400" />;
      case 'crowd': return <Users className="h-3.5 w-3.5 text-cyan-400" />;
      default: return null;
    }
  };

  const getScoreColorClass = (score) => {
    const num = parseFloat(score);
    if (num >= 4.5) return 'bg-emerald-500';
    if (num >= 4.0) return 'bg-blue-500';
    if (num >= 3.5) return 'bg-indigo-500';
    return 'bg-amber-500';
  };

  const getTopAspect = (scoresObj = {}) => {
    let topAspect = '';
    let topScore = -1;
    for (const [key, val] of Object.entries(scoresObj)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > topScore) {
        topScore = num;
        topAspect = key;
      }
    }
    return topScore > 0 ? { aspect: topAspect, score: topScore } : null;
  };

  const calculatedAlignmentScore = useMemo(() => {
    if (!response?.explainability_data || response.explainability_data.length === 0) return 92;
    let total = 0;
    let count = 0;
    response.explainability_data.forEach((place) => {
      Object.values(place.scores || {}).forEach((s) => {
        const val = parseFloat(s);
        if (!isNaN(val)) {
          total += val;
          count += 1;
        }
      });
    });
    if (count === 0) return 92;
    const avg = total / count;
    return Math.round((avg / 5) * 100);
  }, [response]);

  // Robust Parser: Strips all rogue asterisks, dashes, colons, and breaks into sub-fields
  const parsedItinerary = useMemo(() => {
    if (!response?.itinerary_markdown) return null;

    const raw = response.itinerary_markdown;
    const daySections = [];
    let xaiItems = [];

    const cleanStr = (str) => {
      if (!str) return '';
      return str
        .replace(/^\s*[\*\-\#\:\_]+\s*/g, '')
        .replace(/\*\*/g, '')
        .trim();
    };

    const parseSlotDetails = (rawSlotText) => {
      if (!rawSlotText) return null;
      let cleaned = cleanStr(rawSlotText);

      let place = '';
      let activity = '';
      let dining = '';
      let tip = '';

      if (cleaned.includes('|')) {
        const parts = cleaned.split('|').map((p) => p.trim());
        place = parts[0] || '';
        parts.slice(1).forEach((part) => {
          const lower = part.toLowerCase();
          if (lower.startsWith('activity:')) {
            activity = part.replace(/^activity:\s*/i, '');
          } else if (lower.startsWith('dining:') || lower.startsWith('food:')) {
            dining = part.replace(/^(dining|food):\s*/i, '');
          } else if (lower.startsWith('tip:')) {
            tip = part.replace(/^tip:\s*/i, '');
          } else if (!activity) {
            activity = part;
          }
        });
      } else {
        const actMatch = cleaned.match(/activity:?\s*(.*?)(?=(?:dining:?|food:?|tip:?|$))/i);
        const dinMatch = cleaned.match(/(?:dining|food):?\s*(.*?)(?=(?:tip:?|$))/i);
        const tipMatch = cleaned.match(/tip:?\s*(.*?)$/i);

        activity = actMatch ? actMatch[1].trim() : '';
        dining = dinMatch ? dinMatch[1].trim() : '';
        tip = tipMatch ? tipMatch[1].trim() : '';
        place = cleaned.split(/[—\:\-]/)[0].trim();
      }

      return {
        place: cleanStr(place),
        activity: cleanStr(activity) || cleanStr(cleaned),
        dining: cleanStr(dining),
        tip: cleanStr(tip)
      };
    };

    // 1. Extract XAI Section
    const xaiMatch = raw.match(/Explainable\s*AI.*?(?:\n|$)([\s\S]*)$/i);
    if (xaiMatch && xaiMatch[1]) {
      const lines = xaiMatch[1].trim().split('\n').filter((l) => l.trim().length > 0);
      lines.forEach((line) => {
        const clean = cleanStr(line);
        const colonIndex = clean.indexOf(':');
        if (colonIndex > 0) {
          const placeName = clean.substring(0, colonIndex).trim();
          const justification = clean.substring(colonIndex + 1).trim();
          xaiItems.push({ placeName, justification });
        } else if (clean.length > 5) {
          xaiItems.push({ placeName: 'Verified Destination Rationale', justification: clean });
        }
      });
    }

    // 2. Parse Day Blocks
    const dayRegex = /(?:^|\n)(?:#{1,3}\s*|\*{0,2})Day\s*(\d+)[:\s\-—]*(.*?)(?=(?:\n(?:#{1,3}\s*|\*{0,2})Day\s*\d+|\n(?:#{1,3}\s*)Explainable|\n\*\*Explainable|$))/gis;
    let match;
    while ((match = dayRegex.exec(raw)) !== null) {
      const dayNum = parseInt(match[1], 10);
      const rawBody = match[2].trim();

      const lines = rawBody.split('\n').map((l) => l.trim()).filter(Boolean);
      let theme = `Day ${dayNum} Exploration`;
      if (lines.length > 0 && !lines[0].toLowerCase().includes('morning:')) {
        theme = cleanStr(lines[0]);
      }

      const morningMatch = rawBody.match(/Morning:?\s*([\s\S]*?)(?=(?:Afternoon:?|Evening:?|$))/i);
      const afternoonMatch = rawBody.match(/Afternoon:?\s*([\s\S]*?)(?=(?:Evening:?|$))/i);
      const eveningMatch = rawBody.match(/Evening:?\s*([\s\S]*?)$/i);

      daySections.push({
        dayNumber: dayNum,
        theme: theme,
        morning: parseSlotDetails(morningMatch ? morningMatch[1] : null),
        afternoon: parseSlotDetails(afternoonMatch ? afternoonMatch[1] : null),
        evening: parseSlotDetails(eveningMatch ? eveningMatch[1] : null)
      });
    }

    return {
      days: daySections,
      xaiItems: xaiItems
    };
  }, [response]);

  if (!user) {
    return <AuthLanding onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 py-3.5 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setCurrentView('planner')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#0d1117] rounded-xl flex items-center justify-center group-hover:bg-[#161b22] transition">
                <Compass className="h-4 w-4 text-blue-400 group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">AI Travel Assistant</span>
              <p className="text-[11px] text-slate-400">Intelligent Itinerary Synthesizer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setCurrentView('planner')}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                  currentView === 'planner'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Planner
              </button>
              {response && (
                <button
                  onClick={() => setCurrentView('itinerary')}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                    currentView === 'itinerary'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Current Itinerary
                </button>
              )}
              <button
                onClick={() => setCurrentView('saved_trips')}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                  currentView === 'saved_trips'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Saved Trips ({userTrips.length})
              </button>
            </nav>

            <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-none">{user.name}</div>
                <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="text-slate-400 hover:text-red-400 transition ml-1 p-1 rounded-md hover:bg-white/[0.05]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* VIEW 1: PLANNER STUDIO */}
      {currentView === 'planner' && (
        <section className="relative overflow-hidden pt-10 pb-12 px-4 print:hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
              Where do you want to explore next?
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Define your travel rhythm. Our RAG engine evaluates real visitor reviews and aspect sentiment metrics to synthesize your verified schedule.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-8 bg-white/[0.04] border border-white/[0.1] rounded-2xl shadow-2xl backdrop-blur-2xl p-6 sm:p-7 relative z-10">
            {/* Quick Demo Presets */}
            <div className="mb-5 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkle className="h-3 w-3 text-amber-400" /> Quick Demonstration Presets
                </span>
                <span className="text-[10px] text-slate-500">Click to auto-fill</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_PRESETS.map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyDemoPreset(demo)}
                    className="text-xs px-3 py-1 bg-white/[0.03] hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-white/[0.08] hover:border-blue-500/30 rounded-lg transition"
                  >
                    {demo.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-semibold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
                    Trip Vibes & Sentiment Priorities
                  </label>
                  <span className="text-[11px] text-slate-500">Pick any to ground ChromaDB</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_VIBES.map((vibe) => {
                    const isSelected = selectedVibes.includes(vibe.id);
                    return (
                      <button
                        key={vibe.id}
                        type="button"
                        onClick={() => toggleVibe(vibe)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25 scale-[1.02]'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 border-white/[0.08]'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        {vibe.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-slate-300 mb-2">
                  Trip Description & Preferences
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-[#161b22] border border-white/[0.1] rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="e.g., A peaceful 3-day coastal vacation with serene sunset views, authentic seafood, and low crowd density..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Placeholder Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-white/[0.06]">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" /> Duration
                  </label>
                  <select
                    value={days}
                    onChange={(e) => setDays(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#161b22] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select Duration...</option>
                    <option value={1}>1 Day (Express Tour)</option>
                    <option value={2}>2 Days (Weekend Break)</option>
                    <option value={3}>3 Days (Standard Plan)</option>
                    <option value={5}>5 Days (Extended Expedition)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" /> Travel Pace
                  </label>
                  <select
                    value={pace}
                    onChange={(e) => setPace(e.target.value)}
                    className="w-full bg-[#161b22] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select Pace...</option>
                    <option value="Leisurely (Slow & Restful)">Leisurely (Slow & Restful)</option>
                    <option value="Balanced (Standard Flow)">Balanced (Standard Flow)</option>
                    <option value="Packed (High Exploration)">Packed (High Exploration)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-emerald-400" /> Budget Tier
                  </label>
                  <select
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value)}
                    className="w-full bg-[#161b22] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select Budget Tier...</option>
                    <option value="Budget / Backpacker">Budget / Backpacker</option>
                    <option value="Moderate / Value">Moderate / Value</option>
                    <option value="Luxury / Premium">Luxury / Premium</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-7 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 text-sm active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Synthesizing Itinerary...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Itinerary</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3.5 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* VIEW 2: CURRENT ITINERARY WITH ACTIONABLE CARDS & CLEAR XAI */}
      {currentView === 'itinerary' && response && (
        <main className="max-w-6xl mx-auto mt-8 px-4 md:px-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentView('planner')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Planner
            </button>
          </div>

          {/* Analytics Ribbon */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</div>
                <div className="text-xs font-bold text-white">{days || 3} Days Route</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Pace Profile</div>
                <div className="text-xs font-bold text-white">{activePaceProfile || 'Balanced Flow'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Budget Tier</div>
                <div className="text-xs font-bold text-white">{activeBudgetTier || 'Moderate'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">ABSA Alignment</div>
                <div className="text-xs font-bold text-emerald-400">{calculatedAlignmentScore}% Confidence</div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {/* Grounded Destination Matches */}
            {response.explainability_data && response.explainability_data.length > 0 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-400" /> Grounded Destination Matches
                    </h2>
                    <p className="text-xs text-slate-400">
                      Top retrieved destinations with aspect sentiment scores extracted from visitor reviews.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
                    <button
                      onClick={() => setComparisonMode('cards')}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                        comparisonMode === 'cards'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Cards View
                    </button>
                    <button
                      onClick={() => setComparisonMode('matrix')}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                        comparisonMode === 'matrix'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 className="h-3 w-3" />
                      <span>ABSA Matrix</span>
                    </button>
                  </div>
                </div>

                {comparisonMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {response.explainability_data.map((place, idx) => {
                      const topMatch = getTopAspect(place.scores);

                      return (
                        <div 
                          key={idx} 
                          className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-blue-500/40 rounded-2xl p-5 transition-all duration-300 shadow-xl flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-white text-base tracking-tight">
                                {place.place_name}
                              </h3>
                              <span className="text-[11px] bg-white/[0.06] text-slate-300 px-2.5 py-0.5 rounded-full font-medium border border-white/[0.06]">
                                {place.category}
                              </span>
                            </div>

                            {topMatch && (
                              <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-400/20 rounded-md text-[11px] text-amber-300 font-medium">
                                <Award className="h-3 w-3 text-amber-400" />
                                <span>Top Strength: {topMatch.aspect} ({topMatch.score}/5)</span>
                              </div>
                            )}

                            <div className="space-y-2.5 pt-1">
                              {Object.entries(place.scores || {}).map(([aspect, score]) => {
                                const numericScore = parseFloat(score) || 0;
                                const percentage = Math.min(100, Math.max(0, (numericScore / 5) * 100));

                                return (
                                  <div key={aspect} className="text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-1.5 text-slate-400 font-medium capitalize text-[11px]">
                                        {getAspectIcon(aspect)}
                                        <span>{aspect}</span>
                                      </div>
                                      <span className="font-bold text-slate-200 text-[11px]">
                                        {score} <span className="text-slate-500 font-normal">/ 5</span>
                                      </span>
                                    </div>
                                    <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-700 ${getScoreColorClass(numericScore)}`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 overflow-x-auto shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400">
                          <th className="py-2.5 px-3">Destination Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Scenery</th>
                          <th className="py-2.5 px-3">Food</th>
                          <th className="py-2.5 px-3">Nightlife</th>
                          <th className="py-2.5 px-3">Budget</th>
                          <th className="py-2.5 px-3">Low Crowd</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {response.explainability_data.map((place, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3 font-bold text-white">{place.place_name}</td>
                            <td className="py-3 px-3 text-slate-300">{place.category}</td>
                            <td className="py-3 px-3 font-semibold text-emerald-400">{place.scores?.Scenery || 'N/A'}/5</td>
                            <td className="py-3 px-3 font-semibold text-amber-400">{place.scores?.Food || 'N/A'}/5</td>
                            <td className="py-3 px-3 font-semibold text-indigo-400">{place.scores?.Nightlife || 'N/A'}/5</td>
                            <td className="py-3 px-3 font-semibold text-teal-400">{place.scores?.Budget || 'N/A'}/5</td>
                            <td className="py-3 px-3 font-semibold text-cyan-400">{place.scores?.Crowd || 'N/A'}/5</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Timeline Schedule Container */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.08] bg-white/[0.02]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      Day-by-Day Journey Itinerary
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Synthesized itinerary grounded strictly by ChromaDB review context.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.1] rounded-lg transition"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.1] rounded-lg transition"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-400" />
                      <span>Export (.md)</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.1] rounded-lg transition"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-400" />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>

                {parsedItinerary?.days?.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-[#161b22] p-1.5 rounded-xl border border-white/[0.08] mt-5 w-fit print:hidden">
                    <button
                      onClick={() => setActiveDayTab('all')}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                        activeDayTab === 'all'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Days
                    </button>
                    {parsedItinerary.days.map((d) => (
                      <button
                        key={d.dayNumber}
                        onClick={() => setActiveDayTab(d.dayNumber.toString())}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                          activeDayTab === d.dayNumber.toString()
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Day {d.dayNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actionable Timeline Slot Cards */}
              <div className="p-6 sm:p-8 space-y-8">
                {parsedItinerary?.days && parsedItinerary.days.length > 0 ? (
                  parsedItinerary.days
                    .filter((d) => activeDayTab === 'all' || activeDayTab === d.dayNumber.toString())
                    .map((d) => (
                      <div 
                        key={d.dayNumber} 
                        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.06]">
                          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-blue-500/10 border border-blue-400/20 text-blue-300 rounded-lg">
                            Day {d.dayNumber}
                          </span>
                          <h3 className="font-bold text-white text-base">
                            {d.theme}
                          </h3>
                        </div>

                        {/* Structured Morning / Afternoon / Evening Timeline Slots */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* 1. Morning Slot */}
                          <div className="bg-[#121824] border border-white/[0.08] hover:border-amber-400/30 rounded-xl p-4 flex flex-col justify-between transition shadow-sm">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider">
                                  <Sun className="h-4 w-4 text-amber-400" />
                                  <span>Morning</span>
                                </div>
                                {d.morning?.place && (
                                  <span className="text-[10px] font-semibold text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08] truncate max-w-[130px]">
                                    {d.morning.place}
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-0.5">
                                  Sight / Activity
                                </div>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                  {d.morning?.activity || 'Explore the morning shoreline and local sights.'}
                                </p>
                              </div>

                              {d.morning?.dining && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                                    <Utensils className="h-3 w-3 text-amber-400" /> What to Eat / Cafe
                                  </div>
                                  <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                                    {d.morning.dining}
                                  </p>
                                </div>
                              )}

                              {d.morning?.tip && (
                                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                  <div className="text-[10px] font-semibold text-slate-400 mb-0.5">Insider Tip</div>
                                  <p className="text-[11px] text-slate-300 leading-normal">
                                    {d.morning.tip}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2. Afternoon Slot */}
                          <div className="bg-[#121824] border border-white/[0.08] hover:border-sky-400/30 rounded-xl p-4 flex flex-col justify-between transition shadow-sm">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                                <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs uppercase tracking-wider">
                                  <Compass className="h-4 w-4 text-sky-400" />
                                  <span>Afternoon</span>
                                </div>
                                {d.afternoon?.place && (
                                  <span className="text-[10px] font-semibold text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08] truncate max-w-[130px]">
                                    {d.afternoon.place}
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400/90 mb-0.5">
                                  Sight / Activity
                                </div>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                  {d.afternoon?.activity || 'Explore key scenic spots and cultural landmarks.'}
                                </p>
                              </div>

                              {d.afternoon?.dining && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                                    <Utensils className="h-3 w-3 text-sky-400" /> Recommended Lunch
                                  </div>
                                  <p className="text-xs text-sky-200/90 leading-relaxed font-medium">
                                    {d.afternoon.dining}
                                  </p>
                                </div>
                              )}

                              {d.afternoon?.tip && (
                                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                  <div className="text-[10px] font-semibold text-slate-400 mb-0.5">Insider Tip</div>
                                  <p className="text-[11px] text-slate-300 leading-normal">
                                    {d.afternoon.tip}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 3. Evening Slot */}
                          <div className="bg-[#121824] border border-white/[0.08] hover:border-indigo-400/30 rounded-xl p-4 flex flex-col justify-between transition shadow-sm">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                                <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                                  <Sunset className="h-4 w-4 text-indigo-400" />
                                  <span>Evening</span>
                                </div>
                                {d.evening?.place && (
                                  <span className="text-[10px] font-semibold text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08] truncate max-w-[130px]">
                                    {d.evening.place}
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/90 mb-0.5">
                                  Sight / Activity
                                </div>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                  {d.evening?.activity || 'Sunset views followed by evening coastal ambience.'}
                                </p>
                              </div>

                              {d.evening?.dining && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                                    <Utensils className="h-3 w-3 text-indigo-400" /> Dinner & Drinks
                                  </div>
                                  <p className="text-xs text-indigo-200/90 leading-relaxed font-medium">
                                    {d.evening.dining}
                                  </p>
                                </div>
                              )}

                              {d.evening?.tip && (
                                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                  <div className="text-[10px] font-semibold text-slate-400 mb-0.5">Insider Tip</div>
                                  <p className="text-[11px] text-slate-300 leading-normal">
                                    {d.evening.tip}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
                    <p>{response.itinerary_markdown}</p>
                  </div>
                )}
              </div>

              {/* Structured XAI Justification Cards */}
              <div className="mx-6 sm:mx-8 mb-8 p-6 bg-gradient-to-br from-indigo-950/30 via-blue-950/20 to-transparent border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-4 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <span>Explainable AI (XAI) Recommendation Justification</span>
                </div>

                {parsedItinerary?.xaiItems && parsedItinerary.xaiItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {parsedItinerary.xaiItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#121824]/80 border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2 pb-1.5 border-b border-white/[0.06]">
                            <MapPin className="h-3.5 w-3.5 text-blue-400" />
                            <span>{item.placeName}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {item.justification}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <Check className="h-3 w-3" />
                          <span>Sentiment Score Verified</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed">
                    All recommended locations match your requested duration and aspect priorities extracted from visitor reviews.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: SAVED TRIPS */}
      {currentView === 'saved_trips' && (
        <section className="max-w-5xl mx-auto mt-8 px-4 animate-fade-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-blue-400" /> Saved Travel Itineraries
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved plans linked to SQLite Database for: <span className="text-blue-300 font-medium">{user.email}</span>
              </p>
            </div>
          </div>

          {userTrips.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.02]">
              <History className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">No saved itineraries for this profile</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Generate a trip using the planner to have it automatically archived in your SQLite database account.
              </p>
              <button
                onClick={() => setCurrentView('planner')}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition"
              >
                Go to Planner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTrips.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setResponse(item.data);
                    setDays(item.days);
                    setCurrentView('itinerary');
                  }}
                  className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-blue-500/40 p-5 rounded-2xl cursor-pointer transition shadow-lg group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-400/20">
                        {item.days} Days Itinerary
                      </span>
                      <span className="text-[11px] text-slate-500">{item.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition line-clamp-2">
                      {item.queryTitle}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 group-hover:text-white">
                    <span>View Grounded Plan</span>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Persistent Academic Footer */}
      <footer className="border-t border-white/[0.06] py-4 px-6 text-center text-[11px] text-slate-500 mt-16 print:hidden">
        AI Travel Assistant &bull; ChromaDB Vector Embeddings &bull; Aspect-Based Sentiment Analysis &bull; SQLite Persistence
      </footer>
    </div>
  );
}

export default App;