import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata = {
  title: 'Privacy Policy | High Value Growth',
  description: 'How High Value Growth collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <main>
      <MarketingNavbar />

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Page Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-10">Effective Date: March 1, 2026 &nbsp;|&nbsp; High Value Growth LLC</p>

          {/* 1. Introduction */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            High Value Growth LLC ("HVG," "we," "us," or "our") operates the High Value Growth platform,
            accessible at <span className="font-medium">hvg.app</span> and via the HVG mobile application
            (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, and
            safeguard your personal information when you use our Service.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            By accessing or using the Service you agree to the collection and use of information as described
            in this policy. If you do not agree, please discontinue use of the Service.
          </p>

          {/* 2. Information We Collect */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Information We Collect</h2>

          <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Account Information</h3>
          <p className="text-gray-600 leading-relaxed">
            When you register for the Service, we collect your full name, email address, and phone number.
            This information is processed through Firebase Authentication (Google LLC) to create and manage
            your account and to enable secure login.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Organization Information</h3>
          <p className="text-gray-600 leading-relaxed">
            Partner tenants (sober-living house operators) provide additional information including house name,
            physical address, state licensing information, and organizational details needed to configure their
            tenant workspace on the platform.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Usage Data</h3>
          <p className="text-gray-600 leading-relaxed">
            We automatically collect information about how you interact with the Service, including pages
            visited, features used, click events, session duration, and timestamps. This data is processed
            through Firebase Analytics and is used in aggregate to improve the platform.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">AI Chat Transcripts</h3>
          <p className="text-gray-600 leading-relaxed">
            When you use the HVG Companion or HVG Partner AI assistants, your conversation messages and
            the AI-generated responses are stored in our Firestore database. These transcripts are accessible
            only to the authenticated user and, where applicable, to authorized staff members within the same
            tenant organization. Transcripts are retained for 90 days and then automatically purged.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Social Media OAuth Tokens</h3>
          <p className="text-gray-600 leading-relaxed">
            If you choose to connect a Facebook or Instagram account through our Marketing Suite, we receive
            and store OAuth access tokens issued by Meta Platforms. These tokens are encrypted at rest in our
            database and are used solely to publish social media content on your behalf at your explicit
            direction. We do not read your personal social media feed, contacts, or private messages. You may
            revoke access at any time from your account settings or directly through the Facebook/Instagram
            app settings.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Mobile Device Information</h3>
          <p className="text-gray-600 leading-relaxed">
            The HVG mobile application (built with Expo) may collect device type, operating system version,
            and Expo push notification tokens. Push tokens are used exclusively to deliver in-app
            notifications (e.g., check-in reminders, message alerts) to your device.
          </p>

          {/* 3. How We Use Your Information */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
            <li>Provide, operate, and maintain the Service and your account.</li>
            <li>Authenticate your identity and enforce role-based access controls.</li>
            <li>Personalize AI assistant responses based on your organization context and conversation history.</li>
            <li>Send transactional notifications (password resets, billing receipts, security alerts).</li>
            <li>Publish social media posts on your behalf when you use the Marketing Suite.</li>
            <li>Analyze aggregate usage patterns to improve platform features and reliability.</li>
            <li>Comply with applicable legal obligations and respond to lawful requests.</li>
            <li>Investigate and prevent fraud, abuse, or violations of our Terms of Service.</li>
          </ul>

          {/* 4. Data Sharing */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Data Sharing and Disclosure</h2>
          <p className="text-gray-600 leading-relaxed">
            We do not sell, rent, or trade your personal information to third parties for their own marketing
            purposes. We share data only in the following limited circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>
              <span className="font-medium">Firebase / Google LLC</span> — cloud infrastructure, authentication,
              database, and analytics. Data processed under Google's data processing agreements.
            </li>
            <li>
              <span className="font-medium">Google Gemini AI</span> — AI chat transcripts are sent to the
              Gemini API for response generation. We transmit only the conversation context necessary to
              generate a response; we do not transmit names, account identifiers, or other PII as part of
              AI prompts.
            </li>
            <li>
              <span className="font-medium">Meta Platforms (Facebook / Instagram)</span> — only if you
              explicitly connect a social account. We transmit post content and media to the Meta Graph API
              using your OAuth token to publish on your behalf.
            </li>
            <li>
              <span className="font-medium">Stripe, Inc.</span> — payment card data and billing details for
              subscription processing. We do not store card numbers on our servers.
            </li>
            <li>
              <span className="font-medium">Expo (Expo Inc.)</span> — push notification tokens are shared
              with the Expo Push Notification Service to deliver device notifications.
            </li>
            <li>
              <span className="font-medium">Legal requirements</span> — we may disclose information if
              required by law, subpoena, or to protect the safety of any person.
            </li>
          </ul>

          {/* 5. Data Security */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement industry-standard technical and organizational safeguards to protect your
            information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li>Firestore security rules enforce tenant isolation — no tenant can access another tenant's data.</li>
            <li>Role-based access controls (RBAC) via Firebase custom claims limit data access by user role.</li>
            <li>OAuth access tokens are encrypted at rest using AES-256 encryption before storage.</li>
            <li>All data in transit is encrypted via TLS 1.2+.</li>
            <li>Firebase Authentication tokens are short-lived and automatically refreshed.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            No method of transmission over the internet is 100% secure. While we strive to protect your
            data, we cannot guarantee absolute security.
          </p>

          {/* 6. HIPAA Notice */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. HIPAA Notice</h2>
          <p className="text-gray-600 leading-relaxed">
            High Value Growth LLC is not a HIPAA Covered Entity or Business Associate as defined under the
            Health Insurance Portability and Accountability Act (HIPAA). We are HIPAA-aware and design the
            platform with privacy best practices in mind; however, the Service is not certified for the
            storage or transmission of Protected Health Information (PHI).
          </p>
          <p className="text-gray-600 leading-relaxed mt-3 font-medium">
            Do not input Protected Health Information — including clinical diagnoses, treatment records,
            insurance information, or other PHI — into any part of the HVG platform.
          </p>

          {/* 7. Data Retention */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Data Retention</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
            <li>Account and organization data is retained for as long as your account remains active.</li>
            <li>Upon account deletion, personal data is removed from our systems within 30 days.</li>
            <li>AI chat history is retained for 90 days from the date of each message, then automatically purged.</li>
            <li>Billing records may be retained for up to 7 years as required by applicable financial regulations.</li>
            <li>Backup copies may persist for up to an additional 30 days beyond the deletion window.</li>
          </ul>

          {/* 8. Your Rights */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            Depending on your jurisdiction, you may have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3">
            <li><span className="font-medium">Access</span> — request a copy of the data we hold about you.</li>
            <li><span className="font-medium">Correction</span> — request correction of inaccurate or incomplete data.</li>
            <li><span className="font-medium">Export</span> — request a machine-readable export of your data.</li>
            <li><span className="font-medium">Deletion</span> — request deletion of your account and associated data.</li>
            <li><span className="font-medium">Opt-out</span> — opt out of non-essential analytics or marketing communications.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@hvg.app" className="text-blue-600 hover:underline">privacy@hvg.app</a>.
            We will respond within 30 days.
          </p>

          {/* 9. Children's Privacy */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Children&apos;s Privacy</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service is intended for users who are 18 years of age or older. We do not knowingly collect
            personal information from children under the age of 13. If you believe we have inadvertently
            collected information from a child, please contact us immediately at{' '}
            <a href="mailto:privacy@hvg.app" className="text-blue-600 hover:underline">privacy@hvg.app</a>{' '}
            and we will take steps to delete such information promptly.
          </p>

          {/* 10. Changes to This Policy */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. When we make material changes, we will
            notify you by email at least 14 days before the new policy takes effect. The updated policy will
            also be posted at <span className="font-medium">hvg.app/privacy</span> with a revised effective
            date. Your continued use of the Service after the effective date constitutes acceptance of the
            updated policy.
          </p>

          {/* 11. Contact */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-3 text-gray-600 leading-relaxed">
            <p className="font-medium">High Value Growth LLC</p>
            <p>
              Email:{' '}
              <a href="mailto:privacy@hvg.app" className="text-blue-600 hover:underline">privacy@hvg.app</a>
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
