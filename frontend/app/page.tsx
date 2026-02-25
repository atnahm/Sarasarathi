'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════
   Bilingual UI
   ═══════════════════════════════════════════════════ */
const UI = {
  English: {
    brand: 'Sarathi',
    tagline: 'Public Scheme Assistant',
    sourcesTitle: 'Sources',
    addSource: 'Add PDF source',
    processBtn: 'Process Documents',
    processing: 'Processing...',
    clearBtn: 'Clear all',
    clearing: 'Clearing...',
    langLabel: 'Response Language',
    placeholder: 'Ask about your documents...',
    welcome: 'What would you like to know?',
    welcomeDesc: 'Add official scheme documents as sources, then ask anything about eligibility, benefits, or application processes.',
    englishRefLabel: 'English reference:',
    filesSelected: 'files selected',
    chips: [
      'What schemes are in this document?',
      'Summarise the eligibility criteria',
      'What documents do I need to apply?',
      'Explain the benefits in simple words',
    ],
    // Profile Form
    profileBtnActive: 'Profile Active',
    profileBtnIdle: 'Personalize Results',
    profileTitle: 'Personalize Results',
    profileDesc: 'Set temporary traits matching to schemes automatically.',
    gender: 'GENDER',
    ageRange: 'AGE RANGE',
    category: 'CATEGORY (SOCIAL GROUP)',
    income: 'ANNUAL FAMILY INCOME',
    occupation: 'OCCUPATION STATUS',
    clearData: 'Clear Data',
    doneBtn: 'Done',
  },
  Assamese: {
    brand: 'সাৰথি',
    tagline: 'চৰকাৰী আঁচনি সহায়ক',
    sourcesTitle: 'উৎসসমূহ',
    addSource: 'PDF উৎস যোগ কৰক',
    processBtn: 'নথিপত্ৰ প্ৰক্ৰিয়া কৰক',
    processing: 'প্ৰক্ৰিয়াকৰণ...',
    clearBtn: 'সকলো মচক',
    clearing: 'মচা হৈ আছে...',
    langLabel: 'উত্তৰৰ ভাষা',
    placeholder: 'আপোনাৰ নথিপত্ৰৰ বিষয়ে সুধক...',
    welcome: 'আপুনি কি জানিব বিচাৰে?',
    welcomeDesc: 'উৎস হিচাপে চৰকাৰী আঁচনিৰ নথিপত্ৰ যোগ কৰক, তাৰ পিছত যোগ্যতা, সুবিধা, বা আবেদন প্ৰক্ৰিয়াৰ বিষয়ে যিকোনো কথা সুধক।',
    englishRefLabel: 'ইংৰাজী তথ্যসূত্ৰ:',
    filesSelected: 'টা ফাইল বাছনি',
    chips: [
      'এই নথিপত্ৰত কি কি আঁচনি আছে?',
      'যোগ্যতাৰ মানদণ্ড সাৰাংশ কৰক',
      'আবেদন কৰিবলৈ কি কি নথিপত্ৰ লাগে?',
      'সুবিধাসমূহ সহজ ভাষাত বুজাওক',
    ],
    // Profile Form
    profileBtnActive: 'প্ৰফাইল সক্ৰিয়',
    profileBtnIdle: 'ফলাফলসমূহ ব্যক্তিগতকৰণ',
    profileTitle: 'ফলাফলসমূহ ব্যক্তিগতকৰণ কৰক',
    profileDesc: 'আঁচনিসমূহৰ লগত স্বয়ংক্ৰিয়ভাৱে মিলি যোৱাকৈ অস্থায়ী তথ্য সংহতি কৰক।',
    gender: 'লিংগ',
    ageRange: 'বয়সৰ সীমা',
    category: 'শ্ৰেণী (সামাজিক গোট)',
    income: 'বাৰ্ষিক পৰিয়ালৰ আয়',
    occupation: 'বৃত্তিৰ অৱস্থা',
    clearData: 'তথ্য মচক',
    doneBtn: 'সম্পন্ন',
  },
};

/* ═══════════════════════════════════════════════════
   Logo
   ═══════════════════════════════════════════════════ */
const SarathiLogo = ({ size = 36, className = '' }: { size?: number; className?: string }) => (
  <div className={`relative ${className}`} style={{ width: size, height: size }}>
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <circle cx="24" cy="24" r="22" stroke="url(#lg)" strokeWidth="2.5" fill="none" opacity="0.3" />
      <path d="M24 6C24 6 10 12 10 22C10 32 17 40 24 44C31 40 38 32 38 22C38 12 24 6 24 6Z" fill="url(#lg)" opacity="0.15" />
      <path d="M24 6C24 6 10 12 10 22C10 32 17 40 24 44C31 40 38 32 38 22C38 12 24 6 24 6Z" stroke="url(#lg)" strokeWidth="2" fill="none" />
      <circle cx="24" cy="23" r="6" stroke="url(#lg)" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="23" r="2" fill="url(#lg)" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => (
        <line key={a} x1={24 + 3 * Math.cos(a * Math.PI / 180)} y1={23 + 3 * Math.sin(a * Math.PI / 180)} x2={24 + 6 * Math.cos(a * Math.PI / 180)} y2={23 + 6 * Math.sin(a * Math.PI / 180)} stroke="url(#lg)" strokeWidth="1" opacity="0.7" />
      ))}
      <path d="M24 30L24 38" stroke="url(#lg)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M21 32L21 36" stroke="url(#lg)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M27 32L27 36" stroke="url(#lg)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <defs><linearGradient id="lg" x1="8" y1="6" x2="40" y2="44"><stop offset="0%" stopColor="#22d3ee" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
type Message = { id: string; role: 'user' | 'assistant'; content: string; sources?: string[]; english_ref?: string | null; };
type UploadedDoc = { name: string; chunks: number };
type SourceCandidate = { id: string; title: string; url: string; snippet: string; content: string; selected?: boolean; };
type UserProfile = {
  age?: string;
  gender?: string;
  occupation?: string;
  income?: string;
  category?: string;
  state?: string;
};

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<FileList | null>(null);
  const [language, setLanguage] = useState<'English' | 'Assamese'>('English');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [webQuery, setWebQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ephemeralSources, setEphemeralSources] = useState<SourceCandidate[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [appTheme, setAppTheme] = useState('default');

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = UI[language];
  const asm = language === 'Assamese';

  // Helper to get API URL
  const getApiUrl = (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${baseUrl.replace(/\/$/, '')}${endpoint}`;
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const handleUpload = useCallback(async () => {
    if (!files || files.length === 0) return;
    setUploadState('uploading'); setUploadMsg('');
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
    try {
      const res = await fetch(getApiUrl('/upload'), { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setDocs(p => [...p, ...(data.details || []).filter((d: any) => d.status === 'success').map((d: any) => ({ name: d.file, chunks: d.chunks }))]);
        setUploadState('success'); setUploadMsg(`${data.chunks} chunks indexed`);
        setFiles(null); if (fileRef.current) fileRef.current.value = '';
      } else { setUploadState('error'); setUploadMsg(data.detail || 'Failed'); }
    } catch { setUploadState('error'); setUploadMsg('Connection error'); }
  }, [files]);

  const handleClear = async () => {
    setIsClearing(true);
    try { await fetch(getApiUrl('/reset'), { method: 'POST' }); } catch { }
    setDocs([]); setEphemeralSources([]); setUserProfile({}); setMessages([]); setUploadState('idle'); setUploadMsg(''); setIsClearing(false);
  };

  const handleWebSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webQuery.trim()) return;
    setIsSearching(true);
    setUploadMsg('');
    try {
      const res = await fetch(getApiUrl('/search_opportunities'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: webQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setEphemeralSources(data.map((s: any) => ({ ...s, selected: true })));
        setWebQuery('');
      } else {
        setUploadState('error'); setUploadMsg(`Search failed: ${data.detail}`);
      }
    } catch {
      setUploadState('error'); setUploadMsg('Connection error during search.');
    }
    setIsSearching(false);
  };

  const handleAddWebSource = async (src: SourceCandidate) => {
    setUploadState('uploading'); setUploadMsg('Adding web source...');
    try {
      const res = await fetch(getApiUrl('/add_web_source'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(src),
      });
      const data = await res.json();
      if (res.ok) {
        setDocs(p => [...p, { name: data.file, chunks: data.chunks }]);
        setEphemeralSources(p => p.filter(s => s.id !== src.id));
        setUploadState('success'); setUploadMsg('Web source added');
      } else {
        setUploadState('error'); setUploadMsg(data.detail || 'Failed to add source');
      }
    } catch {
      setUploadState('error'); setUploadMsg('Connection error');
    }
  };

  const handleAddAllSelected = async () => {
    const selected = ephemeralSources.filter(s => s.selected);
    if (selected.length === 0) return;

    setUploadState('uploading'); setUploadMsg(`Adding ${selected.length} web source(s)...`);
    let addedCount = 0;

    await Promise.all(selected.map(async (src) => {
      try {
        const res = await fetch(getApiUrl('/add_web_source'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(src),
        });
        const data = await res.json();
        if (res.ok) {
          setDocs(p => [...p, { name: data.file, chunks: data.chunks }]);
          setEphemeralSources(p => p.filter(s => s.id !== src.id));
          addedCount++;
        }
      } catch (err) { }
    }));

    if (addedCount === selected.length) {
      setUploadState('success'); setUploadMsg(`Added ${addedCount} web source(s)`);
    } else if (addedCount > 0) {
      setUploadState('success'); setUploadMsg(`Added ${addedCount}/${selected.length} web source(s)`);
    } else {
      setUploadState('error'); setUploadMsg('Failed to add selected sources');
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', content: text }]);
    setInput(''); setIsLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const selectedSources = ephemeralSources.filter(s => s.selected).map(s => `Title: ${s.title}\nURL: ${s.url}\n\n${s.content}`);

    try {
      const res = await fetch(getApiUrl('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          language,
          selected_sources: selectedSources.length > 0 ? selectedSources : undefined,
          user_profile: Object.keys(userProfile).length > 0 ? userProfile : undefined
        }),
        signal: controller.signal,
      });

      // Error boundary: handle non-JSON responses (e.g. HTML 500 pages)
      let data: any;
      try {
        data = await res.json();
      } catch {
        setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'System encountered an error. The server returned an unexpected response. Please try again.' }]);
        setIsLoading(false);
        return;
      }

      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.ok ? data.answer : `Error: ${data.detail || 'Unknown error'}`,
        sources: res.ok ? data.sources : undefined,
        english_ref: res.ok ? data.english_ref : undefined,
      }]);
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isTimeout
          ? 'The request timed out after 25 seconds. The AI model may be busy — please try again in a moment.'
          : 'Unable to connect to backend. Please check that the server is running.',
      }]);
    } finally {
      clearTimeout(timeout);
    }
    setIsLoading(false);
  }, [language]);

  return (
    <div className={`flex h-screen overflow-hidden relative ${appTheme !== 'default' ? 'theme-' + appTheme : ''}`} style={{ background: 'var(--app-bg)' }}>

      {/* Background blobs for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-gentle-bob ${asm ? 'bg-orange-300' : 'bg-cyan-300'}`} />
        <div className={`absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl animate-gentle-bob ${asm ? 'bg-red-200' : 'bg-indigo-200'}`} style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-100 opacity-10 blur-3xl animate-breathe" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ══════ SIDEBAR ══════ */}
      <aside className={`glass-dark fixed md:relative z-30 w-[300px] h-full flex flex-col transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] shadow-2xl shadow-black/20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <SarathiLogo size={38} />
            <div>
              <h1 className="text-[16px] font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent leading-tight tracking-tight">{t.brand}</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">{t.tagline}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 text-sm transition-colors">✕</button>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mb-2">{t.langLabel}</p>
          <div className="flex bg-slate-800/80 rounded-xl p-1 border border-white/[0.04]">
            {(['English', 'Assamese'] as const).map(lang => (
              <button key={lang} onClick={() => setLanguage(lang)}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-300 ${language === lang
                  ? lang === 'Assamese' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}>
                {lang === 'Assamese' ? 'অসমীয়া' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Button */}
        <div className="px-5 pb-3">
          <button onClick={() => setShowProfileForm(true)}
            className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-[11px] font-bold transition-all duration-200 border ${Object.keys(userProfile).length > 0 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20' : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-300'}`}>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              {Object.keys(userProfile).length > 0 ? t.profileBtnActive : t.profileBtnIdle}
            </div>
            {Object.keys(userProfile).length > 0 && (
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
            )}
          </button>
        </div>

        {/* Sources */}
        <div className="flex-1 px-5 pt-1 pb-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-slate-300 uppercase tracking-wider">{t.sourcesTitle}</p>
            {docs.length > 0 && (
              <button onClick={handleClear} disabled={isClearing}
                className="text-[10px] text-red-400 hover:text-red-300 font-semibold disabled:opacity-50 transition-all hover:underline">
                {isClearing ? t.clearing : t.clearBtn}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 mb-3 custom-scrollbar">
            {docs.length === 0 && ephemeralSources.length === 0 && (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">No sources added yet</p>
              </div>
            )}

            {/* PDF Sources */}
            {docs.map((doc, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] transition-all duration-200 group animate-fade-in-up cursor-default glass-shine" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/10 flex items-center justify-center shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-slate-200 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-500">{doc.chunks} chunks</p>
                </div>
              </div>
            ))}

            {/* Web Sources */}
            {ephemeralSources.length > 0 && (
              <div className="flex items-center justify-between mt-3 mb-2 px-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Web Sources</p>
                {ephemeralSources.some(s => s.selected) && (
                  <button onClick={handleAddAllSelected} className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Selected to RAG
                  </button>
                )}
              </div>
            )}
            {ephemeralSources.map((src, i) => (
              <div key={src.id} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-cyan-500/10 transition-all duration-200 group animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start gap-2.5">
                  <div className="pt-0.5">
                    <input type="checkbox" checked={src.selected} onChange={() => setEphemeralSources(p => p.map(s => s.id === src.id ? { ...s, selected: !s.selected } : s))} className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 checked:bg-cyan-500 checked:border-cyan-500 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer accent-cyan-500" />
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEphemeralSources(p => p.map(s => s.id === src.id ? { ...s, selected: !s.selected } : s))}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-tight">{src.title}</p>
                      <button onClick={(e) => { e.stopPropagation(); handleAddWebSource(src); }} className="w-5 h-5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 transition-colors" title="Add to permanent sources">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    </div>
                    <a href={src.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[9px] text-cyan-500/80 hover:text-cyan-400 truncate block mt-0.5 hover:underline">
                      {new URL(src.url).hostname.replace('www.', '')}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload and Web Search */}
          <div className="space-y-3">

            {/* Documents */}
            <div className="relative">
              <input ref={fileRef} type="file" accept="application/pdf" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={e => { setFiles(e.target.files); setUploadState('idle'); setUploadMsg(''); }} />
              <div className={`border-2 border-dashed rounded-xl py-2.5 px-4 text-center transition-all duration-200 hover-lift ${files && files.length > 0 ? 'border-cyan-500/50 bg-cyan-500/[0.06]' : 'border-slate-700 hover:border-cyan-500/30 hover:bg-white/[0.02]'}`}>
                <p className={`text-[11px] font-semibold flex items-center justify-center gap-2 ${files && files.length > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  {files && files.length > 0 ? `${files.length} ${t.filesSelected}` : t.addSource}
                </p>
              </div>
            </div>

            {/* Web Search */}
            <form onSubmit={handleWebSearch} className="relative">
              <input type="text" value={webQuery} onChange={e => setWebQuery(e.target.value)} placeholder="Search Web Sources..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-3 pr-9 text-[11px] font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
              <button type="submit" disabled={!webQuery.trim() || isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-white/5 disabled:opacity-30">
                {isSearching ? <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
              </button>
            </form>
            {files && files.length > 0 && (
              <div className="space-y-1.5 animate-fade-in">
                {Array.from(files).map((f, i) => (<p key={i} className="text-[10px] text-slate-500 truncate px-1">📄 {f.name}</p>))}
                <button onClick={handleUpload} disabled={uploadState === 'uploading'}
                  className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 disabled:opacity-60 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border border-white/10 hover-lift active:scale-95">
                  {uploadState === 'uploading' ? (<span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.processing}</span>) : t.processBtn}
                </button>
              </div>
            )}
            {uploadMsg && <p className={`text-[10px] font-semibold text-center animate-fade-in ${uploadState === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{uploadMsg}</p>}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.04] flex justify-center pb-6">
          <div className="group relative flex items-center bg-white/5 border border-white/10 rounded-full p-1 min-w-[36px] min-h-[36px] overflow-hidden transition-all duration-300 hover:w-[155px]">
            {/* The default icon */}
            <div className="absolute left-1/2 -translate-x-1/2 group-hover:left-2 group-hover:translate-x-0 w-7 h-7 flex items-center justify-center text-slate-400 transition-all duration-300 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            </div>

            {/* The expanding theme options */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all duration-300 mx-auto pl-7">
              {[
                { id: 'default', color: 'bg-[#f0f4f9] border-slate-300' },
                { id: 'dark', color: 'bg-slate-900 border-slate-700' },
                { id: 'pink', color: 'bg-pink-200 border-pink-400' },
                { id: 'startup', color: 'bg-emerald-200 border-emerald-400' },
                { id: 'morale', color: 'bg-amber-200 border-amber-400' },
              ].map(t => (
                <button key={t.id} onClick={() => setAppTheme(t.id)} title={`${t.id.charAt(0).toUpperCase() + t.id.slice(1)} Theme`}
                  className={`w-4 h-4 rounded-full border-2 transition-all shrink-0 ${t.color} ${appTheme === t.id ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900 scale-125' : 'hover:scale-110 opacity-70 hover:opacity-100'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.04]">
          <p className="text-[9px] text-slate-600 text-center font-semibold tracking-wider uppercase">Sarathi v3.0</p>
        </div>
      </aside>

      {/* ══════ MAIN CHAT ══════ */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Header — glass */}
        <header className="glass-strong h-14 flex items-center px-4 shrink-0 sticky top-0 z-10 rounded-b-2xl mx-2 mt-2 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 rounded-xl clay-sm clay-hover flex items-center justify-center text-slate-500 mr-3 active:scale-95 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <SarathiLogo size={26} />
          <div className="flex items-center gap-2 ml-2">
            <h2 className="text-[15px] font-bold text-slate-700">{t.brand}</h2>
            {docs.length > 0 && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full glass transition-all ${asm ? 'text-orange-600 border-orange-200' : 'text-cyan-600 border-cyan-200'}`}>
                {docs.length} source{docs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="ml-auto">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full clay-sm transition-all ${asm ? 'text-orange-600' : 'text-cyan-600'}`}>
              {asm ? '🇮🇳 অসমীয়া' : '🇮🇳 English'}
            </span>
          </div>
        </header>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="max-w-3xl mx-auto px-2 py-8">

            {messages.length === 0 ? (
              /* ── Empty State ── */
              <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                {/* Floating logo */}
                <div className="animate-float mb-4">
                  <div className={`w-20 h-20 rounded-3xl clay flex items-center justify-center shadow-xl ${asm ? 'shadow-orange-200/30' : 'shadow-cyan-200/30'}`}>
                    <SarathiLogo size={48} />
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 mb-2 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>{t.welcome}</h2>
                <p className="text-[14px] text-slate-500 text-center max-w-md mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>{t.welcomeDesc}</p>

                {/* Prompt chips — clay cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {t.chips.map((chip, i) => (
                    <button key={i} onClick={() => sendMessage(chip)}
                      className={`prompt-chip text-left px-4 py-4 rounded-2xl clay-sm text-[13px] font-medium animate-fade-in-up group transition-all ${asm ? 'text-slate-600 hover:text-orange-700' : 'text-slate-600 hover:text-cyan-700'}`}
                      style={{ animationDelay: `${i * 100 + 300}ms` }}>
                      <span className={`inline-block w-6 h-6 rounded-lg mr-2 align-middle text-center text-[11px] leading-6 transition-colors ${asm ? 'bg-orange-100 group-hover:bg-orange-200' : 'bg-cyan-100 group-hover:bg-cyan-200'}`}>💡</span>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Messages ── */
              <div className="space-y-5">
                {messages.map((m, idx) => (
                  <div key={m.id} className={`flex gap-3 animate-fade-in-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}>

                    {/* Bot avatar */}
                    {m.role === 'assistant' && (
                      <div className={`w-9 h-9 rounded-xl clay-sm flex items-center justify-center shrink-0 mt-0.5 ${asm ? 'shadow-orange-200/20' : 'shadow-cyan-200/20'}`}>
                        <SarathiLogo size={20} />
                      </div>
                    )}

                    <div className="max-w-[80%]">
                      {/* Message bubble */}
                      <div className={`rounded-2xl px-4 py-3.5 transition-all duration-300 ${m.role === 'user'
                        ? asm
                          ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-400/20'
                          : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-400/20'
                        : 'glass-bubble text-slate-800'
                        } ${m.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'}`}
                        style={m.role === 'assistant' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7), 0 0 0 1px rgba(255,255,255,0.35)' } : {}}>
                        <p className="text-[14px] leading-[1.75] whitespace-pre-wrap">{m.content}</p>
                      </div>

                      {/* Sources & Ref */}
                      {m.role === 'assistant' && (m.sources?.length || m.english_ref) && (
                        <div className="mt-2.5 space-y-2 animate-fade-in">
                          {m.english_ref && (
                            <div className="glass text-[12px] text-slate-500 p-3 rounded-xl">
                              <span className="font-bold text-slate-600 block mb-1">{t.englishRefLabel}</span>
                              {m.english_ref}
                            </div>
                          )}
                          {m.sources && m.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {m.sources.map((src, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold clay-sm text-cyan-700 hover-lift transition-all cursor-default">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                  {src}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User avatar */}
                    {m.role === 'user' && (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5 shadow-md ${asm ? 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-400/20' : 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-400/20'}`}>
                        U
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing */}
                {(isLoading || isSearching) && (
                  <div className="flex gap-3 animate-scale-in">
                    <div className="w-9 h-9 rounded-xl clay-sm flex items-center justify-center shrink-0 animate-breathe">
                      <SarathiLogo size={20} />
                    </div>
                    <div className="glass-bubble rounded-2xl rounded-tl-md px-5 py-4 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full typing-dot ${asm ? 'bg-orange-400' : 'bg-cyan-400'}`}></span>
                      <span className={`w-2.5 h-2.5 rounded-full typing-dot ${asm ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                      <span className={`w-2.5 h-2.5 rounded-full typing-dot ${asm ? 'bg-red-400' : 'bg-indigo-400'}`}></span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* ── Input Bar — glass + clay ── */}
        <div className="px-3 pb-3 pt-2">
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="max-w-3xl mx-auto relative">
            <div className={`glass-strong rounded-2xl transition-all duration-300 relative ${inputFocused ? asm ? 'shadow-lg shadow-orange-200/30 ring-2 ring-orange-300/40' : 'shadow-lg shadow-cyan-200/30 ring-2 ring-cyan-300/40' : 'shadow-md'}`}>
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                placeholder={t.placeholder}
                className="w-full bg-transparent text-slate-800 rounded-2xl pl-5 pr-14 py-4 text-[14px] font-medium placeholder:text-slate-400 focus:outline-none"
              />
              <button type="submit" disabled={!input.trim() || isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-20 active:scale-90 ${input.trim()
                  ? asm
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-400/25'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-400/25'
                  : 'bg-transparent text-slate-300'
                  }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* ══════ USER PROFILE MODAL ══════ */}
      {
        showProfileForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-fade-in">
            <div className="w-full max-w-lg glass-dark rounded-3xl border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-indigo-900/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[15px]">{t.profileTitle}</h3>
                    <p className="text-indigo-200/60 text-[11px] mt-0.5">{t.profileDesc}</p>
                  </div>
                </div>
                <button onClick={() => setShowProfileForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 text-slate-300">

                {/* Gender */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest">{t.gender}</label>
                  <div className="flex flex-wrap gap-2">
                    {['Male', 'Female', 'Other'].map(val => (
                      <button key={val}
                        onClick={() => setUserProfile(p => ({ ...p, gender: p.gender === val ? undefined : val }))}
                        className={`px-4 py-2 text-[12px] font-semibold rounded-xl border transition-all ${userProfile.gender === val ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/25' : 'bg-slate-800/40 border-white/5 hover:bg-slate-700/50 hover:border-white/10'}`}>
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest">{t.ageRange}</label>
                  <div className="flex flex-wrap gap-2">
                    {['Under 18', '18-25', '26-40', '41-60', 'Senior (60+)'].map(val => (
                      <button key={val}
                        onClick={() => setUserProfile(p => ({ ...p, age: p.age === val ? undefined : val }))}
                        className={`px-4 py-2 text-[12px] font-semibold rounded-xl border transition-all ${userProfile.age === val ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/25' : 'bg-slate-800/40 border-white/5 hover:bg-slate-700/50 hover:border-white/10'}`}>
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest">{t.category}</label>
                  <div className="flex flex-wrap gap-2">
                    {['General', 'OBC', 'SC', 'ST', 'Minority'].map(val => (
                      <button key={val}
                        onClick={() => setUserProfile(p => ({ ...p, category: p.category === val ? undefined : val }))}
                        className={`px-4 py-2 text-[12px] font-semibold rounded-xl border transition-all ${userProfile.category === val ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/25' : 'bg-slate-800/40 border-white/5 hover:bg-slate-700/50 hover:border-white/10'}`}>
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Income */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest">{t.income}</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {['< ₹1 Lakh', '₹1 - 2.5 Lakhs', '₹2.5 - 5 Lakhs', '₹5 - 8 Lakhs', '> ₹8 Lakhs'].map(val => (
                      <button key={val}
                        onClick={() => setUserProfile(p => ({ ...p, income: p.income === val ? undefined : val }))}
                        className={`px-3 py-2.5 text-[11px] font-semibold rounded-xl border transition-all text-center ${userProfile.income === val ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/25' : 'bg-slate-800/40 border-white/5 hover:bg-slate-700/50 hover:border-white/10'}`}>
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occupation */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest">{t.occupation}</label>
                  <div className="flex flex-wrap gap-2">
                    {['Student', 'Farmer', 'Unemployed', 'Salaried', 'Business/Self-Employed'].map(val => (
                      <button key={val}
                        onClick={() => setUserProfile(p => ({ ...p, occupation: p.occupation === val ? undefined : val }))}
                        className={`px-4 py-2 text-[12px] font-semibold rounded-xl border transition-all ${userProfile.occupation === val ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/25' : 'bg-slate-800/40 border-white/5 hover:bg-slate-700/50 hover:border-white/10'}`}>
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-white/5 bg-slate-800/30 flex justify-between items-center mt-auto">
                <button onClick={() => setUserProfile({})} className="text-[12px] text-slate-400 hover:text-red-400 transition-colors bg-transparent px-3 py-2 rounded-lg hover:bg-red-500/10">
                  {t.clearData}
                </button>
                <button onClick={() => setShowProfileForm(false)} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                  {t.doneBtn}
                </button>
              </div>

            </div>
          </div>
        )
      }

    </div >
  );
}
