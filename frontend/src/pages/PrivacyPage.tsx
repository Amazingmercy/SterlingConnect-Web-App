import React from 'react';
import { Card } from '../components/ui/Card';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Card className="p-8 sm:p-10 space-y-6">
        <div>
          <h1 className="font-brand font-bold text-3xl text-sterling-navy tracking-tight">
            Privacy Notice
          </h1>
          <p className="text-xs text-sterling-muted mt-1">
            Last Updated: October 2026 &bull; MVP Version 1.0
          </p>
        </div>

        <section className="space-y-3 text-xs text-sterling-muted leading-relaxed">
          <h2 className="font-brand font-bold text-sm text-sterling-navy">
            1. Information We Collect
          </h2>
          <p>
            When you register, build a profile, and complete assessments on Sterling Connect, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Basic account data (name, email address, country of residence, nationality).</li>
            <li>Academic and professional profile attributes (qualifications, career level, disciplines, target countries).</li>
            <li>Readiness diagnostic responses and self-reported application statuses.</li>
            <li>Uploaded documents (such as your CV or transcript, if voluntarily uploaded).</li>
          </ul>
        </section>

        <section className="space-y-3 text-xs text-sterling-muted leading-relaxed">
          <h2 className="font-brand font-bold text-sm text-sterling-navy">
            2. How Your Data Is Used
          </h2>
          <p>
            Your information is used exclusively to generate personalized readiness reports, calculate transparent opportunity matches, recommend relevant learning resources, and power your application tracking pipeline. We do not sell your personal data to third-party recruiters or advertising networks.
          </p>
        </section>

        <section className="space-y-3 text-xs text-sterling-muted leading-relaxed">
          <h2 className="font-brand font-bold text-sm text-sterling-navy">
            3. Data Retention &amp; Security
          </h2>
          <p>
            We implement industry-standard encryption, strict database access controls, and secure session management. You retain full control to update your profile preferences, export your data, or request account deletion at any time via your Account Settings.
          </p>
        </section>
      </Card>
    </div>
  );
};
