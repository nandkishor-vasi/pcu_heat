import { useEffect, useRef, useState } from "react";

// Pimpri-Chinchwad bounding box (approx 10×10 km area)
// SW corner: 18.570, 73.760  →  NE corner: 18.660, 73.860
const BOUNDS = {
  swLat: 18.570, swLng: 73.760,
  neLat: 18.660, neLng: 73.860,
};
const GRID_SIZE = 10;

function tempToColor(lst, min, max) {
  const t = (lst - min) / (max - min);
  if (t < 0.5) {
    const r = Math.round(255 * t * 2);
    const g = Math.round(180 * t * 2);
    const b = Math.round(100 * (1 - t * 2));
    return `rgb(${r},${g},${b})`;
  } else {
    const t2 = (t - 0.5) * 2;
    return `rgb(255,${Math.round(180 * (1 - t2))},0)`;
  }
}

// Convert grid [row, col] to real lat/lng bounds for each cell
function cellToBounds(row, col) {
  const latStep = (BOUNDS.neLat - BOUNDS.swLat) / GRID_SIZE;
  const lngStep = (BOUNDS.neLng - BOUNDS.swLng) / GRID_SIZE;
  // row 0 = top of map (highest lat), row 9 = bottom
  const nLat = BOUNDS.neLat - row * latStep;
  const sLat = nLat - latStep;
  const wLng = BOUNDS.swLng + col * lngStep;
  const eLng = wLng + lngStep;
  return [[sLat, wLng], [nLat, eLng]];
}

const SEVERITY_COLORS = {
  critical: "#ff2d2d",
  high:     "#ff7b00",
  moderate: "#ffd500",
  low:      "#4cde80",
};

export default function HeatGrid({ cells, selectedCell, onCellSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const rectanglesRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const lsts = cells.map((c) => c.lst);
  const minLst = Math.min(...lsts);
  const maxLst = Math.max(...lsts);

  // Init Leaflet map once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // Dynamically load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [18.615, 73.810],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark-toned OSM tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap © CARTO",
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Draw / update heat rectangles whenever cells or selection changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Remove old rectangles
    rectanglesRef.current.forEach((r) => r.remove());
    rectanglesRef.current = [];

    cells.forEach((cell) => {
      const bounds = cellToBounds(cell.row, cell.col);
      const color = tempToColor(cell.lst, minLst, maxLst);
      const isSelected = selectedCell?.id === cell.id;

      const rect = L.rectangle(bounds, {
        color: isSelected ? "#ffffff" : "transparent",
        weight: isSelected ? 2 : 0.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.75 : 0.55,
        opacity: isSelected ? 1 : 0.3,
      });

      rect.bindTooltip(
        `<div style="font-family:monospace;font-size:12px;background:#0f1218;color:#d4dce8;border:1px solid #2a3445;padding:6px 10px;border-radius:4px;">
          <strong style="color:#fff">${cell.zone}</strong><br/>
          ${cell.lst}°C &nbsp; <span style="color:${SEVERITY_COLORS[cell.severity]}">${cell.severity.toUpperCase()}</span><br/>
          NDVI: ${cell.ndvi} &nbsp; NDBI: ${cell.ndbi}
        </div>`,
        { sticky: true, opacity: 1, className: "heat-tooltip" }
      );

      rect.on("click", () => onCellSelect(cell));

      rect.addTo(map);
      rectanglesRef.current.push(rect);
    });
  }, [mapReady, cells, selectedCell, minLst, maxLst, onCellSelect]);

  // Pan to selected cell
  useEffect(() => {
    if (!mapReady || !selectedCell || !mapInstanceRef.current) return;
    const [[sLat, wLng], [nLat, eLng]] = cellToBounds(selectedCell.row, selectedCell.col);
    const centerLat = (sLat + nLat) / 2;
    const centerLng = (wLng + eLng) / 2;
    mapInstanceRef.current.panTo([centerLat, centerLng], { animate: true });
  }, [selectedCell, mapReady]);

  return (
    <div className="heat-grid-wrapper">
      <div ref={mapRef} className="leaflet-map" />

      {/* Legend */}
      <div className="legend">
        <span className="legend-label">{minLst.toFixed(1)}°C</span>
        <div className="legend-bar" />
        <span className="legend-label">{maxLst.toFixed(1)}°C</span>
      </div>

      {/* Severity legend */}
      <div className="severity-legend">
        {Object.entries(SEVERITY_COLORS).map(([key, val]) => (
          <div key={key} className="sev-item">
            <span className="sev-dot" style={{ background: val }} />
            <span>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
