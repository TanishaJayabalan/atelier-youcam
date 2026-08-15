'use client';

import React from 'react';
import { Sun, Moon, AlertTriangle, ShieldCheck, CheckCircle2, Droplets } from 'lucide-react';
import { SkincareStepRec } from '@/lib/recommendation-engine';

interface SkincareRoutineCardProps {
  warnings: string[];
  amSteps: SkincareStepRec[];
  pmSteps: SkincareStepRec[];
}

export default function SkincareRoutineCard({
  warnings,
  amSteps,
  pmSteps,
}: SkincareRoutineCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-amber-700" />
            AI Adaptive Skincare Routine
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Formulated from your owned skincare products, adapted for today&apos;s skin metrics &amp; weather.
          </p>
        </div>
      </div>

      {/* Routine Warnings / Safety banners */}
      {warnings.length > 0 && (
        <div className="mb-5 space-y-2">
          {warnings.map((warning, idx) => (
            <div
              key={idx}
              className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-950"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Routine Adjustment: </span>
                {warning}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AM & PM Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* AM Routine Column */}
        <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-200">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Morning Routine (AM)</h4>
                <p className="text-[10px] text-stone-500">Hydration, antioxidant defense &amp; SPF seal</p>
              </div>
            </div>

            <div className="space-y-3">
              {amSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-stone-200/80 shadow-2xs text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 text-[11px] uppercase tracking-wider">
                      Step {idx + 1}: {step.stepCategory}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="font-semibold text-stone-900 mt-0.5">{step.productName}</div>
                  <p className="text-stone-600 text-[11px] mt-1 leading-relaxed">
                    {step.actionNote}
                  </p>
                  {step.activeIngredients && step.activeIngredients.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.activeIngredients.map((act) => (
                        <span
                          key={act}
                          className="text-[9px] bg-stone-100 text-stone-600 font-medium px-1.5 py-0.5 rounded"
                        >
                          {act.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PM Routine Column */}
        <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Night Routine (PM)</h4>
                <p className="text-[10px] text-stone-500">Barrier recovery &amp; nocturnal replenishment</p>
              </div>
            </div>

            <div className="space-y-3">
              {pmSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border shadow-2xs text-xs ${
                    step.isModified
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-white border-stone-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold text-[11px] uppercase tracking-wider ${
                        step.isModified ? 'text-amber-800' : 'text-stone-700'
                      }`}
                    >
                      Step {idx + 1}: {step.stepCategory}
                    </span>
                    {step.isModified ? (
                      <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full">
                        Modified
                      </span>
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </div>
                  <div className="font-semibold text-stone-900 mt-0.5">{step.productName}</div>
                  <p className="text-stone-600 text-[11px] mt-1 leading-relaxed">
                    {step.actionNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
