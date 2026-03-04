import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata = {
  title: 'Terms of Service | High Value Growth',
  description: 'Terms and conditions for using the High Value Growth platform.',
};

export default function TermsOfServicePage() {
  return (
    <main>
      <MarketingNavbar />

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Page Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-10">Effective Date: March 1, 2026 &nbsp;|&nbsp; High Value Growth LLC</p>

          {/* 1. Acceptance of Terms */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using the High Value Growth platform (the "Service"), including the web application
            at <span className="font-medium">hvg.app</span> and the HVG mobile application, you agree to be
            bound by these Terms of Service ("Terms") and our{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. These Terms
            constitute a legally binding agreement between you and High Value Growth LLC ("HVG," "we," "us,"
            or "our").
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            If you are accepting these Terms on behalf of an organization, you represent that you have the
            authority to bind that organization. If you do not agree to these Terms, do not use the Service.
          </p>

          {/* 2. Description of Service */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed">
            High Value Growth is a cloud-based Software-as-a-Service (SaaS) platform designed for sober-living
            house operators and their residents. The Service includes, but is not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>Multi-tenant operator dashboard for house and resident management.</li>
            <li>Resident mobile application (HVG Companion) for recovery support.</li>
            <li>AI-powered assistants (HVG Companion and HVG Partner) built on Google Gemini.</li>
            <li>Learning Management System (LMS) for resident courses and coursework.</li>
            <li>Marketing suite for managing social media accounts and scheduling posts.</li>
            <li>Scheduling, incident reporting, and operational management tools.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            HVG reserves the right to modify, suspend, or discontinue any part of the Service at any time
            with reasonable notice.
          </p>

          {/* 3. Account Registration */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Account Registration</h2>
          <p className="text-gray-600 leading-relaxed">
            To access the Service you must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>Be at least 18 years of age.</li>
            <li>Provide accurate, current, and complete registration information.</li>
            <li>Maintain and promptly update your account information to keep it accurate.</li>
            <li>Keep your password confidential and not share access credentials with unauthorized parties.</li>
            <li>Notify us immediately at{' '}
              <a href="mailto:legal@hvg.app" className="text-blue-600 hover:underline">legal@hvg.app</a>{' '}
              of any unauthorized access to your account.
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            You are responsible for all activity that occurs under your account.
          </p>

          {/* 4. Permitted Use */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Permitted Use</h2>
          <p className="text-gray-600 leading-relaxed">
            You may use the Service solely for lawful purposes related to sober-living house management
            and recovery support. You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>Use the Service for any illegal purpose or in violation of any applicable laws.</li>
            <li>Reverse engineer, decompile, disassemble, or attempt to derive source code from the Service.</li>
            <li>Scrape, crawl, or programmatically extract data from the Service without written permission.</li>
            <li>Misuse or attempt to exploit AI features to generate harmful, deceptive, or illegal content.</li>
            <li>Upload malicious code, viruses, or any software intended to disrupt the Service.</li>
            <li>Impersonate another person or organization.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
          </ul>

          {/* 5. Tenant Obligations */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Tenant Obligations</h2>
          <p className="text-gray-600 leading-relaxed">
            Tenant administrators (sober-living house operators) who create a tenant workspace on HVG accept
            the following additional obligations:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>
              You are responsible for the data you collect, input, and manage on behalf of your residents
              and staff within your tenant workspace.
            </li>
            <li>
              You must comply with all applicable federal, state, and local laws, including state licensing
              requirements for sober-living or recovery residences, and any applicable privacy regulations.
            </li>
            <li>
              You acknowledge that HVG is not a HIPAA Business Associate, and you must not input Protected
              Health Information (PHI) into the platform.
            </li>
            <li>
              You are responsible for obtaining any necessary consents from your residents before collecting
              or processing their personal information through the Service.
            </li>
            <li>
              You must promptly notify HVG if you become aware of any unauthorized access to your tenant
              workspace or resident data.
            </li>
          </ul>

          {/* 6. AI-Generated Content */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. AI-Generated Content</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service includes AI-powered assistants (HVG Companion and HVG Partner) that generate
            responses using Google Gemini. You acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>
              AI-generated content is provided for informational and operational assistance purposes only.
              It does not constitute medical, clinical, psychological, legal, or financial advice.
            </li>
            <li>
              You must review all AI-generated content before acting on it or publishing it. HVG is not
              responsible for decisions made based on AI output.
            </li>
            <li>
              AI responses may contain errors, inaccuracies, or outdated information. Always verify
              critical information with qualified professionals.
            </li>
            <li>
              You retain responsibility for all content published using AI-assisted tools, including
              social media posts drafted or scheduled via the Marketing Suite.
            </li>
          </ul>

          {/* 7. Social Media Integration */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Social Media Integration</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service allows you to connect Facebook and Instagram accounts through Meta&apos;s OAuth
            authorization flow. By connecting a social media account, you:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>
              Authorize HVG to store your OAuth access token and use it to publish content on your behalf
              via the Meta Graph API.
            </li>
            <li>
              Remain solely responsible for all content published to your social media accounts through
              the Service, including compliance with Meta&apos;s Platform Terms and Community Standards.
            </li>
            <li>
              Acknowledge that HVG does not access your personal social media feed, private messages,
              or contacts beyond what is necessary to publish on your behalf.
            </li>
            <li>
              May revoke access at any time from your HVG account settings or directly through
              Facebook/Instagram app settings.
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Your use of the social media integration features is also subject to Meta&apos;s applicable
            terms of service and policies.
          </p>

          {/* 8. Payment Terms */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Payment Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            Access to certain features of the Service requires a paid subscription. By subscribing, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>
              Pay all fees for your selected subscription plan, billed on a monthly or annual basis as
              selected at the time of purchase.
            </li>
            <li>
              Authorize HVG to charge your payment method on file via Stripe on each billing cycle.
            </li>
            <li>
              No refunds will be issued for partial subscription periods, unused features, or early
              cancellations, except as required by applicable law.
            </li>
            <li>
              HVG may adjust subscription pricing with at least 30 days&apos; advance written notice.
              Continued use after the effective date of a price change constitutes acceptance of the new price.
            </li>
            <li>
              Failure to pay may result in suspension of your account. Access will be restored upon
              resolution of outstanding balances.
            </li>
          </ul>

          {/* 9. Intellectual Property */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            <span className="font-medium">HVG Platform.</span> The Service, including its software, design,
            features, trademarks, and documentation, is owned by High Value Growth LLC and is protected by
            copyright, trademark, and other applicable intellectual property laws. You may not copy,
            reproduce, distribute, or create derivative works from the platform without our express written
            permission.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            <span className="font-medium">Your Content.</span> You retain ownership of all data, content,
            and materials you upload or create within the Service ("Your Content"). By using the Service,
            you grant HVG a non-exclusive, worldwide, royalty-free license to host, store, process, and
            display Your Content solely as necessary to provide and improve the Service. This license
            terminates when you delete Your Content or close your account, subject to our data retention
            policy.
          </p>

          {/* 10. Limitation of Liability */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
            KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HVG SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
            PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF
            THE SERVICE, EVEN IF HVG HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            HVG&apos;s total cumulative liability to you for any claims arising under these Terms shall not
            exceed the total fees paid by you to HVG in the three (3) months immediately preceding the
            event giving rise to the claim.
          </p>

          {/* 11. Termination */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Termination</h2>
          <p className="text-gray-600 leading-relaxed">
            Either party may terminate these Terms at any time. You may close your account through your
            account settings or by contacting{' '}
            <a href="mailto:legal@hvg.app" className="text-blue-600 hover:underline">legal@hvg.app</a>.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            HVG may suspend or terminate your access to the Service immediately, without prior notice, if:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>You materially breach these Terms and fail to cure the breach within 10 days of notice.</li>
            <li>You engage in conduct that poses a risk to the Service, other users, or third parties.</li>
            <li>Required by applicable law or court order.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Upon termination, your right to access the Service ceases immediately. You may request an
            export of Your Content within 30 days of termination, after which data will be deleted in
            accordance with our retention policy.
          </p>

          {/* 12. Governing Law */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Governing Law and Dispute Resolution</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms are governed by and construed in accordance with the laws of the State of
            California, without regard to its conflict of law provisions.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            Any dispute, claim, or controversy arising out of or relating to these Terms or the Service
            shall be resolved by binding arbitration administered by the American Arbitration Association
            (AAA) under its Commercial Arbitration Rules. The arbitration shall be conducted in English,
            and the arbitrator&apos;s decision shall be final and binding. Notwithstanding the foregoing,
            either party may seek injunctive or other equitable relief in any court of competent
            jurisdiction to prevent irreparable harm.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            You waive any right to participate in a class action lawsuit or class-wide arbitration.
          </p>

          {/* 13. Contact */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">13. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions about these Terms, please contact us:
          </p>
          <div className="mt-3 text-gray-600 leading-relaxed">
            <p className="font-medium">High Value Growth LLC</p>
            <p>
              Email:{' '}
              <a href="mailto:legal@hvg.app" className="text-blue-600 hover:underline">legal@hvg.app</a>
            </p>
            <p>Website: <span className="font-medium">hvg.app</span></p>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-400">
            Last updated: March 1, 2026 &mdash; High Value Growth LLC. All rights reserved.
          </div>

        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
