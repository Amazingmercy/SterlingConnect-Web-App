import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'We couldn’t load this information. Please try again.',
  onRetry,
  className = 'p-8 text-center bg-white rounded-xl border border-[#e4eaf0]',
}) => {
  return (
    <div className={`space-y-4 max-w-md mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
        <AlertCircle size={22} />
      </div>
      <p className="text-sm font-medium text-[#102641]">
        {message}
      </p>
      {onRetry && (
        <div className="pt-1">
          <Button variant="primary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
