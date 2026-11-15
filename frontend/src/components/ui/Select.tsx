import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[12px] font-bold text-[#102641] tracking-tight"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={twMerge(
              clsx(
                // Select specs from index.css: 11px padding, 7px radius, border #e4eaf0
                'w-full p-[11px] text-[13px] rounded-[7px] bg-white border border-[#e4eaf0] text-[#10223c] transition-colors appearance-none pr-9',
                'focus:outline-none focus-visible:outline-[#90cfc0] focus-visible:outline-[3px] focus-visible:outline-offset-2',
                error && 'border-red-400 focus-visible:outline-red-400',
                className
              )
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#627086]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-[11px] font-medium text-red-600">{error}</span>}
        {!error && helperText && (
          <span className="text-[11px] text-[#627086]">{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
