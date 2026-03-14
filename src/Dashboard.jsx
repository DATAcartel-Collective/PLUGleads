import React from 'react';

const Dashboard = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Navbar */}
      <nav className="glass-panel border-b border-slate-700 p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">P</div>
          <span className="font-bold text-lg tracking-tight">PLUGleads</span>
        </div>
        <div className="flex items-center gap-4">
          <span id="user-display" className="text-sm text-gray-400 hidden md:block"></span>
          <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Lead Intelligence</h2>
              <p className="text-gray-400 text-sm">Real-time asset verification & probability scoring.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-900 rounded-full text-xs">Live Data</span>
              <span className="px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-900 rounded-full text-xs">Roofing Mode</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-panel p-6 rounded-xl">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Leads</p>
              <p className="text-3xl font-bold text-white mt-1">142</p>
            </div>
            <div className="glass-panel p-6 rounded-xl border-blue-500/30">
              <p className="text-blue-400 text-xs uppercase tracking-wider">High Probability</p>
              <p className="text-3xl font-bold text-white mt-1">28</p>
            </div>
            <div className="glass-panel p-6 rounded-xl">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Est. Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">$420k</p>
            </div>
          </div>

          {/* Lead List */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Owner / Entity</th>
                  <th className="p-4">Property Address</th>
                  <th className="p-4">Asset Flags</th>
                  <th className="p-4 text-right">Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {/* Sample Data Row 1 */}
                <tr className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <td className="p-4 font-medium text-white">
                    HARRISON FAMILY TRUST
                    <span className="block text-xs text-gray-500">Warranty Deed (2018)</span>
                  </td>
                  <td className="p-4 text-gray-300">1204 Oakwood Drive, Austin TX</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs border border-purple-800">Trust</span>
                    <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs border border-yellow-800">Pool Permit</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-green-400 font-bold">94%</span>
                  </td>
                </tr>
                {/* Sample Data Row 2 */}
                <tr className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <td className="p-4 font-medium text-white">
                    RED HAWK VENTURES LLC
                    <span className="block text-xs text-gray-500">Commercial (2021)</span>
                  </td>
                  <td className="p-4 text-gray-300">880 Industrial Pkwy, Suite B</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs border border-blue-800">LLC</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-green-400 font-bold">88%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;