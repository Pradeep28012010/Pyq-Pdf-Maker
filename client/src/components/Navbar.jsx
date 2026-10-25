import React from 'react';
import { 
  Printer, 
  Crown, 
  User, 
  Sparkles, 
  LogOut, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Leaf,
  Layers,
  HelpCircle,
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
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200/50">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-gray-950 tracking-tight">MARKS</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                  Pro Print
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <Leaf className="w-3 h-3 text-emerald-600" /> Paper Saver Engine
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Generate offline study sheets with Answer Keys & LaTeX Solutions
              </p>
            </div>
          </div>

          {/* Quick Metrics (Paper savings & Time) */}
          {selectedCount > 0 && (
            <div className="hidden md:flex items-center gap-3 bg-gray-50/80 border border-gray-200/80 px-3 py-1.5 rounded-xl text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span><strong>{selectedCount}</strong> Qs</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>≈ {estimatedTime}m test</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>~{estimatedPages} {estimatedPages === 1 ? 'Sheet' : 'Sheets'}</span>
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* User status */}
            {user ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/90 py-1 px-2.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                  {user.name ? user.name[0] : 'P'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{user.name}</span>
                    {user.isPremium && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                        <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" /> Premium
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 block">MARKS Synced</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Disconnect Account"
                  className="ml-1 p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-200/60 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isDemo ? (
              <div className="flex items-center gap-2 bg-purple-50/80 border border-purple-200 py-1 px-2.5 rounded-xl">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-purple-950 block leading-tight">Demo Mode</span>
                  <span className="text-[10px] text-purple-700">Sample JEE PYQs</span>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="ml-1 px-2 py-0.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition"
                >
                  Connect
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition"
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
              className="hidden sm:flex px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-semibold rounded-xl shadow-2xs transition items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Save HTML</span>
            </button>

            {/* Print PDF Button */}
            <button
              onClick={onPrint}
              disabled={selectedCount === 0 || isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-200 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
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
