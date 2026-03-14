import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, TrendingUp, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import OutcomeModal from './OutcomeModal';
import { initiateSignalWireCall } from '../services/DialerLogic';

const LeadCardStack = ({ leads: initialLeads }) => {
  const [leads, setLeads] = useState(initialLeads);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOutcome, setShowOutcome] = useState(false);
  const [isDialing, setIsDialing] = useState(false);

  const activeLead = leads[currentIndex];

  // BROWSER SENSE: Detect return from dialer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isDialing) {
        setShowOutcome(true);
        setIsDialing(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isDialing]);

  const handleCall = async () => {
    const phoneNumber = activeLead.phone_numbers[activeLead.current_phone_index || 0];
    setIsDialing(true);
    // Trigger SignalWire Proxy
    await initiateSignalWireCall(phoneNumber, activeLead.id);
    // Fallback: Trigger device dialer
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleOutcome = async (outcome) => {
    setShowOutcome(false);
    let updatedLead = { ...activeLead };

    if (outcome === 'no_answer') {
      const nextIndex = (updatedLead.current_phone_index || 0) + 1;
      if (nextIndex < updatedLead.phone_numbers.length) {
        updatedLead.current_phone_index = nextIndex;
      } else {
        updatedLead.priority_status = 'FOLLOW UP';
        // Move to next card after exhausting numbers
        setCurrentIndex(prev => prev + 1);
      }
    } else if (outcome === 'dead' || outcome === 'wrong_number') {
      updatedLead.priority_status = 'DEAD';
      setCurrentIndex(prev => prev + 1); // Triggers "Tear Off" animation
    } else {
      updatedLead.priority_status = 'SPOKE';
      setCurrentIndex(prev => prev + 1);
    }

    // Persist to Supabase
    await supabase.from('leads').upsert(updatedLead);
  };

  if (!activeLead) return <div className="text-white font-black italic text-center mt-20 uppercase tracking-widest">Territory Cleared.</div>;

  return (
    <div className="relative flex justify-center items-center h-[80vh] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLead.id}
          // ANIMATION A: SHINGLE SLIDE
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ 
            // ANIMATION B: TEAR OFF
            clipPath: "polygon(0 0, 100% 0, 100% 75%, 85% 90%, 70% 75%, 55% 90%, 40% 75%, 25% 90%, 10% 75%, 0 90%)",
            y: 800,
            rotate: -10,
            opacity: 0
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.8 }}
          className="absolute w-full max-w-md bg-zinc-950 border-2 border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">
                {activeLead.address}
              </h2>
              <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-xs">
                <MapPin size={12} /> {activeLead.city}, {activeLead.state}
              </div>
            </div>
            <div className={`px-4 py-1 rounded-full border-2 ${activeLead.lead_score > 80 ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'border-zinc-700 text-zinc-500'}`}>
              <span className="text-xs font-black italic uppercase">Score: {activeLead.lead_score}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 mb-1 uppercase text-[10px] font-black">
                <TrendingUp size={14} /> Equity
              </div>
              <p className="text-2xl font-mono text-white font-bold">{activeLead.equity_percent}%</p>
            </div>
            <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 mb-1 uppercase text-[10px] font-black">
                <AlertCircle size={14} /> Roof Age
              </div>
              <p className="text-2xl font-mono text-white font-bold">{activeLead.roof_age} YRS</p>
            </div>
          </div>

          {/* Feature 1: Sequential Dialer Button */}
          <motion.button
            // ANIMATION C: NAIL GUN TAP
            whileTap={{ scale: 0.92, y: 4 }}
            transition={{ type: 'spring', stiffness: 600, damping: 10 }}
            onClick={handleCall}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 uppercase italic tracking-widest shadow-[0_10px_40px_rgba(234,88,12,0.3)] group transition-colors"
          >
            <Phone size={28} fill="currentColor" className="group-hover:animate-bounce" />
            <div className="text-left leading-none">
              <div className="text-[10px] opacity-70 mb-1">Initiating Relay...</div>
              <div className="text-xl">
                CALL NUMBER {(activeLead.current_phone_index || 0) + 1} OF {activeLead.phone_numbers.length}
              </div>
            </div>
          </motion.button>
        </motion.div>
      </AnimatePresence>

      <OutcomeModal 
        isOpen={showOutcome} 
        onSelect={handleOutcome} 
        leadName={activeLead.homeowner_name}
      />
    </div>
  );
};

export default LeadCardStack;