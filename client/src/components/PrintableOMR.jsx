import React from 'react';

export default function PrintableOMR({ questions = [] }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="printable-omr avoid-break border-2 border-black rounded-lg p-3 my-4 bg-white">
      <div className="flex items-center justify-between border-b border-black pb-1.5 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-black text-xs uppercase tracking-wider text-black">
            PRACTICE OMR RESPONSE SHEET
          </span>
          <span className="text-[10px] text-gray-500 italic hidden sm:inline">
            (Fill with dark blue/black pen)
          </span>
        </div>
        <div className="text-[10px] font-bold text-gray-700 flex items-center gap-3">
          <span>Candidate: __________________</span>
          <span>Date: __/__/____</span>
        </div>
      </div>

      {/* Grid of OMR Bubbles: 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 print:grid-cols-5 gap-x-4 gap-y-1.5 text-xs">
        {questions.map((q, idx) => {
          const isNum = q?.type === 'numerical';
          return (
            <div key={q?._id || idx} className="flex items-center justify-between border-b border-gray-200 pb-1">
              <span className="font-bold text-gray-800 text-[11px] w-6">
                {idx + 1}.
              </span>
              {isNum ? (
                <div className="flex-1 flex justify-end">
                  <div className="w-16 h-4 border border-black rounded text-[9px] text-center text-gray-400 font-mono">
                    [ &nbsp; &nbsp; &nbsp; &nbsp; ]
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <span
                      key={opt}
                      className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[9px] font-bold text-black select-none"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 pt-1.5 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-600">
        <span>Correct (+4): _____</span>
        <span>Incorrect (-1): _____</span>
        <span>Unattempted (0): _____</span>
        <span className="font-bold text-black">Total Score: _____ / {questions.length * 4}</span>
      </div>
    </div>
  );
}
