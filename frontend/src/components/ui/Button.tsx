import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'signin' | 'white' | 'ghost' | 'mint' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles following index.css:176 (.btn)
    const baseStyles =
      'inline-flex items-center justify-center font-bold text-[12px] border transition-all duration-200 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0';

    const variants = {
      primary:
        'bg-[#087b63] text-white border-transparent hover:bg-[#05644f] shadow-[0_7px_16px_rgba(8,123,99,0.20)]',
      danger:
        'bg-red-600 text-white border-transparent hover:bg-red-700 shadow-[0_7px_16px_rgba(220,38,38,0.20)]',
      secondary:
        'bg-white text-[#17304a] border-[#cdd9df] hover:border-[#b8dcd0] hover:bg-slate-50 shadow-xs',
      signin:
        'bg-[#086b58] text-white border-transparent hover:bg-[#05644f] rounded-[22px] px-5 py-[11px] shadow-xs',
      white:
        'bg-white text-[#087b63] border-transparent hover:bg-[#f0f6f4] shadow-xs',
      ghost:
        'bg-transparent text-[#627086] border-transparent hover:text-[#087b63] hover:bg-slate-100',
      mint:
        'bg-[#e3f4ed] text-[#05644f] border-[#bddbd1] hover:bg-[#d8eee6]',
    };

    const sizes = {
      sm: 'px-3.5 py-2 text-[11px] rounded-[7px] gap-1.5',
      md: 'px-[18px] py-[13px] text-[12px] rounded-[8px] gap-2',
      lg: 'px-6 py-3.5 text-[13px] rounded-[8px] gap-2.5',
    };

    const isCustomPill = variant === 'signin';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            baseStyles,
            variants[variant],
            !isCustomPill && sizes[size],
            className
          )
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
