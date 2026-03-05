import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { HeroSection } from '@/components/marketing/HeroSection';
import { ProblemSection } from '@/components/marketing/ProblemSection';
import { PlatformSection } from '@/components/marketing/PlatformSection';
import { AIRecoverySection } from '@/components/marketing/AIRecoverySection';
import { MarketingSection } from '@/components/marketing/MarketingSection';
import { OperationsSection } from '@/components/marketing/OperationsSection';
import { SocialProofSection } from '@/components/marketing/SocialProofSection';
import { DemoCTASection } from '@/components/marketing/DemoCTASection';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function LandingPage() {
    return (
        <main>
            <MarketingNavbar />
            <HeroSection />
            <ProblemSection />
            <PlatformSection />
            <AIRecoverySection />
            <MarketingSection />
            <OperationsSection />
            <SocialProofSection />
            <DemoCTASection />
            <MarketingFooter />
        </main>
    );
}
