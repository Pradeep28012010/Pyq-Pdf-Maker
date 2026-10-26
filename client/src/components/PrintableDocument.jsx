import React, { useMemo } from 'react';
import MathView from '../utils/mathRenderer';
import PrintableOMR from './PrintableOMR';

export default function PrintableDocument({
  questions = [],
  exam,
  subject,
  chapter,
  bucket,
  options = {}
}) {
  if (!questions || !Array.isArray(questions) || questions.length === 0) return null;

  // Group MCQs into Section A and Numericals into Section B if both are present
  const { orderedQuestions, firstNumericalIndex, hasBothSections } = useMemo(() => {
    const hasMcq = questions.some(q => q.type !== 'numerical');
    const hasNum = questions.some(q => q.type === 'numerical');
    const both = hasMcq && hasNum;

    if (!both) {
      return { orderedQuestions: questions, firstNumericalIndex: -1, hasBothSections: false };
    }

    const mcqs = questions.filter(q => q.type !== 'numerical');
    const nums = questions.filter(q => q.type === 'numerical');
    return {
      orderedQuestions: [...mcqs, ...nums],
      firstNumericalIndex: mcqs.length,
      hasBothSections: true
    };
  }, [questions]);

  // Determine correct answer letter/text for each question
  const getAnswerText = (q) => {
    if (!q) return 'N/A';
    if (q.type === 'numerical') {
      return q.correctValue !== undefined && q.correctValue !== null
        ? String(q.correctValue)
        : (q.numericalLowerLimit !== undefined
          ? `${q.numericalLowerLimit} to ${q.numericalUpperLimit}`
          : 'Refer Solution');
    }

    if (Array.isArray(q.options)) {
      const correctIndices = q.options
        .map((opt, idx) => (opt && typeof opt === 'object' && opt.isCorrect ? String.fromCharCode(65 + idx) : null))
        .filter(Boolean);
      return correctIndices.length > 0 ? correctIndices.join(', ') : 'Refer Solution';
    }

    return 'Refer Solution';
  };

  const isTwoColumn = options.layout === '2-column';
  
  // Font size classes
  const fontClass = options.fontSize === 'compact'
    ? 'text-[10px] leading-snug'
    : options.fontSize === 'large'
    ? 'text-[12.5px] leading-relaxed'
    : 'text-[11px] leading-normal';

  // Section break class: only break to a brand new page if user explicitly requested separate sections!
  const sectionBreakClass = options.separateSections
    ? 'page-break-before mt-6 pt-3 border-t-2 border-black'
    : 'mt-4 pt-3 border-t-2 border-black';

  return (
    <div id="printable-area" className={`printable-document bg-white text-gray-900 mx-auto max-w-4xl p-6 md:p-8 print:p-0 print:max-w-none ${fontClass}`}>
      {/* -------------------- PART 1: QUESTIONS -------------------- */}
      {options.includeQuestions && (
        <section className="questions-section">
          {/* Official NTA Exam Pattern Header */}
          <div className="border-2 border-black p-2.5 mb-3 bg-white">
            <div className="flex items-start justify-between border-b border-black pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase bg-black text-white px-2 py-0.5 rounded-xs">
                    MARKS APP • JEE PRACTICE
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                    {exam?.title || 'JEE MAIN / ADVANCED'} — {subject?.title || 'EXAM TARGET'}
                  </span>
                </div>
                <h1 className="text-base md:text-lg font-black uppercase tracking-tight text-black mt-1">
                  {chapter?.title || 'Multi-Chapter Practice Worksheet'}
                </h1>
                <p className="text-[10px] font-semibold text-gray-700">
                  Category: <span className="uppercase text-black font-extrabold">{bucket?.title || 'Selected Category'}</span> • Total Questions: <strong>{orderedQuestions.length}</strong> • Max Marks: <strong>{orderedQuestions.length * 4}</strong> • Time: <strong>{options.timeAllowed || '60 Mins'}</strong>
                </p>
              </div>

              <div className="text-right text-[10px] text-gray-700 shrink-0 border-l border-gray-300 pl-3 hidden sm:block">
                <div className="font-bold text-black text-xs font-mono">CODE: MARKS-OFFLINE</div>
                <div>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div className="text-[9px] text-emerald-700 font-bold">2-Col Paper-Saver Flow</div>
              </div>
            </div>

            {/* Candidate Details & Verification Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] text-gray-800">
              <div>
                <span className="font-bold text-black">Candidate Name: </span>
                <span className="border-b border-gray-800 inline-block w-28 text-center font-semibold">
                  {options.studentName || ''}
                </span>
              </div>
              <div>
                <span className="font-bold text-black">Roll No / ID: </span>
                <span className="border-b border-gray-800 inline-block w-24"></span>
              </div>
              <div>
                <span className="font-bold text-black">Batch / Institute: </span>
                <span className="border-b border-gray-800 inline-block w-28 text-center">
                  {options.instituteName || ''}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-black">Invigilator Sign: </span>
                <span className="border-b border-gray-800 inline-block w-20"></span>
              </div>
            </div>

            <div className="text-[9.5px] text-gray-600 mt-1.5 pt-1 border-t border-gray-200 flex items-center justify-between italic">
              <span>📌 Instructions: Section A: Single Correct (+4, -1). Section B: Numerical (+4, 0 or -1). Complete Answer Key & Step-by-Step Solutions at end.</span>
              <span className="font-semibold text-gray-800">No Electronics In Study Hall</span>
            </div>
          </div>

          {/* Question List: Continuous 2-Column Flow (Newspaper style) or 1-Column */}
          <div className={isTwoColumn ? 'columns-1 md:columns-2 print-newspaper-columns gap-5' : 'space-y-3.5'}>
            {/* Section A Banner if both sections exist */}
            {hasBothSections && (
              <div className="paper-saver-header bg-gray-100 border border-gray-400 px-2 py-1 rounded mb-2 font-black text-xs uppercase flex items-center justify-between">
                <span>SECTION A: MULTIPLE CHOICE QUESTIONS (Q.1 – Q.{firstNumericalIndex})</span>
                <span className="font-mono text-[10px] text-gray-700 font-bold">+4 / -1</span>
              </div>
            )}

            {orderedQuestions.map((q, idx) => {
              if (!q) return null;
              const qNumber = idx + 1;
              const paperTitle = q.previousYearPapers?.[0]?.title || '';
              const isFirstNumerical = hasBothSections && idx === firstNumericalIndex;

              return (
                <React.Fragment key={q._id || idx}>
                  {/* Section B Banner before first numerical question */}
                  {isFirstNumerical && (
                    <div className="paper-saver-header bg-gray-100 border border-gray-400 px-2 py-1 rounded my-2 font-black text-xs uppercase flex items-center justify-between">
                      <span>SECTION B: NUMERICAL VALUE TYPE (Q.{firstNumericalIndex + 1} – Q.{orderedQuestions.length})</span>
                      <span className="font-mono text-[10px] text-gray-700 font-bold">+4 / 0</span>
                    </div>
                  )}

                  <div
                    className="question-card paper-saver-item pb-2.5 mb-2.5 border-b border-gray-200 print:border-gray-300 inline-block w-full"
                  >
                    {/* Question Title & Tags */}
                    <div className="paper-saver-header flex items-start gap-1.5 mb-1">
                      <span className="font-black text-xs text-black shrink-0">
                        Q.{qNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        {options.showMetadata && paperTitle && (
                          <span className="inline-block text-[9px] font-semibold text-gray-600 bg-gray-100 px-1 py-0.2 rounded border border-gray-300 mb-0.5">
                            [{paperTitle}]
                          </span>
                        )}
                        <div className="text-gray-950 font-normal leading-relaxed">
                          <MathView content={q.question || q.statement || q.text || ''} />
                        </div>
                      </div>
                    </div>

                    {/* Options / Numerical Field */}
                    {q.type === 'numerical' ? (
                      <div className="mt-1.5 pl-4">
                        <div className="inline-flex items-center gap-2 border border-gray-400 border-dashed rounded px-2 py-0.5 bg-gray-50 text-[11px] text-gray-600">
                          <span className="font-semibold text-black">Your Answer:</span>
                          <span className="w-16 border-b border-gray-600 inline-block"></span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 pl-3.5 space-y-0.5">
                        {Array.isArray(q.options) && q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const optContent = opt && typeof opt === 'object' ? (opt.text || opt.option || opt.content || '') : String(opt || '');
                          return (
                            <div
                              key={opt?.id || oIdx}
                              className="flex items-start gap-1.5 text-gray-900"
                            >
                              <span className="font-bold text-gray-700 shrink-0">
                                ({letter})
                              </span>
                              <div className="flex-1 min-w-0">
                                <MathView content={optContent} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Rough Work Margin Box */}
                    {options.roughSpace && options.roughSpace !== 'none' && (
                      <div
                        className={`mt-2 pl-4 border border-gray-200 border-dashed rounded bg-gray-50/50 flex items-start p-1 text-[9px] text-gray-400 italic ${
                          options.roughSpace === 'small'
                            ? 'h-12'
                            : options.roughSpace === 'medium'
                            ? 'h-20'
                            : 'h-32'
                        }`}
                      >
                        <span>Rough Work Space</span>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------- OPTIONAL: PRACTICE OMR BUBBLE GRID -------------------- */}
      {options.includeOMR && (
        <div className={`omr-section ${options.separateSections ? 'page-break-before my-6' : 'my-4'} avoid-break-strict`}>
          <PrintableOMR questions={orderedQuestions} />
        </div>
      )}

      {/* -------------------- PART 2: COMPACT 6-COLUMN ANSWER KEY & SCORECARD -------------------- */}
      {options.includeAnswerKey && (
        <section className={`answer-key-section avoid-break-strict ${sectionBreakClass}`}>
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-gray-300">
            <div>
              <h2 className="text-sm font-black uppercase text-black tracking-tight flex items-center gap-2">
                OFFICIAL ANSWER KEY — {chapter?.title || 'Chapter Practice'}
              </h2>
              <p className="text-[10px] text-gray-500">
                {exam?.title} • {subject?.title} ({bucket?.title}) • {orderedQuestions.length} Questions
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 rounded border border-gray-300">
              Quick Check
            </span>
          </div>

          {/* Compact 6-Column Grid Table */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 print:grid-cols-6 gap-1.5">
            {orderedQuestions.map((q, idx) => {
              if (!q) return null;
              const ans = getAnswerText(q);
              return (
                <div
                  key={q._id || idx}
                  className="flex items-center justify-between border border-gray-400 rounded px-2 py-0.5 bg-gray-50/60 print:bg-white text-xs"
                >
                  <span className="font-bold text-gray-600 text-[11px]">Q.{idx + 1}</span>
                  <span className="font-black text-indigo-950 font-mono text-xs">{ans}</span>
                </div>
              );
            })}
          </div>

          {/* Student Self-Evaluation Scorecard & Mistake Tracker */}
          {(options.includeScorecard ?? true) && (
            <div className="mt-3 p-2 bg-gray-50/80 border border-gray-400 rounded text-xs space-y-2">
              <div className="font-bold uppercase tracking-wider text-[11px] text-gray-800 flex items-center justify-between border-b border-gray-300 pb-1">
                <span>📊 Student Self-Evaluation Scorecard</span>
                <span className="font-mono text-[10px] text-gray-600">Marking: +4 / -1</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px]">
                <div className="border border-gray-300 rounded p-1 bg-white text-center">
                  <span className="block text-gray-500 font-semibold">Total Qs</span>
                  <span className="font-black text-sm">{orderedQuestions.length}</span>
                </div>
                <div className="border border-gray-300 rounded p-1 bg-white text-center">
                  <span className="block text-emerald-700 font-semibold">Correct (+4)</span>
                  <span className="font-mono text-xs">______</span>
                </div>
                <div className="border border-gray-300 rounded p-1 bg-white text-center">
                  <span className="block text-rose-700 font-semibold">Incorrect (-1)</span>
                  <span className="font-mono text-xs">______</span>
                </div>
                <div className="border border-gray-300 rounded p-1 bg-white text-center">
                  <span className="block text-gray-600 font-semibold">Unattempted</span>
                  <span className="font-mono text-xs">______</span>
                </div>
                <div className="border border-indigo-300 rounded p-1 bg-indigo-50/70 text-center font-bold text-indigo-950">
                  <span className="block text-[9px] uppercase tracking-wider">Net Score</span>
                  <span className="font-mono text-xs">____ / {orderedQuestions.length * 4}</span>
                </div>
                <div className="border border-indigo-300 rounded p-1 bg-indigo-50/70 text-center font-bold text-indigo-950">
                  <span className="block text-[9px] uppercase tracking-wider">Accuracy %</span>
                  <span className="font-mono text-xs">______ %</span>
                </div>
              </div>

              {/* Mistake Classification & Quick Formula Revision Log */}
              <div className="border-t border-gray-300 pt-1.5 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                <div className="border border-gray-300 rounded p-1.5 bg-white space-y-1">
                  <span className="font-bold text-gray-800 block text-[10px] uppercase">Mistake Classification Log</span>
                  <div className="space-y-0.5 text-gray-600">
                    <div>• Calculation / Silly Error: Q. ________________________</div>
                    <div>• Conceptual Gap / Formula: Q. ________________________</div>
                    <div>• Question Misread: Q. ________________________</div>
                    <div>• Time Ran Out: Q. ________________________</div>
                  </div>
                </div>
                <div className="border border-gray-300 rounded p-1.5 bg-white flex flex-col justify-between">
                  <span className="font-bold text-gray-800 block text-[10px] uppercase">Key Formulae / Insights to Revise</span>
                  <div className="border-b border-gray-300 h-4"></div>
                  <div className="border-b border-gray-300 h-4"></div>
                  <div className="border-b border-gray-300 h-4"></div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* -------------------- PART 3: 2-COLUMN COMPACT STEP-BY-STEP SOLUTIONS -------------------- */}
      {options.includeSolutions && (
        <section className={`solutions-section ${sectionBreakClass}`}>
          <div className="flex items-center justify-between pb-1 mb-2.5 border-b border-gray-300">
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase text-black tracking-tight">
                DETAILED HINTS & SOLUTIONS
              </h2>
              <p className="text-[10px] text-gray-500">
                Step-by-step mathematical derivations for {chapter?.title} ({isTwoColumn ? '2-Column Compact' : 'Standard'})
              </p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded">
              🍃 Zero-Waste Paper Flow
            </span>
          </div>

          {/* Solutions Layout: Continuous 2-Column Flow (Newspaper style) or 1-Column */}
          <div className={isTwoColumn ? 'columns-1 md:columns-2 print-newspaper-columns gap-5' : 'space-y-3'}>
            {orderedQuestions.map((q, idx) => {
              if (!q) return null;
              const qNumber = idx + 1;
              const ans = getAnswerText(q);

              return (
                <div
                  key={q._id || idx}
                  className="solution-card paper-saver-item pb-2.5 mb-2.5 border-b border-gray-300 print:border-gray-400 inline-block w-full"
                >
                  {/* Solution Card Header */}
                  <div className="paper-saver-header flex items-center justify-between bg-gray-100 border border-gray-300 px-2 py-0.5 rounded mb-1">
                    <span className="font-bold text-xs text-black">
                      Solution Q.{qNumber}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-900 bg-white px-1.5 py-0.2 rounded border border-indigo-200">
                      Ans: {ans}
                    </span>
                  </div>

                  {/* Hint if present */}
                  {q.hint && (
                    <div className="mb-1 p-1 bg-amber-50/70 border-l-2 border-amber-500 text-[10px] text-amber-900 leading-snug">
                      <strong>Concept: </strong>
                      <MathView content={q.hint} className="inline" />
                    </div>
                  )}

                  {/* Detailed Explanation / Derivations */}
                  <div className="solution-body text-gray-900 leading-snug space-y-0.5">
                    {q.solution ? (
                      <MathView content={q.solution} />
                    ) : (
                      <p className="italic text-gray-500 text-[10px]">Detailed solution verified in MARKS App.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-6 pt-2 border-t border-gray-200 text-center text-[9px] text-gray-400 flex items-center justify-between">
        <span>MARKS App Offline Worksheet • Study Hours Prep</span>
        <span>Paper-Saver Edition • Personal Offline Study</span>
      </footer>
    </div>
  );
}
