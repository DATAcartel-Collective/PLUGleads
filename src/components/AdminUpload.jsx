import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { processAndStoreLead } from '../services/leadService';
import { AlertCircle, CheckCircle, FileUp, Upload } from 'lucide-react';

const AdminUpload = ({ tenantId, onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(0);

  const dripFlowRef = useRef(null);
  const caulkSealRef = useRef(null);

  useEffect(() => {
    if (!loading || !dripFlowRef.current) return undefined;

    const tween = gsap.to(dripFlowRef.current, {
      backgroundPositionX: '220px',
      duration: 0.85,
      repeat: -1,
      ease: 'none',
    });

    return () => {
      tween.kill();
    };
  }, [loading]);

  useEffect(() => {
    if (!stats?.imported || !caulkSealRef.current) return;

    const timeline = gsap.timeline();
    timeline
      .fromTo(caulkSealRef.current, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.3 })
      .to(caulkSealRef.current, { autoAlpha: 0, duration: 0.5, delay: 0.35 });
  }, [stats]);

  const onDrop = (acceptedFiles) => {
    if (!tenantId) {
      setStats({ imported: 0, skipped: 0, error: 'No tenant assigned to current user.' });
      return;
    }

    if (!acceptedFiles?.length) {
      return;
    }

    setLoading(true);
    setProgress(0);
    setStats(null);

    Papa.parse(acceptedFiles[0], {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = Array.isArray(results?.data) ? results.data : [];

        if (rows.length === 0) {
          setStats({ imported: 0, skipped: 0, error: 'CSV contained no rows.' });
          setLoading(false);
          setProgress(0);
          return;
        }

        let imported = 0;
        let skipped = 0;

        for (let index = 0; index < rows.length; index += 1) {
          const row = rows[index];
          try {
            await processAndStoreLead(row, tenantId);
            imported += 1;
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(
              'Lead Rejected:',
              row.property_address || row.address || 'Unknown Row',
              '| Reason:',
              err.message,
            );
            skipped += 1;
          }

          setProgress(Math.round(((index + 1) / rows.length) * 100));
        }

        setStats({ imported, skipped });
        setLoading(false);

        if (onImportComplete) {
          onImportComplete({ imported, skipped });
        }
      },
      error: (err) => {
        setStats({ imported: 0, skipped: 0, error: err?.message || 'Failed to parse CSV.' });
        setLoading(false);
      },
    });
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { 'text/csv': ['.csv'] },
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-10 transition-all md:p-16 ${
          isDragActive ? 'border-violet-300 bg-violet-300/10' : 'border-violet-200/20 bg-slate-950/50'
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {loading ? <div className="vent-loader" /> : <Upload className="text-violet-200/80" size={48} />}

          <p className="font-medium text-slate-300">
            {loading ? 'Processing Michiana Logic...' : 'Drag and drop Propwire CSV here'}
          </p>

          {loading ? (
            <div className="w-full max-w-xl">
              <div className="drip-edge-track">
                <div ref={dripFlowRef} className="drip-edge-flow" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-violet-300">{progress}% Parsed</p>
            </div>
          ) : null}

          <div className="relative mt-2">
            <button
              onClick={open}
              type="button"
            className="rounded-lg border border-violet-200/25 bg-slate-900/60 px-6 py-2 text-sm font-bold uppercase tracking-wider text-violet-100 transition-all hover:bg-violet-300 hover:text-slate-900"
            >
              <span className="inline-flex items-center gap-2">
                <FileUp size={16} /> Browse Files
              </span>
            </button>
            <span ref={caulkSealRef} className="caulk-seal-ring" />
          </div>
        </div>
      </div>

      {stats ? (
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center gap-4 rounded-xl border border-violet-200/20 bg-slate-900/70 p-4">
            <CheckCircle className="text-green-500" />
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Imported</p>
              <p className="text-2xl font-mono text-white">{stats.imported}</p>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-4 rounded-xl border border-violet-200/20 bg-slate-900/70 p-4">
            <AlertCircle className="text-slate-500" />
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Skipped</p>
              <p className="text-2xl font-mono text-slate-300">{stats.skipped}</p>
            </div>
          </div>
        </div>
      ) : null}

      {stats?.error ? <p className="text-sm font-semibold text-red-500">{stats.error}</p> : null}
    </div>
  );
};

export default AdminUpload;

