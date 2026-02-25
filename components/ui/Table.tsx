import { cn } from '@/lib/utils/cn';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-gray-50', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn('hover:bg-gray-50 transition-colors', className)}>
      {children}
    </tr>
  );
}

interface TableCellProps extends TableProps {
  as?: 'th' | 'td';
}

export function TableCell({ children, className, as = 'td' }: TableCellProps) {
  const Component = as;

  return (
    <Component
      className={cn(
        'px-6 py-4 text-sm',
        as === 'th'
          ? 'text-left font-medium text-gray-500 uppercase tracking-wider'
          : 'text-gray-900',
        className
      )}
    >
      {children}
    </Component>
  );
}
