import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-6">
        <Link to={createPageUrl('Home')}>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 4, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using SeeWhy LIVE ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Eligibility</h2>
            <p>You must be at least 13 years of age to use SeeWhy LIVE. By using the Platform, you represent and warrant that you meet this requirement. If you are under 18, you represent that a parent or legal guardian has reviewed and agreed to these Terms on your behalf.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Content & Conduct</h2>
            <p>Users may not post, stream, or share content that:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains explicit sexual content involving minors</li>
              <li>Promotes violence, terrorism, or hate speech</li>
              <li>Constitutes spam or deceptive practices</li>
            </ul>
            <p className="mt-2">We use AI-assisted moderation to enforce these rules and reserve the right to remove content or ban users at our discretion.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Payments & Creator Revenue</h2>
            <p>SeeWhy LIVE facilitates payments between viewers and creators. Creators receive 90% of subscription and tip revenue. Payments are processed by Stripe. All transactions are subject to Stripe's terms. We are not responsible for payment disputes between users.</p>
            <p className="mt-2">Refund requests must be submitted within 7 days of a transaction. Refunds are granted at our sole discretion for platform errors. Voluntary tips and donations are non-refundable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Intellectual Property</h2>
            <p>You retain ownership of content you create and broadcast. By using the Platform, you grant SeeWhy LIVE a non-exclusive, royalty-free license to display, distribute, and promote your content within the Platform. You may not use our trademarks, logos, or brand assets without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Limitation of Liability</h2>
            <p>SeeWhy LIVE is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the Platform, including loss of revenue, data, or goodwill.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Termination</h2>
            <p>We may terminate or suspend your access at any time for any reason, including violations of these Terms. You may close your account at any time from your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify users of material changes via email or in-app notification. Continued use after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Governing Law</h2>
            <p>These Terms are governed by the laws of the United States without regard to conflict of law provisions. Any disputes shall be resolved by binding arbitration in accordance with the American Arbitration Association rules.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:legal@seewhy.live" className="text-[#D4AF37] underline">legal@seewhy.live</a>.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t flex gap-4">
          <Link to={createPageUrl('PrivacyPolicy')}>
            <button style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}>Privacy Policy</button>
          </Link>
          <Link to={createPageUrl('Home')}>
            <button style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer' }}>Back to SeeWhy LIVE</button>
          </Link>
        </div>
      </div>
    </div>
  );
}