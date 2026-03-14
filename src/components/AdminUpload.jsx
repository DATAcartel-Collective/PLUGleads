import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { processAndStoreLead } from '../services/leadService';
import { Loader2, CheckCircle, AlertCircle, Upload, FileUp } from 'lucide-react';

// THIS LINE WAS LIKELY MISSING:
const AdminUpload = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const onDrop = (acceptedFiles) => {
    setLoading(true);
    setStats(null);
    
    Papa.parse(acceptedFiles[0], {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let imported = 0;
        let skipped = 0;

        for (const row of results.data) {
          try {
            await processAndStoreLead(row);
            imported++;
          } catch (err) {
            console.error("Lead Rejected:", row.property_address || row.address || "Unknown Row", "| Reason:", err.message);
            skipped++;
          }
        }
        setStats({ imported, skipped });
        setLoading(false);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop,
    noClick: true, 
    accept: { 'text/csv': ['.csv'] }
  });

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`p-16 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-4
          ${isDragActive ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800 bg-zinc-950'}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <Loader2 className="text-orange-500 animate-spin" size={48} />
        ) : (
          <Upload className="text-zinc-700" size={48} />
        )}
        <p className="text-zinc-500 font-medium text-center">
          {loading ? 'Processing Michiana Logic...' : 'Drag and drop Propwire CSV here'}
        </p>
        
        <button 
          onClick={open}
          className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-orange-500 hover:text-black text-white text-sm font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2"
        >
          <FileUp size={16} />
          Browse Files
        </button>
      </div>

      {stats && (
        <div className="flex gap-4">
          <div className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
            <CheckCircle className="text-green-500" />
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold">Imported</p>
              <p className="text-2xl font-mono text-white">{stats.imported}</p>
            </div>
          </div>
          <div className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
            <AlertCircle className="text-zinc-600" />
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold">Skipped</p>
              <p className="text-2xl font-mono text-zinc-400">{stats.skipped}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;