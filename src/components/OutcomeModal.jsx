import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, PhoneCall, UserCheck, XCircle, Ban } from 'lucide-react';

const options = [
  { id: 'no_answer', label: 'No Answer', icon: PhoneOff, color: 'bg-slate-700 hover:bg-slate-600' },
  { id: 'busy', label: 'Busy', icon: PhoneCall, color: 'bg-amber-600 hover:bg-amber-500' },
  { id: 'spoke', label: 'Spoke', icon: UserCheck, color: 'bg-emerald-600 hover:bg-emerald-500' },
  { id: 'wrong_number', label: 'Wrong Number', icon: XCircle, color: 'bg-rose-600 hover:bg-rose-500' },
  { id: 'disconnected', label: 'Disconnected', icon: Ban, color: 'bg-slate-800 hover:bg-slate-700' },
  { id: 'dead', label: 'Dead Lead', icon: XCircle, color: 'bg-slate-900 hover:bg-slate-800' },
];

const OutcomeModal = ({ isOpen, onSelect, leadAddress }) => (
  <AnimatePresence>
    {isOpen ? (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ y: 22, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="w-full max-w-md rounded-3xl border border-violet-200/20 bg-slate-950/90 p-6 shadow-2xl"
        >
          <h3 className="text-center text-2xl font-black uppercase italic text-white">Call Outcome</h3>
          <p className="mb-5 mt-2 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            {leadAddress}
          </p>

          <div className="grid gap-2">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black uppercase tracking-wide text-white transition ${option.color}`}
              >
                <span>{option.label}</span>
                <option.icon size={17} />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default OutcomeModal;

