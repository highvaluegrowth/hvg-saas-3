import { ErrorLayout } from '@/components/ui/ErrorLayout';

export default function NotFound() {
  return (
    <ErrorLayout
      statusCode={404}
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
      actionLabel="Go to Homepage"
      actionHref="/"
      icon={
        <svg
          className="w-24 h-24 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
    />
  );
}
