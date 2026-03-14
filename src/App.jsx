import React, { useState, useEffect } from 'react';
import { supabase } from './services/leadService'; 
import AdminUpload from './components/AdminUpload';
import LeadCard from './components/LeadCard';
import CallOutcome from './components/CallOutcome';
import { Shield, Upload, MapPin } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  // Define this ONCE here
  const currentLead = leads[currentIndex];

  const resolveLead = async (disposition) => {
    if (!currentLead) return;
    
    await supabase
      .from('leads')
      .update({ status: disposition })
      .eq('id', currentLead.id);

    setShowOutcomeModal(false);
    setCurrentIndex(prev => prev + 1);
  };

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setLeads(data);
    };
    fetchLeads();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans overflow-hidden flex">
      {/* SIDEBAR */}
      <nav className="h-screen w-20 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-8 gap-8 flex-shrink-0">
        <div className="text-orange-500 font-black text-xl italic leading-none">PL</div>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-orange-500 text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          <Shield size={24} />
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'upload' ? 'bg-orange-500 text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          <Upload size={24} />
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        <header className="mb-12 max-w-4xl mx-auto">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            {activeTab === 'dashboard' ? 'Field Dashboard' : 'Data Ingestion'}
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Michiana Node <span className="text-orange-500 mx-2">|</span> Contractor Unit 01
          </p>
        </header>

        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          {activeTab === 'upload' ? (
            <AdminUpload />
          ) : (
            <>
              {currentLead ? (
                <LeadCard
                  lead={currentLead}
                  onDial={() => {
                    window.open(`tel:${currentLead.phone || ''}`);
                    setShowOutcomeModal(true);
                  }}
                />
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl w-full max-w-md">
                  <MapPin size={48} className="mx-auto mb-4 text-zinc-800" />
                  <p className="text-zinc-500 uppercase font-black tracking-widest text-sm">No Leads in Queue</p>
                  <button onClick={() => setActiveTab('upload')} className="mt-4 text-orange-500 font-bold hover:underline">
                    Import Michiana CSV
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {showOutcomeModal && <CallOutcome onResolve={resolveLead} />}
    </div>
  );
}

export default App;