import React from 'react';

const CallOutcome = ({ onResolve }) => {
  const outcomes = [
    { label: 'No Answer', color: 'bg-zinc-800', status: 'RETRY' },
    { label: 'Interested', color: 'bg-green-600', status: 'HOT' },
    { label: 'Not Interested', color: 'bg-red-900', status: 'DEAD' },
    { label: 'Wrong Number', color: 'bg-orange-900', status: 'BAD_DATA' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-black italic uppercase text-white mb-6">Call Disposition</h3>
        <div className="grid grid-cols-1 gap-3">
          {outcomes.map((o) => (
            <button
              key={o.label}
              onClick={() => onResolve(o.status)}
              className={`${o.color} text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform uppercase tracking-tighter`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CallOutcome;