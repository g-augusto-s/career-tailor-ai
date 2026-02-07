
import React, { useState, useEffect } from 'react';
import { Plus, Rocket, FileText, Layout, History, Loader2, Clipboard, Zap, Linkedin, X, Check, ArrowRight, Info } from 'lucide-react';
import { CareerModule, TargetJob, GeneratedContent } from './types';
import { CareerModuleCard } from './components/CareerModuleCard';
import { generateApplicationMaterials, parseLinkedInProfile } from './services/geminiService';

const isModule = (m: any): m is CareerModule => {
  if (!m || typeof m !== 'object') return false;
  const allowed = ['experience', 'case_study', 'skill', 'education'];
  return (
    typeof m.id === 'string' &&
    typeof m.title === 'string' &&
    typeof m.description === 'string' &&
    typeof m.unit === 'string' &&
    allowed.includes(m.type)
  );
};

const loadModules = (): CareerModule[] => {
  try {
    const saved = localStorage.getItem('career_vault');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isModule);
  } catch {
    return [];
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vault' | 'apply' | 'results'>('vault');
  const [modules, setModules] = useState<CareerModule[]>(loadModules);
  
  const [jobInput, setJobInput] = useState<TargetJob>({
    company: '',
    title: '',
    description: ''
  });

  const [newModule, setNewModule] = useState<Partial<CareerModule>>({
    type: 'experience',
    unit: '',
    title: '',
    description: ''
  });

  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [linkedInText, setLinkedInText] = useState('');
  const [isParsingLinkedIn, setIsParsingLinkedIn] = useState(false);
  const [linkedInPreview, setLinkedInPreview] = useState<CareerModule[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GeneratedContent | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('career_vault', JSON.stringify(modules));
    } catch {
      // ignore storage errors (quota, disabled storage)
    }
  }, [modules]);

  const addModule = () => {
    if (!newModule.title || !newModule.description) return;
    const module: CareerModule = {
      id: crypto.randomUUID(),
      title: newModule.title!,
      description: newModule.description!,
      unit: newModule.unit || 'General',
      type: (newModule.type as any) || 'experience'
    };
    setModules([...modules, module]);
    setNewModule({ type: 'experience', unit: '', title: '', description: '' });
  };

  const deleteModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const handleLinkedInImport = async () => {
    if (!linkedInText.trim()) return;
    setIsParsingLinkedIn(true);
    try {
      const parsed = await parseLinkedInProfile(linkedInText);
      const withIds = parsed.map(p => ({
        ...p,
        id: crypto.randomUUID()
      } as CareerModule));
      setLinkedInPreview(withIds);
    } catch (error) {
      alert("Failed to parse LinkedIn text. Try copying a smaller section.");
    } finally {
      setIsParsingLinkedIn(false);
    }
  };

  const saveLinkedInImport = () => {
    setModules([...modules, ...linkedInPreview]);
    setLinkedInPreview([]);
    setLinkedInText('');
    setIsLinkedInModalOpen(false);
  };

  const handleGenerate = async () => {
    if (!jobInput.title || !jobInput.description) {
      alert("Please fill in the job details first!");
      return;
    }
    if (modules.length === 0) {
      alert("Your Career Vault is empty. Add some experiences first!");
      return;
    }

    setIsLoading(true);
    try {
      const output = await generateApplicationMaterials(modules, jobInput);
      setResults(output);
      setActiveTab('results');
    } catch (error) {
      alert("Error generating content. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Rocket size={18} />
            </div>
            <h1 className="font-bold text-xl text-slate-800">CareerTailor <span className="text-blue-600">AI</span></h1>
          </div>
          <nav className="flex gap-4">
            <button 
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'vault' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <History size={16} /> My Vault
            </button>
            <button 
              onClick={() => setActiveTab('apply')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'apply' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileText size={16} /> New Application
            </button>
            {results && (
              <button 
                onClick={() => setActiveTab('results')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'results' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Layout size={16} /> View Results
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 pb-20 text-slate-900">
        {activeTab === 'vault' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Add to Vault</h2>
                  <button 
                    onClick={() => setIsLinkedInModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Linkedin size={14} /> Import LinkedIn
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Type</label>
                    <select 
                      value={newModule.type}
                      onChange={(e) => setNewModule({...newModule, type: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    >
                      <option value="experience">Professional Experience</option>
                      <option value="case_study">Business Case / Success Story</option>
                      <option value="skill">Key Skill & Context</option>
                      <option value="education">Education & Certs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Title / Role</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Senior Project Manager"
                      value={newModule.title}
                      onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Business Unit / Company</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Fintech Operations"
                      value={newModule.unit}
                      onChange={(e) => setNewModule({...newModule, unit: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Details & Outcomes</label>
                    <textarea 
                      rows={6}
                      placeholder="Describe your actions, tools used, and the measurable business impact..."
                      value={newModule.description}
                      onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    ></textarea>
                  </div>
                  <button 
                    onClick={addModule}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus size={18} /> Add to Vault
                  </button>
                </div>
              </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">My Professional History</h2>
                <span className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                  {modules.length} Items stored
                </span>
              </div>
              
              {modules.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <History size={32} />
                  </div>
                  <h3 className="text-slate-800 font-bold mb-2">Your Vault is Empty</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    Start by adding your professional experiences manually or import your LinkedIn profile to build your context library.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map(m => (
                    <CareerModuleCard key={m.id} module={m} onDelete={deleteModule} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'apply' && (
          <div className="max-w-3xl mx-auto py-8 text-slate-900">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Generate Tailored Application</h2>
              <p className="text-slate-500 mb-8">Paste the details of the job you want to conquer. We will cross-reference it with your Career Vault.</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Target Company</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Google, Stripe, Local Startup"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                      value={jobInput.company}
                      onChange={(e) => setJobInput({...jobInput, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Senior Backend Engineer"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                      value={jobInput.title}
                      onChange={(e) => setJobInput({...jobInput, title: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Job Description</label>
                  <textarea 
                    rows={10}
                    placeholder="Paste the full job description here. Include requirements, responsibilities, and about the company..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    value={jobInput.description}
                    onChange={(e) => setJobInput({...jobInput, description: e.target.value})}
                  ></textarea>
                </div>
                
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" /> Analyzing your Vault & Creating Strategy...
                    </>
                  ) : (
                    <>
                      <Rocket size={20} /> Generate Tailored Materials
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Your Tailored Strategy</h2>
                <p className="text-slate-500">Optimized for {jobInput.title} at {jobInput.company}</p>
              </div>
              <button 
                onClick={() => setActiveTab('apply')}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white bg-slate-50 transition-colors text-slate-800"
              >
                Re-generate / Edit Job
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interview Tips Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 h-full">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-4">
                    <Zap size={18} /> Interview Winning Points
                  </h3>
                  <div className="space-y-4">
                    {results.interviewTips.split('\n').filter(Boolean).map((tip: string, idx: number) => (
                      <div key={idx} className="flex gap-3 text-amber-900 text-sm leading-relaxed">
                        <span className="flex-shrink-0 w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                        {tip.replace(/^\d+\.\s*/, '')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Outputs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Tailored Resume</h3>
                    <button onClick={() => copyToClipboard(results.resume)} className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
                      <Clipboard size={18} />
                    </button>
                  </div>
                  <div className="p-6 overflow-auto max-h-[600px] prose prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans text-slate-700 leading-relaxed">{results.resume}</pre>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Tailored Cover Letter</h3>
                    <button onClick={() => copyToClipboard(results.coverLetter)} className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
                      <Clipboard size={18} />
                    </button>
                  </div>
                  <div className="p-6 prose prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans text-slate-700 leading-relaxed">{results.coverLetter}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* LinkedIn Import Modal */}
      {isLinkedInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
              <div className="flex items-center gap-2">
                <Linkedin size={20} />
                <h2 className="text-xl font-bold">Import LinkedIn Profile</h2>
              </div>
              <button onClick={() => setIsLinkedInModalOpen(false)} className="hover:bg-blue-500 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-slate-900">
              {linkedInPreview.length === 0 ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-xl flex gap-3 mb-6">
                    <Info className="text-blue-600 flex-shrink-0" size={20} />
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Go to your LinkedIn profile, click <strong>"More"</strong>, then <strong>"Save to PDF"</strong>. 
                      Open the PDF, copy all text, and paste it below. Our AI will structure it for you.
                    </p>
                  </div>
                  <textarea 
                    rows={12}
                    placeholder="Paste your LinkedIn text here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm mb-4 text-slate-900"
                    value={linkedInText}
                    onChange={(e) => setLinkedInText(e.target.value)}
                  ></textarea>
                  <button 
                    onClick={handleLinkedInImport}
                    disabled={isParsingLinkedIn || !linkedInText.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {isParsingLinkedIn ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Parsing your profile...
                      </>
                    ) : (
                      <>
                        Analyze Profile <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800">Parsed Modules ({linkedInPreview.length})</h3>
                    <p className="text-xs text-slate-500 italic">Review and edit below if needed.</p>
                  </div>
                  {linkedInPreview.map((item, idx) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                          {item.type}
                        </span>
                        <input 
                          className="flex-1 bg-transparent border-none font-bold text-slate-800 outline-none focus:ring-0 text-slate-900"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...linkedInPreview];
                            updated[idx].title = e.target.value;
                            setLinkedInPreview(updated);
                          }}
                        />
                      </div>
                      <input 
                        className="w-full bg-transparent border-none text-xs text-blue-600 font-medium mb-2 outline-none focus:ring-0"
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...linkedInPreview];
                          updated[idx].unit = e.target.value;
                          setLinkedInPreview(updated);
                        }}
                      />
                      <textarea 
                        className="w-full bg-transparent border-none text-sm text-slate-600 outline-none focus:ring-0 resize-none text-slate-900"
                        rows={3}
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...linkedInPreview];
                          updated[idx].description = e.target.value;
                          setLinkedInPreview(updated);
                        }}
                      />
                      <button 
                        onClick={() => setLinkedInPreview(linkedInPreview.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
                    <button 
                      onClick={() => setLinkedInPreview([])}
                      className="flex-1 py-3 border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveLinkedInImport}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check size={18} /> Add All to Vault
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 fixed bottom-0 left-0 right-0 z-10 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
          <div>Powered by Gemini 3 Flash Preview</div>
          <div className="flex gap-4">
            <span>RAG Context Enabled</span>
            <span className="text-green-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Local Storage Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
