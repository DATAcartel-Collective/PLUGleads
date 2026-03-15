import React from 'react';
import { ArrowRight } from 'lucide-react';
import BrandLogo from './BrandLogo';

const flowSections = [
  {
    kicker: "Google's Vertex AI",
    headline: "Google's Vertex AI evaluates roof condition signals from satellite imagery.",
    body:
      'Visible wear patterns and surface risk cues are blended into a lead quality score for execution teams.',
  },
  {
    kicker: 'Storm Intelligence',
    headline: 'Storm and hail pressure define where opportunity starts.',
    body:
      'PLUGleads prioritizes neighborhoods where weather impact patterns and claim behavior suggest immediate roof demand.',
  },
  {
    kicker: 'Permit Momentum',
    headline: 'Nearby roof permit activity shifts neighborhood priority upward.',
    body:
      'When surrounding homes are already replacing roofs, adjacent properties receive stronger weighting for outreach timing.',
  },
  {
    kicker: 'Property Signals',
    headline: 'Home value, equity depth, and ownership type shape close probability.',
    body:
      'Owner profile and property context are combined to surface accounts more likely to schedule and complete work.',
  },
  {
    kicker: 'Michiana Tuning',
    headline: 'Scoring is tuned for local behavior, not generic national assumptions.',
    body:
      'In the Michiana test region, expensive vehicles are down-weighted because they do not reliably indicate disposable income.',
  },
  {
    kicker: 'Execution Output',
    headline: 'Contractors receive ranked opportunities in a focused daily workflow.',
    body:
      'PLUGleads is built for lead execution speed, consistent follow-up, and disciplined pipeline movement.',
  },
];

const OperationsLanding = ({ onOpenLogin, onOpenDemo }) => (
  <div className="landing-bg min-h-screen px-4 py-6 text-slate-100 md:px-8 md:py-10">
    <div className="mx-auto w-full max-w-6xl">
      <header className="rounded-3xl border border-violet-200/20 bg-white/10 p-6 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 md:w-24">
              <BrandLogo
                src="/branding/PLUGleads_logo.jpg"
                sources={[
                  '/branding/PLUGleads_logo.jpg',
                  '/branding/PLUGleads_logo.jpeg',
                  '/branding/PLUGleads_logo.png',
                  '/PLUGleads_logo.jpg',
                  '/PLUGleads_logo.png',
                ]}
                alt="PLUGleads logo"
                className="aspect-square w-full"
                imgClassName="rounded-none"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">PLUGleads</h1>
              <p className="mt-1 text-base font-semibold text-violet-100 md:text-xl">by DATAcartel Collective</p>
            </div>
          </div>
          <div className="w-full max-w-[340px] md:self-start">
            <BrandLogo
              src="/branding/DATAcartel_logo.jpg"
              sources={[
                '/branding/DATAcartel_logo.jpg',
                '/branding/DATAcartel_logo.jpeg',
                '/branding/DATAcartel_logo.png',
                '/DATAcartel_logo.jpg',
                '/DATAcartel_logo.png',
              ]}
              alt="DATAcartel Collective logo"
              className="aspect-[2.5/1] w-full"
              imgClassName="rounded-none"
            />
          </div>
        </div>

        <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-200 md:text-xl">
          Ranked roofing opportunities, delivered in a fast workflow built for contractor execution.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-xl bg-violet-300 px-4 py-3 text-xs font-black tracking-wider text-slate-900 transition hover:bg-violet-200"
          >
            Enter PLUGleads <ArrowRight size={14} className="ml-1 inline" />
          </button>
          <button
            type="button"
            onClick={onOpenDemo}
            className="rounded-xl border border-violet-200/30 bg-white/10 px-4 py-3 text-xs font-black tracking-wider text-violet-100 transition hover:bg-white/20"
          >
            Preview Workflow
          </button>
        </div>
      </header>

      <main className="mt-6 space-y-4">
        {flowSections.map((section) => (
          <section
            key={section.kicker}
            className="relative flex min-h-[52vh] items-center rounded-3xl border border-violet-200/20 bg-white/10 p-7 backdrop-blur-xl md:min-h-[66vh] md:p-12"
          >
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">{section.kicker}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white md:text-6xl">
                {section.headline}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-200 md:text-2xl md:leading-relaxed">
                {section.body}
              </p>
            </div>
          </section>
        ))}
      </main>
    </div>
  </div>
);

export default OperationsLanding;

