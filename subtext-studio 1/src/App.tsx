import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  PenTool, 
  Layers, 
  Eye, 
  EyeOff, 
  Loader2, 
  MessageSquare,
  RefreshCw,
  PlusCircle,
  Trash2,
  Settings2,
  UserPlus,
  Wand2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  History
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  generateNextDialogue, 
  rewriteLine, 
  getFeedback, 
  type Character, 
  type SceneConfig, 
  type DialogueLine, 
  type LineFeedback 
} from './services/gemini';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  
  // Scene Configuration
  const [scene, setScene] = useState<SceneConfig>({
    setting: 'A dimly lit jazz club in 1940s Chicago. Smoke hangs heavy in the air.',
    mood: 'Tense, Noir, Suspicious',
    intensity: 7
  });

  // Characters
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: 'Detective Miller', personality: 'Cynical, tired, observant', relationship: 'Investigating the club owner' },
    { id: '2', name: 'Elena', personality: 'Mysterious, guarded, manipulative', relationship: 'Club singer with a secret' }
  ]);

  // Script
  const [script, setScript] = useState<DialogueLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<LineFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const addCharacter = () => {
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Character',
      personality: 'Describe personality...',
      relationship: 'Describe relationship...'
    };
    setCharacters([...characters, newChar]);
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const nextLines = await generateNextDialogue(scene, characters, script);
      setScript([...script, ...nextLines]);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async (line: DialogueLine, instruction: string) => {
    setLoading(true);
    try {
      const updatedLine = await rewriteLine(line, instruction, scene, characters);
      setScript(script.map(l => l.id === line.id ? updatedLine : l));
    } catch (error) {
      console.error("Rewrite failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetFeedback = async (line: DialogueLine) => {
    setSelectedLineId(line.id);
    setFeedbackLoading(true);
    setFeedback(null);
    try {
      const result = await getFeedback(line, scene, script.filter(l => script.indexOf(l) < script.indexOf(line)));
      setFeedback(result);
    } catch (error) {
      console.error("Feedback failed:", error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const clearScript = () => {
    if (confirm("Clear the entire script?")) {
      setScript([]);
      setSelectedLineId(null);
      setFeedback(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-paper">
      {/* Sidebar - Studio Controls */}
      <aside className="w-full md:w-96 bg-ink text-paper p-6 flex flex-col gap-8 border-r border-ink/20 overflow-y-auto h-screen sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-subtext rounded-lg flex items-center justify-center">
            <Layers className="text-paper" size={24} />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl tracking-tight">Subtext Studio</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Advanced Dialogue Architect</p>
          </div>
        </div>

        {/* Scene Builder */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-widest opacity-50 font-mono font-bold flex items-center gap-2">
              <Settings2 size={14} /> Scene Builder
            </h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] opacity-40 uppercase font-bold">Setting</label>
              <textarea 
                value={scene.setting}
                onChange={(e) => setScene({ ...scene, setting: e.target.value })}
                className="w-full bg-paper/5 border border-paper/10 rounded-lg p-2 text-xs focus:outline-none focus:border-subtext min-h-[60px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] opacity-40 uppercase font-bold">Mood</label>
                <input 
                  value={scene.mood}
                  onChange={(e) => setScene({ ...scene, mood: e.target.value })}
                  className="w-full bg-paper/5 border border-paper/10 rounded-lg p-2 text-xs focus:outline-none focus:border-subtext"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] opacity-40 uppercase font-bold">Intensity: {scene.intensity}</label>
                <input 
                  type="range" min="1" max="10"
                  value={scene.intensity}
                  onChange={(e) => setScene({ ...scene, intensity: parseInt(e.target.value) })}
                  className="w-full accent-subtext"
                />
                <p className="text-[8px] opacity-30 italic">Controls emotional volatility and stakes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Character Profiles */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-widest opacity-50 font-mono font-bold flex items-center gap-2">
              <UserPlus size={14} /> Characters
            </h2>
            <button onClick={addCharacter} className="text-subtext hover:text-subtext/80 transition-colors">
              <PlusCircle size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {characters.map((char) => (
              <div key={char.id} className="p-3 bg-paper/5 rounded-lg border border-paper/10 space-y-2 relative group">
                <button 
                  onClick={() => removeCharacter(char.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-red-400"
                >
                  <Trash2 size={12} />
                </button>
                <input 
                  value={char.name}
                  onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                  className="bg-transparent border-none p-0 font-bold text-sm focus:ring-0 w-full"
                  placeholder="Name"
                />
                <textarea 
                  value={char.personality}
                  onChange={(e) => updateCharacter(char.id, 'personality', e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-[10px] opacity-60 focus:ring-0 resize-none h-8"
                  placeholder="Personality..."
                />
                <textarea 
                  value={char.relationship}
                  onChange={(e) => updateCharacter(char.id, 'relationship', e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-[10px] opacity-60 italic focus:ring-0 resize-none h-8"
                  placeholder="Relationship..."
                />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-auto pt-6 border-t border-paper/10 flex flex-col gap-3">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-subtext hover:bg-subtext/90 text-paper font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Continue Scene
          </button>
          <button 
            onClick={clearScript}
            className="w-full border border-paper/20 hover:bg-paper/5 text-paper/60 text-[10px] uppercase tracking-widest font-bold py-2 rounded-lg transition-all"
          >
            Reset Studio
          </button>
        </div>
      </aside>

      {/* Main Script Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <header className="flex items-center justify-between border-b border-ink/10 pb-6">
            <div>
              <h2 className="font-serif text-3xl italic">The Script</h2>
              <p className="text-xs text-ink/40 font-mono mt-1 uppercase tracking-widest">Multi-Layered Dialogue</p>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  const text = script.map(l => `${l.characterName}: ${l.text}`).join('\n');
                  navigator.clipboard.writeText(text);
                  alert("Script copied to clipboard!");
                }}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-subtext transition-colors"
              >
                Copy Script
              </button>
              <button 
                onClick={() => setShowLayers(!showLayers)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-subtext transition-colors"
              >
                {showLayers ? <EyeOff size={14} /> : <Eye size={14} />}
                {showLayers ? 'Hide Layers' : 'Show Layers'}
              </button>
            </div>
          </header>

          <div className="space-y-12 pb-32">
            {script.length > 0 ? (
              script.map((line, idx) => (
                <div key={line.id} className="group relative">
                  {/* Line Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-ink/30">{line.characterName}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-ink/5 rounded text-[9px] font-bold uppercase text-ink/40 tracking-tighter">
                          {line.emotion}
                        </span>
                      </div>
                    </div>
                    
                    {/* Line Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleGetFeedback(line)}
                        className="p-1.5 hover:bg-ink/5 rounded-full text-ink/40 hover:text-subtext transition-all"
                        title="Analyze & Feedback"
                      >
                        <Lightbulb size={14} />
                      </button>
                      <div className="h-4 w-px bg-ink/10 mx-1" />
                      <button 
                        onClick={() => handleRewrite(line, "Make it more tense and subtle")}
                        className="p-1.5 hover:bg-ink/5 rounded-full text-ink/40 hover:text-subtext transition-all"
                        title="Rewrite: Subtle Tension"
                      >
                        <Wand2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleRewrite(line, "Add more emotional vulnerability")}
                        className="p-1.5 hover:bg-ink/5 rounded-full text-ink/40 hover:text-subtext transition-all"
                        title="Rewrite: Vulnerable"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button 
                        onClick={() => setScript(script.filter(l => l.id !== line.id))}
                        className="p-1.5 hover:bg-ink/5 rounded-full text-ink/40 hover:text-red-400 transition-all"
                        title="Delete Line"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Custom Rewrite Input */}
                  <div className="mb-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input 
                      type="text"
                      placeholder="Custom rewrite instruction..."
                      className="flex-1 bg-ink/5 border-none rounded-full px-4 py-1 text-[10px] focus:ring-1 focus:ring-subtext/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRewrite(line, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>

                  {/* The Dialogue */}
                  <div className={cn(
                    "relative p-4 rounded-xl transition-all border border-transparent",
                    selectedLineId === line.id ? "bg-subtext/5 border-subtext/20" : "hover:bg-ink/5"
                  )}>
                    <textarea
                      value={line.text}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                      onChange={(e) => {
                        setScript(script.map(l => l.id === line.id ? { ...l, text: e.target.value } : l));
                      }}
                      className="w-full bg-transparent border-none p-0 font-serif text-2xl leading-relaxed text-ink/90 focus:ring-0 resize-none overflow-hidden"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />

                    <AnimatePresence>
                      {showLayers && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-ink/5"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-widest font-bold text-subtext opacity-60">Subtext</span>
                            <p className="text-xs italic text-subtext leading-relaxed">{line.subtext}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-widest font-bold text-ink/30">Hidden Intent</span>
                            <p className="text-xs text-ink/60 leading-relaxed">{line.intent}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Feedback Panel (if selected) */}
                  <AnimatePresence>
                    {selectedLineId === line.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-6 bg-paper border border-subtext/20 rounded-xl shadow-xl shadow-ink/5 space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-subtext">AI Feedback & Alternatives</h4>
                          <button onClick={() => setSelectedLineId(null)} className="text-ink/20 hover:text-ink transition-colors">
                            <ChevronUp size={16} />
                          </button>
                        </div>

                        {feedbackLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-subtext" size={24} />
                          </div>
                        ) : feedback && (
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <p className="text-xs text-ink/60 italic leading-relaxed">"{feedback.critique}"</p>
                              <div className="flex flex-wrap gap-2">
                                {feedback.suggestions.map((s, i) => (
                                  <span key={i} className="px-2 py-1 bg-ink/5 rounded text-[10px] text-ink/60">{s}</span>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <span className="text-[9px] uppercase font-bold opacity-40">Alternative Variations</span>
                              <div className="grid grid-cols-1 gap-3">
                                {feedback.alternatives.map((alt, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => {
                                      setScript(script.map(l => l.id === line.id ? { ...l, text: alt.text } : l));
                                      setSelectedLineId(null);
                                    }}
                                    className="text-left p-3 rounded-lg border border-ink/5 hover:border-subtext/30 hover:bg-subtext/5 transition-all group"
                                  >
                                    <p className="text-sm font-serif group-hover:text-subtext transition-colors">"{alt.text}"</p>
                                    <p className="text-[9px] opacity-40 mt-1 uppercase tracking-tighter">{alt.description}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-ink/10 border-2 border-dashed border-ink/5 rounded-3xl">
                <MessageSquare size={64} strokeWidth={1} />
                <p className="mt-6 font-serif italic text-xl text-center max-w-xs">
                  The stage is set. Use the sidebar to generate the opening lines.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-50">
        <div className="bg-ink text-paper px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-paper/10">
          <div className="flex items-center gap-2 pr-6 border-r border-paper/10">
            <History size={16} className="opacity-40" />
            <span className="text-xs font-mono">{script.length} Lines</span>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-subtext transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Generate Next
          </button>
        </div>
      </div>
    </div>
  );
}
