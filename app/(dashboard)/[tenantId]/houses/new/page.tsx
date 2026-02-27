'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';
import type { CreateHouseInput } from '@/features/houses/types/house.types';

interface NewHousePageProps {
  params: Promise<{ tenantId: string }>;
}

interface FormErrors {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  capacity?: string;
  general?: string;
}

const US_STATES = [
  { value: '', label: 'Select state...' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function NewHousePage({ params }: NewHousePageProps) {
  const { tenantId } = use(params);
  const router = useRouter();

  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'House name is required.';
    if (!street.trim()) errs.street = 'Street address is required.';
    if (!city.trim()) errs.city = 'City is required.';
    if (!state) errs.state = 'State is required.';
    if (!zip.trim()) errs.zip = 'ZIP code is required.';
    const cap = Number(capacity);
    if (!capacity || isNaN(cap) || cap < 1) {
      errs.capacity = 'Capacity must be a positive number.';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const token = await authService.getIdToken();
      const body: CreateHouseInput = {
        name: name.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state,
          zip: zip.trim(),
        },
        capacity: Number(capacity),
        status,
      };
      if (phone.trim()) {
        body.phone = phone.trim();
      }

      const res = await fetch(`/api/tenants/${tenantId}/houses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.errors && typeof data.errors === 'object') {
          // Zod field errors
          const fieldErrors: FormErrors = {};
          for (const [field, messages] of Object.entries(data.errors)) {
            const msg = Array.isArray(messages) ? messages[0] : String(messages);
            (fieldErrors as Record<string, string>)[field] = msg;
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.message || data.error || 'Failed to create house. Please try again.' });
        }
        return;
      }

      router.push(`/${tenantId}/houses`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrors({ general: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New House</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Fill in the details below to add a new sober-living house.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">House Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            {/* House Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunrise Recovery House"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Address */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Address</legend>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Street <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main St"
                    className={errors.street ? 'border-red-500' : ''}
                  />
                  {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Springfield"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="12345"
                      className={errors.zip ? 'border-red-500' : ''}
                    />
                    {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
                  </div>
                </div>

                <div>
                  <Select
                    label="State *"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    options={US_STATES}
                    error={errors.state}
                  />
                </div>
              </div>
            </fieldset>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                type="tel"
              />
            </div>

            {/* Capacity and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <Input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="10"
                  type="number"
                  min="1"
                  className={errors.capacity ? 'border-red-500' : ''}
                />
                {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
              </div>
              <div>
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
              <Link href={`/${tenantId}/houses`}>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {submitting ? 'Creating...' : 'Create House'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
