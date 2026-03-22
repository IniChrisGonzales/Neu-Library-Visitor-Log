import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', loading = false }) {
  // Swapped dark gradients for soft, light-theme tinted containers
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    purple: 'bg-violet-50 text-violet-600 border-violet-100',
    pink: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const selectedColor = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex justify-between items-start gap-4">
        
        {/* Text and Value */}
        <div>
          <p className="text-slate-500 text-xs font-semibold mb-2 uppercase tracking-wide">
            {title}
          </p>
          {loading ? (
            <div className="h-9 bg-slate-100 rounded-lg animate-pulse w-24"></div>
          ) : (
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {value}
            </p>
          )}
        </div>

        {/* Icon Container */}
        <div className={`p-3.5 rounded-xl border ${selectedColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" strokeWidth={2.5} />
        </div>
        
      </div>
    </div>
  );
}