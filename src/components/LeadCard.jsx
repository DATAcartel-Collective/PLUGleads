import React from 'react';
import { Phone, MapPin, TrendingUp, AlertCircle } from 'lucide-react';

const LeadCard = ({ lead, onDial }) => {
  if (!lead) return null;

  // Use fallbacks to ensure data shows up even if naming is inconsistent
  const displayAddress = lead.address || lead.property_address || "No Address";
  const displayEquity = lead.equity || lead.equity_percent || 0;
  const displayScore = lead.score || 0;
  const displayTier = lead.tier || "Standard";
  const displayCity = lead.city || lead.property_city || "Unknown City";
  const displayState = lead.state || lead.property_state || "IN";

// Add this inside your LeadCard before the return
const scoreColor = lead.lead_score > 80 ? 'text-green-400' : 'text-orange-500';
const urgencyColor = lead.urgency_flag ? 'animate-pulse text-red-500' : 'text-zinc-500';

return (
  <div className={`relative group w-full max-w-md bg-zinc-950 border-2 rounded-[2rem] overflow-hidden transition-all duration-500 ${lead.lead_score > 80 ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)]' : 'border-zinc-800'}`}>
    
    {/* High Priority Glow Bar */}
    <div className={`h-1.5 w-full ${lead.lead_score > 80 ? 'bg-orange-500' : 'bg-zinc-800'}`} />

    <div className="p-8">
      {/* Header with Pulse for Urgent Leads */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{lead.address}</h2>
        {lead.urgency_flag && (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-md animate-pulse">
            <AlertCircle size={10} /> EXPIRES SOON
          </span>
        )}
      </div>

      {/* The "Money" Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-500 font-bold uppercase">Equity</p>
          <p className="text-lg font-mono text-white">{lead.equity_percent}%</p>
        </div>
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-500 font-bold uppercase">Roof Age</p>
          <p className="text-lg font-mono text-white">{lead.roof_age}y</p>
        </div>
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-500 font-bold uppercase">Score</p>
          <p className={`text-lg font-mono font-black ${scoreColor}`}>{lead.lead_score}</p>
        </div>
      </div>

      {/* Action Button: Make it feel like a Weapon */}
      <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 uppercase italic tracking-widest shadow-xl transition-transform active:scale-95">
        <Phone size={20} fill="currentColor" />
        Launch Smart Dial
      </button>
    </div>
  </div>
);

  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-3 bg-orange-600 w-full" />
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">
              {displayAddress}
            </h2>
            <p className="text-zinc-500 font-bold uppercase text-xs mt-1">
              {displayCity}, {displayState}
            </p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
            <span className="text-orange-500 text-[10px] font-black uppercase italic">
              Score: {displayScore}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <TrendingUp size={14} />
              <span className="text-[10px] font-black uppercase">Equity</span>
            </div>
            <p className="text-xl font-mono text-white font-bold">{displayEquity}%</p>
          </div>
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <AlertCircle size={14} />
              <span className="text-[10px] font-black uppercase">Tier</span>
            </div>
            <p className="text-xl font-mono text-white font-bold uppercase">{displayTier}</p>
          </div>
        </div>

        <button 
          onClick={() => onDial(lead)}
          className="w-full bg-white hover:bg-orange-500 hover:text-white text-black font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase italic tracking-tighter shadow-lg active:scale-95 group"
        >
          <Phone size={24} className="group-hover:animate-pulse" />
          Initiate Smart Dial
        </button>
      </div>
    </div>
  );
};

export default LeadCard;