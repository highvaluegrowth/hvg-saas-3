'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CreateTenantPage() {
  const router = useRouter();
  const { user, refreshToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await authService.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant');
      }

      // Get tenantId directly from API response - don't wait for claim propagation
      const newTenantId = data.tenant.id;

      // Attempt token refresh in background (best-effort, don't block navigation)
      refreshToken().catch(() => {});

      // Navigate immediately using the known tenant ID
      router.push(`/${newTenantId}`);
    } catch (err: any) {
      console.error('Error creating tenant:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create Your Organization
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your recovery house management platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Sunrise Recovery"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL Slug
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  app.hvg.com/
                </span>
                <Input
                  id="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="sunrise-recovery"
                  className="rounded-l-none"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.name || !formData.slug}
          >
            {isLoading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </div>
    </div>
  );
}
