import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Centre } from '../types';
import { ExternalLink, Navigation } from 'lucide-react';

interface CentreMapProps {
  centres: Centre[];
  selectedCentreId?: string;
  onSelectCentre?: (centre: Centre) => void;
}

export const CentreMap: React.FC<CentreMapProps> = ({
  centres,
  selectedCentreId,
  onSelectCentre,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default centre over Maharashtra / Central India (approx 20.0, 76.0)
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([20.2, 76.5], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Custom Marker Icon generator
    const createCustomIcon = (status: string, isSelected: boolean) => {
      const color =
        status === 'OPERATIONAL'
          ? '#16a34a'
          : status === 'TEMPORARILY_CLOSED'
          ? '#dc2626'
          : '#d97706';

      const svgHtml = `
        <div style="
          background-color: ${color};
          width: ${isSelected ? '36px' : '30px'};
          height: ${isSelected ? '36px' : '30px'};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-size: 14px;
            font-weight: bold;
          ">🌾</span>
        </div>
      `;

      return L.divIcon({
        className: 'custom-apmc-marker',
        html: svgHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    };

    // Add markers for each centre
    const bounds = L.latLngBounds([]);

    centres.forEach((centre) => {
      if (centre.latitude && centre.longitude) {
        const isSelected = centre.id === selectedCentreId;
        const icon = createCustomIcon(centre.operationalStatus, isSelected);

        const marker = L.marker([centre.latitude, centre.longitude], { icon }).addTo(map);

        const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`;

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <span style="
              display: inline-block;
              font-size: 9px;
              font-weight: bold;
              padding: 2px 6px;
              border-radius: 4px;
              background-color: ${centre.operationalStatus === 'OPERATIONAL' ? '#dcfce7' : '#fef3c7'};
              color: ${centre.operationalStatus === 'OPERATIONAL' ? '#166534' : '#92400e'};
              margin-bottom: 6px;
            ">
              ${centre.operationalStatus}
            </span>
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #0f172a;">${centre.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${centre.address}</p>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-bottom: 8px;">
              <span><strong>Queue:</strong> ${centre.activeQueueCount || 0} waiting</span>
              <span><strong>Capacity:</strong> ${centre.dailyCapacity}/day</span>
            </div>
            <a href="${gmapsLink}" target="_blank" rel="noreferrer" style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              font-weight: 600;
              color: #16a34a;
              text-decoration: none;
            ">
              Get Directions &rarr;
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectCentre) onSelectCentre(centre);
        });

        markersRef.current.push(marker);
        bounds.extend([centre.latitude, centre.longitude]);
      }
    });

    if (centres.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [centres, selectedCentreId, onSelectCentre]);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-3">
        <span className="font-semibold text-slate-700">Map Legend:</span>
        <span className="flex items-center gap-1 text-emerald-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Operational
        </span>
        <span className="flex items-center gap-1 text-amber-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Limited/Delayed
        </span>
      </div>
    </div>
  );
};
