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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Connect Your MARKS App Account</h2>
              <p className="text-xs text-blue-100">Access your Premium question bank & practice offline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Token input form */}
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              MARKS App Auth Token / Session Key
            </label>
            <div className="relative">
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your token here (eyJhbGciOi...)"
                rows={3}
                className="w-full px-4 py-2.5 text-xs font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectDemo();
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Try Sample / Demo Mode
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify & Connect
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick instructions tab */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                How to get your token from MARKS App:
              </span>
              <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('bookmarklet')}
                  className={`px-2.5 py-1 rounded-md transition ${activeTab === 'bookmarklet' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ⚡ 1-Click Bookmarklet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('devtools')}
                  className={`px-2.5 py-1 rounded-md transition ${activeTab === 'devtools' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  🔍 DevTools / F12
                </button>
              </div>
            </div>

            {activeTab === 'bookmarklet' ? (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5 text-xs text-gray-700">
                <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  Easiest Way: 1-Click Token Extractor
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                  <li>Copy the code below or drag this link to your bookmarks bar.</li>
                  <li>Go to your open <strong className="text-gray-900">web.getmarks.app</strong> tab where you are logged in.</li>
                  <li>Click this bookmark or paste in address bar — your token will be copied to clipboard automatically!</li>
                </ol>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={copyBookmarklet}
                    className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-lg shadow-xs hover:bg-indigo-50 flex items-center gap-1.5 transition"
                  >
                    <Code className="w-3.5 h-3.5" />
                    {copiedBookmarklet ? 'Copied to Clipboard!' : 'Copy Bookmarklet Code'}
                  </button>
                  <a
                    href={bookmarkletCode}
                    onClick={(e) => e.preventDefault()}
                    title="Drag me to your Bookmarks Bar"
                    className="px-3 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 cursor-grab active:cursor-grabbing shadow-xs transition"
                  >
                    Drag to Bookmark Bar
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs text-gray-600">
                <p className="font-semibold text-gray-900">Manual inspection in 10 seconds:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open <a href="https://web.getmarks.app" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium">web.getmarks.app</a> in Chrome/Edge and ensure you are logged in.</li>
                  <li>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-700 font-mono">F12</kbd> (or right click → Inspect).</li>
                  <li>Click the <strong className="text-gray-900">Console</strong> tab and paste: <code className="bg-white px-1.5 py-0.5 border rounded font-mono text-indigo-700">copy(localStorage.getItem('token'))</code> and hit Enter.</li>
                  <li>Your token is now in your clipboard! Paste it above and click Verify.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>🔒 Secure: Token is stored only in your local browser.</span>
          <span>Offline Study Worksheet Generator</span>
        </div>
      </div>
    </div>
  );
}
