import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, PhoneOff, UserCheck, XCircle } from 'lucide-react';

const OutcomeModal = ({ isOpen, onSelect, leadName }) => {
  if (!isOpen) return null;

  const options = [
    { id: 'spoke', label: 'Spoke with Owner', icon: UserCheck, color: 'bg-green-600' },
    { id: 'no_answer', label: 'No Answer / VM', icon: PhoneOff, color: 'bg-zinc-700' },
    { id: 'wrong_number', label: 'Wrong Number', icon: XCircle, color: 'bg-red-600' },
    { id: 'dead', label: 'Dead Lead', icon: MessageSquare, color: 'bg-black' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8"
      >
        <h3 className="text-2xl font-black text-white italic uppercase text-center mb-2">Call Outcome</h3>
        <p className="text-zinc-500 text-center text-sm mb-8 uppercase font-bold tracking-widest">{leadName}</p>
        
        <div className="grid gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`flex items-center gap-4 w-full ${opt.color} text-white font-black p-5 rounded-2xl hover:brightness-110 transition-all uppercase italic tracking-tighter`}
            >
              <opt.icon size={20} />
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OutcomeModal;