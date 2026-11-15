import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variantStyle?: 'default' | 'search';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, variantStyle = 'default', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const isSearch = variantStyle === 'search';

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[12px] font-bold text-[#102641] tracking-tight"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              // Default input specs from index.css: 11px padding, 7px radius, borders #e4eaf0
              'w-full p-[11px] text-[13px] rounded-[7px] bg-white border border-[#e4eaf0] text-[#10223c] placeholder:text-[#627086] transition-colors',
              'focus:outline-none focus-visible:outline-[#90cfc0] focus-visible:outline-[3px] focus-visible:outline-offset-2',
              // Search input specs: 54px high, 10px radius
              isSearch && 'h-[54px] rounded-[10px] text-[13px] px-5 max-w-[720px]',
              error && 'border-red-400 focus-visible:outline-red-400',
              className
            )
          )}
          {...props}
        />
        {error && <span className="text-[11px] font-medium text-red-600">{error}</span>}
        {!error && helperText && (
          <span className="text-[11px] text-[#627086]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
