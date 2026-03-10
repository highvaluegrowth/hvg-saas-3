import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/80 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm',
            'bg-white/5 text-white placeholder-white/40',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500',
            'disabled:bg-white/10 disabled:cursor-not-allowed',
            'sm:text-sm resize-vertical',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
