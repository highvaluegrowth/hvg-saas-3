import Link from 'next/link';
import { Button } from './Button';

interface ErrorLayoutProps {
  title: string;
  description: string;
  statusCode?: number;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

export function ErrorLayout({
  title,
  description,
  statusCode,
  icon,
  actionLabel = 'Go to Homepage',
  actionHref = '/',
}: ErrorLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {statusCode && (
          <div className="text-6xl font-bold text-indigo-600">{statusCode}</div>
        )}

        {icon && <div className="flex justify-center">{icon}</div>}

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="pt-4">
          <Link href={actionHref}>
            <Button className="w-full sm:w-auto">{actionLabel}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
