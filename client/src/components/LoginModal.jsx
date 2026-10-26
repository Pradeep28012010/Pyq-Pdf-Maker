import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, Bookmark, Code, HelpCircle, Sparkles, X } from 'lucide-react';
import { api } from '../services/api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onSelectDemo }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bookmarklet'); // 'bookmarklet' | 'devtools'
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please enter your MARKS App token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean token of possible surrounding quotes or Bearer prefix
      let cleaned = tokenInput.trim();
      cleaned = cleaned.replace(/^Bearer\s+/i, '').replace(/^['"]+|['"]+$/g, '');
      const res = await api.verifyToken(cleaned);
      if (res.success) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your token.');
    } finally {
      setLoading(false);
    }
  };

  const bookmarkletCode = `javascript:(function(){try{const t=localStorage.getItem('token');if(t){const clean=t.replace(/^['"]+|['"]+$/g,'');navigator.clipboard.writeText(clean).then(()=>{alert('✅ MARKS App Token copied to clipboard! Paste it into the PDF generator.')}).catch(()=>{prompt('Copy your MARKS token below:',clean);});}else{alert('⚠️ Please open https://web.getmarks.app and make sure you are logged in first!');}}catch(e){alert('Error: '+e);}})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white/85 backdrop-blur-3xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.18),inset_0_1px_2px_rgba(255,255,255,1)] overflow-hidden border border-white/80">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0071e3] via-indigo-600 to-[#af52de] px-6 py-5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xs">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Connect MARKS App Account</h2>
              <p className="text-xs text-blue-100">Access your synchronized question bank & study offline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Token input form */}
          <form onSubmit={handleVerify} className="space-y-3.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              MARKS App Auth Token / Session Key
            </label>
            <div className="relative">
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your token here (eyJhbGciOi...)"
                rows={3}
                className="w-full px-4 py-2.5 text-xs font-mono bg-white/80 backdrop-blur-md border border-slate-200/90 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] outline-none transition-all resize-none shadow-2xs text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectDemo();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-[#0071e3] bg-blue-50/80 hover:bg-blue-100/80 rounded-full flex items-center gap-1.5 transition-all border border-blue-200/60 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-[#0071e3]" />
                Use Sample Demo Mode
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 glass-btn-primary text-white font-bold text-xs sm:text-sm rounded-full flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(0,113,227,0.3)]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Connect</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick instructions tab */}
          <div className="border-t border-slate-200/50 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                How to get your token from MARKS App:
              </span>
              <div className="flex bg-slate-200/50 backdrop-blur-md p-1 rounded-full border border-white/60 text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                <button
                  type="button"
                  onClick={() => setActiveTab('bookmarklet')}
                  className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === 'bookmarklet' ? 'bg-white shadow-sm text-[#0071e3] font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ 1-Click Bookmarklet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('devtools')}
                  className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === 'devtools' ? 'bg-white shadow-sm text-[#0071e3] font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔍 DevTools / F12
                </button>
              </div>
            </div>

            {activeTab === 'bookmarklet' ? (
              <div className="p-4 bg-blue-50/60 border border-blue-200/70 rounded-2xl space-y-2.5 text-xs text-slate-700 shadow-2xs">
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#0071e3]" />
                  Easiest Way: 1-Click Token Extractor
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Copy the code below or drag this link to your bookmarks bar.</li>
                  <li>Go to your open <strong className="text-slate-900">web.getmarks.app</strong> tab where you are logged in.</li>
                  <li>Click this bookmark or paste in address bar — your token will be copied to clipboard automatically!</li>
                </ol>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={copyBookmarklet}
                    className="px-3.5 py-1.5 bg-white border border-blue-200 text-[#0071e3] font-semibold rounded-full shadow-2xs hover:bg-blue-50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    {copiedBookmarklet ? 'Copied to Clipboard!' : 'Copy Bookmarklet Code'}
                  </button>
                  <a
                    href={bookmarkletCode}
                    onClick={(e) => e.preventDefault()}
                    title="Drag me to your Bookmarks Bar"
                    className="px-3.5 py-1.5 glass-btn-primary text-white font-semibold rounded-full hover:scale-105 cursor-grab active:cursor-grabbing shadow-xs transition-all"
                  >
                    Drag to Bookmark Bar
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs text-slate-600 shadow-2xs">
                <p className="font-bold text-slate-900">Manual inspection in 10 seconds:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open <a href="https://web.getmarks.app" target="_blank" rel="noreferrer" className="text-[#0071e3] underline font-medium">web.getmarks.app</a> in Chrome/Edge and ensure you are logged in.</li>
                  <li>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-mono text-[10px]">F12</kbd> (or right click → Inspect).</li>
                  <li>Click the <strong className="text-slate-900">Console</strong> tab and paste: <code className="bg-white px-1.5 py-0.5 border rounded font-mono text-[#0071e3]">copy(localStorage.getItem('token'))</code> and hit Enter.</li>
                  <li>Your token is now in your clipboard! Paste it above and click Verify.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>🔒 Secure: Token is stored only in your local browser session.</span>
          <span>Apple Liquid Glass Edition</span>
        </div>
      </div>
    </div>
  );
}
