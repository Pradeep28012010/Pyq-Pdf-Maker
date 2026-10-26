import React from 'react';
import { 
  Printer, 
  Crown, 
  User, 
  Sparkles, 
  LogOut, 
  FileText, 
  Clock, 
  Leaf,
  Download
} from 'lucide-react';

export default function Navbar({ 
  user, 
  isDemo, 
  onOpenLogin, 
  onLogout, 
  onPrint, 
  onDownloadHtml,
  selectedCount, 
  isGenerating,
  estimatedPages = 1,
  estimatedTime = 30
}) {
  return (
    <header className="no-print sticky top-3 z-40 px-4 sm:px-6 lg:px-8 mb-4">
      <div className="max-w-7xl mx-auto glass-pill-nav rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 transition-all duration-300">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0071e3] via-indigo-600 to-[#af52de] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(0,113,227,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform hover:scale-105">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">MARKS</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-[#0071e3] to-indigo-600 text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)]">
                  Liquid Pro
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <Leaf className="w-3 h-3 text-emerald-600" /> Paper Saver Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-normal">
                High-density offline study worksheets & verified LaTeX solutions
              </p>
            </div>
          </div>

          {/* Center Apple-style Pill Metrics */}
          {selectedCount > 0 && (
            <div className="hidden md:flex items-center gap-2.5 bg-slate-200/50 backdrop-blur-md border border-white/60 px-3.5 py-1.5 rounded-full text-xs text-slate-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <FileText className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>{selectedCount} Qs</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>≈ {estimatedTime}m</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <Leaf className="w-3 h-3 text-emerald-600" />
                <span>~{estimatedPages} {estimatedPages === 1 ? 'Sheet' : 'Sheets'}</span>
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* User status */}
            {user ? (
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/80 py-1 px-2.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0071e3] to-purple-600 text-white flex items-center justify-center text-[10px] font-bold uppercase shadow-xs">
                  {user.name ? user.name[0] : 'P'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1 leading-tight">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[110px]">{user.name}</span>
                    {user.isPremium && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-900 bg-amber-400/20 px-1.5 py-0.2 rounded-full border border-amber-500/20">
                        <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">MARKS Synced</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Disconnect Account"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-200/50 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isDemo ? (
              <div className="flex items-center gap-2 bg-purple-500/10 backdrop-blur-md border border-purple-500/20 py-1 px-2.5 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-semibold text-purple-950 block leading-tight">Demo Mode</span>
                  <span className="text-[10px] text-purple-700">Sample PYQs</span>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="px-2.5 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full shadow-xs transition cursor-pointer"
                >
                  Connect
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full shadow-[0_4px_12px_rgba(0,113,227,0.3)] flex items-center gap-1.5 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Connect MARKS
              </button>
            )}

            {/* Offline HTML Download Button */}
            <button
              onClick={onDownloadHtml}
              disabled={selectedCount === 0}
              title="Download standalone offline HTML file (no internet required)"
              className="hidden sm:flex px-3 py-1.5 bg-white/70 hover:bg-white/95 border border-white/80 text-slate-700 text-xs font-semibold rounded-full shadow-2xs transition items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>HTML</span>
            </button>

            {/* Print PDF Button */}
            <button
              onClick={onPrint}
              disabled={selectedCount === 0 || isGenerating}
              className="px-4 sm:px-5 py-1.5 glass-btn-emerald text-white font-bold text-xs sm:text-sm rounded-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Print PDF ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
