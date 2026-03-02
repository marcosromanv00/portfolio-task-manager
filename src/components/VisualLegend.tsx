"use client";

import React, { useState } from "react";
import { Info, X } from "lucide-react";

export function VisualLegend() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-6 right-6 md:right-32 z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-lg"
        title="Show Legend"
      >
        <Info size={20} />
      </button>
    );
  }

  return (
    <div className="absolute top-6 right-6 md:right-32 z-10 w-64 glass-panel rounded-2xl p-4 text-sm text-slate-200 shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Info size={16} className="text-blue-400" />
          How it works
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-400 flex-shrink-0 flex items-center justify-center mt-0.5 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-blue-500/50" />
          </div>
          <div>
            <p className="font-medium text-white/90">Size = Urgency</p>
            <p className="text-xs text-slate-400">
              Bigger bubbles are more important or near their deadline.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/40 flex-shrink-0 flex items-center justify-center mt-0.5 animate-pulse shadow-sm">
            <div className="w-4 h-4 rounded-full bg-rose-500/80" />
          </div>
          <div>
            <p className="font-medium text-white/90">Pulse = Needs Attention</p>
            <p className="text-xs text-slate-400">
              Faster pulsing means a deadline is approaching quickly.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 flex-shrink-0 flex flex-wrap gap-1 items-center justify-center mt-0.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
          </div>
          <div>
            <p className="font-medium text-white/90">Border = Category</p>
            <p className="text-xs text-slate-400">
              Colors indicate the project or type of task.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
