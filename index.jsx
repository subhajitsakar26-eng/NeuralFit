import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Droplet, Moon, Heart, Utensils, User, 
  Award, AlertCircle, Zap, MapPin, ChevronRight, 
  Calendar, BarChart2, Shield, TrendingUp, X,
  MessageSquare, Bell, Search, Play, Pause, Wind, Cloud,
  Thermometer, FileText, ArrowRight, Send, Sparkles, ChefHat
} from 'lucide-react';

// --- Gemini API Configuration ---
const apiKey = ""; // API Key injected by environment

// --- Mock Data & Utilities ---

const MOCK_DATA = {
  macros: {
    protein: { current: 120, target: 180, unit: 'g' },
    carbs: { current: 210, target: 250, unit: 'g' },
    fats: { current: 55, target: 70, unit: 'g' }
  },
  micros: [
    { name: 'Vitamin C', percent: 85, formula: 'C₆H₈O₆' },
    { name: 'Magnesium', percent: 60, formula: 'Mg' },
    { name: 'Iron', percent: 45, formula: 'Fe' },
    { name: 'Calcium', percent: 90, formula: 'Ca' },
    { name: 'Zinc', percent: 30, formula: 'Zn' }
  ],
  sleep: {
    duration: '7h 12m',
    score: 85,
    hrv: '42ms',
    stress: 'Low'
  },
  doctors: [
    { id: 1, name: 'Dr. Sarah Chen', spec: 'Cardiologist', dist: '1.2 mi', rating: 4.9 },
    { id: 2, name: 'Dr. Mike Ross', spec: 'Sports Med', dist: '3.4 mi', rating: 4.8 }
  ],
  recipes: [
    { id: 1, name: 'Quinoa Power Bowl', cals: 450, time: '15m', type: 'Recipe', ingredients: ['Quinoa', 'Kale', 'Chickpeas', 'Lemon Tahini'] },
    { id: 2, name: 'Grilled Salmon', cals: 520, time: '25m', type: 'Recipe', ingredients: ['Wild Salmon', 'Asparagus', 'Garlic', 'Lemon'] }
  ],
  restaurants: [
    { id: 3, name: 'Green Leaf Cafe', item: 'Avocado Toast', dist: '0.5 mi', type: 'Restaurant' },
    { id: 4, name: 'Fresh & Co', item: 'Lean Turkey Wrap', dist: '0.8 mi', type: 'Restaurant' }
  ],
  activity: {
    week: [40, 65, 45, 90, 75, 55, 80],
    month: [50, 70, 60, 85, 80, 90, 65, 70, 75, 60, 85, 95]
  },
  medical: {
    nextTest: 'Blood Panel',
    date: 'Oct 24',
    daysLeft: 12
  }
};

const GlassCard = ({ children, className = '', onClick, hoverEffect = true }) => (
  <div 
    onClick={onClick}
    className={`
      relative backdrop-blur-xl bg-white/5 border border-white/10 
      rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
      transition-all duration-500 ease-out overflow-hidden
      ${hoverEffect ? 'hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(255,165,0,0.15)] hover:-translate-y-1' : ''}
      ${className}
    `}
  >
    {/* Noise Texture Overlay */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
    </div>
    {children}
  </div>
);

const CircularProgress = ({ value, max, color, size = 120, strokeWidth = 10, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full drop-shadow-[0_0_10px_rgba(255,165,0,0.3)]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col text-white z-10">
        {children}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function NeuralFitApp() {
  const [view, setView] = useState('dashboard'); 
  const [selectedCard, setSelectedCard] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [notification, setNotification] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  
  // New States
  const [weightUnit, setWeightUnit] = useState('lbs'); // lbs | kg
  const [activityRange, setActivityRange] = useState('Week'); // Week | Month
  const [manualLocation, setManualLocation] = useState('');
  const [viewingRecipe, setViewingRecipe] = useState(null); // ID of recipe being viewed

  // --- AI Integration States ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: "Hello! I'm your NeuralFit AI Coach. I can help analyze your health data, suggest workouts, or explain your metrics. What's on your mind?" }
  ]);
  
  // AI Recipe States
  const [recipePrompt, setRecipePrompt] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);

  // --- Notification Handler ---
  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Helper for weight ---
  const getWeightDisplay = () => {
    return weightUnit === 'lbs' ? { val: 182, unit: 'lbs' } : { val: 82.5, unit: 'kg' };
  };

  // --- Gemini API Caller ---
  const callGemini = async (prompt, type = 'chat') => {
    const setLoading = type === 'chat' ? setIsAiLoading : setIsRecipeLoading;
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      
      if (!response.ok) throw new Error('AI Service Busy');
      
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that. Try again?";
      
      if (type === 'chat') {
        setChatHistory(prev => [...prev, { role: 'model', text: resultText }]);
      } else if (type === 'recipe') {
        setGeneratedRecipe(resultText);
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      triggerNotification("AI Service currently unavailable. Try again later.");
      if (type === 'chat') {
          setChatHistory(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the server. Please check your connection." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, newMsg]);
    setChatInput('');
    
    // Contextual prompt for the health coach
    const systemContext = `You are a compassionate and expert AI Health Coach named NeuralFit Coach. 
    The user has the following stats: Weight: 182lbs, Sleep: 7h 12m (Score 85), RHR: 54bpm. 
    Keep answers concise, motivating, and focused on health optimization. 
    User query: ${chatInput}`;

    callGemini(systemContext, 'chat');
  };

  const handleGenerateRecipe = () => {
      if (!recipePrompt.trim()) {
          // Default prompt if empty
          const prompt = `Generate a healthy, high-protein recipe using seasonal ingredients. Format nicely with Ingredients and Instructions.`;
          callGemini(prompt, 'recipe');
          return;
      }
      const prompt = `Generate a healthy recipe based on these ingredients or preferences: "${recipePrompt}". 
      Include caloric estimate and macros if possible. Format clearly.`;
      callGemini(prompt, 'recipe');
  };

  // --- Onboarding Logic (Simplified) ---
  const [onboardingStep, setOnboardingStep] = useState(0);
  const handleOnboardingComplete = () => {
    setView('dashboard');
    triggerNotification("Welcome to NeuralFit. Your plan is ready.");
  };

  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Blob */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

        <div className="max-w-md w-full space-y-8 animate-fadeIn relative z-10">
          <div className="text-center">
            <h1 className="text-6xl font-bold tracking-tighter mb-2 drop-shadow-lg">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Neural</span><span className="text-orange-500">Fit</span>
            </h1>
            <p className="text-neutral-400 tracking-widest uppercase text-xs">AI-Driven Human Optimization</p>
          </div>
          
          <GlassCard className="p-8 space-y-6">
            {onboardingStep === 0 && (
              <div className="space-y-4 animate-slideUp">
                <h2 className="text-2xl font-semibold">Let's calibrate your profile.</h2>
                <p className="text-sm text-neutral-400">We connect with your wearables and analyze your biometrics.</p>
                <button onClick={() => setOnboardingStep(1)} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Continue
                </button>
              </div>
            )}
             {onboardingStep > 0 && (
                <div className="text-center">
                     <h2 className="text-2xl font-semibold mb-4">System Ready</h2>
                     <button onClick={handleOnboardingComplete} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                        Enter Dashboard
                    </button>
                </div>
             )}
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden relative">
      
      {/* --- Ambient Nature Effects --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse duration-[10000ms]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse duration-[8000ms] delay-1000"></div>
      </div>

      {/* --- Header --- */}
      <header className="sticky top-0 z-40 bg-[#050505]/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Neural<span className="text-orange-500">Fit</span></span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSosActive(!sosActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${sosActive ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]' : 'bg-white/5 text-red-500 border border-red-900/30'}`}
            >
              <AlertCircle size={16} />
              {sosActive ? 'SOS ACTIVE' : 'SOS'}
            </button>
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
            </div>
          </div>
        </div>
      </header>

      {/* --- Emergency Overlay --- */}
      {sosActive && (
        <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fadeIn">
          <GlassCard className="max-w-sm w-full text-center border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-white mb-2">Emergency Mode</h2>
            <p className="text-neutral-400 mb-6">Transmitting location and health data...</p>
            <button 
              onClick={() => { setSosActive(false); triggerNotification('SOS Cancelled'); }} 
              className="mt-8 w-full py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 border border-white/10"
            >
              Cancel Alert (3s)
            </button>
          </GlassCard>
        </div>
      )}

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8 relative z-10">
        
        {/* Stats Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Weight Card with Toggle */}
          <GlassCard 
            onClick={() => setWeightUnit(prev => prev === 'lbs' ? 'kg' : 'lbs')}
            className="cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider group-hover:text-green-400 transition-colors">Weight</span>
              <TrendingUp size={16} className="text-green-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white group-hover:translate-x-1 transition-transform">
              {getWeightDisplay().val} <span className="text-sm text-neutral-500">{getWeightDisplay().unit}</span>
            </div>
            <div className="text-xs text-green-400/80 mt-1">-1.2 this week</div>
            <div className="absolute bottom-0 left-0 h-0.5 bg-green-500 w-0 group-hover:w-full transition-all duration-700"></div>
          </GlassCard>

          {/* Sleep Score */}
          <GlassCard className="group overflow-hidden">
             {/* Cloud Animation Layer */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
               <Cloud size={40} className="absolute top-2 left-[-20px] text-purple-300 animate-cloudDrift" />
               <Cloud size={30} className="absolute top-8 right-[-20px] text-purple-300 animate-cloudDrift delay-1000" style={{animationDuration: '15s'}} />
            </div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider group-hover:text-purple-400 transition-colors">Sleep Score</span>
              <Moon size={16} className="text-purple-400 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white relative z-10">85</div>
            <div className="text-xs text-purple-400/80 mt-1 relative z-10">+5% vs avg</div>
          </GlassCard>

          {/* RHR Pulse */}
          <GlassCard className="group cursor-pointer" hoverEffect={false}>
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all"></div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">RHR</span>
              <Heart size={16} className="text-red-400 group-hover:animate-beat" />
            </div>
            <div className="text-2xl font-bold text-white">54 <span className="text-sm text-neutral-500">bpm</span></div>
            <div className="text-xs text-red-400/80 mt-1">Optimal Range</div>
          </GlassCard>

          {/* Lively Streak */}
          <GlassCard className="group overflow-hidden">
             <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-orange-500/20 to-transparent h-0 group-hover:h-full transition-all duration-700 ease-in-out"></div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Streak</span>
              <Award size={16} className="text-orange-400 group-hover:rotate-180 transition-transform duration-500" />
            </div>
            <div className="text-2xl font-bold text-white relative z-10">14 Days</div>
            <div className="text-xs text-orange-400/80 mt-1 relative z-10">Keep it burning!</div>
          </GlassCard>
        </section>

        {/* --- Bento Grid Dashboard --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">
          
          {/* 1. Calorie Intake (Large Card) */}
          <GlassCard 
            onClick={() => setSelectedCard('calories')}
            className="md:col-span-2 cursor-pointer group border-orange-500/10"
          >
             {/* Floating Formulas on Hover */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               {[1,2,3,4].map(i => (
                  <div key={i} className="absolute text-[10px] text-orange-500/30 font-mono opacity-0 group-hover:animate-floatUp"
                       style={{ left: `${20 * i}%`, bottom: '-20px', animationDelay: `${i * 0.2}s` }}>
                     {i % 2 === 0 ? 'C₆H₁₂O₆' : 'ATP'}
                  </div>
               ))}
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-xl font-semibold mb-1 group-hover:text-orange-400 transition-colors">Nutrition</h3>
                <p className="text-sm text-neutral-400">1,840 / 2,500 kcal</p>
                <div className="mt-6 flex gap-4 text-sm">
                  <div className="flex flex-col transition-transform group-hover:-translate-y-1 duration-300">
                     <span className="text-orange-400 font-bold text-lg">{MOCK_DATA.macros.protein.current}g</span>
                     <span className="text-neutral-500 text-xs">Protein</span>
                  </div>
                  <div className="flex flex-col transition-transform group-hover:-translate-y-1 duration-300 delay-75">
                     <span className="text-blue-400 font-bold text-lg">{MOCK_DATA.macros.carbs.current}g</span>
                     <span className="text-neutral-500 text-xs">Carbs</span>
                  </div>
                  <div className="flex flex-col transition-transform group-hover:-translate-y-1 duration-300 delay-150">
                     <span className="text-yellow-400 font-bold text-lg">{MOCK_DATA.macros.fats.current}g</span>
                     <span className="text-neutral-500 text-xs">Fats</span>
                  </div>
                </div>
              </div>
              <CircularProgress value={1840} max={2500} color="text-orange-500" size={100}>
                <span className="text-lg font-bold">73%</span>
              </CircularProgress>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </GlassCard>

          {/* 2. Hydration */}
          <GlassCard 
            onClick={() => setSelectedCard('hydration')}
            className="md:col-span-1 cursor-pointer relative overflow-hidden group border-blue-500/10"
          >
            <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-2 bg-blue-400 h-0 opacity-0 group-hover:animate-pourWater"></div>
            <div className="absolute right-4 top-4 text-blue-400 group-hover:scale-110 transition-transform"><Droplet size={20}/></div>
            <h3 className="text-lg font-semibold mb-4 group-hover:text-blue-400 transition-colors">Hydration</h3>
            <div className="flex items-end justify-center gap-1 h-24 mb-2 relative z-10">
              {[30, 50, 70, 40, 90, 60, 80].map((h, i) => (
                <div key={i} className="w-2 bg-white/5 rounded-t-full relative h-full overflow-hidden">
                  <div 
                    style={{ height: `${h}%` }} 
                    className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-full transition-all duration-500 group-hover:bg-blue-400"
                  >
                     <div className="absolute top-0 left-0 w-full h-1 bg-white/30"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center relative z-10">
              <span className="text-2xl font-bold">1.2L</span> <span className="text-neutral-500 text-sm">/ 2.5L</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-blue-600/20 to-transparent opacity-50 pointer-events-none"></div>
          </GlassCard>

          {/* 3. Sleep & Stress */}
          <GlassCard className="md:col-span-1 row-span-2 flex flex-col justify-between relative overflow-hidden border-purple-500/10">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold group-hover:text-purple-400 transition-colors">Recovery</h3>
                 <Moon size={20} className="text-purple-400" />
              </div>
              <div className="space-y-6">
                <div className="group/item">
                  <p className="text-neutral-400 text-xs mb-1">Sleep Duration</p>
                  <p className="text-2xl font-bold text-white group-hover/item:translate-x-2 transition-transform">{MOCK_DATA.sleep.duration}</p>
                </div>
                <div className="group/item">
                   <p className="text-neutral-400 text-xs mb-1">HRV Status</p>
                   <p className="text-xl font-semibold text-green-400 group-hover/item:translate-x-2 transition-transform">{MOCK_DATA.sleep.hrv} <span className="text-neutral-500 text-xs font-normal">(Normal)</span></p>
                </div>
                <div>
                   <p className="text-neutral-400 text-xs mb-1">Stress Load</p>
                   <div className="w-full bg-white/5 h-2 rounded-full mt-1 overflow-hidden">
                      <div className="bg-green-500 w-[30%] h-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                   </div>
                   <p className="text-right text-xs text-green-400 mt-1">Low</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-900/10 rounded-xl border border-purple-500/20 backdrop-blur-md relative z-10">
              <p className="text-xs text-purple-200">💡 Tip: Wind down mode active.</p>
            </div>
            <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-purple-600/20 rounded-full blur-3xl"></div>
          </GlassCard>

          {/* 4. AI Meal Planner */}
          <GlassCard 
            onClick={() => setSelectedCard('meal-planner')}
            className="md:col-span-1 cursor-pointer relative group bg-gradient-to-br from-white/10 to-white/5 text-white"
          >
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-lg group-hover:text-green-400 transition-colors">Next Meal</h3>
               <Utensils size={20} className="group-hover:rotate-12 transition-transform" />
            </div>
            <div className="mt-4 group-hover:translate-x-1 transition-transform duration-300">
               <p className="text-xs text-neutral-400 font-bold uppercase">Recommended (12:30 PM)</p>
               <p className="text-xl font-bold mt-1">Quinoa Power Bowl</p>
               <div className="flex gap-2 mt-2 text-xs font-medium">
                  <span className="px-2 py-1 bg-white/10 rounded-md backdrop-blur-sm">450 kcal</span>
                  <span className="px-2 py-1 bg-white/10 rounded-md backdrop-blur-sm">High Protein</span>
               </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
               <span className="text-sm font-medium flex items-center gap-1"><MapPin size={14}/> Find Nearby</span>
               <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                 <ChevronRight size={16} />
               </div>
            </div>
          </GlassCard>

          {/* 5. Activity Trends */}
          <GlassCard className="md:col-span-2 border-orange-500/10">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Activity Trends 
                    <Wind size={16} className="text-neutral-500 animate-pulse"/>
                </h3>
                <div className="flex bg-white/5 rounded-lg p-1">
                    {['Week', 'Month'].map(range => (
                        <button 
                            key={range}
                            onClick={() => setActivityRange(range)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activityRange === range ? 'bg-orange-500 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
             </div>
             <div className="h-32 flex items-end justify-between gap-2 px-2">
                {(activityRange === 'Week' ? MOCK_DATA.activity.week : MOCK_DATA.activity.month).map((h, i) => (
                   <div key={i} className="group relative w-full rounded-t-sm h-full flex items-end">
                      <div 
                        style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }} 
                        className={`
                            w-full rounded-t-lg transition-all duration-700 ease-out animate-growUp
                            ${i === (activityRange === 'Week' ? 3 : 11) ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/10 hover:bg-white/20'}
                        `}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold pointer-events-none z-20">
                           {h * 10} kcal
                        </div>
                      </div>
                   </div>
                ))}
             </div>
          </GlassCard>

           {/* 6. AI Coach (Enhanced Interactive) */}
          <GlassCard 
            onClick={() => setChatOpen(true)}
            className="md:col-span-1 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border-neutral-700 flex flex-col justify-between cursor-pointer hover:border-orange-500/50 group"
          >
             <div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse">
                      <Sparkles size={16} className="text-white" />
                   </div>
                   <h3 className="font-semibold text-white">AI Coach</h3>
                </div>
                <div className="bg-white/5 p-3 rounded-xl rounded-tl-none text-sm text-neutral-300 leading-relaxed border border-white/5">
                   "Your recovery is high today. I've adjusted your plan to include High Intensity Interval Training."
                </div>
             </div>
             <button className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-white/5 group-hover:text-orange-400">
                <MessageSquare size={16} /> Chat Now
             </button>
          </GlassCard>

          {/* 7. Doctor Finder */}
          <GlassCard 
            onClick={() => setSelectedCard('doctors')}
            className="bg-white/5 cursor-pointer flex flex-col justify-between group"
          >
             <h3 className="font-semibold mb-2 flex items-center justify-between group-hover:text-blue-400 transition-colors">
                Find Specialist <Search size={16} />
             </h3>
             <div className="flex-1 flex items-center justify-center my-4">
                <div className="flex -space-x-4 transition-all group-hover:space-x-1">
                   {[1,2,3].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-neutral-700 flex items-center justify-center text-xs shadow-lg transition-all">
                         Dr.
                      </div>
                   ))}
                </div>
             </div>
             <p className="text-center text-xs text-neutral-400">3 Specialists nearby</p>
          </GlassCard>

        </section>
      </main>

      {/* --- Chat Modal (AI Coach) --- */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
           <GlassCard className="w-full max-w-md h-[600px] flex flex-col !p-0 overflow-hidden border-orange-500/20">
              <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                       <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                       <h3 className="font-bold text-white">AI Coach</h3>
                       <p className="text-xs text-orange-400 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
              </div>
              
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          msg.role === 'user' 
                             ? 'bg-orange-600 text-white rounded-br-none' 
                             : 'bg-white/10 text-neutral-200 rounded-bl-none'
                       }`}>
                          {msg.text}
                       </div>
                    </div>
                 ))}
                 {isAiLoading && (
                    <div className="flex justify-start">
                       <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none flex gap-1">
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-150"></span>
                       </div>
                    </div>
                 )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white/5 border-t border-white/5">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about your workouts or diet..." 
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button onClick={handleSendMessage} className="bg-orange-500 p-3 rounded-xl text-white hover:bg-orange-600 transition-colors shadow-lg">
                       <Send size={20} />
                    </button>
                 </div>
              </div>
           </GlassCard>
        </div>
      )}

      {/* --- Notification Toast --- */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-slideUp z-50">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* --- Expanded Views (Liquid Modal) --- */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-[#0f0f0f]/90 w-full max-w-2xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col animate-scaleIn border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
          >
            {/* Decorative Gradients in Modal */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f0f0f] sticky top-0 z-20">
              <h2 className="text-2xl font-bold capitalize bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">{selectedCard.replace('-', ' ')}</h2>
              <button onClick={() => { setSelectedCard(null); setViewingRecipe(null); setGeneratedRecipe(null); }} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar relative z-10">
              
              {/* --- MEAL PLANNER EXPANSION --- */}
              {selectedCard === 'meal-planner' && (
                <div className="space-y-8">
                   
                   {/* AI Chef Section */}
                   <div className="bg-gradient-to-r from-orange-900/20 to-transparent p-6 rounded-3xl border border-orange-500/20">
                      <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
                          <Sparkles size={18} /> AI Chef
                      </h3>
                      <p className="text-xs text-neutral-400 mb-4">Enter ingredients you have, and I'll create a recipe.</p>
                      <div className="flex gap-2 mb-4">
                          <input 
                             type="text" 
                             value={recipePrompt}
                             onChange={(e) => setRecipePrompt(e.target.value)}
                             placeholder="e.g., chicken, broccoli, rice..."
                             className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                          />
                          <button 
                            onClick={handleGenerateRecipe}
                            disabled={isRecipeLoading}
                            className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-orange-500 disabled:opacity-50 flex items-center gap-2"
                          >
                            {isRecipeLoading ? 'Cooking...' : 'Generate ✨'}
                          </button>
                      </div>
                      {generatedRecipe && (
                          <div className="bg-black/40 p-4 rounded-xl text-sm text-neutral-200 whitespace-pre-wrap border border-white/5 animate-fadeIn">
                              {generatedRecipe}
                          </div>
                      )}
                   </div>

                   {/* Standard Meal Planner Logic (Existing) */}
                   <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 focus-within:border-orange-500/50 transition-colors">
                      <div className="p-3 text-orange-500"><MapPin size={20} /></div>
                      <input 
                        type="text" 
                        placeholder="Enter location or 'Current Location'" 
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        className="bg-transparent w-full p-2 focus:outline-none text-sm"
                      />
                      <button 
                        onClick={() => {
                           setLocationStatus('loading');
                           setTimeout(() => setLocationStatus('success'), 1500);
                        }}
                        className="m-1 text-xs bg-neutral-800 text-white px-4 py-2 rounded-xl hover:bg-neutral-700 transition-colors"
                      >
                        {locationStatus === 'loading' ? 'Scanning...' : 'Find'}
                      </button>
                   </div>
                    
                   {/* (Existing Recipe List Logic) */}
                   {viewingRecipe ? (
                      <div className="animate-slideUp bg-white/5 p-6 rounded-3xl border border-white/10">
                         <button onClick={() => setViewingRecipe(null)} className="text-xs text-neutral-400 flex items-center gap-1 mb-4 hover:text-white"><ArrowRight className="rotate-180" size={12}/> Back to list</button>
                         <div className="w-full h-40 bg-neutral-800 rounded-2xl mb-4 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                <h3 className="text-2xl font-bold">{MOCK_DATA.recipes.find(r => r.id === viewingRecipe).name}</h3>
                            </div>
                         </div>
                         <h4 className="font-bold mb-2 text-orange-400">Ingredients</h4>
                         <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1 mb-6">
                            {MOCK_DATA.recipes.find(r => r.id === viewingRecipe).ingredients.map(i => (
                                <li key={i}>{i}</li>
                            ))}
                         </ul>
                         <button className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(22,163,74,0.4)]">Start Cooking Mode</button>
                      </div>
                   ) : (
                      /* List View */
                      locationStatus === 'loading' ? (
                          <div className="py-20 text-center text-neutral-500 flex flex-col items-center gap-4">
                             <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                             <span className="animate-pulse">Scanning local healthy options...</span>
                          </div>
                       ) : (
                          <>
                            <div>
                               <h3 className="font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Cook at Home (Recommended)</h3>
                               <div className="grid gap-4">
                                  {MOCK_DATA.recipes.map(r => (
                                     <GlassCard key={r.id} className="flex justify-between items-center p-4 !bg-white/5 hover:!bg-white/10 !border-white/5 !shadow-none">
                                        <div>
                                           <p className="font-bold text-white">{r.name}</p>
                                           <p className="text-xs text-neutral-400 flex items-center gap-2 mt-1"><Utensils size={10}/> {r.cals} kcal • {r.time}</p>
                                        </div>
                                        <button 
                                            onClick={() => setViewingRecipe(r.id)}
                                            className="bg-white/10 text-white px-4 py-2 rounded-xl text-xs border border-white/10 hover:bg-white/20 transition-colors"
                                        >
                                            View Recipe
                                        </button>
                                     </GlassCard>
                                  ))}
                               </div>
                            </div>
                            
                            {/* Restaurants */}
                            <div className="pt-4 border-t border-white/5">
                               <h3 className="font-bold mb-4 text-orange-400">Nearby Orders</h3>
                               <div className="grid gap-4">
                                  {MOCK_DATA.restaurants.map(r => (
                                     <GlassCard key={r.id} className="flex justify-between items-center p-4 !bg-white/5 hover:!bg-white/10 !border-white/5 !shadow-none">
                                        <div>
                                           <p className="font-bold text-white">{r.name}</p>
                                           <p className="text-xs text-neutral-400">{r.item} • {r.dist}</p>
                                        </div>
                                        <button className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-orange-500">Order</button>
                                     </GlassCard>
                                  ))}
                               </div>
                            </div>
                          </>
                       )
                   )}
                </div>
              )}

              {/* --- CALORIES EXPANSION --- */}
              {selectedCard === 'calories' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                        <h3 className="font-semibold mb-4 text-orange-500 flex items-center gap-2"><Zap size={18}/> AI Nutrient Analysis</h3>
                        <p className="text-sm text-neutral-300 leading-relaxed">
                          Your protein intake is optimal for muscle repair. Try increasing complex carbs around your workout window for sustained energy.
                        </p>
                      </div>
                      <div className="space-y-4">
                         <h3 className="font-semibold">Micronutrients</h3>
                         {MOCK_DATA.micros.map((m) => (
                            <div key={m.name} className="group">
                               <div className="flex justify-between text-xs mb-2">
                                  <span className="flex items-center gap-2">
                                    {m.name} 
                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-orange-400 font-mono transition-opacity bg-white/10 px-1 rounded">{m.formula}</span>
                                  </span>
                                  <span>{m.percent}%</span>
                               </div>
                               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${m.percent}%` }} 
                                    className={`h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] ${m.percent > 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-orange-500 to-yellow-500'}`}
                                  ></div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {/* ... Other modals (Hydration, Doctors) kept simple for brevity but use same glass style ... */}
              {selectedCard === 'hydration' && (
                 <div className="text-center space-y-8 py-8">
                    <div className="relative w-40 h-40 mx-auto">
                        <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                        <div className="relative bg-blue-500/20 w-full h-full rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-400/30">
                            <Droplet size={64} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                        </div>
                    </div>
                    <div>
                       <h3 className="text-3xl font-bold text-white">2,500ml Target</h3>
                       <p className="text-blue-400">Optimal hydration level achieved.</p>
                    </div>
                    <button 
                        onClick={() => triggerNotification("Drink reminder set for 1 hour")}
                        className="px-8 py-3 bg-blue-600 rounded-full font-bold shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:scale-105 transition-transform"
                    >
                        Set Reminder
                    </button>
                 </div>
              )}

              {selectedCard === 'doctors' && (
                 <div className="space-y-4">
                    <input type="text" placeholder="Search by specialty or name..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
                    {MOCK_DATA.doctors.map(d => (
                       <GlassCard key={d.id} className="flex items-center gap-4 p-4 !bg-white/5 !shadow-none hover:!bg-white/10 !border-white/5">
                          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-neutral-400">Dr</div>
                          <div className="flex-1">
                             <h4 className="font-bold text-white">{d.name}</h4>
                             <p className="text-xs text-neutral-400">{d.spec} • {d.dist}</p>
                          </div>
                          <button className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-200">Book</button>
                       </GlassCard>
                    ))}
                 </div>
              )}

            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pourWater { 0% { height: 0; opacity: 1; } 50% { height: 100%; opacity: 1; } 100% { height: 100%; opacity: 0; } }
        @keyframes floatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-30px); opacity: 0; } }
        @keyframes cloudDrift { 0% { transform: translateX(0); opacity: 0.5; } 50% { transform: translateX(20px); opacity: 0.8; } 100% { transform: translateX(0); opacity: 0.5; } }
        @keyframes beat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes growUp { from { height: 0; } to { height: var(--target-height); } }

        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pourWater { animation: pourWater 1.5s infinite; }
        .animate-floatUp { animation: floatUp 3s infinite linear; }
        .animate-cloudDrift { animation: cloudDrift 10s infinite ease-in-out; }
        .animate-beat { animation: beat 1s infinite cubic-bezier(0.4, 0, 0.6, 1); }
        .animate-growUp { animation: growUp 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
