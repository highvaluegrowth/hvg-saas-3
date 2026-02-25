import { ErrorLayout } from '@/components/ui/ErrorLayout';

export default function UnauthorizedPage() {
  return (
    <ErrorLayout
      statusCode={403}
      title="Access Denied"
      description="You don't have permission to access this resource. If you believe this is an error, please contact your administrator."
      actionLabel="Go to Login"
      actionHref="/login"
      icon={
        <svg
          className="w-24 h-24 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      }
    />
  );
}
