import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'mint' | 'peach' | 'blue' | 'lilac' | 'yellow' | 'navy' | 'slate';
  size?: 'sm' | 'md' | 'chip';
  active?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'mint',
  size = 'md',
  active = false,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-bold tracking-tight rounded-full transition-colors';

  const variants = {
    mint: 'bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1]',
    peach: 'bg-[#fff0e4] text-[#b66b25] border border-[#f5d5be]',
    blue: 'bg-[#e9f0ff] text-[#4164bd] border border-[#cbd9fa]',
    lilac: 'bg-[#f0eaff] text-[#8054c8] border border-[#dccff8]',
    yellow: 'bg-[#fff6d9] text-[#b28722] border border-[#f2e1a8]',
    navy: 'bg-[#102641] text-white border border-[#102641]',
    slate: 'bg-white text-[#42516a] border border-[#e4eaf0]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-3 py-1',
    // Exact filter chip specs from index.css:890: 11px bold, 9px 16px padding, 30px radius
    chip: 'text-[11px] px-4 py-[9px] rounded-[30px] font-bold cursor-pointer',
  };

  return (
    <span
      className={twMerge(
        clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          active && 'bg-[#087b63] text-white border-[#087b63]',
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
