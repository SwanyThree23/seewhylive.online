import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-6">
        <Link to={createPageUrl('Home')}>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 4, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Account data:</strong> name, email address, profile photo, bio</li>
              <li><strong>Payment data:</strong> handled entirely by Stripe — we do not store raw card numbers</li>
              <li><strong>Content:</strong> streams, chat messages, VODs, communities you create</li>
              <li><strong>Usage data:</strong> pages visited, rooms joined, interactions, device info</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, operate, and improve the Platform</li>
              <li>To process payments and pay out creator revenue</li>
              <li>To send you notifications, product updates, and newsletters (opt-out available)</li>
              <li>To enforce our Terms of Service and moderate content</li>
              <li>To generate aggregate analytics (never sold to third parties)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Information Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Stripe:</strong> for payment processing</li>
              <li><strong>Infrastructure providers:</strong> hosting, CDN, and storage services under strict data processing agreements</li>
              <li><strong>Law enforcement:</strong> only when required by law or to protect safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Cookies & Tracking</h2>
            <p>We use essential cookies for authentication and session management. We use analytics cookies to understand usage patterns. You can disable non-essential cookies in your browser settings. We do not use cross-site tracking or sell data to ad networks.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Deleted accounts are purged within 30 days. Chat messages and stream recordings may be retained for up to 90 days post-deletion for safety review purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access and download your personal data (via Data Export)</li>
              <li>Correct inaccurate data in your account settings</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Lodge a complaint with your local data protection authority (EU/UK residents)</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:privacy@seewhy.live" className="text-[#5B7FA6] underline">privacy@seewhy.live</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Children's Privacy</h2>
            <p>SeeWhy LIVE is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we discover such data has been collected, we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Security</h2>
            <p>We implement industry-standard security measures including encryption in transit (TLS), access controls, and regular security audits. No system is 100% secure — we cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Changes to This Policy</h2>
            <p>We will notify users of material changes to this Privacy Policy via email or in-app notification at least 14 days before changes take effect.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Contact</h2>
            <p>For privacy inquiries: <a href="mailto:privacy@seewhy.live" className="text-[#5B7FA6] underline">privacy@seewhy.live</a></p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t flex gap-4">
          <Link to={createPageUrl('TermsOfService')}>
            <button style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}>Terms of Service</button>
          </Link>
          <Link to={createPageUrl('Home')}>
            <button style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer' }}>Back to SeeWhy LIVE</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
