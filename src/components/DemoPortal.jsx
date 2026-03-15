import React from 'react';
import { ArrowLeft, CalendarCheck, PhoneCall, Send, ShieldCheck } from 'lucide-react';

const demoRows = [
  { id: 'p1', zone: 'Evansville West Permit Cluster', score: 94, status: 'HOT' },
  { id: 'p2', zone: 'Newburgh Wind-Damage Segment', score: 87, status: 'NEW' },
  { id: 'p3', zone: 'Boonville Insurance Inquiry List', score: 79, status: 'IN_PROGRESS' },
];

const DemoPortal = ({ onLogin, onBack }) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#2a1554_0%,#140f2b_45%,#05030d_100%)] px-4 py-6 text-slate-100 md:px-8">
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-5 rounded-2xl border border-violet-200/20 bg-white/10 p-5 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Preview Mode</p>
        <h1 className="mt-1 text-2xl font-black uppercase tracking-tight md:text-4xl">
          Contractor Lead Operations Portal
        </h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-200/90 md:text-base">
          This is a read-only preview of the operations workspace. It shows queue management, ranked dialing flow,
          and one-tap follow-up execution.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-violet-200/30 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-violet-100 transition hover:bg-white/20"
            >
              <ArrowLeft size={14} className="mr-1 inline" />
              Back To Overview
            </button>
          ) : null}
          <button
            type="button"
            onClick={onLogin}
            className="rounded-xl bg-violet-300 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-900 transition hover:bg-violet-200"
          >
            Sign In To Live Workspace
          </button>
        </div>
      </header>

      <main className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <section className="rounded-2xl border border-violet-200/20 bg-white/10 p-4 backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">Lead Queue Snapshot</p>
          <div className="mt-3 space-y-2">
            {demoRows.map((row) => (
              <article key={row.id} className="rounded-xl border border-violet-200/20 bg-slate-950/60 p-3">
                <p className="text-sm font-black uppercase tracking-wide">{row.zone}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-300">
                  Heat {row.score} | {row.status}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-violet-200/20 bg-white/10 p-4 backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">Execution Controls</p>
          <div className="mt-3 space-y-2">
            <p className="rounded-lg border border-violet-200/20 bg-slate-950/60 p-3 text-sm">
              <PhoneCall size={14} className="mr-2 inline text-violet-200" />
              Tap-to-call workflow keeps reps moving through ranked opportunities.
            </p>
            <p className="rounded-lg border border-violet-200/20 bg-slate-950/60 p-3 text-sm">
              <Send size={14} className="mr-2 inline text-violet-200" />
              One-tap no-answer follow-up text can be edited and reused.
            </p>
            <p className="rounded-lg border border-violet-200/20 bg-slate-950/60 p-3 text-sm">
              <ShieldCheck size={14} className="mr-2 inline text-violet-200" />
              Heat score and status update instantly after each call outcome.
            </p>
            <p className="rounded-lg border border-violet-200/20 bg-slate-950/60 p-3 text-sm">
              <CalendarCheck size={14} className="mr-2 inline text-violet-200" />
              Queue flow is tuned for fast daily execution and appointment conversion.
            </p>
          </div>
        </section>
      </main>
    </div>
  </div>
);

export default DemoPortal;

