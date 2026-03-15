import React, { useMemo, useState } from 'react';

const BrandLogo = ({
  src,
  sources = [],
  alt,
  className = '',
  imgClassName = '',
  fallback = '',
  fallbackClassName = '',
}) => {
  const sourceList = useMemo(() => {
    if (Array.isArray(sources) && sources.length > 0) return sources;
    return [src];
  }, [sources, src]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (!fallback) return null;
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-violet-200/25 bg-slate-950/55 px-3 py-2 text-center text-xs font-semibold text-violet-100 ${className} ${fallbackClassName}`}
      >
        {fallback}
      </div>
    );
  }

  const handleError = () => {
    if (sourceIndex < sourceList.length - 1) {
      setSourceIndex((prev) => prev + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <div className={className}>
      <img
        src={sourceList[sourceIndex]}
        alt={alt}
        onError={handleError}
        className={`h-full w-full rounded-xl object-contain ${imgClassName}`}
        loading="lazy"
      />
    </div>
  );
};

export default BrandLogo;

