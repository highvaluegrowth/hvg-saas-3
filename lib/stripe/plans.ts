// lib/stripe/plans.ts

export interface PlanConfig {
  id: 'free' | 'starter' | 'professional' | 'enterprise';
  name: string;
  description: string;
  monthlyPrice: number; // in dollars
  annualPrice: number;
  monthlyPriceId: string; // Stripe Price ID env var name
  annualPriceId: string;
  features: string[];
  maxResidents: number | null;
  maxHouses: number | null;
  highlighted?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the essentials',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceId: '',
    annualPriceId: '',
    features: ['Up to 10 residents', '1 house', 'Basic dashboard', 'HVG Companion AI (limited)'],
    maxResidents: 10,
    maxHouses: 1,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For growing recovery homes',
    monthlyPrice: 99,
    annualPrice: 990,
    monthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
    annualPriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? '',
    features: ['Up to 50 residents', '3 houses', 'Full AI tools', 'LMS course builder', 'Application management'],
    maxResidents: 50,
    maxHouses: 3,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Scale your organization',
    monthlyPrice: 249,
    annualPrice: 2490,
    monthlyPriceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '',
    annualPriceId: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL ?? '',
    features: ['Unlimited residents', '10 houses', 'Marketing suite', 'Social media publishing', 'Priority support'],
    maxResidents: null,
    maxHouses: 10,
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large networks',
    monthlyPrice: 599,
    annualPrice: 5990,
    monthlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
    annualPriceId: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ?? '',
    features: ['Unlimited everything', 'Unlimited houses', 'White-label option', 'Dedicated support', 'Custom integrations'],
    maxResidents: null,
    maxHouses: null,
  },
];
