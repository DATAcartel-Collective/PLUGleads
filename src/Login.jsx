import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // TODO: Add real Firebase phone authentication here
    console.log("Simulating login with:", phone);
    navigate('/dashboard');
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">PLUG<span className="text-blue-500">leads</span></h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">DATAcartel Collective</p>
        </div>

        {/* STEP 1: Phone Input */}
        <div id="step-phone">
          <label className="block text-sm font-medium text-gray-400 mb-2">Mobile Number</label>
          <div className="relative">
            <input 
              type="tel" 
              id="phone-input" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-600" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Standard message and data rates may apply.</p>
          
          <button 
            id="send-code-btn" 
            onClick={handleLogin}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95"
          >
              Send Verification Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;