import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AlertTriangle, Database, LogOut, Menu, Shield, Upload, X } from 'lucide-react';
import { isSupabaseBrowserKeyValid, supabase } from './supabaseClient';
import AdminUpload from './components/AdminUpload';
import BrandLogo from './components/BrandLogo';
import DemoPortal from './components/DemoPortal';
import LeadCardStack from './components/LeadCardStack';
import MapOverlayPanel from './components/MapOverlayPanel';
import OperationsLanding from './components/OperationsLanding';
import Login from './Login';
import { fetchLeadQueue, resolveTenantFromSession } from './services/leadService';

function App() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [leads, setLeads] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [publicView, setPublicView] = useState('landing');
  const [sessionError, setSessionError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const chalkLineRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const stackShellRef = useRef(null);

  const animateChalkLine = useCallback(() => {
    if (!chalkLineRef.current) return;
    gsap.fromTo(
      chalkLineRef.current,
      { scaleX: 0, transformOrigin: 'left center', opacity: 0.7 },
      { scaleX: 1, opacity: 1, duration: 0.32, ease: 'power2.out' },
    );
  }, []);

  const triggerStackDrop = useCallback(() => {
    if (!stackShellRef.current) return;
    gsap.fromTo(
      stackShellRef.current,
      { y: -38, opacity: 0.6, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' },
    );
  }, []);

  const loadSessionContext = useCallback(async () => {
    setSessionError('');
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      const nextIsAuthenticated = Boolean(session?.user);
      setIsAuthenticated(nextIsAuthenticated);

      if (!nextIsAuthenticated) {
        setTenantId(null);
        setLeads([]);
        setPublicView('landing');
        return;
      }

      const resolvedTenant = await resolveTenantFromSession();
      setTenantId(resolvedTenant);
    } catch (error) {
      setSessionError(error?.message || 'Failed to initialize authenticated session.');
      setIsAuthenticated(false);
      setTenantId(null);
      setLeads([]);
    } finally {
      setAuthReady(true);
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    try {
      const queue = await fetchLeadQueue();
      setLeads(queue || []);
    } catch (error) {
      setSessionError(error?.message || 'Failed to load leads from Supabase.');
    }
  }, []);

  useEffect(() => {
    loadSessionContext();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSessionContext();
    });

    return () => subscription.unsubscribe();
  }, [loadSessionContext]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'workspace') {
      refreshQueue();
    }
  }, [activeTab, isAuthenticated, refreshQueue]);

  useEffect(() => {
    if (!isAuthenticated || !tenantId) return undefined;

    const channel = supabase
      .channel(`leads-live-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => refreshQueue(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isAuthenticated, tenantId, refreshQueue]);

  useEffect(() => {
    animateChalkLine();
  }, [activeTab, animateChalkLine]);

  useEffect(() => {
    if (!mobileMenuRef.current) return;
    gsap.to(mobileMenuRef.current, {
      y: menuOpen ? 0 : -220,
      opacity: menuOpen ? 1 : 0,
      duration: 0.24,
      ease: 'power2.out',
    });
  }, [menuOpen]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleImportComplete = async ({ imported }) => {
    if (!imported || imported <= 0) return;
    await refreshQueue();
    setActiveTab('workspace');
    triggerStackDrop();
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#2a1554_0%,#140f2b_42%,#06030f_100%)] text-slate-200">
        Initializing contractor portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (publicView === 'landing') {
      return (
        <OperationsLanding
          onOpenLogin={() => setPublicView('login')}
          onOpenDemo={() => setPublicView('demo')}
        />
      );
    }
    if (publicView === 'demo') {
      return <DemoPortal onLogin={() => setPublicView('login')} onBack={() => setPublicView('landing')} />;
    }
    return (
      <Login
        onAuthenticated={loadSessionContext}
        onBack={() => setPublicView('landing')}
        onPreview={() => setPublicView('demo')}
      />
    );
  }

  const showLowLeadAlert = activeTab === 'workspace' && leads.length > 0 && leads.length < 3;
  const hotLeadCount = leads.filter((lead) => (lead.heat_score || 0) >= 85).length;

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_10%_8%,#2f1760_0%,#1b133a_38%,#090612_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(90deg,rgba(196,181,253,0.08)_0_1px,transparent_1px_48px),repeating-linear-gradient(0deg,rgba(196,181,253,0.06)_0_1px,transparent_1px_48px)]" />
      <div className="sticky top-0 z-40 border-b border-violet-200/20 bg-slate-950/75 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-violet-200">PLUGleads</p>
            <p className="text-sm font-bold">Contractor Operations Portal</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-lg border border-violet-200/30 bg-white/10 p-2 text-violet-100"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        className="fixed left-0 right-0 top-[57px] z-30 border-b border-violet-200/20 bg-slate-950/85 p-4 opacity-0 md:hidden"
        style={{ transform: 'translateY(-220px)' }}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => selectTab('workspace')}
            className="rounded-xl border border-violet-200/30 bg-white/10 px-3 py-3 text-xs font-black uppercase tracking-wider"
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => selectTab('import')}
            className="rounded-xl border border-violet-200/30 bg-white/10 px-3 py-3 text-xs font-black uppercase tracking-wider"
          >
            Import
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        <nav className="hidden h-screen w-64 border-r border-violet-200/20 bg-slate-950/65 px-4 py-6 backdrop-blur-xl lg:flex lg:flex-col">
          <div>
            <div className="mb-2 w-full max-w-[160px]">
              <BrandLogo
                src="/branding/PLUGleads_logo.jpg"
                sources={[
                  '/branding/PLUGleads_logo.jpg',
                  '/branding/PLUGleads_logo.jpeg',
                  '/branding/PLUGleads_logo.png',
                ]}
                alt="PLUGleads logo"
                className="aspect-square w-12 rounded-xl border border-violet-200/20 bg-slate-950/55 p-1.5"
              />
            </div>
            <p className="text-[10px] font-black tracking-[0.2em] text-violet-200">PLUGleads</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">Contractor Ops</p>
          </div>

          <div className="mt-6 grid gap-2">
            <div className="rounded-xl border border-violet-200/20 bg-white/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Queue</p>
              <p className="text-xl font-black text-white">{leads.length}</p>
            </div>
            <div className="rounded-xl border border-violet-200/20 bg-white/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Hot Leads</p>
              <p className="text-xl font-black text-rose-300">{hotLeadCount}</p>
            </div>
          </div>

          <div className="mt-7 grid gap-2">
            <button
              onClick={() => selectTab('workspace')}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'workspace' ? 'bg-violet-300 text-slate-900' : 'border border-violet-200/20 bg-white/5 text-slate-300 hover:text-white'}`}
              type="button"
              title="Workspace"
            >
              <Shield size={18} /> Workspace
            </button>
            <button
              onClick={() => selectTab('import')}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'import' ? 'bg-violet-300 text-slate-900' : 'border border-violet-200/20 bg-white/5 text-slate-300 hover:text-white'}`}
              type="button"
              title="Import"
            >
              <Upload size={18} /> Import List
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-auto flex items-center gap-3 rounded-xl border border-violet-200/20 bg-white/5 px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-300 transition hover:text-white"
            title="Sign Out"
            type="button"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </nav>

        <nav className="hidden h-screen w-20 border-r border-violet-200/20 bg-slate-950/65 backdrop-blur-xl md:flex md:flex-col md:items-center md:gap-8 md:py-8 lg:hidden">
          <div className="text-xl font-black leading-none text-violet-200">PL</div>
          <button
            onClick={() => selectTab('workspace')}
            className={`rounded-xl p-3 transition-all ${activeTab === 'workspace' ? 'bg-violet-300 text-slate-900' : 'text-slate-300 hover:text-white'}`}
            type="button"
            title="Workspace"
          >
            <Shield size={24} />
          </button>
          <button
            onClick={() => selectTab('import')}
            className={`rounded-xl p-3 transition-all ${activeTab === 'import' ? 'bg-violet-300 text-slate-900' : 'text-slate-300 hover:text-white'}`}
            type="button"
            title="Import"
          >
            <Upload size={24} />
          </button>
          <button onClick={handleSignOut} className="mt-auto rounded-xl p-3 text-slate-300 transition-all hover:text-white" title="Sign Out" type="button"><LogOut size={20} /></button>
        </nav>

        <main className="relative flex-1 p-4 md:p-8">
          <header className="mx-auto mb-8 max-w-6xl rounded-2xl border border-violet-200/20 bg-white/10 p-4 backdrop-blur-xl md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-violet-200">PLUGleads</p>
                <h1 className="mt-1 text-2xl font-black uppercase tracking-tight md:text-4xl">
                  {activeTab === 'workspace' ? 'Lead Operations Workspace' : 'List Import And Parsing'}
                </h1>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  This portal is for lead execution and compliance tracking, not lead capture pages.
                </p>
              </div>
              <div className="w-full max-w-[320px] rounded-xl border border-violet-200/20 bg-slate-950/55 px-3 py-2 text-xs tracking-wider text-slate-300">
                <p className="font-black text-violet-200">Node</p>
                <p className="mb-2">Southwest Indiana</p>
                <div className="grid grid-cols-[1.25fr_0.75fr] gap-2">
                  <BrandLogo
                    src="/branding/AngelC&R_logo.jpg"
                    sources={[
                      '/branding/AngelC&R_logo.jpg',
                      '/branding/AngelC%26R_logo.jpg',
                      '/branding/AngelC&R_logo.jpeg',
                      '/branding/AngelC&R_logo.png',
                    ]}
                    alt="Angel Construction and Roofing logo"
                    className="aspect-[16/9] w-full rounded-lg border border-violet-200/20 bg-slate-950/70 p-1"
                  />
                  <BrandLogo
                    src="/branding/Lowe&Co_logo.jpg"
                    sources={[
                      '/branding/Lowe&Co_logo.jpg',
                      '/branding/Lowe%26Co_logo.jpg',
                      '/branding/Lowe&Co_logo.jpeg',
                      '/branding/Lowe&Co_logo.png',
                    ]}
                    alt="Lowe and Co logo"
                    className="aspect-square w-full rounded-lg border border-violet-200/20 bg-slate-950/70 p-1"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 h-[8px] w-full overflow-hidden rounded-full bg-slate-950/60">
              <div ref={chalkLineRef} className="chalk-line" />
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            {sessionError ? (
              <p className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-400">
                {sessionError}
              </p>
            ) : null}

            {showLowLeadAlert ? (
              <div className="flashing-alert flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-wider">
                <AlertTriangle size={16} /> Active queue is low. Import another list to keep dials running.
              </div>
            ) : null}

            {activeTab === 'import' ? (
              <AdminUpload tenantId={tenantId} onImportComplete={handleImportComplete} />
            ) : (
              <div className="ops-grid">
                <MapOverlayPanel leads={leads} />
                <div ref={stackShellRef}>
                  <LeadCardStack leads={leads} onQueueChanged={refreshQueue} />
                </div>
              </div>
            )}

            <section className="rounded-2xl border border-violet-200/20 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
                <Database size={14} /> Compliance Chain
              </div>
              <p className="mt-2 text-sm text-slate-200">
                Calls and SMS are routed through proxy workflows. Session outcomes and outbound communication are
                logged for quality control and fraud enforcement.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

