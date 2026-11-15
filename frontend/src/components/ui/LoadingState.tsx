import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Getting things ready…',
  className = 'min-h-[40vh]',
}) => {
  return (
    <div className={`flex flex-col justify-center items-center gap-3 ${className}`}>
      <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#087b63]" />
      <span className="text-xs font-medium text-[#627086]">{message}</span>
    </div>
  );
};
