import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { HeroSection } from '@/components/marketing/HeroSection';
import { ProblemSection } from '@/components/marketing/ProblemSection';
import { PlatformSection } from '@/components/marketing/PlatformSection';
import { AIRecoverySection } from '@/components/marketing/AIRecoverySection';
import { SocialProofSection } from '@/components/marketing/SocialProofSection';
import { DemoCTASection } from '@/components/marketing/DemoCTASection';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function LandingPage() {
    return (
        <main>
            <MarketingNavbar />
            <HeroSection />
            <Link href="/pricing" className="text-sm font-semibold leading-6 text-slate-900 border-b-2 border-transparent hover:border-emerald-600 transition-colors">
                Pricing
            </Link>
            <Link href="/transparency" className="text-sm font-semibold leading-6 text-slate-900 border-b-2 border-transparent hover:emerald-cyan-600 transition-colors">
                Transparency
            </Link>
            <Link href="/donate" className="text-sm font-semibold leading-6 text-slate-900 border-b-2 border-transparent hover:border-emerald-600 transition-colors">
                Donate
            </Link>
            <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
                <ProblemSection />
                <PlatformSection />
                <AIRecoverySection />
                <SocialProofSection />
                <DemoCTASection />
                <MarketingFooter />
        </main>
    );
}
