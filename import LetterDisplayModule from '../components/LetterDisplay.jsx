import React from 'react';

const alphabetData = [
  { letter: 'أ', image: '/images/letters/alif.png', title: 'أسد' },
  { letter: 'ب', image: '/images/letters/baa.png', title: 'بطة' },
  { letter: 'ت', image: '/images/letters/taa.png', title: 'تاج' },
  { letter: 'ث', image: '/images/letters/thaa.png', title: 'ثوب' },
  { letter: 'ج', image: '/images/letters/jeem.png', title: 'جمل' },
];

export default function LetterDisplayModule() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
        صفحة التشخيص والتدريب النطقي
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {alphabetData.map((item, index) => (
          <div 
            key={index}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-md border-4 border-blue-100 hover:border-blue-400 transition-all duration-300"
          >
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-32 h-32 object-contain mb-4 filter drop-shadow-md"
            />
            <span className="text-6xl font-black text-blue-800 mb-1">
              {item.letter}
            </span>
            <span className="text-xl font-semibold text-gray-600">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
