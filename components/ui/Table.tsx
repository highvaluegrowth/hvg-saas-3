import { cn } from '@/lib/utils/cn';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-border', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className, ...props }: TableSectionProps) {
  return (
    <thead className={cn('bg-muted/50', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: TableSectionProps) {
  return (
    <tbody className={cn('bg-card divide-y divide-border', className)} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
}

export function TableRow({ children, className, ...props }: TableRowProps) {
  return (
    <tr className={cn('hover:bg-muted/50 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
  as?: 'th' | 'td';
}

export function TableCell({ children, className, as = 'td', ...props }: TableCellProps) {
  const Component = as;

  return (
    <Component
      className={cn(
        'px-6 py-4 text-sm',
        as === 'th'
          ? 'text-left font-medium text-muted-foreground uppercase tracking-wider'
          : 'text-foreground',
        className
      )}
      {...props as any}
    >
      {children}
    </Component>
  );
}
