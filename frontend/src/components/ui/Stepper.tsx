import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
}

export interface StepperProps {
  steps: StepItem[];
  activeStep: number; // 0-indexed
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, activeStep, className }) => {
  return (
    <div className={`w-full flex items-center justify-between max-w-xl mx-auto py-3 px-2 ${className || ''}`}>
      {steps.map((step, idx) => {
        const isDone = idx < activeStep;
        const isActive = idx === activeStep;
        const stepNumber = idx + 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step node */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-brand font-extrabold text-xs transition-all duration-200 select-none ${
                  isDone
                    ? 'bg-[#087b63] text-white shadow-xs'
                    : isActive
                    ? 'bg-[#102641] text-white ring-4 ring-[#e3f4ed] shadow-xs'
                    : 'bg-white text-[#102641] border-2 border-[#d0dbe5]'
                }`}
              >
                {isDone ? (
                  <Check size={16} strokeWidth={3} className="text-white" />
                ) : (
                  <span className="leading-none text-xs font-extrabold">{stepNumber}</span>
                )}
              </div>
              <span
                className={`text-[11px] font-bold mt-2 tracking-tight transition-colors ${
                  isActive
                    ? 'text-[#102641]'
                    : isDone
                    ? 'text-[#087b63]'
                    : 'text-[#627086]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting bar */}
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 transition-colors duration-200 ${
                  idx < activeStep ? 'bg-[#087b63]' : 'bg-[#e4eaf0]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
