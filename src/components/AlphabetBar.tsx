import React, { useState } from 'react';
import { ARABIC_LETTERS, LATIN_LETTERS } from '../services/alphabet';

interface AlphabetBarProps {
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  letterCounts: Record<string, number>;
}

export const AlphabetBar: React.FC<AlphabetBarProps> = ({
  selectedLetter,
  onSelectLetter,
  letterCounts
}) => {
  const [activeCharset, setActiveCharset] = useState<'both' | 'arabic' | 'latin'>('both');

  const totalFilteredCount = selectedLetter ? (letterCounts[selectedLetter] || 0) : null;

  return (
    <div id="alphabet-navigation-container" className="bg-[#FAF9F5] border border-[#E2DDD3] rounded-xl p-3 shadow-xs space-y-2.5">
      {/* Top Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE5DC] pb-2 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-[#574E45]">
          <span className="w-2 h-2 rounded-full bg-[#7D2433]"></span>
          <span>شريط الفهرسة الأبجدية بأول اسم المؤلف (الاسم الأول):</span>
          {selectedLetter && (
            <span className="bg-[#7D2433] text-white text-[11px] px-2 py-0.5 rounded font-bold">
              الحرف المحدد: «{selectedLetter}» ({totalFilteredCount} مرجع)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#EFECE4] p-0.5 rounded-lg">
          <button
            onClick={() => setActiveCharset('both')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              activeCharset === 'both' ? 'bg-white font-semibold text-[#1F2937] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            الكل (عربي + لاتيني)
          </button>
          <button
            onClick={() => setActiveCharset('arabic')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              activeCharset === 'arabic' ? 'bg-white font-semibold text-[#1F2937] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            المراجع العربية (أ - ي)
          </button>
          <button
            onClick={() => setActiveCharset('latin')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              activeCharset === 'latin' ? 'bg-white font-semibold text-[#1F2937] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            المراجع الأجنبية (A - Z)
          </button>
        </div>
      </div>

      {/* Letters List */}
      <div className="flex flex-wrap items-center gap-1 text-xs">
        {/* All Reset Button */}
        <button
          onClick={() => onSelectLetter(null)}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
            selectedLetter === null
              ? 'bg-[#1E252B] text-white shadow-xs'
              : 'bg-white text-[#4A5568] hover:bg-[#EAE5DC] border border-[#E2DDD3]'
          }`}
        >
          عرض الكل
        </button>

        {/* Arabic letters */}
        {(activeCharset === 'both' || activeCharset === 'arabic') && (
          <div className="flex flex-wrap items-center gap-1 bg-[#F4F1EA] p-1 rounded-lg border border-[#E7E2D8]">
            <span className="text-[10px] text-[#8C827A] px-1 font-bold">عربي:</span>
            {ARABIC_LETTERS.map((letter) => {
              const count = letterCounts[letter] || 0;
              const isSelected = selectedLetter === letter;
              const hasItems = count > 0;

              return (
                <button
                  key={`ar-${letter}`}
                  onClick={() => onSelectLetter(isSelected ? null : letter)}
                  title={hasItems ? `${count} مرجع يبدأ بحرف ${letter}` : `لا توجد مراجع مسجلة بحرف ${letter}`}
                  className={`relative min-w-[28px] h-7 px-1 flex items-center justify-center rounded text-xs font-citation font-bold transition-all ${
                    isSelected
                      ? 'bg-[#7D2433] text-white shadow-sm ring-1 ring-[#7D2433]'
                      : hasItems
                      ? 'bg-white text-[#1F2937] hover:bg-[#7D2433]/10 hover:text-[#7D2433] border border-[#D5CEC2]'
                      : 'bg-transparent text-[#9CA3AF] opacity-50 cursor-pointer hover:opacity-80'
                  }`}
                >
                  <span>{letter}</span>
                  {hasItems && !isSelected && (
                    <span className="absolute -top-1 -right-1 text-[9px] w-3.5 h-3.5 bg-[#1E252B] text-white rounded-full flex items-center justify-center font-sans font-normal scale-90">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Latin letters */}
        {(activeCharset === 'both' || activeCharset === 'latin') && (
          <div className="flex flex-wrap items-center gap-1 bg-[#F4F1EA] p-1 rounded-lg border border-[#E7E2D8]">
            <span className="text-[10px] text-[#8C827A] px-1 font-bold">LAT:</span>
            {LATIN_LETTERS.map((letter) => {
              const count = letterCounts[letter] || 0;
              const isSelected = selectedLetter === letter;
              const hasItems = count > 0;

              return (
                <button
                  key={`la-${letter}`}
                  onClick={() => onSelectLetter(isSelected ? null : letter)}
                  title={hasItems ? `${count} reference(s) starting with '${letter}'` : `No references under '${letter}'`}
                  className={`relative min-w-[26px] h-7 px-1 flex items-center justify-center rounded text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-[#7D2433] text-white shadow-sm ring-1 ring-[#7D2433]'
                      : hasItems
                      ? 'bg-white text-[#1F2937] hover:bg-[#7D2433]/10 hover:text-[#7D2433] border border-[#D5CEC2]'
                      : 'bg-transparent text-[#9CA3AF] opacity-50 cursor-pointer hover:opacity-80'
                  }`}
                >
                  <span>{letter}</span>
                  {hasItems && !isSelected && (
                    <span className="absolute -top-1 -right-1 text-[9px] w-3.5 h-3.5 bg-[#1E252B] text-white rounded-full flex items-center justify-center font-sans font-normal scale-90">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
