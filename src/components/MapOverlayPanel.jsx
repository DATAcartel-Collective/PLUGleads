import React, { useMemo } from 'react';
import { Shield, Zap } from 'lucide-react';

const hashCoordinate = (input, min, max) => {
  const text = String(input || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return min + normalized * (max - min);
};

const maskAddress = (address) => {
  const value = String(address || '').trim();
  if (!value) return 'Masked Territory';
  return value.replace(/^\d+/, '###');
};

const MapOverlayPanel = ({ leads = [] }) => {
  const markers = useMemo(
    () =>
      leads.slice(0, 24).map((lead) => ({
        id: lead.id,
        x: hashCoordinate(lead.id, 8, 92),
        y: hashCoordinate(`${lead.id}-y`, 10, 88),
        score: lead.heat_score || 0,
        status: lead.status || 'NEW',
      })),
    [leads],
  );

  const topStack = useMemo(() => leads.slice(0, 3), [leads]);

  const heatZones = useMemo(() => {
    const grid = new Map();

    markers.forEach((marker, index) => {
      const lead = leads[index];
      const gridX = Math.floor(marker.x / 16);
      const gridY = Math.floor(marker.y / 16);
      const key = `${gridX}-${gridY}`;

      const explicitStorm = Number(lead?.storm_score || lead?.storm_intensity || 0);
      const explicitPermits = Number(lead?.neighbor_roof_permits || lead?.permit_density || 0);

      const stormSignal = Number.isFinite(explicitStorm) && explicitStorm > 0 ? explicitStorm : (marker.score / 100) * 0.8;
      const permitSignal = Number.isFinite(explicitPermits) && explicitPermits > 0 ? explicitPermits / 10 : marker.status === 'NEW' ? 0.35 : 0.2;
      const intensity = Math.min(1, 0.45 + stormSignal * 0.45 + permitSignal * 0.25);

      const existing = grid.get(key);
      if (existing) {
        existing.count += 1;
        existing.intensity += intensity;
        existing.storm += stormSignal;
        existing.permit += permitSignal;
      } else {
        grid.set(key, {
          key,
          x: gridX * 16 + 8,
          y: gridY * 16 + 8,
          count: 1,
          intensity,
          storm: stormSignal,
          permit: permitSignal,
        });
      }
    });

    return [...grid.values()]
      .map((zone) => {
        const normalized = Math.min(1, zone.intensity / Math.max(zone.count, 1));
        const weightedDensity = Math.min(1, normalized * 0.7 + Math.min(zone.count / 5, 1) * 0.3);
        const size = 90 + weightedDensity * 120;

        return {
          ...zone,
          weightedDensity,
          size,
          label: zone.count >= 3 || weightedDensity > 0.72,
        };
      })
      .sort((a, b) => b.weightedDensity - a.weightedDensity)
      .slice(0, 10);
  }, [leads, markers]);

  return (
    <section className="map-ops-shell">
      <div className="map-ops-header">
        <p className="map-ops-kicker">Storm + Permit + Financial Intel</p>
        <h2>Neighborhood Heat Map Overlay</h2>
      </div>

      <div className="map-surface">
        <div className="map-grid" />
        <div className="map-heat-layer">
          {heatZones.map((zone) => (
            <span
              key={zone.key}
              className="map-heat-blob"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.size}px`,
                height: `${zone.size}px`,
                opacity: Math.min(0.84, 0.22 + zone.weightedDensity * 0.62),
              }}
            />
          ))}
        </div>

        {markers.map((marker) => (
          <span
            key={marker.id}
            className={`map-marker ${marker.score >= 85 ? 'hot' : marker.score >= 70 ? 'warm' : ''}`}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            title={`${marker.status} / ${marker.score}`}
          />
        ))}

        {heatZones
          .filter((zone) => zone.label)
          .slice(0, 3)
          .map((zone, idx) => (
            <span
              key={`label-${zone.key}`}
              className="map-neighborhood-label"
              style={{
                left: `${Math.min(86, zone.x + (idx % 2 === 0 ? 6 : -8))}%`,
                top: `${Math.max(12, zone.y - 7)}%`,
              }}
            >
              High-Density Opportunity
            </span>
          ))}

        <div className="map-overlay-cards">
          {topStack.length > 0 ? (
            topStack.map((lead, index) => (
              <article key={lead.id} className="map-overlay-card" style={{ transform: `translateY(${index * 10}px)` }}>
                <p className="map-overlay-address">{maskAddress(lead.address)}</p>
                <p className="map-overlay-meta">
                  Heat {lead.heat_score || 0} | {lead.status || 'NEW'}
                </p>
              </article>
            ))
          ) : (
            <article className="map-overlay-card">
              <p className="map-overlay-address">No active leads in queue</p>
              <p className="map-overlay-meta">Upload to begin route execution</p>
            </article>
          )}
        </div>
      </div>

      <div className="map-ops-footer">
        <p>
          <Shield size={14} /> PII shielding enabled: contractors never see direct phone records.
        </p>
        <p>
          <Zap size={14} /> Proxy dial + recording logs keep commission enforcement auditable.
        </p>
        <p>
          <Zap size={14} /> Heat zones combine storm pressure, permit adjacency, and lead score density.
        </p>
      </div>
    </section>
  );
};

export default MapOverlayPanel;

