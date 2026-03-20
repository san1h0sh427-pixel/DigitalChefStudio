/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  X, 
  Zap, 
  Moon, 
  Flame, 
  Leaf, 
  CloudRain, 
  ChefHat,
  CheckCircle2,
  ArrowRight,
  Timer,
  Users,
  Dumbbell,
  Thermometer,
  RotateCcw,
  UtensilsCrossed,
  MessageCircle,
  Sparkles,
  Info,
  HelpCircle
} from 'lucide-react';
import { generateRecipe, generateCharacterDialogue, CHARACTERS, type Recipe, type Character } from './services/geminiService';

type Step = 'landing' | 'mood' | 'ingredients' | 'generating' | 'recipe' | 'cooking' | 'final';

const MOODS = [
  { id: 'Energetic', label: 'Energetic', emoji: '⚡', icon: Zap, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'Lazy', label: 'Lazy', emoji: '😴', icon: Moon, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'Hungry', label: 'Hungry', emoji: '🍗', icon: Flame, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'Healthy', label: 'Healthy', emoji: '🥗', icon: Leaf, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Stressed', label: 'Stressed', emoji: '😓', icon: CloudRain, color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

const SUGGESTIONS = [
  'Chicken Breast', 'Eggs', 'Tofu', 'Paneer', 'Greek Yogurt', 
  'Lentils', 'Chickpeas', 'Black Beans', 'Protein Powder', 
  'Salmon', 'Tuna', 'Quinoa', 'Cottage Cheese', 'Turkey', 
  'Beef', 'Tempeh', 'Edamame', 'Peanut Butter', 'Almonds'
];

const MOOD_CONFIG: Record<string, { 
  colors: string[]; 
  banner: string; 
  particles: string[];
  particleCount: number;
  speed: number;
}> = {
  Energetic: {
    colors: ['#f97316', '#ef4444', '#eab308'],
    banner: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    particles: ['⚡', '🔥', '✨'],
    particleCount: 15,
    speed: 2
  },
  Lazy: {
    colors: ['#bfdbfe', '#ddd6fe', '#f3f4f6'],
    banner: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=1200',
    particles: ['☁️', '💤', '✨'],
    particleCount: 8,
    speed: 0.5
  },
  Hungry: {
    colors: ['#fcd34d', '#b45309', '#991b1b'],
    banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
    particles: ['🍗', '🍔', '🍕', '🍳'],
    particleCount: 12,
    speed: 1
  },
  Healthy: {
    colors: ['#dcfce7', '#10b981', '#065f46'],
    banner: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1200',
    particles: ['🥗', '🥑', '🥦', '🍃'],
    particleCount: 10,
    speed: 0.8
  },
  Stressed: {
    colors: ['#1e3a8a', '#581c87', '#0f172a'],
    banner: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200',
    particles: ['🌊', '✨', '🌙'],
    particleCount: 6,
    speed: 0.3
  }
};

const MoodBackground = ({ mood }: { mood: string | null }) => {
  if (!mood || !MOOD_CONFIG[mood]) return null;
  const config = MOOD_CONFIG[mood];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div 
        className="absolute inset-0 opacity-20"
        animate={{
          background: `linear-gradient(45deg, ${config.colors.join(', ')})`,
        }}
        transition={{ duration: 1 }}
      />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]" />
      
      {Array.from({ length: config.particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl select-none"
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            x: [
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%'
            ],
            y: [
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%', 
              Math.random() * 100 + '%'
            ],
            opacity: [0.1, 0.3, 0.1],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: (10 + Math.random() * 20) / config.speed, 
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {config.particles[Math.floor(Math.random() * config.particles.length)]}
        </motion.div>
      ))}
    </div>
  );
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [cookingStep, setCookingStep] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterDialogue, setCharacterDialogue] = useState<string>("");
  const [isDialogueLoading, setIsDialogueLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Handle PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Handle character selection when mood changes
  useEffect(() => {
    if (selectedMood) {
      const moodCharacters = CHARACTERS[selectedMood];
      const randomChar = moodCharacters[Math.floor(Math.random() * moodCharacters.length)];
      setSelectedCharacter(randomChar);
    } else {
      setSelectedCharacter(null);
      setCharacterDialogue("");
    }
  }, [selectedMood]);

  // Generate initial dialogue when character is selected
  useEffect(() => {
    if (selectedCharacter && selectedMood && currentStep === 'ingredients') {
      updateDialogue({ mood: selectedMood, isGenerating: false });
    }
  }, [selectedCharacter]);

  const updateDialogue = async (context: any) => {
    if (!selectedCharacter || !selectedMood) return;
    setIsDialogueLoading(true);
    const dialogue = await generateCharacterDialogue(selectedCharacter, {
      mood: selectedMood,
      ...context
    });
    setCharacterDialogue(dialogue);
    setIsDialogueLoading(false);
  };

  // Handle autocomplete
  useEffect(() => {
    if (inputValue.trim().length > 0) {
      const filtered = SUGGESTIONS.filter(s => 
        s.toLowerCase().includes(inputValue.toLowerCase()) && 
        !ingredients.includes(s)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, ingredients]);

  const addIngredient = (item: string) => {
    if (item && !ingredients.includes(item)) {
      setIngredients([...ingredients, item]);
      setInputValue('');
      setSuggestions([]);
    }
  };

  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter(i => i !== item));
  };

  const handleStartCooking = async () => {
    setCurrentStep('generating');
    if (selectedMood) {
      // Character reacts to generation
      updateDialogue({ isGenerating: true });

      const generatedRecipe = await generateRecipe(selectedMood, ingredients);
      setRecipe(generatedRecipe);
      setCurrentStep('recipe');

      // Character reacts to recipe ready
      updateDialogue({ 
        instruction: `I found a perfect ${generatedRecipe.name} for you!`,
        isGenerating: false 
      });
    }
  };

  const startCooking = () => {
    setCookingStep(0);
    setCurrentStep('cooking');
    updateDialogue({ 
      step: 0, 
      totalSteps: recipe?.steps.length,
      instruction: recipe?.steps[0].instruction
    });
  };

  const nextCookingStep = () => {
    if (recipe && cookingStep < recipe.steps.length - 1) {
      const nextStep = cookingStep + 1;
      setCookingStep(nextStep);
      updateDialogue({ 
        step: nextStep, 
        totalSteps: recipe.steps.length,
        instruction: recipe.steps[nextStep].instruction
      });
    } else {
      setCurrentStep('final');
      updateDialogue({ isFinished: true });
    }
  };

  const prevCookingStep = () => {
    if (cookingStep > 0) {
      const prevStep = cookingStep - 1;
      setCookingStep(prevStep);
      updateDialogue({ 
        step: prevStep, 
        totalSteps: recipe?.steps.length,
        instruction: recipe?.steps[prevStep].instruction
      });
    }
  };

  const handleQuickReply = (reply: string) => {
    updateDialogue({
      step: cookingStep,
      totalSteps: recipe?.steps.length,
      instruction: recipe?.steps[cookingStep].instruction,
      userReply: reply
    });
  };

  const resetApp = () => {
    setCurrentStep('landing');
    setSelectedMood(null);
    setIngredients([]);
    setRecipe(null);
    setCookingStep(0);
    setSelectedCharacter(null);
    setCharacterDialogue("");
  };

  const renderProgressBar = () => {
    const steps: Step[] = ['mood', 'ingredients', 'recipe', 'cooking'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex === -1 && currentStep !== 'generating') return null;
    
    const progress = currentStep === 'generating' ? 2.5 : currentIndex + 1;

    return (
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-100 z-50">
        <motion.div 
          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${(progress / steps.length) * 100}%` }}
        />
      </div>
    );
  };

  const getMoodBanner = (mood: string | null) => {
    if (!mood || !MOOD_CONFIG[mood]) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200';
    return MOOD_CONFIG[mood].banner;
  };

  const renderCharacterCompanion = () => {
    if (!selectedCharacter) return null;

    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-[300px] pointer-events-none">
        <AnimatePresence mode="wait">
          {characterDialogue && (
            <motion.div
              key={characterDialogue}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 relative pointer-events-auto"
            >
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-slate-100 rotate-45" />
              {isDialogueLoading ? (
                <div className="flex gap-1 py-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  {characterDialogue}
                </p>
              )}
              
              {currentStep === 'cooking' && !isDialogueLoading && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-50">
                  <button 
                    onClick={() => handleQuickReply("Got it")}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-50 text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                    Got it
                  </button>
                  <button 
                    onClick={() => handleQuickReply("Explain more")}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-50 text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Explain more
                  </button>
                  <button 
                    onClick={() => handleQuickReply("I'm confused")}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-50 text-slate-500 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    I'm confused
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ 
            y: [0, -5, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-20 h-20 bg-white rounded-full shadow-2xl border-4 border-white flex items-center justify-center text-5xl pointer-events-auto cursor-help group relative"
        >
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500" />
          {selectedCharacter.emoji}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-emerald-100 relative">
      <MoodBackground mood={selectedMood} />
      {renderProgressBar()}
      {renderCharacterCompanion()}
      
      <main className="max-w-xl mx-auto px-6 py-12 md:py-16">
        <AnimatePresence mode="wait">
          {currentStep === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-10 py-12"
            >
              <div className="relative inline-block">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white shadow-xl shadow-emerald-100 border border-slate-50 mb-4"
                >
                  <ChefHat className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <motion.div 
                  className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow-md border border-slate-50"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                </motion.div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight text-slate-900">ProteinChef AI</h1>
                <p className="text-xl text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Smart High-Protein Recipes Based on Your Mood & Ingredients 🍳
                </p>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setCurrentStep('mood')}
                  className="w-full py-5 px-8 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  Start Cooking
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="w-full py-4 px-8 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold text-md shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    Install App for Offline Access
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 'mood' && (
            <motion.div 
              key="mood"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <h2 className="text-3xl font-black">How are you feeling today? 💭</h2>
                <p className="text-slate-500 text-lg">We'll tailor the recipe complexity to your mood.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {MOODS.map((mood) => {
                  const Icon = mood.icon;
                  const isSelected = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex items-center gap-5 p-6 rounded-3xl border-2 transition-all text-left group ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 ring-8 ring-emerald-50/30' 
                          : 'border-white bg-white hover:border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${mood.color}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-xl block">{mood.label}</span>
                        <span className="text-sm text-slate-400">Perfect for your vibe</span>
                      </div>
                      <span className="text-3xl">{mood.emoji}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                disabled={!selectedMood}
                onClick={() => setCurrentStep('ingredients')}
                className="w-full py-5 px-8 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Done
              </button>
            </motion.div>
          )}

          {currentStep === 'ingredients' && (
            <motion.div 
              key="ingredients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <h2 className="text-3xl font-black">What ingredients do you have? 🛒</h2>
                <p className="text-slate-500 text-lg">Add at least one high-protein source.</p>
              </div>

              <div className="space-y-5">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputValue) {
                        addIngredient(inputValue);
                      }
                    }}
                    placeholder="Type an ingredient (e.g. Chicken)..."
                    className="w-full p-5 pr-14 bg-white border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm transition-all text-lg"
                  />
                  <button 
                    onClick={() => addIngredient(inputValue)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>

                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-20 w-full mt-3 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden"
                    >
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => addIngredient(s)}
                          className="w-full px-6 py-4 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 font-medium flex items-center justify-between group"
                        >
                          {s}
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <AnimatePresence>
                    {ingredients.map((item) => (
                      <motion.span
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        key={item}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-2xl text-sm font-bold border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors"
                      >
                        {item}
                        <button onClick={() => removeIngredient(item)} className="p-0.5 hover:bg-slate-100 rounded-md transition-colors">
                          <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentStep('mood')}
                  className="p-5 bg-white border border-slate-200 rounded-3xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-7 h-7 text-slate-600" />
                </button>
                <button 
                  disabled={ingredients.length === 0}
                  onClick={handleStartCooking}
                  className="flex-1 py-5 px-8 bg-slate-900 text-white rounded-3xl font-bold text-lg shadow-xl disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'generating' && (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 space-y-8 text-center"
            >
              <div className="relative">
                <motion.div 
                  className="w-28 h-28 border-4 border-emerald-100 rounded-[2.5rem]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute top-0 left-0 w-28 h-28 border-4 border-emerald-500 border-t-transparent rounded-[2.5rem]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <ChefHat className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-emerald-500" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black">Crafting your high-protein meal... 👨‍🍳</h2>
                <p className="text-slate-500 text-lg italic max-w-xs mx-auto">"Great recipes are like great muscles—they take a little time to build."</p>
              </div>
            </motion.div>
          )}

          {currentStep === 'recipe' && recipe && (
            <motion.div 
              key="recipe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100">
                <div className="relative h-72 w-full overflow-hidden">
                  <motion.img 
                    key={selectedMood}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    src={getMoodBanner(selectedMood)} 
                    alt={selectedMood || 'Recipe'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                        {recipe.proteinContent} Protein
                      </span>
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
                        {recipe.totalTime}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-white leading-tight">
                      {recipe.emoji} {recipe.name}
                    </h2>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col items-center gap-1 px-4 border-r border-slate-200 flex-1">
                      <Timer className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
                      <span className="text-sm font-bold">{recipe.totalTime}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-4 border-r border-slate-200 flex-1">
                      <Dumbbell className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protein</span>
                      <span className="text-sm font-bold">{recipe.proteinContent}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-4 flex-1">
                      <Users className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serves</span>
                      <span className="text-sm font-bold">{recipe.servingSize}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-lg italic">
                    "{recipe.description}"
                  </p>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-black text-xl flex items-center gap-2">
                        ✅ Ingredients You Have
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {recipe.ingredients.filter(i => i.isOwned).map((ing, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              <span className="font-bold text-slate-800">{ing.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-emerald-600 bg-white px-3 py-1 rounded-xl border border-emerald-100 shadow-sm">
                                {ing.quantity}
                              </span>
                              <span className="text-xs font-bold text-slate-400 uppercase">
                                {ing.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {recipe.ingredients.some(i => i.isOptional) && (
                      <div className="space-y-4">
                        <h3 className="font-black text-xl flex items-center gap-2">
                          ➕ Recommended Add-Ons (Optional)
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5">
                          {recipe.ingredients.filter(i => i.isOptional).map((ing, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                              <div className="flex items-center gap-3">
                                <Plus className="w-4 h-4 text-slate-300" />
                                <span className="font-medium text-slate-500">{ing.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">
                                  {ing.quantity} {ing.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentStep('ingredients')}
                  className="p-5 bg-white border border-slate-200 rounded-[2rem] hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-7 h-7 text-slate-600" />
                </button>
                <button 
                  onClick={startCooking}
                  className="flex-1 py-5 px-8 bg-emerald-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  Start Cooking
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'cooking' && recipe && (
            <motion.div 
              key="cooking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-50 px-3 py-1 rounded-full">
                    Step {cookingStep + 1} of {recipe.steps.length}
                  </span>
                </div>
                <div className="flex gap-1.5 justify-center">
                  {recipe.steps.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        idx <= cookingStep ? 'w-10 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'w-4 bg-slate-200'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-50" />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cookingStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-center gap-4">
                      {recipe.steps[cookingStep].time && recipe.steps[cookingStep].time.toLowerCase() !== 'none' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-lg">
                          <Timer className="w-4 h-4 text-emerald-400" />
                          {recipe.steps[cookingStep].time}
                        </div>
                      )}
                      {recipe.steps[cookingStep].intensity && recipe.steps[cookingStep].intensity.toLowerCase() !== 'none' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-2xl text-sm font-bold border border-orange-100">
                          <Thermometer className="w-4 h-4" />
                          {recipe.steps[cookingStep].intensity}
                        </div>
                      )}
                    </div>

                    <p className="text-3xl md:text-4xl font-bold leading-tight text-slate-800">
                      {recipe.steps[cookingStep].instruction}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex gap-4">
                {cookingStep > 0 && (
                  <button 
                    onClick={prevCookingStep}
                    className="p-6 bg-white border border-slate-200 rounded-[2rem] hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-7 h-7 text-slate-600" />
                  </button>
                )}
                <button 
                  onClick={nextCookingStep}
                  className="flex-1 py-6 px-8 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {cookingStep === recipe.steps.length - 1 ? 'Finish Meal' : 'Done'}
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'final' && (
            <motion.div 
              key="final"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12 py-12"
            >
              <div className="relative inline-block">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200"
                >
                  <CheckCircle2 className="w-16 h-16 text-white" />
                </motion.div>
                <motion.div 
                  className="absolute -top-4 -right-4 text-5xl"
                  animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {recipe?.emoji || '🍽️'}
                </motion.div>
              </div>

              <div className="space-y-6">
                <h2 className="text-5xl font-black text-slate-900 leading-tight">
                  Congratulations!<br />Your meal is ready!
                </h2>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm inline-block">
                  <p className="text-2xl text-slate-600 font-bold flex flex-col items-center justify-center gap-3">
                    <span>You just made a high-protein meal! 🎉</span>
                    <span className="text-emerald-500">Keep it up! 💪🔥</span>
                  </p>
                </div>
              </div>

              <div className="pt-8 flex flex-col gap-4">
                <button 
                  onClick={resetApp}
                  className="w-full py-6 px-8 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <RotateCcw className="w-6 h-6" />
                  Generate Another Recipe
                </button>
                <button 
                  onClick={() => setCurrentStep('landing')}
                  className="w-full py-4 px-8 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-8 left-0 w-full text-center pointer-events-none opacity-30">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          ProteinChef AI • Premium Assistant
        </p>
      </footer>
    </div>
  );
}
