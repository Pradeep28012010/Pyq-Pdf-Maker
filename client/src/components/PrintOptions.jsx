import React from 'react';
import { 
  Sliders, 
  Columns, 
  AlignJustify, 
  BookText, 
  CheckSquare, 
  Type, 
  Clock, 
  Award, 
  FileCheck2, 
  Sparkles,
  Leaf
} from 'lucide-react';

export default function PrintOptions({ options, onChange, totalQuestions, selectedCount }) {
  const update = (key, value) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="no-print bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Worksheet & Print Customizer</h3>
            <p className="text-[11px] text-gray-500">Fine-tune paper density, layout, answer key and solutions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Leaf className="w-3.5 h-3.5" /> Paper Saver Enabled
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Layout Mode */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Columns className="w-3.5 h-3.5 text-indigo-600" />
            Page Layout
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update('layout', '2-column')}
              className={`p-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                options.layout === '2-column'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="font-bold flex items-center justify-center gap-1">
                <Columns className="w-3 h-3" /> 2-Column
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Saves 50% Paper</span>
            </button>

            <button
              type="button"
              onClick={() => update('layout', '1-column')}
              className={`p-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                options.layout === '1-column'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="font-bold flex items-center justify-center gap-1">
                <AlignJustify className="w-3 h-3" /> 1-Column
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">Spacious</span>
            </button>
          </div>
        </div>

        {/* 2. Font Size (Density) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-600" />
            Print Text Size
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'compact', label: 'Compact', sub: '9pt' },
              { id: 'normal', label: 'Normal', sub: '11pt' },
              { id: 'large', label: 'Large', sub: '12.5pt' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => update('fontSize', f.id)}
                className={`p-1.5 rounded-xl border text-xs text-center transition cursor-pointer ${
                  options.fontSize === f.id
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-500'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div>{f.label}</div>
                <div className="text-[10px] text-gray-400 font-normal">{f.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Rough Work Space */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <BookText className="w-3.5 h-3.5 text-indigo-600" />
            Rough Work Margin
          </label>
          <select
            value={options.roughSpace}
            onChange={(e) => update('roughSpace', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          >
            <option value="none">None (Maximum Compactness)</option>
            <option value="small">Small Box (~3 lines)</option>
            <option value="medium">Medium Box (~6 lines)</option>
            <option value="large">Large Box (Half Page)</option>
          </select>
        </div>

        {/* 4. Document Sections Included */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
            Sections to Include
          </label>
          <div className="space-y-1 text-xs text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer hover:text-black">
              <input
                type="checkbox"
                checked={options.includeQuestions}
                onChange={(e) => update('includeQuestions', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Questions Sheet</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-black font-semibold text-indigo-950">
              <input
                type="checkbox"
                checked={options.includeAnswerKey}
                onChange={(e) => update('includeAnswerKey', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Compact Answer Key Grid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-black font-semibold text-purple-950">
              <input
                type="checkbox"
                checked={options.includeSolutions}
                onChange={(e) => update('includeSolutions', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>2-Column Detailed Solutions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-black text-amber-900 font-medium">
              <input
                type="checkbox"
                checked={options.includeOMR}
                onChange={(e) => update('includeOMR', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Practice OMR Bubbles Grid</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-black text-emerald-800 font-semibold pt-1 border-t border-gray-100">
              <input
                type="checkbox"
                checked={!options.separateSections}
                onChange={(e) => update('separateSections', !e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1 text-[11px]">
                <Leaf className="w-3 h-3 text-emerald-600" />
                <span>Zero-Waste Flow (No blank pages)</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Custom Headers (Timer, Student, Batch, Marking Scheme) */}
      <div className="border-t border-gray-100 pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1">
            Student / Candidate Name
          </label>
          <input
            type="text"
            value={options.studentName}
            onChange={(e) => update('studentName', e.target.value)}
            placeholder="e.g. Pradeep"
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1">
            Institute / Batch Name
          </label>
          <input
            type="text"
            value={options.instituteName}
            onChange={(e) => update('instituteName', e.target.value)}
            placeholder="e.g. College Self-Study Batch"
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Time Allotted (Minutes)
          </label>
          <input
            type="text"
            value={options.timeAllowed || ''}
            onChange={(e) => update('timeAllowed', e.target.value)}
            placeholder="e.g. 45 Mins"
            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={options.showMetadata}
              onChange={(e) => update('showMetadata', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span className="font-medium">Show PYQ Shift Tags</span>
          </label>
        </div>
      </div>
    </div>
  );
}
